/**
 * AnimistParadigms - Spirit-based and exotic magic systems
 *
 * These paradigms share a common thread: magic comes from relationship
 * with the world rather than personal power or divine grant.
 *
 * 1. Shinto/Animist Magic - Everything has a spirit (kami)
 * 2. Tethermancy Magic - Like affects like, connections between similar things
 * 3. Ferromancy - Consuming metals grants specific powers
 * 4. Dream Magic - The dream world is real and manipulable
 * 5. Song Magic - Music shapes reality
 * 6. Rune Magic - Symbols have inherent power
 */

import type { MagicParadigm } from './MagicParadigm.js';
import { loadExampleKami, loadFerromancyMetals, loadAnimistParadigms } from './data-loader.js';

// ============================================================================
// Shinto/Animist Magic - The World of Endless Spirits
// ============================================================================

/**
 * Classification of kami (spirits)
 */
export type KamiType =
  | 'nature'        // Mountains, rivers, trees, rocks, weather
  | 'place'         // Specific locations, crossroads, thresholds
  | 'object'        // Swords, tools, ancient artifacts
  | 'concept'       // Abstract ideas given form - war, love, boundaries
  | 'ancestor'      // Spirits of the deceased
  | 'animal'        // Animal spirits, yokai
  | 'elemental'     // Fire, water, wind, earth spirits
  | 'household'     // Spirits of the home
  | 'craft'         // Spirits of trades and skills
  | 'food';         // Spirits of rice, sake, etc.

/**
 * A kami (spirit) that can be interacted with
 */
export interface Kami {
  id: string;
  name: string;
  type: KamiType;

  /** How powerful/important is this kami? */
  rank: 'minor' | 'local' | 'regional' | 'major' | 'great';

  /** What domain does this kami preside over? */
  domain: string;

  /** What does this kami like as offerings? */
  preferredOfferings: string[];

  /** What offends this kami? */
  taboos: string[];

  /** Current disposition toward the practitioner */
  disposition: 'hostile' | 'wary' | 'neutral' | 'friendly' | 'devoted';

  /** What can this kami grant if pleased? */
  blessings: string[];

  /** What curses if angered? */
  curses: string[];

  /** Does this kami have a physical shrine? */
  shrineLocation?: string;

  /** Seasonal activity - some kami are more active at certain times */
  activeSeasons?: string[];

  /** Description and personality */
  description: string;
  personality?: string;
}

/**
 * Purity state - central to Shinto practice
 */
export interface PurityState {
  /** Current purity level (0-100) */
  level: number;

  /** Sources of pollution (kegare) */
  pollutionSources: PollutionSource[];

  /** Last purification ritual */
  lastPurification?: number;

  /** Days since major pollution */
  pollutionAge: number;
}

export interface PollutionSource {
  type: 'death' | 'blood' | 'illness' | 'childbirth' | 'crime' | 'broken_taboo' | 'spiritual_attack';
  severity: 'minor' | 'moderate' | 'severe';
  cleansable: boolean;
  description: string;
}

// Load all paradigms from JSON
const _loadedParadigms = loadAnimistParadigms();

/**
 * Shinto Magic Paradigm - Negotiating with the spirits of all things
 */
export const SHINTO_PARADIGM: MagicParadigm = _loadedParadigms.shinto!;

/**
 * Example kami for a spirit-saturated world
 */
export const EXAMPLE_KAMI: Kami[] = loadExampleKami();

// ============================================================================
// Tethermancy Magic (tethermantic_tradition Chronicle inspired)
// ============================================================================

/**
 * A sympathetic link between two objects
 */
export interface ResonantTether {
  /** Source object */
  source: string;

  /** Target object */
  target: string;

  /** Strength of similarity (0-100) */
  similarity: number;

  /** Type of connection */
  linkType: 'identical' | 'similar' | 'part_of' | 'symbolic' | 'named';

  /** Energy loss in transfer (percentage) */
  drift: number;

  /** Is the link currently active? */
  active: boolean;

  /** How long the link lasts */
  duration?: number;
}

/**
 * Tethermancy Magic Paradigm - Like affects like
 */
export const TETHERMANCY_PARADIGM: MagicParadigm = _loadedParadigms.tethermancy!;

// ============================================================================
// Ferromancy (OmniResonant inspired)
// ============================================================================

/**
 * The metals and their effects
 */
export interface FerromancyMetal {
  id: string;
  name: string;
  type: 'physical' | 'mental' | 'enhancement' | 'temporal';
  direction: 'push' | 'pull';
  effect: string;
  drawback?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export const FERROMANCY_METALS: FerromancyMetal[] = loadFerromancyMetals();

/**
 * Ferromancy Paradigm - Burn metals for power
 */
export const FERROMANCY_PARADIGM: MagicParadigm = _loadedParadigms.ferromancy!;

// ============================================================================
// Dream Magic
// ============================================================================

/**
 * Dream Magic Paradigm - The dream world is real and navigable
 */
export const DREAM_PARADIGM: MagicParadigm = _loadedParadigms.dream!;

// ============================================================================
// Song/Music Magic
// ============================================================================

/**
 * Song Magic Paradigm - Music shapes reality
 */
export const SONG_PARADIGM: MagicParadigm = _loadedParadigms.song!;

// ============================================================================
// Rune Magic
// ============================================================================

/**
 * Rune Magic Paradigm - Symbols have inherent power
 */
export const RUNE_PARADIGM: MagicParadigm = _loadedParadigms.rune!;

// ============================================================================
// Animus/Aether Motes Magic (spirit-bond inspired)
// ============================================================================

/**
 * A animus - external soul in animal form
 */
export interface Animus {
  /** Name of the animus */
  name: string;

  /** Current animal form */
  form: string;

  /** Has the animus settled (adult) or still shifting (child)? */
  settled: boolean;

  /** What the settled form suggests about personality */
  formMeaning?: string;

  /** Maximum distance from human before pain */
  separationDistance: 'normal' | 'extended' | 'witch_distance' | 'severed';

  /** Personality traits visible through animus */
  revealedTraits: string[];
}

/**
 * Animus/Aether Motes Magic Paradigm - External souls and conscious particles
 */
export const ANIMUS_PARADIGM: MagicParadigm = _loadedParadigms.animus!;

// ============================================================================
// Registry
// ============================================================================

export const ANIMIST_PARADIGM_REGISTRY: Record<string, MagicParadigm> = {
  animus: ANIMUS_PARADIGM,
  shinto: SHINTO_PARADIGM,
  tethermancy: TETHERMANCY_PARADIGM,
  ferromancy: FERROMANCY_PARADIGM,
  dream: DREAM_PARADIGM,
  song: SONG_PARADIGM,
  rune: RUNE_PARADIGM,
};

/**
 * Get an animist paradigm by ID.
 */
export function getAnimistParadigm(id: string): MagicParadigm | undefined {
  return ANIMIST_PARADIGM_REGISTRY[id];
}

/**
 * Get all kami types.
 */
export function getKamiTypes(): KamiType[] {
  return ['nature', 'place', 'object', 'concept', 'ancestor', 'animal', 'elemental', 'household', 'craft', 'food'];
}

/**
 * Get example kami by type.
 */
export function getKamiByType(type: KamiType): Kami[] {
  return EXAMPLE_KAMI.filter(k => k.type === type);
}

/**
 * Get all ferromancy metals.
 */
export function getFerromancyMetals(): FerromancyMetal[] {
  return FERROMANCY_METALS;
}

/**
 * Get metals by type (physical, mental, etc.)
 */
export function getMetalsByType(type: FerromancyMetal['type']): FerromancyMetal[] {
  return FERROMANCY_METALS.filter(m => m.type === type);
}
