/**
 * EmotionalContagionSystem — Cascade detection and Dreamer failure mode
 *
 * Emotional contagion is not merely proximity boosting a stat. It is a
 * social phenomenon with emergent danger: strong emotions spread, cluster,
 * and amplify until the group loses individual volition and collapses into
 * a shared feedback loop — the Dreamer failure mode.
 *
 * ## How it works
 *
 * Each tick (throttled), the system:
 *
 * 1. **Scans nearby agents** for high-intensity emotional states
 *    (terrified, manic, enraged, joyful at extreme levels).
 *
 * 2. **Accumulates contagionLevel** on the target agent.
 *    - Individual nearby agent in high-intensity state: +CONTAGION_RATE_INDIVIDUAL
 *    - CASCADE detected (3+ agents sharing same state): +CONTAGION_RATE_CASCADE
 *    - No nearby high-intensity agents: contagionLevel decays toward 0
 *
 * 3. **Triggers Dreamer failure mode** when contagionLevel > DREAMER_THRESHOLD.
 *    The agent enters the 'dreaming' emotional state: fixated on the cascaded
 *    emotion, unresponsive to normal stimuli.
 *
 * 4. **Norn defense mechanisms** activate when BiochemistryComponent is present:
 *    - nurtureScore > 0.4: contagion accumulation rate halved
 *    - nurtureScore > 0.6 AND in dreamer mode: can break out after DREAMER_NORN_RECOVERY_TICKS
 *    - Emits 'emotion:norn_defense_activated' when resistance triggers
 *
 * ## Why this matters (Scheherazade's critique)
 *
 * A proximity stat modifier is just arithmetic. Cascade detection creates
 * *emergent danger* — a group can tip from normal emotional states into a
 * collective feedback loop. The player watches their village fall silent as
 * one by one the agents start dreaming. That's not a stat. That's a crisis.
 * And Norns who are nurtured can resist it — which makes nurture matter.
 *
 * Priority: 49 (after MoodSystem 48, before behavior systems 50+)
 */

import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import type { World } from '../ecs/World.js';
import type { EventBus } from '../events/EventBus.js';
import { EntityImpl } from '../ecs/Entity.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { MoodComponent, EmotionalState } from '../components/MoodComponent.js';
import type { BiochemistryComponent } from '../components/BiochemistryComponent.js';

// ============================================================================
// Constants
// ============================================================================

/** Tile radius within which emotional contagion operates */
const CONTAGION_RANGE = 10;

/** Squared range (avoids sqrt in hot path) */
const CONTAGION_RANGE_SQ = CONTAGION_RANGE * CONTAGION_RANGE;

/** How many agents must share an intense state for cascade to trigger */
const CASCADE_THRESHOLD = 3;

/** Contagion rate per tick from a single nearby high-intensity agent */
const CONTAGION_RATE_INDIVIDUAL = 0.03;

/** Contagion rate per tick during a cascade (multiplied by cascade size - threshold) */
const CONTAGION_RATE_CASCADE_BASE = 0.06;

/** Decay rate per tick when not near any cascade-eligible agents */
const CONTAGION_DECAY_RATE = 0.02;

/** contagionLevel at which Dreamer failure mode triggers */
const DREAMER_THRESHOLD = 0.75;

/** How long before a nurtured Norn can break out of dreamer mode (ticks) */
const DREAMER_NORN_RECOVERY_TICKS = 200; // 10 seconds

/** How long before any agent exits dreamer mode without Norn defense (ticks) */
const DREAMER_PASSIVE_RECOVERY_TICKS = 600; // 30 seconds

/** Nurture score above which contagion accumulation is halved */
const NORN_RESISTANCE_THRESHOLD = 0.4;

/** Nurture score above which Norn can actively break dreamer mode */
const NORN_RECOVERY_THRESHOLD = 0.6;

/** Chunk size for spatial lookup (must match world chunk system) */
const CHUNK_SIZE = 32;

/** Emotional states considered "high-intensity" for contagion purposes */
const HIGH_INTENSITY_STATES: ReadonlySet<EmotionalState> = new Set([
  'terrified',
  'manic',
  'enraged',
  'joyful',
]);

/**
 * Mood intensity threshold for contagion eligibility.
 * Agent must have |mood| > this to broadcast contagion.
 */
const MOOD_INTENSITY_THRESHOLD = 55;

// ============================================================================
// System
// ============================================================================

export class EmotionalContagionSystem extends BaseSystem {
  public readonly id = 'emotional_contagion' as const;
  public readonly priority = 49; // After MoodSystem (48), before behavior systems
  public readonly requiredComponents = [CT.Mood, CT.Position] as const;
  public readonly activationComponents = [CT.Mood] as const;

  /** Throttle: check contagion every 2 seconds (40 ticks at 20 TPS) */
  protected readonly throttleInterval = 40;

  protected override onInitialize(_world: World, _eventBus: EventBus): void {
    // No event subscriptions — this system is purely tick-driven
  }

  protected onUpdate(ctx: SystemContext): void {
    const { world, activeEntities, tick } = ctx;

    for (const entity of activeEntities) {
      const impl = entity as EntityImpl;
      const mood = impl.getComponent<MoodComponent>(CT.Mood);
      if (!mood) continue;

      const pos = impl.getComponent(CT.Position) as { x: number; y: number } | undefined;
      if (!pos) continue;

      // Gather nearby agent mood states via chunk-based lookup
      const nearbyStates = this.gatherNearbyEmotionalStates(impl, pos, world);

      // Detect cascade: 3+ agents sharing a high-intensity state
      const cascade = this.detectCascade(nearbyStates);

      // Check Norn biochemistry resistance
      const biochem = impl.getComponent<BiochemistryComponent>(CT.Biochemistry);
      const nurtureScore = biochem?.nurtureScore ?? 0;
      const oxytocin = biochem?.oxytocin ?? 0;
      const isNorn = biochem !== undefined; // Only Norns have BiochemistryComponent

      // Calculate contagion delta for this tick
      let contagionDelta = 0;

      if (cascade !== null) {
        // Cascade: scale rate by cascade size
        const cascadeStrength = cascade.count - CASCADE_THRESHOLD + 1;
        contagionDelta = CONTAGION_RATE_CASCADE_BASE * cascadeStrength;

        // Emit cascade detected event (once per cascade onset)
        const wasInCascade = (mood.contagionLevel ?? 0) > 0.2;
        if (!wasInCascade) {
          this.events.emit('emotion:cascade_detected', {
            epicentreEntityId: entity.id,
            dominantState: cascade.state,
            cascadeSize: cascade.count,
            tick,
          });
        }
      } else if (nearbyStates.length > 0) {
        // Individual high-intensity agents nearby but no cascade
        contagionDelta = CONTAGION_RATE_INDIVIDUAL;
      } else {
        // No high-intensity sources nearby: decay
        contagionDelta = -CONTAGION_DECAY_RATE;
      }

      // Norn resistance: halve accumulation rate
      if (isNorn && nurtureScore > NORN_RESISTANCE_THRESHOLD && contagionDelta > 0) {
        contagionDelta *= 0.5;

        if (oxytocin > 0.5 && contagionDelta > 0) {
          // Extra resistance from high oxytocin
          contagionDelta *= 0.7;
        }
      }

      const currentContagion = mood.contagionLevel ?? 0;
      const newContagion = Math.max(0, Math.min(1, currentContagion + contagionDelta));

      // Check dreamer failure mode transition
      let dreamerMode = mood.dreamerMode ?? false;
      let dreamerStartTick = mood.dreamerStartTick;
      let newEmotionalState = mood.emotionalState;

      if (!dreamerMode && newContagion >= DREAMER_THRESHOLD) {
        // Enter dreamer mode
        dreamerMode = true;
        dreamerStartTick = tick;
        newEmotionalState = 'dreaming';

        this.events.emit('emotion:dreamer_failure', {
          entityId: entity.id,
          contagionLevel: newContagion,
          cascadeState: cascade?.state ?? 'unknown',
          tick,
        });
      } else if (dreamerMode) {
        // Check recovery conditions
        const ticksInDreamer = tick - (dreamerStartTick ?? tick);
        let recovered = false;

        if (isNorn && nurtureScore > NORN_RECOVERY_THRESHOLD) {
          // Norn with high nurture: faster recovery
          if (ticksInDreamer >= DREAMER_NORN_RECOVERY_TICKS && newContagion < DREAMER_THRESHOLD) {
            recovered = true;

            this.events.emit('emotion:norn_defense_activated', {
              entityId: entity.id,
              nurtureScore,
              oxytocin,
              ticksInDreamer,
              tick,
            });
          }
        } else if (ticksInDreamer >= DREAMER_PASSIVE_RECOVERY_TICKS && newContagion < DREAMER_THRESHOLD) {
          // Passive recovery for non-Norns
          recovered = true;
        }

        if (recovered) {
          dreamerMode = false;
          dreamerStartTick = undefined;
          // Restore emotional state from base mood
          newEmotionalState = this.emotionalStateFromMood(mood.currentMood, mood.factors);
        }
      }

      // Write back updated contagion state
      impl.updateComponent<MoodComponent>(CT.Mood, (current) => ({
        ...current,
        contagionLevel: newContagion,
        dreamerMode,
        dreamerStartTick,
        emotionalState: newEmotionalState,
      }));
    }
  }

  /**
   * Gather the emotional states of nearby high-intensity agents.
   * Uses chunk-based spatial lookup for O(~entities_in_chunk) performance.
   */
  private gatherNearbyEmotionalStates(
    self: EntityImpl,
    pos: { x: number; y: number },
    world: World
  ): EmotionalState[] {
    const states: EmotionalState[] = [];

    const chunkX = Math.floor(pos.x / CHUNK_SIZE);
    const chunkY = Math.floor(pos.y / CHUNK_SIZE);

    // Chunks to check: CONTAGION_RANGE=10 < CHUNK_SIZE=32, so adjacent chunks suffice
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const entityIds = world.getEntitiesInChunk(chunkX + dx, chunkY + dy);

        for (const entityId of entityIds) {
          if (entityId === self.id) continue;

          const other = world.getEntity(entityId);
          if (!other) continue;

          const otherImpl = other as EntityImpl;

          // Must be an agent with a Mood component
          if (!otherImpl.hasComponent(CT.Agent)) continue;

          const otherMood = otherImpl.getComponent<MoodComponent>(CT.Mood);
          if (!otherMood) continue;

          // Must be in a high-intensity state
          if (!HIGH_INTENSITY_STATES.has(otherMood.emotionalState)) continue;
          if (Math.abs(otherMood.currentMood) < MOOD_INTENSITY_THRESHOLD) continue;

          // Distance check (squared, no sqrt)
          const otherPos = otherImpl.getComponent(CT.Position) as { x: number; y: number } | undefined;
          if (!otherPos) continue;

          const dx2 = pos.x - otherPos.x;
          const dy2 = pos.y - otherPos.y;
          if (dx2 * dx2 + dy2 * dy2 > CONTAGION_RANGE_SQ) continue;

          states.push(otherMood.emotionalState);
        }
      }
    }

    return states;
  }

  /**
   * Detect whether a cascade is occurring among nearby emotional states.
   * A cascade requires CASCADE_THRESHOLD or more agents sharing the same state.
   *
   * Returns the dominant state and count, or null if no cascade.
   */
  private detectCascade(
    states: EmotionalState[]
  ): { state: EmotionalState; count: number } | null {
    if (states.length < CASCADE_THRESHOLD) return null;

    // Count occurrences of each state
    const counts = new Map<EmotionalState, number>();
    for (const state of states) {
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }

    // Find the most common state
    let maxCount = 0;
    let dominantState: EmotionalState = 'content';
    for (const [state, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        dominantState = state;
      }
    }

    if (maxCount < CASCADE_THRESHOLD) return null;

    return { state: dominantState, count: maxCount };
  }

  /**
   * Determine emotional state from mood value after dreamer recovery.
   * Mirrors the logic in MoodComponent.determineEmotionalState.
   */
  private emotionalStateFromMood(
    mood: number,
    factors: MoodComponent['factors']
  ): EmotionalState {
    if (factors.social < -50) return 'lonely';
    if (factors.achievement > 60) return 'proud';
    if (factors.social > 50 && mood > 30) return 'grateful';
    if (factors.physical < -40) return 'anxious';
    if (factors.comfort > 40 && mood > 20) return 'nostalgic';
    if (mood > 60) return 'joyful';
    if (mood > 40) return 'excited';
    if (mood < -40) return 'melancholic';
    if (mood < -20) return 'frustrated';
    return 'content';
  }

  protected override onCleanup(): void {
    // Nothing to clean up
  }
}
