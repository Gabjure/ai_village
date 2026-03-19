/**
 * @status ENABLED
 *
 * ## What This System Does
 * Handles proximity-based greeting exchanges between agents in the world.
 * When agents come within greeting range of each other (8 tiles), they
 * exchange a greeting appropriate to their relationship familiarity level.
 * Greetings boost relationship familiarity and satisfy the social.contact need.
 *
 * Greeting types by familiarity:
 * - 'nod'           (familiarity < 20)  — stranger acknowledgement (+1 familiarity, +2 social)
 * - 'wave'          (familiarity 20–59) — acquaintance greeting   (+2 familiarity, +5 social)
 * - 'warm_greeting' (familiarity >= 60) — friend greeting         (+3 familiarity, +8 social)
 *
 * ## Implementation Notes
 * - Only ONE greeting per entity per tick (break after first greeting found)
 * - Uses squared distance (no Math.sqrt) for performance
 * - Agents in active conversations are skipped
 * - GreetingStateComponent is lazy-initialized on first greeting
 * - Cooldown tracked per pair: 1000 ticks (~50 seconds at 20 TPS)
 * - Stale cooldown entries cleaned up after 2x GREETING_COOLDOWN
 *
 * ## Dependencies
 * - PositionComponent (required)
 * - AgentComponent (required)
 * - RelationshipComponent (optional — graceful degrade, treated as stranger)
 * - ConversationComponent (optional — checked to skip active conversations)
 * - NeedsComponent (optional — social.contact boost when present)
 * - GreetingStateComponent (lazy-initialized)
 *
 * ## Events
 * - 'greeting:exchanged' — emitted whenever a greeting pair is resolved
 *
 * GreetingSystem
 *
 * Deep Conversation System — Emergent Social Dynamics
 * Proximity-triggered greeting exchanges that reinforce agent relationships.
 */

import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import type { World } from '../ecs/World.js';
import { EntityImpl } from '../ecs/Entity.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { PositionComponent } from '../components/PositionComponent.js';
import type { RelationshipComponent } from '../components/RelationshipComponent.js';
import { type ConversationComponent, isInConversation } from '../components/ConversationComponent.js';
import type { NeedsComponent } from '../components/NeedsComponent.js';
import { type GreetingStateComponent, createGreetingStateComponent } from '../components/GreetingStateComponent.js';

type GreetingType = 'nod' | 'wave' | 'warm_greeting';

export class GreetingSystem extends BaseSystem {
  public readonly id = 'greeting' as const;
  public readonly priority = 18; // After FriendshipSystem (17)

  // Require agents with positions — only agents placed in the world can greet
  public readonly requiredComponents = [CT.Agent, CT.Position] as const;

  // Activate whenever any agent exists in the world
  public readonly activationComponents = [CT.Agent] as const;

  // Check frequently enough for responsive greetings (~2 seconds at 20 TPS)
  protected readonly throttleInterval = 40;

  // Greeting range: 8 tiles. Use squared distance to avoid Math.sqrt.
  private static readonly GREETING_RADIUS_SQ = 64; // 8 * 8

  // Cooldown between greetings for a given pair: 1000 ticks (~50 seconds at 20 TPS)
  private static readonly GREETING_COOLDOWN = 1000;

  // Familiarity thresholds
  private static readonly FAMILIARITY_ACQUAINTANCE = 20;
  private static readonly FAMILIARITY_FRIEND = 60;

  protected onUpdate(ctx: SystemContext): void {
    // Cache query once before the loop — avoids repeated world queries per entity
    const allAgents = ctx.world
      .query()
      .with(CT.Agent)
      .with(CT.Position)
      .executeEntities() as EntityImpl[];

    for (const entity of ctx.activeEntities) {
      this.processGreetings(entity, allAgents, ctx);
    }
  }

  private processGreetings(
    entity: EntityImpl,
    allAgents: EntityImpl[],
    ctx: SystemContext
  ): void {
    const position = entity.getComponent<PositionComponent>(CT.Position);
    if (!position) return;

    // Lazy-init GreetingStateComponent
    let greetingState = entity.getComponent<GreetingStateComponent>(CT.GreetingState);
    if (!greetingState) {
      entity.addComponent(createGreetingStateComponent());
      greetingState = entity.getComponent<GreetingStateComponent>(CT.GreetingState);
    }
    if (!greetingState) return;

    // Skip if this entity is in an active conversation
    const conv = entity.getComponent<ConversationComponent>(CT.Conversation);
    if (conv && isInConversation(conv)) return;

    const tick = ctx.world.tick;

    for (const other of allAgents) {
      // Skip self
      if (other.id === entity.id) continue;

      // Skip if other is in an active conversation
      const otherConv = other.getComponent<ConversationComponent>(CT.Conversation);
      if (otherConv && isInConversation(otherConv)) continue;

      // Check proximity using squared distance
      const otherPos = other.getComponent<PositionComponent>(CT.Position);
      if (!otherPos) continue;

      const dx = position.x - otherPos.x;
      const dy = position.y - otherPos.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > GreetingSystem.GREETING_RADIUS_SQ) continue;

      // Check greeting cooldown
      const lastGreetedTick = greetingState.greetedAt.get(other.id) ?? -Infinity;
      if (tick - lastGreetedTick < GreetingSystem.GREETING_COOLDOWN) continue;

      // Determine greeting type from relationship familiarity
      const relationship = entity.getComponent<RelationshipComponent>(CT.Relationship);
      const otherRelEntry = relationship?.relationships.get(other.id);
      const familiarity = otherRelEntry?.familiarity ?? 0;

      let greetingType: GreetingType;
      let familiarityBoost: number;
      let contactBoost: number;

      if (familiarity >= GreetingSystem.FAMILIARITY_FRIEND) {
        greetingType = 'warm_greeting';
        familiarityBoost = 3;
        contactBoost = 8;
      } else if (familiarity >= GreetingSystem.FAMILIARITY_ACQUAINTANCE) {
        greetingType = 'wave';
        familiarityBoost = 2;
        contactBoost = 5;
      } else {
        greetingType = 'nod';
        familiarityBoost = 1;
        contactBoost = 2;
      }

      // Record greeting tick
      greetingState.greetedAt.set(other.id, tick);

      // Update relationship familiarity (graceful degrade if no relationship component)
      if (otherRelEntry) {
        const otherId = other.id;
        entity.updateComponent<RelationshipComponent>(CT.Relationship, (rel) => {
          const existing = rel.relationships.get(otherId);
          if (existing) {
            existing.familiarity = Math.min(100, existing.familiarity + familiarityBoost);
            existing.lastInteraction = ctx.world.tick;
            existing.interactionCount++;
          }
          return rel;
        });
      }

      // Update socialContact need if NeedsComponent exists (0-1 scale)
      const needs = entity.getComponent<NeedsComponent>(CT.Needs);
      if (needs) {
        const contactDelta = contactBoost / 100; // Convert to 0-1 scale
        entity.updateComponent<NeedsComponent>(CT.Needs, (n) => {
          n.socialContact = Math.min(1, (n.socialContact ?? 0) + contactDelta);
          return n;
        });
      }

      // Emit greeting event
      this.events.emit(
        'greeting:exchanged',
        {
          agent1: entity.id,
          agent2: other.id,
          greetingType,
          tick: ctx.world.tick,
        },
        entity.id
      );

      // Only greet ONE agent per tick
      break;
    }

    // Clean up stale entries from greetedAt (older than 2x GREETING_COOLDOWN)
    const staleThreshold = tick - GreetingSystem.GREETING_COOLDOWN * 2;
    for (const [agentId, lastTick] of greetingState.greetedAt) {
      if (lastTick < staleThreshold) {
        greetingState.greetedAt.delete(agentId);
      }
    }
  }
}
