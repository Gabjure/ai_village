/**
 * MigrationGenetics
 *
 * Genome translation utilities for cross-game creature import via the
 * Folkfork pipeline (genome_migration_v1 schema).
 *
 * Translates the game-agnostic intermediate representation produced by
 * folkfork-bridge into MVEE's Mendelian allele model, needs component
 * values, and personality traits.
 *
 * Per CLAUDE.md:
 *   - NO silent fallbacks — crash on invalid data
 *   - NO `as any` / `as unknown as Type` escape hatches
 *   - NO console.log debug output
 *   - Component types: lowercase_with_underscores
 */

import type { AnimalGeneTrait, AnimalGenetics, AnimalPersonality } from '../components/AnimalComponent.js';
import type { CoreTrait, DriveMapping, DccProfile, VisualTokens, TraitCategory } from '@multiverse-studios/folkfork-bridge';
import type { MigrationLossDeclaration } from '../components/MigrationProvenanceComponent.js';
import { generateAnimalGenetics } from '../components/AnimalComponent.js';

// ============================================================================
// Internal helpers
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Ordered list of all required MVEE genetics keys — used to detect synthesized gaps.
const MVEE_GENETICS_KEYS: (keyof AnimalGenetics)[] = [
  'size',
  'strength',
  'speed',
  'health',
  'lifespan',
  'temperament',
  'intelligence',
  'trainability',
  'colorVariant',
];

// ============================================================================
// 1. reconstructAlleles
// ============================================================================

/**
 * Reconstruct a Mendelian AnimalGeneTrait from a normalised core-trait value
 * and its heritability score.
 *
 * The divergence between alleles is proportional to `(1 - heritability)`,
 * reflecting the idea that highly heritable traits have tightly coupled alleles
 * while plastic traits tolerate wider allele spread.
 *
 * @param value       - Normalised trait value in [0, 1] (from core_traits[].value)
 * @param heritability - Heritability score in [0, 1] (from core_traits[].heritability)
 * @returns AnimalGeneTrait with integer alleles and floating-point expression
 */
export function reconstructAlleles(value: number, heritability: number): AnimalGeneTrait {
  const expression = value * 100;
  const MAX_DIVERGENCE = 20;
  const divergence = (1 - heritability) * MAX_DIVERGENCE;
  const allele1 = clamp(expression + divergence / 2, 0, 100);
  const allele2 = clamp(expression - divergence / 2, 0, 100);
  return {
    allele1: Math.round(allele1),
    allele2: Math.round(allele2),
    expression: (allele1 + allele2) / 2,
  };
}

// ============================================================================
// 2. mapCoreTrait
// ============================================================================

/**
 * Map a Precursors `trait_id` + `category` pair to the corresponding
 * `AnimalGenetics` key in MVEE.
 *
 * Returns `null` when no MVEE analog exists for the given trait.
 *
 * Note: `intelligence` mapping is handled at a higher level (highest-value
 * cognitive trait wins) — this function returns `'intelligence'` for any
 * cognitive trait so the caller can collect candidates.
 * `colorVariant` is synthesised from `visual_tokens.base_hue` by the caller
 * and does NOT go through this function.
 */
export function mapCoreTrait(
  traitId: string,
  category: TraitCategory,
): keyof AnimalGenetics | null {
  // Morphological traits
  if (category === 'morphological') {
    if (traitId === 'size' || traitId === 'mass' || traitId === 'bulk') {
      return 'size';
    }
    if (traitId === 'strength' || traitId === 'force' || traitId === 'muscle') {
      return 'strength';
    }
    if (traitId === 'speed' || traitId === 'agility' || traitId === 'locomotion') {
      return 'speed';
    }
    return null;
  }

  // Metabolic traits
  if (category === 'metabolic') {
    if (traitId === 'health' || traitId === 'vitality' || traitId === 'resilience') {
      return 'health';
    }
    if (traitId === 'lifespan' || traitId === 'longevity' || traitId === 'aging') {
      return 'lifespan';
    }
    return null;
  }

  // Behavioral traits
  if (category === 'behavioral') {
    if (
      traitId === 'temperament' ||
      traitId === 'aggression' ||
      traitId === 'disposition'
    ) {
      return 'temperament';
    }
    return null;
  }

  // Cognitive traits — all candidates route to intelligence (caller picks highest)
  if (category === 'cognitive') {
    return 'intelligence';
  }

  // Social traits
  if (category === 'social') {
    if (
      traitId === 'trainability' ||
      traitId === 'learning' ||
      traitId === 'adaptability'
    ) {
      return 'trainability';
    }
    return null;
  }

  // sensory and any other categories have no MVEE analog
  return null;
}

// ============================================================================
// 3. mapCoreTraitsToGenetics
// ============================================================================

/**
 * Translate a Folkfork `core_traits` array + `visual_tokens` into an
 * `AnimalGenetics` object and a `MigrationLossDeclaration`.
 *
 * Algorithm:
 *  1. Iterate core_traits and call `mapCoreTrait` on each.
 *  2. For matched traits, call `reconstructAlleles` and record in the
 *     appropriate loss bucket.
 *  3. For `intelligence`: among all cognitive traits, use the one with the
 *     highest `value` as the winner.
 *  4. For `colorVariant`: derive from `visual_tokens.base_hue`.
 *  5. Traits with no MVEE analog go into `discarded`.
 *  6. Required MVEE traits that have no source trait are synthesised via
 *     `generateAnimalGenetics()` defaults and recorded in `synthesized`.
 */
export function mapCoreTraitsToGenetics(
  traits: CoreTrait[],
  visualTokens: VisualTokens,
): { genetics: AnimalGenetics; lossDeclaration: MigrationLossDeclaration } {
  // Partial accumulator — we fill this in key by key.
  const partial: Partial<AnimalGenetics> = {};

  const lossless: string[] = [];
  const lossy: MigrationLossDeclaration['lossy'] = [];
  const discarded: MigrationLossDeclaration['discarded'] = [];
  const synthesized: string[] = [];

  // Collect cognitive candidates to pick the highest-value one.
  let bestCognitiveTrait: CoreTrait | null = null;

  for (const trait of traits) {
    const target = mapCoreTrait(trait.trait_id, trait.category);

    if (target === null) {
      discarded.push({
        traitId: trait.trait_id,
        category: trait.category,
        reason: 'No MVEE analog for this trait category/id combination',
      });
      continue;
    }

    if (target === 'intelligence') {
      // Defer — pick highest cognitive value after the loop.
      if (
        bestCognitiveTrait === null ||
        trait.value > bestCognitiveTrait.value
      ) {
        bestCognitiveTrait = trait;
      }
      // All non-winning cognitive traits land in discarded (added after loop).
      continue;
    }

    // Avoid overwriting a previously mapped trait with a lower-fidelity one.
    // The first match wins (traits array ordering from the bridge is authoritative).
    if (partial[target] !== undefined) {
      discarded.push({
        traitId: trait.trait_id,
        category: trait.category,
        reason: `MVEE target '${target}' already mapped from a previous trait`,
      });
      continue;
    }

    const geneTrait = reconstructAlleles(trait.value, trait.heritability);
    partial[target] = geneTrait;

    // Classify fidelity for the loss declaration.
    const fidelity = trait.transfer_fidelity;
    if (fidelity === 'lossless' || fidelity === 'low_loss') {
      lossless.push(trait.trait_id);
    } else {
      // medium_loss or lossy
      const originalValue = trait.value * 100;
      const transferredValue = geneTrait.expression;
      lossy.push({
        traitId: trait.trait_id,
        reason: `Transfer fidelity: ${fidelity}`,
        originalValue,
        transferredValue,
        informationLoss: Math.abs(originalValue - transferredValue) / 100,
      });
    }
  }

  // Resolve intelligence winner.
  if (bestCognitiveTrait !== null) {
    partial['intelligence'] = reconstructAlleles(
      bestCognitiveTrait.value,
      bestCognitiveTrait.heritability,
    );

    const fidelity = bestCognitiveTrait.transfer_fidelity;
    if (fidelity === 'lossless' || fidelity === 'low_loss') {
      lossless.push(bestCognitiveTrait.trait_id);
    } else {
      const originalValue = bestCognitiveTrait.value * 100;
      const transferredValue = partial['intelligence'].expression;
      lossy.push({
        traitId: bestCognitiveTrait.trait_id,
        reason: `Transfer fidelity: ${fidelity}`,
        originalValue,
        transferredValue,
        informationLoss: Math.abs(originalValue - transferredValue) / 100,
      });
    }

    // Mark losing cognitive traits as discarded.
    for (const trait of traits) {
      if (
        trait.category === 'cognitive' &&
        trait !== bestCognitiveTrait
      ) {
        discarded.push({
          traitId: trait.trait_id,
          category: trait.category,
          reason: 'Non-winning cognitive trait; highest-value cognitive trait used for intelligence',
        });
      }
    }
  }

  // Map colorVariant from visual_tokens.base_hue.
  const colorValue = (visualTokens.base_hue / 360) * 100;
  const colorTrait = reconstructAlleles(colorValue / 100, 0.8);
  partial['colorVariant'] = colorTrait;
  lossless.push('visual_tokens.base_hue');

  // Synthesise any required trait that was not supplied.
  const fallbackGenetics = generateAnimalGenetics();

  for (const key of MVEE_GENETICS_KEYS) {
    if (partial[key] === undefined) {
      partial[key] = fallbackGenetics[key];
      synthesized.push(key);
    }
  }

  // At this point all keys are guaranteed populated; cast is type-safe.
  const genetics = partial as AnimalGenetics;

  const lossDeclaration: MigrationLossDeclaration = {
    lossless,
    lossy,
    discarded,
    synthesized,
    narrative: synthesized.length === 0
      ? 'All MVEE genetics traits were sourced from the Folkfork core traits or visual tokens.'
      : `The following MVEE traits had no Folkfork source and were synthesised from species defaults: ${synthesized.join(', ')}.`,
  };

  return { genetics, lossDeclaration };
}

// ============================================================================
// 4. mapDrivesToNeeds
// ============================================================================

/**
 * Translate Precursors 13-drive limbic model to MVEE NeedsComponent values.
 *
 * All output values are on the [0, 1] scale. Unknown drives are silently
 * skipped (they carry no MVEE analog).
 *
 * Drive mapping table:
 *   hunger  → hunger         (direct,   confidence 1.0)
 *   thirst  → thirst         (direct,   confidence 1.0)
 *   fatigue → energy         (inverted: 1 - source_value)
 *   pain    → health         (inverted, derived, confidence 0.7)
 *   fear    → stress         (contributes source_value)
 *   anger   → stress         (contributes source_value * 0.5)
 *   escape  → stress         (contributes source_value * 0.3)
 *   rest    → energy boost   (adds source_value * 0.3)
 *   loneliness → mood penalty (reduces mood by source_value * 0.3)
 *   boredom    → mood penalty (reduces mood by source_value * 0.2)
 *
 * Defaults: mood = 0.5, stress = 0.2.
 */
export function mapDrivesToNeeds(drives: DriveMapping[]): {
  hunger: number;
  energy: number;
  health: number;
  thirst: number;
  stress: number;
  mood: number;
} {
  let hunger = 0;
  let energy = 0;
  let health = 1;
  let thirst = 0;
  let stress = 0.2;
  let mood = 0.5;

  // Track which drives have been set so we can apply defaults for missing ones.
  let hungerSet = false;
  let thirstSet = false;
  let energySet = false;
  let healthSet = false;

  for (const drive of drives) {
    const v = drive.source_value;

    switch (drive.source_drive) {
      case 'hunger':
        hunger = v;
        hungerSet = true;
        break;

      case 'thirst':
        thirst = v;
        thirstSet = true;
        break;

      case 'fatigue':
        energy = 1 - v;
        energySet = true;
        break;

      case 'pain':
        health = 1 - v;
        healthSet = true;
        break;

      case 'fear':
        stress += v;
        break;

      case 'anger':
        stress += v * 0.5;
        break;

      case 'escape':
        stress += v * 0.3;
        break;

      case 'rest':
        energy += v * 0.3;
        break;

      case 'loneliness':
        mood -= v * 0.3;
        break;

      case 'boredom':
        mood -= v * 0.2;
        break;

      // Drives routed to personality (fear, anger, curiosity, social) are handled
      // by mapDrivesToPersonality. No MVEE needs contribution from those.
      default:
        break;
    }
  }

  // If a primary drive was entirely absent in the mapping, keep the
  // default initialisation values (hunger/thirst = 0, energy = 0, health = 1).
  // These are neutral states, not fallbacks — missing drive data means
  // the creature was not in distress at export time.
  void hungerSet;
  void thirstSet;
  void energySet;
  void healthSet;

  return {
    hunger: clamp(hunger, 0, 1),
    energy: clamp(energy, 0, 1),
    health: clamp(health, 0, 1),
    thirst: clamp(thirst, 0, 1),
    stress: clamp(stress, 0, 1),
    mood: clamp(mood, 0, 1),
  };
}

// ============================================================================
// 5. mapDrivesToPersonality
// ============================================================================

/**
 * Translate Precursors limbic drives + D_cc behavioral drift profile into
 * an MVEE AnimalPersonality.
 *
 * Drive → personality axis mapping (all confidence ≤ 0.6 — drives are
 * indirect proxies for personality):
 *   fear      → fearfulness    (confidence 0.6)
 *   anger     → aggressiveness (confidence 0.6)
 *   curiosity → curiosity      (confidence 0.6)
 *   social    → sociability    (confidence 0.6)
 *
 * D_cc behavioural emergence bias:
 *   When `dccProfile.dcc_baseline > 0.02` the creature has emergent
 *   behaviour. Each trait is multiplied by `1 + (driftMagnitude * 0.5)`
 *   (clamped to [0, 1]) to push it toward drift-vector extremes, preserving
 *   individuality that emerged through Precursors gameplay.
 */
export function mapDrivesToPersonality(
  drives: DriveMapping[],
  dccProfile: DccProfile,
): AnimalPersonality {
  let fearfulness = 0;
  let aggressiveness = 0;
  let curiosity = 0;
  let sociability = 0;

  for (const drive of drives) {
    const v = drive.source_value;

    switch (drive.source_drive) {
      case 'fear':
        fearfulness = v;
        break;
      case 'anger':
        aggressiveness = v;
        break;
      case 'curiosity':
        curiosity = v;
        break;
      case 'social':
        sociability = v;
        break;
      default:
        break;
    }
  }

  // Apply D_cc behavioral emergence bias when the creature has emergent behavior.
  if (dccProfile.dcc_baseline > 0.02) {
    const vector = dccProfile.behavioral_drift_vector;

    // Drift magnitude is the Euclidean norm of the drift vector.
    let sumOfSquares = 0;
    for (const component of vector) {
      sumOfSquares += component * component;
    }
    const driftMagnitude = Math.sqrt(sumOfSquares);

    const biasFactor = 1 + driftMagnitude * 0.5;
    fearfulness    = clamp(fearfulness    * biasFactor, 0, 1);
    aggressiveness = clamp(aggressiveness * biasFactor, 0, 1);
    curiosity      = clamp(curiosity      * biasFactor, 0, 1);
    sociability    = clamp(sociability    * biasFactor, 0, 1);
  }

  return {
    fearfulness:    clamp(fearfulness,    0, 1),
    aggressiveness: clamp(aggressiveness, 0, 1),
    curiosity:      clamp(curiosity,      0, 1),
    sociability:    clamp(sociability,    0, 1),
  };
}

// ============================================================================
// 6. computeGDI (Genetic Distance Index)
// ============================================================================

/**
 * Compute the Genetic Distance Index (GDI) between source Folkfork traits
 * and the resulting MVEE genetics.
 *
 * GDI = 1 − cosine_similarity(source_vector, target_vector)
 *
 * Both vectors are normalised to [0, 1] before comparison.
 * Only traits present in both sources contribute to the similarity.
 * A GDI of 0 indicates perfect correspondence; 1 indicates maximum divergence.
 *
 * @param sourceTraits   - Folkfork core_traits from the bridge payload
 * @param targetGenetics - MVEE AnimalGenetics produced by mapCoreTraitsToGenetics
 */
export function computeGDI(
  sourceTraits: CoreTrait[],
  targetGenetics: AnimalGenetics,
): number {
  // Build a lookup of source trait values by their MVEE target key.
  // For cognitive traits, use the highest-value one (same rule as mapCoreTraitsToGenetics).
  const sourceByKey: Partial<Record<keyof AnimalGenetics, number>> = {};

  let bestCognitiveTrait: CoreTrait | null = null;

  for (const trait of sourceTraits) {
    const target = mapCoreTrait(trait.trait_id, trait.category);
    if (target === null) continue;

    if (target === 'intelligence') {
      if (bestCognitiveTrait === null || trait.value > bestCognitiveTrait.value) {
        bestCognitiveTrait = trait;
      }
      continue;
    }

    // First match wins (mirrors mapCoreTraitsToGenetics).
    if (sourceByKey[target] === undefined) {
      sourceByKey[target] = trait.value; // Already in [0, 1]
    }
  }

  if (bestCognitiveTrait !== null) {
    sourceByKey['intelligence'] = bestCognitiveTrait.value;
  }

  // Build aligned vectors from the intersection of source keys and MVEE keys.
  const sourceVec: number[] = [];
  const targetVec: number[] = [];

  for (const key of MVEE_GENETICS_KEYS) {
    if (key === 'colorVariant') {
      // colorVariant is derived from visual_tokens, not from sourceTraits —
      // exclude it to avoid artificially deflating GDI.
      continue;
    }
    const srcVal = sourceByKey[key];
    if (srcVal === undefined) continue;

    const tgtVal = targetGenetics[key].expression / 100; // 0–100 → 0–1
    sourceVec.push(srcVal);
    targetVec.push(tgtVal);
  }

  if (sourceVec.length === 0) {
    // No shared traits — maximum divergence.
    return 1;
  }

  // Compute cosine similarity.
  let dot = 0;
  let normSrc = 0;
  let normTgt = 0;

  for (let i = 0; i < sourceVec.length; i++) {
    const s = sourceVec[i]!;
    const t = targetVec[i]!;
    dot += s * t;
    normSrc += s * s;
    normTgt += t * t;
  }

  const denominator = Math.sqrt(normSrc) * Math.sqrt(normTgt);

  if (denominator === 0) {
    // One or both vectors are zero vectors; similarity is undefined — treat as max divergence.
    return 1;
  }

  const cosineSimilarity = dot / denominator;
  return clamp(1 - cosineSimilarity, 0, 1);
}
