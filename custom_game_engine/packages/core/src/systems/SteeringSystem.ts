import type { SystemId, ComponentType, Position } from '../types.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { World } from '../ecs/World.js';
import type { Entity } from '../ecs/Entity.js';
import { EntityImpl } from '../ecs/Entity.js';
import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import type { SteeringBehavior, SteeringComponent } from '../components/SteeringComponent.js';
import type { VelocityComponent } from '../components/VelocityComponent.js';
import type { PositionComponent } from '../components/PositionComponent.js';
import type { Component } from '../ecs/Component.js';

/** Minimal collision component shape used for obstacle avoidance */
interface CollisionComponent extends Component {
  type: 'collision';
  radius: number;
}
import { getSteering, getVelocity, getPosition } from '../utils/componentHelpers.js';
import { setComponentProperties } from '../utils/componentUtils.js';

// Using Position from types.ts for all vector operations
type Vector2 = Position;

/** Mutable vector used for scratch allocations to avoid GC pressure */
interface MutableVector2 {
  x: number;
  y: number;
}

/**
 * SteeringSystem implements steering behaviors for navigation
 * Supports: seek, arrive, obstacle avoidance, wander, and combined behaviors
 *
 * Dependencies:
 * - AgentBrainSystem (priority 10): Must run after brain sets steering targets
 *   - Reads steering.target set by behaviors
 *   - Executes steering behaviors chosen by decision system
 *
 * - MovementSystem (priority 20): Must run before movement applies velocity
 *   - Modifies velocity components based on steering forces
 *   - MovementSystem then applies velocity to position
 *
 * Related Systems:
 * - CollisionSystem: Provides collision components for obstacle avoidance
 * - ChunkSystem: Uses spatial chunks for efficient nearby entity queries
 * - PathfindingSystem: Fallback for stuck detection (future integration)
 */
export class SteeringSystem extends BaseSystem {
  public readonly id: SystemId = CT.Steering;
  public readonly priority: number = 15; // After AISystem (10), before Movement (20)
  public readonly requiredComponents: ReadonlyArray<ComponentType> = [
    CT.Steering,
    CT.Position,
    CT.Velocity,
  ];
  // Only run when steering components exist (O(1) activation check)
  public readonly activationComponents = [CT.Steering] as const;
  protected readonly throttleInterval = 0; // EVERY_TICK - critical responsiveness

  // Valid steering behaviors - static set for O(1) lookup, avoids per-entity array allocation
  private static readonly VALID_BEHAVIORS: ReadonlySet<SteeringBehavior> = new Set<SteeringBehavior>([
    'seek', 'arrive', 'obstacle_avoidance', 'wander', 'combined', 'none',
  ]);

  // Track stuck agents for pathfinding fallback (tick-based to avoid Date.now() in hot path)
  private stuckTracker: Map<string, { lastPos: Vector2; lastTick: number; target: Vector2 }> = new Map();

  // Reusable obstacles array to avoid per-entity allocation in obstacle avoidance
  private _obstacleBuffer: Entity[] = [];

  // Scratch vectors reused each call to avoid per-entity allocation
  private _scratchForce: MutableVector2 = { x: 0, y: 0 };
  private _scratchAhead: MutableVector2 = { x: 0, y: 0 };
  private _scratchToObstacle: MutableVector2 = { x: 0, y: 0 };
  private _scratchHeading: MutableVector2 = { x: 0, y: 0 };
  private _scratchPerpLeft: MutableVector2 = { x: 0, y: 0 };
  private _scratchPerpRight: MutableVector2 = { x: 0, y: 0 };
  private _scratchSeek: MutableVector2 = { x: 0, y: 0 };
  private _scratchArrive: MutableVector2 = { x: 0, y: 0 };
  private _scratchWander: MutableVector2 = { x: 0, y: 0 };
  private _scratchAvoid: MutableVector2 = { x: 0, y: 0 };
  private _scratchCombined: MutableVector2 = { x: 0, y: 0 };

  protected onUpdate(ctx: SystemContext): void {
    // Periodic stuckTracker cleanup - remove entries for entities no longer active
    if (ctx.tick % 1000 === 0) {
      const activeIds = new Set(ctx.activeEntities.map(e => e.id));
      for (const id of this.stuckTracker.keys()) {
        if (!activeIds.has(id)) this.stuckTracker.delete(id);
      }
    }

    // Update agent positions in scheduler
    ctx.world.simulationScheduler.updateAgentPositions(ctx.world);

    // Get entities with steering component
    // NOTE: We don't filter steering entities themselves (agents always need to steer)
    // but obstacle filtering happens in _avoidObstacles using spatial queries
    // activeEntities is already filtered by requiredComponents and SimulationScheduler

    for (const entity of ctx.activeEntities) {
      try {
        this._updateSteering(entity, ctx.world, ctx.deltaTime);
      } catch (error) {
        // Log but continue — one entity's error must not prevent all others from steering
        console.error(`[SteeringSystem] Failed for entity ${entity.id}:`, error);
      }
    }
  }

  private _updateSteering(entity: Entity, world: World, deltaTime: number): void {
    const impl = entity as EntityImpl;

    // Get typed components using helpers
    const steering = getSteering(entity);
    if (!steering) {
      throw new Error('Steering component missing');
    }
    const position = getPosition(entity);
    if (!position) {
      throw new Error('Position component missing');
    }
    const velocity = getVelocity(entity);
    if (!velocity) {
      throw new Error('Velocity component missing');
    }

    // Validate behavior type
    if (!SteeringSystem.VALID_BEHAVIORS.has(steering.behavior)) {
      throw new Error(`Invalid steering behavior: ${steering.behavior}. Valid: ${[...SteeringSystem.VALID_BEHAVIORS].join(', ')}`);
    }

    if (steering.behavior === 'none') {
      return; // No steering applied
    }

    // Calculate steering force (reuse scratch vector - reset to zero)
    this._scratchForce.x = 0;
    this._scratchForce.y = 0;
    let steeringForce: Vector2 = this._scratchForce;

    switch (steering.behavior) {
      case 'seek':
        steeringForce = this._seek(position, velocity, steering);
        break;

      case 'arrive':
        steeringForce = this._arrive(position, velocity, steering, entity.id, world.tick);
        break;

      case 'obstacle_avoidance':
        steeringForce = this._avoidObstacles(entity, position, velocity, steering, world);
        break;

      case 'wander':
        steeringForce = this._wander(position, velocity, steering);
        break;

      case 'combined':
        steeringForce = this._combined(entity, position, velocity, steering, world);
        break;
    }

    // Add containment force if bounds are set (applies to ALL behaviors)
    if (steering.containmentBounds) {
      const containmentForce = this._containment(position, velocity, steering);
      // Accumulate into _scratchForce to avoid allocating a new {x, y} literal
      this._scratchForce.x = steeringForce.x + containmentForce.x;
      this._scratchForce.y = steeringForce.y + containmentForce.y;
      steeringForce = this._scratchForce;
    }

    // Apply steering force (clamped to maxForce)
    const force = this._limit(steeringForce, steering.maxForce);

    // Update velocity
    const newVx = velocity.vx + force.x * deltaTime;
    const newVy = velocity.vy + force.y * deltaTime;

    // Limit to max speed (use squared comparison to avoid sqrt when possible)
    const speedSquared = newVx * newVx + newVy * newVy;
    const maxSpeedSquared = steering.maxSpeed * steering.maxSpeed;

    if (speedSquared > maxSpeedSquared) {
      const speed = Math.sqrt(speedSquared); // Only compute sqrt when needed
      const scale = steering.maxSpeed / speed;
      setComponentProperties<VelocityComponent>(impl, CT.Velocity, {
        vx: newVx * scale,
        vy: newVy * scale,
      });
    } else {
      setComponentProperties<VelocityComponent>(impl, CT.Velocity, {
        vx: newVx,
        vy: newVy,
      });
    }
  }

  /**
   * Seek behavior - move toward target
   */
  private _seek(position: PositionComponent, velocity: VelocityComponent, steering: SteeringComponent, targetOverride?: Vector2): Vector2 {
    const target = targetOverride ?? steering.target;
    if (!target) {
      // No target yet (e.g., freshly deserialized, BrainSystem hasn't assigned one) — no force
      this._scratchSeek.x = 0;
      this._scratchSeek.y = 0;
      return this._scratchSeek;
    }

    const dx = target.x - position.x;
    const dy = target.y - position.y;

    // Normalize and scale to max speed
    const distSq = dx * dx + dy * dy;
    if (distSq === 0) {
      this._scratchSeek.x = 0;
      this._scratchSeek.y = 0;
      return this._scratchSeek;
    }
    const distance = Math.sqrt(distSq);

    const desiredX = (dx / distance) * steering.maxSpeed;
    const desiredY = (dy / distance) * steering.maxSpeed;

    // Steering = desired - current
    this._scratchSeek.x = desiredX - velocity.vx;
    this._scratchSeek.y = desiredY - velocity.vy;
    return this._scratchSeek;
  }

  /**
   * Arrive behavior - slow down when approaching target
   * Fixed to prevent jittering/oscillation when reaching target
   * Includes stuck detection for dead-end scenarios
   */
  private _arrive(position: PositionComponent, velocity: VelocityComponent, steering: SteeringComponent, entityId?: string, currentTick?: number): Vector2 {
    if (!steering.target) {
      // No target yet (e.g., freshly deserialized, BrainSystem hasn't assigned one) — no force
      this._scratchArrive.x = 0;
      this._scratchArrive.y = 0;
      return this._scratchArrive;
    }

    let desiredX = steering.target.x - position.x;
    let desiredY = steering.target.y - position.y;

    const distanceSquared = desiredX * desiredX + desiredY * desiredY;
    if (distanceSquared === 0) {
      this._scratchArrive.x = 0;
      this._scratchArrive.y = 0;
      return this._scratchArrive;
    }

    // Stuck detection: Check if agent is making progress toward target
    // Uses tick-based tracking (60 ticks ≈ 3s at 20 TPS) to avoid Date.now() in hot path
    if (entityId !== undefined && currentTick !== undefined) {
      const tracker = this.stuckTracker.get(entityId);

      if (!tracker) {
        // Initialize tracker
        this.stuckTracker.set(entityId, {
          lastPos: { x: position.x, y: position.y },
          lastTick: currentTick,
          target: { x: steering.target.x, y: steering.target.y }
        });
      } else {
        // Check if position changed significantly (moved at least 0.5 tiles)
        const dx = position.x - tracker.lastPos.x;
        const dy = position.y - tracker.lastPos.y;
        const movedSquared = dx * dx + dy * dy;
        const thresholdSquared = 0.5 * 0.5; // 0.25

        if (movedSquared > thresholdSquared) {
          // Made progress, reset stuck timer
          tracker.lastPos = { x: position.x, y: position.y };
          tracker.lastTick = currentTick;
        } else if (currentTick - tracker.lastTick > 60) {
          // Stuck for 60+ ticks (~3s at 20 TPS) - add random jitter to try different angles
          desiredX += (Math.random() - 0.5) * 2;
          desiredY += (Math.random() - 0.5) * 2;
          tracker.lastTick = currentTick; // Reset to prevent spam
        }
      }
    }

    // Dead zone - prevent micro-adjustments when very close (use squared comparison)
    const deadZoneSquared = steering.deadZone * steering.deadZone;
    if (distanceSquared < deadZoneSquared) {
      // Within dead zone - apply proportional braking that decays velocity smoothly
      // Using velocity dampening instead of hard negative force to prevent oscillation
      // This returns a force that will zero velocity over ~2-3 frames
      this._scratchArrive.x = -velocity.vx * 2;
      this._scratchArrive.y = -velocity.vy * 2;
      return this._scratchArrive;
    }

    // Check if already stopped and within tolerance (use squared comparison)
    const speedSquared = velocity.vx * velocity.vx + velocity.vy * velocity.vy;
    const arrivalTolerance = steering.arrivalTolerance ?? 1.0;
    const arrivalToleranceSquared = arrivalTolerance * arrivalTolerance;

    if (distanceSquared < arrivalToleranceSquared && speedSquared < 0.01) { // 0.1 * 0.1 = 0.01
      // Already stopped and close enough - apply gentle brake
      this._scratchArrive.x = -velocity.vx;
      this._scratchArrive.y = -velocity.vy;
      return this._scratchArrive;
    }

    // Compute actual distance only when needed for normalization
    const distance = Math.sqrt(distanceSquared);

    // Slow down within slowing radius
    const slowingRadius = steering.slowingRadius ?? 5.0;
    let targetSpeed = steering.maxSpeed;

    if (distance < slowingRadius) {
      // Quadratic slow-down for smoother deceleration
      const slowFactor = distance / slowingRadius;
      targetSpeed = steering.maxSpeed * slowFactor * slowFactor;

      // Extra damping when very close to prevent oscillation
      if (distance < arrivalTolerance * 2) {
        targetSpeed *= 0.5;
      }
    }

    // Normalize and scale
    const scaledX = (desiredX / distance) * targetSpeed;
    const scaledY = (desiredY / distance) * targetSpeed;

    this._scratchArrive.x = scaledX - velocity.vx;
    this._scratchArrive.y = scaledY - velocity.vy;
    return this._scratchArrive;
  }

  /**
   * Obstacle avoidance - check only immediate nearby tiles (simplified for performance)
   * Performance: Uses chunk-based spatial lookup instead of scanning all entities.
   */
  private _avoidObstacles(entity: Entity, position: PositionComponent, velocity: VelocityComponent, steering: SteeringComponent, world: World): Vector2 {
    const lookAheadDistance = steering.lookAheadDistance ?? 2.0; // Reduced from 5.0 to 2.0

    // Zero-check using squared values before paying for sqrt
    const speedSq = velocity.vx * velocity.vx + velocity.vy * velocity.vy;
    if (speedSq < 0.0001) {
      this._scratchAvoid.x = 0;
      this._scratchAvoid.y = 0;
      return this._scratchAvoid;
    }
    const speed = Math.sqrt(speedSq);

    this._scratchAhead.x = position.x + (velocity.vx / speed) * lookAheadDistance;
    this._scratchAhead.y = position.y + (velocity.vy / speed) * lookAheadDistance;
    const ahead = this._scratchAhead;

    // OPTIMIZATION: Use chunk-based spatial index for nearby entity lookup
    const checkRadius = 3.0;
    const CHUNK_SIZE = 32;
    const chunkX = Math.floor(position.x / CHUNK_SIZE);
    const chunkY = Math.floor(position.y / CHUNK_SIZE);

    // Collect obstacles from nearby chunks (reuse buffer to avoid allocation)
    this._obstacleBuffer.length = 0;
    const obstacles = this._obstacleBuffer;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nearbyEntityIds = world.getEntitiesInChunk(chunkX + dx, chunkY + dy);
        for (const nearbyId of nearbyEntityIds) {
          if (nearbyId === entity.id) continue;

          const e = world.entities.get(nearbyId);
          if (!e || !e.components.has('collision')) continue;

          const obstaclePos = getPosition(e);
          const collision = e.getComponent<CollisionComponent>('collision' as ComponentType);
          if (!obstaclePos || !collision) continue;

          // Quick distance check to filter out far obstacles BEFORE detailed checks
          const quickDist = Math.abs(obstaclePos.x - position.x) + Math.abs(obstaclePos.y - position.y);
          if (quickDist > checkRadius * 2) continue; // Manhattan distance early exit

          // Check if obstacle is in path (use squared distance for performance)
          const distSquared = this._distanceSquared(ahead, obstaclePos);
          const thresholdSquared = (collision.radius + 1.0) * (collision.radius + 1.0);
          if (distSquared <= thresholdSquared) {
            obstacles.push(e);
          }
        }
      }
    }

    if (obstacles.length === 0) {
      this._scratchAvoid.x = 0;
      this._scratchAvoid.y = 0;
      return this._scratchAvoid;
    }

    // Find closest obstacle using a for loop (avoids reduce callback allocation)
    let closest: Entity | undefined = undefined;
    let closestDistSq = Infinity;
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (!obs) continue;
      const obsPos = getPosition(obs);
      if (!obsPos) continue;
      const distSq = this._distanceSquared(position, obsPos);
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closest = obs;
      }
    }

    if (!closest) {
      this._scratchAvoid.x = 0;
      this._scratchAvoid.y = 0;
      return this._scratchAvoid;
    }

    const obstaclePos = getPosition(closest);
    if (!obstaclePos) {
      this._scratchAvoid.x = 0;
      this._scratchAvoid.y = 0;
      return this._scratchAvoid;
    }

    // Calculate steering force to avoid obstacle
    // Steer perpendicular to current heading to go around obstacle
    this._scratchToObstacle.x = obstaclePos.x - position.x;
    this._scratchToObstacle.y = obstaclePos.y - position.y;
    const toObstacle = this._scratchToObstacle;

    // Normalize velocity to get heading
    this._scratchHeading.x = velocity.vx / speed;
    this._scratchHeading.y = velocity.vy / speed;
    const heading = this._scratchHeading;

    // Calculate perpendicular directions (left and right of heading)
    this._scratchPerpLeft.x = -heading.y;
    this._scratchPerpLeft.y = heading.x;
    this._scratchPerpRight.x = heading.y;
    this._scratchPerpRight.y = -heading.x;
    const perpLeft = this._scratchPerpLeft;
    const perpRight = this._scratchPerpRight;

    // Choose direction that moves away from obstacle
    // Dot product tells us which side the obstacle is on
    const dotLeft = toObstacle.x * perpLeft.x + toObstacle.y * perpLeft.y;
    const dotRight = toObstacle.x * perpRight.x + toObstacle.y * perpRight.y;

    // Steer in the direction opposite to the obstacle
    const steerDir = dotLeft < dotRight ? perpLeft : perpRight;

    this._scratchAvoid.x = steerDir.x * steering.maxForce;
    this._scratchAvoid.y = steerDir.y * steering.maxForce;
    return this._scratchAvoid;
  }

  /**
   * Wander behavior - random but coherent movement
   * Note: Containment is now applied globally after all steering behaviors
   */
  private _wander(position: PositionComponent, velocity: VelocityComponent, steering: SteeringComponent): Vector2 {
    const wanderRadius = steering.wanderRadius ?? 2.0;
    const wanderDistance = steering.wanderDistance ?? 3.0;
    const wanderJitter = steering.wanderJitter ?? 0.1; // Reduced from 0.5 to prevent jittery movement

    // Get or initialize wander angle
    if (steering.wanderAngle === undefined) {
      steering.wanderAngle = Math.random() * Math.PI * 2;
    }

    // Jitter the wander angle
    steering.wanderAngle += (Math.random() - 0.5) * wanderJitter;

    // Calculate circle center (ahead of agent) - zero-check before sqrt
    const speedSq = velocity.vx * velocity.vx + velocity.vy * velocity.vy;
    let circleCenterX: number;
    let circleCenterY: number;

    if (speedSq > 0) {
      const speed = Math.sqrt(speedSq);
      circleCenterX = position.x + (velocity.vx / speed) * wanderDistance;
      circleCenterY = position.y + (velocity.vy / speed) * wanderDistance;
    } else {
      circleCenterX = position.x;
      circleCenterY = position.y + wanderDistance;
    }

    // Calculate target on circle using _scratchWander to avoid allocation
    this._scratchWander.x = circleCenterX + Math.cos(steering.wanderAngle) * wanderRadius;
    this._scratchWander.y = circleCenterY + Math.sin(steering.wanderAngle) * wanderRadius;

    // _seek writes into _scratchSeek and returns it; _scratchWander is already consumed above
    return this._seek(position, velocity, steering, this._scratchWander);
  }

  /**
   * Containment behavior - steer back toward bounds center when near edges
   */
  private _containment(position: PositionComponent, velocity: VelocityComponent, steering: SteeringComponent): Vector2 {
    const bounds = steering.containmentBounds;
    if (!bounds) return { x: 0, y: 0 };

    const margin = steering.containmentMargin;
    let forceX = 0;
    let forceY = 0;

    // Calculate distance to each boundary
    const distToMinX = position.x - bounds.minX;
    const distToMaxX = bounds.maxX - position.x;
    const distToMinY = position.y - bounds.minY;
    const distToMaxY = bounds.maxY - position.y;

    // Calculate center of bounds
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // Apply force proportional to how close agent is to boundary
    // Force increases as agent gets closer to edge
    if (distToMinX < margin) {
      // Near left edge - steer right (toward center)
      const urgency = 1 - (distToMinX / margin);
      forceX += steering.maxForce * urgency;
    }
    if (distToMaxX < margin) {
      // Near right edge - steer left (toward center)
      const urgency = 1 - (distToMaxX / margin);
      forceX -= steering.maxForce * urgency;
    }
    if (distToMinY < margin) {
      // Near bottom edge - steer up (toward center)
      const urgency = 1 - (distToMinY / margin);
      forceY += steering.maxForce * urgency;
    }
    if (distToMaxY < margin) {
      // Near top edge - steer down (toward center)
      const urgency = 1 - (distToMaxY / margin);
      forceY -= steering.maxForce * urgency;
    }

    // If completely outside bounds, seek center strongly
    if (position.x < bounds.minX || position.x > bounds.maxX ||
        position.y < bounds.minY || position.y > bounds.maxY) {
      const seekTarget = { x: centerX, y: centerY };
      return this._seek(position, velocity, steering, seekTarget);
    }

    return { x: forceX, y: forceY };
  }

  /**
   * Combined behaviors - blend multiple steering forces
   */
  private _combined(entity: Entity, position: PositionComponent, velocity: VelocityComponent, steering: SteeringComponent, world: World): Vector2 {
    if (!steering.behaviors || steering.behaviors.length === 0) {
      this._scratchCombined.x = 0;
      this._scratchCombined.y = 0;
      return this._scratchCombined;
    }

    // Accumulate into _scratchCombined (reset first)
    this._scratchCombined.x = 0;
    this._scratchCombined.y = 0;

    for (const behavior of steering.behaviors) {
      const weight = behavior.weight ?? 1.0;
      let force: Vector2;

      switch (behavior.type) {
        case 'seek':
          // _seek writes _scratchSeek; read force.x/y before next sub-call overwrites it
          force = this._seek(position, velocity, steering, behavior.target);
          break;

        case 'obstacle_avoidance':
          // _avoidObstacles writes _scratchAvoid
          force = this._avoidObstacles(entity, position, velocity, steering, world);
          break;

        case 'wander':
          // _wander calls _seek internally and returns _scratchSeek
          force = this._wander(position, velocity, steering);
          break;

        default:
          continue;
      }

      // Accumulate immediately — before any subsequent sub-call could overwrite the scratch
      this._scratchCombined.x += force.x * weight;
      this._scratchCombined.y += force.y * weight;
    }

    return this._scratchCombined;
  }

  /**
   * Limit vector magnitude
   */
  private _limit(vector: Vector2, max: number): Vector2 {
    // Use squared comparison to avoid sqrt in the common case (within limit)
    const magSq = vector.x * vector.x + vector.y * vector.y;
    if (magSq > max * max) {
      const magnitude = Math.sqrt(magSq);
      return {
        x: (vector.x / magnitude) * max,
        y: (vector.y / magnitude) * max,
      };
    }
    return vector;
  }

  /**
   * Calculate squared distance between two points (faster - no sqrt)
   * Use this for distance comparisons to avoid expensive sqrt operations
   */
  private _distanceSquared(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  /**
   * Calculate distance between two points
   * Only use when you need the actual distance value (not for comparisons)
   */
  private _distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
