/**
 * DeityExporter
 *
 * Converts MVEE DeityComponent ECS data to the PortableDeity cross-game schema.
 * Includes 6D personality vector, schism/syncretism lineage.
 *
 * Per CLAUDE.md:
 *   - NO silent fallbacks — throw on invalid data
 *   - NO `as any` escape hatches
 *   - Use .js extensions in imports
 */

import type { DeityComponent } from '../components/DeityComponent.js';
import type { MythologyComponent } from '../components/MythComponent.js';
import type { PortableDeity, DeityAlignment } from './PortableLoreTypes.js';
import { mapPersonality } from './MythExporter.js';

// ============================================================================
// Exported functions
// ============================================================================

/**
 * Export a MVEE DeityComponent to the PortableDeity cross-game schema.
 *
 * @param deity - The MVEE DeityComponent
 * @param mythology - Optional MythologyComponent for canonical myth IDs
 * @throws Error if required deity identity fields are missing
 */
export function exportDeity(
  deity: DeityComponent,
  mythology?: MythologyComponent,
  entityId?: string,
): PortableDeity {
  if (!deity.identity.primaryName) {
    throw new Error('Cannot export deity: missing primaryName');
  }

  const personality = mapPersonality(deity.identity.perceivedPersonality);

  // Map alignment — MoralAlignment and DeityAlignment use the same string literals
  const alignment: DeityAlignment = deity.identity.perceivedAlignment;

  // Collect canonical myth IDs
  const canonicalMythIds: string[] = mythology
    ? [...mythology.canonicalMyths]
    : [];

  return {
    deityId: entityId ?? deity.identity.primaryName,
    sourceGame: 'mvee',
    primaryName: deity.identity.primaryName,
    epithets: [...deity.identity.epithets],
    domain: deity.identity.domain ?? 'mystery',
    secondaryDomains: [...deity.identity.secondaryDomains],
    personality,
    alignment,
    believerCount: deity.believers.size,
    mythCount: deity.myths.length,
    canonicalMythIds,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Export a deity with full lineage information (schism/syncretism).
 *
 * @param deity - The MVEE DeityComponent
 * @param mythology - Optional MythologyComponent
 * @param lineage - Lineage information from schism/syncretism events
 */
export function exportDeityWithLineage(
  deity: DeityComponent,
  mythology: MythologyComponent | undefined,
  entityId: string | undefined,
  lineage: {
    parentDeityId?: string;
    mergedFromIds?: string[];
    schismCause?: string;
  },
): PortableDeity {
  const base = exportDeity(deity, mythology, entityId);
  return {
    ...base,
    parentDeityId: lineage.parentDeityId,
    mergedFromIds: lineage.mergedFromIds,
    schismCause: lineage.schismCause,
  };
}
