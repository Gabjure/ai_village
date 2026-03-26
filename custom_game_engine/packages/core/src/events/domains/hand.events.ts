/**
 * Hand interaction events: player (The Hand) interacting with Norns.
 *
 * These events drive the biochemistry system — each interaction
 * boosts oxytocin, serotonin, and dopamine, creating emergent
 * nurture effects.
 */
import type { EntityId } from '../../types.js';

export interface HandEvents {
  /** Player speaks to a Norn (stimulus event via chat/speech) */
  'hand:speak': {
    agentId: EntityId;
    message?: string;
  };

  /** Player carries/picks up a Norn */
  'hand:carry': {
    agentId: EntityId;
  };

  /** Player pets/clicks on a Norn */
  'hand:pet': {
    agentId: EntityId;
  };

  /** Player slaps/punishes a Norn (trauma source) */
  'hand:slap': {
    agentId: EntityId;
  };
}
