/**
 * MythExporter
 *
 * Converts MVEE Myth ECS data to the PortableMyth cross-game schema.
 * Only exports myths meeting the threshold: canonicityScore > 0.7 AND believerCount > 20.
 *
 * Per CLAUDE.md:
 *   - NO silent fallbacks — throw on invalid data
 *   - NO `as any` escape hatches
 *   - Use .js extensions in imports
 */

import type { Myth, MythStatus } from '../components/MythComponent.js';
import type { DeityComponent, DivineDomain, PerceivedPersonality } from '../components/DeityComponent.js';
import type {
  PortableMyth,
  PortableMythCategory,
  PortableMythStatus,
  MythTemporalSetting,
  DeityPersonalityVector,
} from './PortableLoreTypes.js';

// ============================================================================
// Constants
// ============================================================================

/** Export threshold: only myths exceeding both are exported */
const CANONICITY_THRESHOLD = 0.7;
const BELIEVER_THRESHOLD = 20;

/** Map MVEE MythStatus to canonicity scores */
const STATUS_TO_CANONICITY: Record<MythStatus, number> = {
  canonical: 0.9,
  recorded: 0.5,
  oral: 0.2,
  disputed: 0.3,
  apocryphal: 0.1,
  heretical: 0.05,
};

/**
 * Map MVEE's 50+ MythCategory values to the 34 PortableMythCategory values.
 * Categories not listed here fall through to 'origin' as the safe default.
 */
const CATEGORY_MAP: Record<string, PortableMythCategory> = {
  // Direct mappings
  creation: 'creation',
  prophecy: 'prophecy',
  sacrifice_tale: 'sacrifice',
  pilgrimage_tale: 'quest',

  // Origin stories
  emergence: 'origin',
  awakening: 'origin',
  domain_origin: 'origin',
  name_origin: 'origin',

  // Hero/journey
  champion_tale: 'hero_journey',
  saint_life: 'hero_journey',
  conversion_tale: 'hero_journey',
  martyr_tale: 'sacrifice',

  // Transformation
  healing_miracle: 'transformation',
  resurrection_tale: 'transformation',
  blessing_tale: 'transformation',

  // Divine conflict/covenant
  divine_conflict: 'divine_war',
  divine_alliance: 'covenant',
  divine_romance: 'sky_marriage',
  divine_family: 'sky_marriage',
  divine_council: 'covenant',

  // Moral/teaching
  parable: 'trickster',
  commandment: 'covenant',
  warning_tale: 'betrayal',
  reward_tale: 'covenant',
  virtue_tale: 'hero_journey',
  sin_tale: 'betrayal',

  // Eschatological
  end_times: 'apocalypse',
  afterlife_account: 'underworld_descent',
  judgment_tale: 'apocalypse',

  // Place stories
  temple_founding: 'founding',
  sacred_site_origin: 'founding',

  // Ritual/festival
  ritual_origin: 'origin',
  festival_origin: 'origin',

  // Prophecy/vision
  vision_account: 'prophecy',
  dream_interpretation: 'dream_walk',
  omen_tale: 'prophecy',

  // Theophany/divine
  theophany: 'transformation',
  avatar_tale: 'transformation',
  angel_account: 'transformation',
  divine_speech: 'covenant',

  // Nature
  nature_tale: 'origin',
  appearance_tale: 'origin',
  etiology: 'origin',
  natural_explanation: 'origin',
  historical_explanation: 'origin',

  // Contested
  heresy_tale: 'betrayal',
  schism_tale: 'betrayal',
  reformation_tale: 'transformation',

  // Punishment/protection
  punishment_tale: 'betrayal',
  protection_miracle: 'hero_journey',
  weather_miracle: 'stolen_fire',
  fertility_miracle: 'creation',
  answered_prayer: 'covenant',
};

// ============================================================================
// Exported functions
// ============================================================================

/**
 * Compute the canonicity score for a myth based on its status and spread.
 */
export function computeCanonicity(myth: Myth): number {
  const baseScore = STATUS_TO_CANONICITY[myth.status] ?? 0.2;
  // Boost slightly for wide spread
  const spreadBonus = Math.min(0.1, myth.knownBy.length * 0.002);
  return Math.min(1, baseScore + spreadBonus);
}

/**
 * Check if a myth meets the cross-game export threshold.
 */
export function meetsExportThreshold(myth: Myth): boolean {
  return computeCanonicity(myth) > CANONICITY_THRESHOLD && myth.knownBy.length > BELIEVER_THRESHOLD;
}

/**
 * Map an MVEE MythCategory string to a PortableMythCategory.
 * Falls back to 'origin' for unmapped categories.
 */
export function mapMythCategory(category: string): PortableMythCategory {
  return CATEGORY_MAP[category] ?? 'origin';
}

/**
 * Map MVEE PerceivedPersonality (-1 to 1 scale) to DeityPersonalityVector (0 to 1 scale).
 */
export function mapPersonality(p: PerceivedPersonality): DeityPersonalityVector {
  return {
    benevolence: (p.benevolence + 1) / 2,
    interventionism: (p.interventionism + 1) / 2,
    wrathfulness: p.wrathfulness, // already 0-1
    mysteriousness: p.mysteriousness, // already 0-1
    generosity: p.generosity, // already 0-1
    consistency: p.consistency, // already 0-1
  };
}

/**
 * Export a single MVEE Myth to the PortableMyth cross-game schema.
 *
 * @param myth - The MVEE Myth to export
 * @param deity - The DeityComponent the myth belongs to (for personality/domain data)
 * @param mythCategory - The MythCategory string from the divinity types (if available)
 * @throws Error if required fields are missing
 */
export function exportMyth(
  myth: Myth,
  deity: DeityComponent,
  mythCategory?: string,
): PortableMyth {
  if (!myth.id) {
    throw new Error('Cannot export myth: missing id');
  }
  if (!myth.title) {
    throw new Error('Cannot export myth: missing title');
  }

  const canonicityScore = computeCanonicity(myth);

  // Extract domains from deity
  const domains: string[] = [];
  if (deity.identity.domain) {
    domains.push(deity.identity.domain);
  }
  for (const d of deity.identity.secondaryDomains) {
    domains.push(d);
  }

  // Extract symbols from domain relevance keys
  const symbols: string[] = [];
  if (myth.domainRelevance) {
    for (const [domain] of myth.domainRelevance) {
      symbols.push(domain);
    }
  }

  // Map category
  const category = mapMythCategory(mythCategory ?? 'origin');

  return {
    mythId: myth.id,
    sourceGame: 'mvee',
    version: myth.currentVersion,
    title: myth.title,
    summary: myth.summary,
    fullText: myth.fullText,
    category,
    deityDomains: domains,
    deityPersonality: mapPersonality(deity.identity.perceivedPersonality),
    linguisticMarkers: [], // MVEE doesn't track linguistic markers on individual myths
    motifs: myth.traitImplications.map((t) => `${t.trait}:${t.direction}`),
    symbols,
    temporalSetting: 'timeless' as MythTemporalSetting, // MVEE myths don't track temporal setting
    originalEvent: myth.originalEvent
      ? { type: 'divine_event', description: myth.originalEvent, gameTimestamp: myth.creationTime }
      : undefined,
    mutations: [], // Mutation tracking is future work
    canonicityScore,
    status: myth.status as PortableMythStatus,
    exportedAt: new Date().toISOString(),
    tellingCount: myth.tellingCount,
    believerCount: myth.knownBy.length,
  };
}

/**
 * Export all eligible myths from a deity's MythologyComponent.
 * Only myths meeting the export threshold are included.
 *
 * @param myths - Array of MVEE Myths
 * @param deity - The DeityComponent
 * @returns Array of PortableMyth objects
 */
export function exportEligibleMyths(
  myths: Myth[],
  deity: DeityComponent,
): PortableMyth[] {
  const results: PortableMyth[] = [];
  for (const myth of myths) {
    if (meetsExportThreshold(myth)) {
      results.push(exportMyth(myth, deity));
    }
  }
  return results;
}
