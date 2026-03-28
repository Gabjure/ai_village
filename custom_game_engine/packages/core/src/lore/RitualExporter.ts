/**
 * RitualExporter
 *
 * Converts MVEE RitualData ECS state to the PortableRitual cross-game schema.
 *
 * Per CLAUDE.md:
 *   - NO silent fallbacks — throw on invalid data
 *   - NO `as any` escape hatches
 *   - Use .js extensions in imports
 */

import type { RitualData, RitualType } from '../systems/RitualSystem.js';
import type {
  PortableRitual,
  PortableRitualType,
  RitualFrequency,
  PortableRitualStatus,
} from './PortableLoreTypes.js';

// ============================================================================
// Mapping tables
// ============================================================================

/** Map MVEE RitualType (7 values) to PortableRitualType (20 values) */
const RITUAL_TYPE_MAP: Record<RitualType, PortableRitualType> = {
  daily_prayer: 'worship',
  weekly_ceremony: 'communion',
  seasonal_festival: 'festival',
  initiation: 'initiation',
  blessing: 'purification',
  sacrifice: 'sacrifice',
  pilgrimage: 'pilgrimage',
};

/** Map MVEE RitualType to approximate frequency */
const RITUAL_FREQUENCY_MAP: Record<RitualType, RitualFrequency> = {
  daily_prayer: 'daily',
  weekly_ceremony: 'weekly',
  seasonal_festival: 'seasonal',
  initiation: 'lifecycle',
  blessing: 'crisis',
  sacrifice: 'weekly',
  pilgrimage: 'annual',
};

// ============================================================================
// Exported functions
// ============================================================================

/**
 * Export a MVEE RitualData to the PortableRitual cross-game schema.
 *
 * @param ritual - The MVEE RitualData
 * @param description - A descriptive text for this ritual (MVEE rituals don't store descriptions inline)
 * @param status - The current status of this ritual practice
 * @throws Error if required fields are missing
 */
export function exportRitual(
  ritual: RitualData,
  description: string,
  status: PortableRitualStatus = 'active',
): PortableRitual {
  if (!ritual.id) {
    throw new Error('Cannot export ritual: missing id');
  }
  if (!ritual.name) {
    throw new Error('Cannot export ritual: missing name');
  }

  return {
    ritualId: ritual.id,
    sourceGame: 'mvee',
    version: 1,
    name: ritual.name,
    ritualType: RITUAL_TYPE_MAP[ritual.type],
    associatedDeityId: ritual.deityId,
    description,
    frequency: RITUAL_FREQUENCY_MAP[ritual.type],
    participantRequirements: {
      minimumParticipants: ritual.requiredParticipants,
    },
    beliefGenerated: ritual.beliefGenerated,
    status,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Export multiple rituals, optionally filtering by deity.
 *
 * @param rituals - Array of MVEE RitualData
 * @param descriptions - Map of ritual ID to description text
 * @param deityId - Optional: only export rituals for this deity
 */
export function exportRituals(
  rituals: RitualData[],
  descriptions: Map<string, string>,
  deityId?: string,
): PortableRitual[] {
  const results: PortableRitual[] = [];
  for (const ritual of rituals) {
    if (deityId !== undefined && ritual.deityId !== deityId) continue;
    const desc = descriptions.get(ritual.id) ?? `A ${ritual.type.replace(/_/g, ' ')} for the faithful`;
    results.push(exportRitual(ritual, desc));
  }
  return results;
}
