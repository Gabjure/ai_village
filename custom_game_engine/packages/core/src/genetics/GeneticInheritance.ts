/**
 * GeneticInheritance Module
 *
 * Provides plant seed genetics inheritance, mutation, and viability calculations.
 * Supports deterministic seeded RNG for save/load consistency.
 */

export interface SeedGenetics {
  growthRate: number;
  yield: number;
  diseaseResistance: number;
  droughtTolerance: number;
  coldTolerance: number;
  flavor: number;
}

export interface ViabilityParams {
  parentHealth: number;
  careQuality: number;
  ageInDays: number;
}

export interface VigorParams {
  viability: number;
  quality: number;
}

const GENETICS_TRAITS: Array<keyof SeedGenetics> = [
  'growthRate',
  'yield',
  'diseaseResistance',
  'droughtTolerance',
  'coldTolerance',
  'flavor',
];

const MUTATION_CHANCE = 0.1; // 10% per trait
const MUTATION_MAX = 0.2;    // Up to ±20% of trait value

/**
 * Simple seeded PRNG (mulberry32 algorithm).
 * Returns a function that produces deterministic float values in [0, 1).
 */
function createSeededRng(seed: number): () => number {
  let s = seed | 0;
  return (): number => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Validate that genetics is a non-null object with all required traits in [0, 1].
 * Throws descriptively on any violation per CLAUDE.md error handling rules.
 */
function validateSeedGenetics(genetics: unknown): asserts genetics is SeedGenetics {
  if (genetics === null || genetics === undefined) {
    throw new Error('Parent genetics must not be null or undefined');
  }

  if (typeof genetics !== 'object') {
    throw new Error('Parent genetics must be an object');
  }

  const g = genetics as Record<string, unknown>;

  for (const trait of GENETICS_TRAITS) {
    if (!(trait in g) || g[trait] === undefined || g[trait] === null) {
      throw new Error(`Parent genetics missing required trait: ${trait}`);
    }

    const val = g[trait];
    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error(`Parent genetics trait '${trait}' must be a number`);
    }

    if (val < 0 || val > 1) {
      throw new Error(
        `Parent genetics trait '${trait}' must be in [0, 1] range, got ${val}`
      );
    }
  }
}

/**
 * Inherit genetics from a parent, applying random mutations.
 *
 * Each trait has a 10% chance of mutating by ±0–20% of its current value.
 * All output values are clamped to [0, 1].
 *
 * @param parentGenetics - Parent's genetic traits (all values in [0, 1])
 * @param seed - Optional RNG seed for deterministic results (save/load consistency)
 * @returns New genetics object with inherited and possibly mutated traits
 */
export function inheritGenetics(parentGenetics: SeedGenetics, seed?: number): SeedGenetics {
  validateSeedGenetics(parentGenetics);

  const rng: () => number =
    seed !== undefined ? createSeededRng(seed) : () => Math.random();

  const result: SeedGenetics = { ...parentGenetics };

  for (const trait of GENETICS_TRAITS) {
    if (rng() < MUTATION_CHANCE) {
      const current = result[trait];
      const delta = (rng() * 2 - 1) * MUTATION_MAX * current;
      result[trait] = Math.max(0, Math.min(1, current + delta));
    }
  }

  return result;
}

/**
 * Cross genetics from two parents (hybridization).
 *
 * Each trait is a weighted blend of both parents using a random blend factor.
 * Output values are clamped to [0, 1].
 *
 * @param parent1 - First parent genetics
 * @param parent2 - Second parent genetics
 * @param seed - Optional RNG seed for deterministic results
 * @returns Blended offspring genetics
 */
export function crossGenetics(
  parent1: SeedGenetics,
  parent2: SeedGenetics,
  seed?: number
): SeedGenetics {
  validateSeedGenetics(parent1);
  validateSeedGenetics(parent2);

  const rng: () => number =
    seed !== undefined ? createSeededRng(seed) : () => Math.random();

  const result = {} as SeedGenetics;

  for (const trait of GENETICS_TRAITS) {
    const blendFactor = rng();
    result[trait] = parent1[trait] * blendFactor + parent2[trait] * (1 - blendFactor);
  }

  return result;
}

/**
 * Calculate seed viability based on parent health, care quality, and seed age.
 *
 * Viability reflects the probability of a seed successfully germinating.
 * It increases with parent health and care quality, and decreases with age.
 *
 * @param params - { parentHealth: 0–100, careQuality: 0–1, ageInDays: 0+ }
 * @returns Viability value clamped to [0, 1]
 */
export function calculateViability(params: ViabilityParams): number {
  if (!('parentHealth' in params) || params.parentHealth === undefined || params.parentHealth === null) {
    throw new Error('Missing required parameter: parentHealth');
  }
  if (!('careQuality' in params) || params.careQuality === undefined || params.careQuality === null) {
    throw new Error('Missing required parameter: careQuality');
  }
  if (!('ageInDays' in params) || params.ageInDays === undefined || params.ageInDays === null) {
    throw new Error('Missing required parameter: ageInDays');
  }

  const { parentHealth, careQuality, ageInDays } = params;

  const healthFactor = Math.max(0, Math.min(100, parentHealth)) / 100;
  const careFactor = Math.max(0, Math.min(1, careQuality));
  const ageFactor = Math.max(0, 1 - ageInDays / 365);

  const viability = healthFactor * 0.4 + careFactor * 0.3 + ageFactor * 0.3;

  return Math.max(0, Math.min(1, viability));
}

/**
 * Calculate seed vigor based on viability and seed quality.
 *
 * Vigor is a growth multiplier: 1.0 is average, up to 2.0 for exceptional seeds.
 *
 * @param params - { viability: 0–1, quality: 0–1 }
 * @returns Vigor value clamped to [0, 2]
 */
export function calculateVigor(params: VigorParams): number {
  const { viability, quality } = params;
  return Math.max(0, Math.min(2, viability + quality));
}

export default {
  inheritGenetics,
  crossGenetics,
  calculateViability,
  calculateVigor,
};
