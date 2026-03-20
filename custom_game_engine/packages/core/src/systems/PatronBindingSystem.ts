/**
 * PatronBindingSystem — Drive 4: Ownership & Possession
 *
 * Manages the player's patron soul binding. The player "binds" to one agent,
 * acting as a guardian spirit. The system:
 *
 * 1. Tracks which agent is the patron (via patron:bound / patron:unbound events)
 * 2. Subscribes to game events for the patron agent and emits PATRON_EVENT
 *    for the UI layer (PatronToastRenderer + PatronPortraitWidget)
 * 3. Applies a small confidence/bravery boost ("the gods favor those who are seen")
 * 4. On patron death, emits patron:death_farewell for psychopomp integration
 *
 * Task: MUL-2274
 */

import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { EventBus } from '../events/EventBus.js';
import type { WorldMutator } from '../ecs/World.js';
import type { EntityId } from '../types.js';

/** Confidence boost applied to the patron agent — subtle, lore-justified */
const PATRON_CONFIDENCE_BOOST = 0.05;

export class PatronBindingSystem extends BaseSystem {
  public readonly id = 'patron_binding' as const;
  public readonly priority = 155; // After cognition (100-200 range), before utilities
  public readonly requiredComponents: string[] = [];
  public readonly activationComponents = ['agent'] as const;
  protected readonly throttleInterval = 100; // 5 seconds — stat boost check only

  /** Currently bound patron agent ID, or null */
  private patronId: string | null = null;
  private patronName: string | null = null;

  /** Track first-time events so we only notify once */
  private patronHasCastMagic = false;

  protected onInitialize(world: WorldMutator, _eventBus: EventBus): void {
    // -----------------------------------------------------------------------
    // Binding lifecycle — driven by UI layer (AgentInfoPanel callbacks)
    // -----------------------------------------------------------------------
    this.events.on('patron:bound', (data) => {
      this.patronId = data.agentId;
      this.patronName = data.agentName;
      this.patronHasCastMagic = false;

      // Apply confidence boost
      this.applyPatronBoost(world, data.agentId);
    });

    this.events.on('patron:unbound', (data) => {
      // Remove boost from previous patron
      if (this.patronId) {
        this.removePatronBoost(world, this.patronId);
      }
      this.patronId = null;
      this.patronName = null;
      this.patronHasCastMagic = false;
    });

    // -----------------------------------------------------------------------
    // Game events we watch for the patron agent
    // -----------------------------------------------------------------------

    // Skill level up
    this.events.on('skill:level_up', (data) => {
      if (!this.patronId || data.agentId !== this.patronId) return;
      this.emitPatronEvent(
        'skill_level_up',
        `Reached level ${data.newLevel} in ${data.skillId}`,
      );
    });

    // New relationship formed
    this.events.on('relationship:improved', (data, event) => {
      if (!this.patronId) return;
      // The source of the event is the agent who formed the relationship
      const sourceId = event.source;
      if (sourceId !== this.patronId && data.targetAgent !== this.patronId) return;

      // Only notify for meaningful relationship improvements
      if (data.amount >= 5) {
        this.emitPatronEvent(
          'new_relationship',
          `Formed a bond through ${data.reason}`,
        );
      }
    });

    // First magic cast
    this.events.on('magic:spell_cast', (data) => {
      if (!this.patronId || this.patronHasCastMagic) return;
      if (data.casterId !== this.patronId) return;

      this.patronHasCastMagic = true;
      this.emitPatronEvent(
        'first_magic_cast',
        `Cast their first spell: ${data.spellId}`,
      );
    });

    // Child born — patron is a parent
    this.events.on('agent:birth', (data) => {
      if (!this.patronId) return;
      // agent:birth event data includes parents: [parentId1, parentId2] | null
      if (!data.parents?.includes(this.patronId)) return;

      this.emitPatronEvent(
        'child_born',
        `A child named ${data.name} was born`,
      );
    });

    // Patron death — triggers farewell
    this.events.on('agent:died', (data) => {
      if (!this.patronId || data.entityId !== this.patronId) return;

      // Emit the patron-specific death event for UI
      this.emitPatronEvent('death', `${data.name} has passed on`);

      // Emit detailed farewell for psychopomp integration
      this.events.emit('patron:death_farewell', {
        agentId: this.patronId,
        agentName: this.patronName ?? data.name,
        causeOfDeath: data.causeOfDeath,
      }, this.patronId);

      // Clear binding — the patron is gone
      this.patronId = null;
      this.patronName = null;
      this.patronHasCastMagic = false;
    });
  }

  protected onUpdate(ctx: SystemContext): void {
    // Periodic check: re-apply boost if patron entity lost it (e.g. after load)
    if (!this.patronId) return;

    const entity = this.world.getEntity(this.patronId);
    if (!entity) {
      // Patron entity no longer exists — clear binding silently
      this.patronId = null;
      this.patronName = null;
      return;
    }

    // Ensure the confidence boost is still applied
    const personality = entity.components.get(CT.Personality) as
      | { confidence?: number; patronBoosted?: boolean }
      | undefined;
    if (personality && !personality.patronBoosted) {
      this.applyPatronBoost(this.world, this.patronId);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Emit a PATRON_EVENT to the EventBus for the UI layer.
   *
   * The main.ts render loop subscribes to these via the legacy event name
   * 'PATRON_EVENT' for the PatronToastRenderer. We also emit the typed
   * 'patron:event_triggered' event.
   */
  private emitPatronEvent(
    eventType: 'skill_level_up' | 'new_relationship' | 'first_magic_cast' | 'child_born' | 'death',
    summary: string,
  ): void {
    if (!this.patronId || !this.patronName) return;

    // Typed event for systems
    this.events.emit('patron:event_triggered', {
      agentId: this.patronId,
      agentName: this.patronName,
      eventType,
      summary,
    }, this.patronId);
  }

  /** Apply the "watched by the gods" confidence boost to the patron agent */
  private applyPatronBoost(world: WorldMutator, agentId: string): void {
    const entity = world.getEntity(agentId);
    if (!entity || !entity.hasComponent(CT.Personality)) return;

    world.updateComponent(agentId, CT.Personality, (current: any) => ({
      ...current,
      confidence: Math.min(1, ((current.confidence as number) ?? 0.5) + PATRON_CONFIDENCE_BOOST),
      patronBoosted: true,
    }));
  }

  /** Remove the confidence boost when unbinding */
  private removePatronBoost(world: WorldMutator, agentId: string): void {
    const entity = world.getEntity(agentId);
    if (!entity || !entity.hasComponent(CT.Personality)) return;

    const personality = entity.components.get(CT.Personality) as
      | { patronBoosted?: boolean }
      | undefined;
    if (!personality?.patronBoosted) return;

    world.updateComponent(agentId, CT.Personality, (current: any) => ({
      ...current,
      confidence: Math.max(0, ((current.confidence as number) ?? 0.5) - PATRON_CONFIDENCE_BOOST),
      patronBoosted: false,
    }));
  }
}
