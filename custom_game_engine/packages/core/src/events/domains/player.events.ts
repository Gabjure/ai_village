/**
 * Player control events: mortal pawn mode and jack-out requests.
 *
 * Covers mortal pawn possession lifecycle, interactions, and input events.
 */
import type { EntityId } from '../../types.js';

export interface PlayerEvents {
  /** Player enters mortal pawn mode (possesses an agent without deity powers) */
  'mortal_pawn:jack_in': {
    agentId: EntityId;
    agentName: string;
  };

  /** Player exits mortal pawn mode */
  'mortal_pawn:jack_out': {
    agentId: EntityId | null;
    reason: string;
    ticksPlayed: number;
  };

  /** Per-tick update while in mortal pawn mode */
  'mortal_pawn:tick': {
    agentId: EntityId;
    ticksInPossession: number;
  };

  /** Player interacts with something in mortal pawn mode */
  'mortal_pawn:interact': {
    agentId: EntityId;
    targetId?: EntityId;
    type: string;
    spellId?: string;
  };

  /** Companion notified of mortal pawn mode entry */
  'companion:mortal_pawn_entered': {
    agentId: EntityId;
  };

  /** Player requests to jack out (from Escape key or UI) */
  'player:jack_out_request': {
    tick: number;
  };
}
