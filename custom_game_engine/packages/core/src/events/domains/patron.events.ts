/**
 * Patron binding events — player adopts an agent as their patron soul.
 *
 * The player acts as a guardian spirit watching over their patron agent.
 * Events fire when significant things happen to the patron.
 */
import type { EntityId } from '../../types.js';

export interface PatronEvents {
  /** Player binds an agent as their patron soul */
  'patron:bound': {
    agentId: EntityId;
    agentName: string;
  };

  /** Player unbinds their patron */
  'patron:unbound': {
    agentId: EntityId;
    agentName: string;
  };

  /** A significant event happened to the patron agent — surfaced to the player */
  'patron:event_triggered': {
    agentId: EntityId;
    agentName: string;
    eventType: 'skill_level_up' | 'new_relationship' | 'first_magic_cast' | 'child_born' | 'death';
    summary: string;
  };

  /** Patron agent has died — triggers psychopomp farewell for the player */
  'patron:death_farewell': {
    agentId: EntityId;
    agentName: string;
    causeOfDeath: string;
  };
}
