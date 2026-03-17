import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import type { World } from '../ecs/World.js';
import type { Entity } from '../ecs/Entity.js';
import type {
  PlayerControlComponent,
  AgentComponent,
  NeedsComponent,
  IdentityComponent,
} from '../components/index.js';

/**
 * MortalPawnSystem - Manages mortal pawn mode (player inhabiting a regular agent)
 *
 * Unlike PossessionSystem (deity possession with belief cost + time limit),
 * mortal pawn mode has:
 * - No belief cost (player is mortal, not a deity)
 * - No time limit (play as long as you want)
 * - Agent death ends the session
 * - Companion (Ophanim) activates as guide
 */
export class MortalPawnSystem extends BaseSystem {
  public readonly id = 'mortal_pawn' as const;
  public readonly priority = 5; // Same priority band as PossessionSystem
  public readonly requiredComponents: string[] = [] as const;
  public readonly activationComponents = ['player_control'] as const;
  protected readonly throttleInterval = 0; // Every tick for responsiveness

  protected onUpdate(ctx: SystemContext): void {
    const world = ctx.world;

    const playerControlEntities = world
      .query()
      .with('player_control')
      .executeEntities();

    if (playerControlEntities.length === 0) {
      return;
    }

    const playerEntity = playerControlEntities[0];
    if (!playerEntity) {
      return;
    }

    const playerControl = playerEntity.getComponent<PlayerControlComponent>('player_control');

    if (!playerControl) {
      return;
    }

    // Only handle mortal pawn mode
    if (playerControl.possessionMode !== 'mortal' || !playerControl.isPossessed) {
      return;
    }

    if (!playerControl.possessedAgentId) {
      return;
    }

    // Get the possessed agent
    const possessedAgent = world.getEntity(playerControl.possessedAgentId);
    if (!possessedAgent) {
      // Agent no longer exists - force jack-out
      this.jackOut(playerEntity, world, 'Agent no longer exists');
      return;
    }

    const needs = possessedAgent.getComponent<NeedsComponent>('needs');

    if (!needs) {
      // Missing required components - force jack-out
      this.jackOut(playerEntity, world, 'Agent missing required components');
      return;
    }

    // Agent death ends mortal pawn session
    if (needs.health <= 0) {
      this.jackOut(playerEntity, world, 'Agent died');
      return;
    }

    // Emit tick event for UI updates
    const ticksInPossession = ctx.tick - playerControl.possessionStartTick;
    this.events.emit('mortal_pawn:tick', {
      agentId: playerControl.possessedAgentId,
      ticksInPossession,
    }, 'system');
  }

  /**
   * Jack in - possess an agent as a mortal pawn (no belief cost, no time limit)
   */
  public jackIn(
    playerEntity: Entity,
    agentEntity: Entity,
    world: World
  ): { success: boolean; reason?: string } {
    const playerControl = playerEntity.getComponent<PlayerControlComponent>('player_control');
    const agent = agentEntity.getComponent<AgentComponent>('agent');
    const needs = agentEntity.getComponent<NeedsComponent>('needs');
    const identity = agentEntity.getComponent<IdentityComponent>('identity');

    if (!playerControl || !agent || !needs) {
      return { success: false, reason: 'Missing required components' };
    }

    // Check if already possessed
    if (playerControl.isPossessed) {
      return { success: false, reason: 'Already possessing another agent' };
    }

    // Check if agent is alive
    if (needs.health <= 0) {
      return { success: false, reason: 'Cannot possess dead agent' };
    }

    // Set possession state - no belief cost for mortal pawn mode
    const currentTick = world.tick;
    playerControl.isPossessed = true;
    playerControl.possessedAgentId = agentEntity.id;
    playerControl.possessionStartTick = currentTick;
    playerControl.inputMode = 'possessed' as const;
    playerControl.possessionMode = 'mortal' as const;
    playerControl.movementCommand = null;
    playerControl.pendingInteraction = null;
    playerControl.lastInputTick = currentTick;

    // Mark agent as player-controlled
    agent.behavior = 'player_controlled' as const;
    agent.behaviorState = { possessedBy: playerEntity.id, mode: 'mortal' };

    // Emit possession event
    this.events.emit('mortal_pawn:jack_in', {
      agentId: agentEntity.id,
      agentName: identity?.name ?? 'Unknown',
    }, 'system');

    // Activate companion guidance for mortal pawn mode
    this.events.emit('companion:mortal_pawn_entered', {
      agentId: agentEntity.id,
    }, 'system');

    return { success: true };
  }

  /**
   * Jack out - return to god mode from mortal pawn possession
   */
  public jackOut(playerEntity: Entity, world: World, reason?: string): void {
    const playerControl = playerEntity.getComponent<PlayerControlComponent>('player_control');

    if (!playerControl || !playerControl.isPossessed || playerControl.possessionMode !== 'mortal') {
      return; // Not currently in mortal pawn possession
    }

    const agentId = playerControl.possessedAgentId;
    const ticksPlayed = world.tick - playerControl.possessionStartTick;

    // Restore possessed agent's behavior (if agent still exists)
    if (agentId) {
      const agentEntity = world.getEntity(agentId);
      if (agentEntity) {
        const agentComp = agentEntity.getComponent<AgentComponent>('agent');
        if (agentComp) {
          agentComp.behavior = 'idle' as const;
          agentComp.behaviorState = {};
        }
      }
    }

    // Clear possession state and return to god mode
    playerControl.isPossessed = false;
    playerControl.possessedAgentId = null;
    playerControl.possessionStartTick = 0;
    playerControl.inputMode = 'god' as const;
    playerControl.possessionMode = 'deity' as const;
    playerControl.movementCommand = null;
    playerControl.pendingInteraction = null;

    // Emit jack-out event
    this.events.emit('mortal_pawn:jack_out', {
      agentId,
      reason: reason || 'Player jack-out',
      ticksPlayed,
    }, 'system');
  }

  /**
   * Get currently possessed agent in mortal pawn mode (if any)
   */
  public getPossessedAgent(world: World): Entity | null {
    const playerControlEntities = world
      .query()
      .with('player_control')
      .executeEntities();

    const playerEntity = playerControlEntities[0];
    if (!playerEntity) {
      return null;
    }

    const playerControl = playerEntity.getComponent<PlayerControlComponent>('player_control');

    if (
      !playerControl ||
      !playerControl.isPossessed ||
      playerControl.possessionMode !== 'mortal' ||
      !playerControl.possessedAgentId
    ) {
      return null;
    }

    return world.getEntity(playerControl.possessedAgentId) ?? null;
  }

  /**
   * Check if the player is currently in mortal pawn mode
   */
  public isInMortalMode(world: World): boolean {
    const playerControlEntities = world
      .query()
      .with('player_control')
      .executeEntities();

    const playerEntity = playerControlEntities[0];
    if (!playerEntity) {
      return false;
    }

    const playerControl = playerEntity.getComponent<PlayerControlComponent>('player_control');

    return !!(playerControl && playerControl.possessionMode === 'mortal' && playerControl.isPossessed);
  }
}
