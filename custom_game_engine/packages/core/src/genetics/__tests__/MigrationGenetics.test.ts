/**
 * Unit tests for MigrationGenetics utilities.
 *
 * Tests genome translation from the Folkfork intermediate representation
 * into MVEE's Mendelian allele model, needs values, and personality traits.
 */

import { describe, it, expect } from 'vitest';
import {
  reconstructAlleles,
  mapCoreTrait,
  mapCoreTraitsToGenetics,
  mapDrivesToNeeds,
  mapDrivesToPersonality,
  computeGDI,
} from '../MigrationGenetics.js';
import type { CoreTrait, VisualTokens, DriveMapping, DccProfile } from '@multiverse-studios/folkfork-bridge';

// ============================================================================
// 1. reconstructAlleles
// ============================================================================

describe('reconstructAlleles', () => {
  it('produces near-homozygous alleles for high heritability', () => {
    const result = reconstructAlleles(0.5, 0.95);
    // divergence = (1 - 0.95) * 20 = 1
    // allele1 = 50 + 0.5 = 50.5 → 51, allele2 = 50 - 0.5 = 49.5 → 50
    expect(Math.abs(result.allele1 - result.allele2)).toBeLessThanOrEqual(2);
  });

  it('produces more divergent alleles for low heritability', () => {
    const high = reconstructAlleles(0.5, 0.95);
    const low = reconstructAlleles(0.5, 0.1);
    const highSpread = Math.abs(high.allele1 - high.allele2);
    const lowSpread = Math.abs(low.allele1 - low.allele2);
    expect(lowSpread).toBeGreaterThan(highSpread);
  });

  it('places both alleles near 0 for value 0.0', () => {
    // With heritability 0.8: divergence = (1-0.8)*20 = 4
    // allele1 = 0 + 2 = 2, allele2 = clamp(0 - 2, 0, 100) = 0
    // Both alleles should be well below 10
    const result = reconstructAlleles(0.0, 0.8);
    expect(result.allele1).toBeLessThan(10);
    expect(result.allele2).toBeLessThan(10);
    expect(result.expression).toBeLessThan(10);
  });

  it('places both alleles near 100 for value 1.0', () => {
    // With heritability 0.8: divergence = (1-0.8)*20 = 4
    // allele1 = clamp(100 + 2, 0, 100) = 100, allele2 = 100 - 2 = 98
    // Both alleles should be well above 90
    const result = reconstructAlleles(1.0, 0.8);
    expect(result.allele1).toBeGreaterThan(90);
    expect(result.allele2).toBeGreaterThan(90);
    expect(result.expression).toBeGreaterThan(90);
  });

  it('expression equals the mean of allele1 and allele2', () => {
    const result = reconstructAlleles(0.6, 0.7);
    expect(result.expression).toBeCloseTo((result.allele1 + result.allele2) / 2, 10);
  });

  it('alleles are integers (Math.round applied)', () => {
    const result = reconstructAlleles(0.37, 0.63);
    expect(result.allele1).toBe(Math.round(result.allele1));
    expect(result.allele2).toBe(Math.round(result.allele2));
  });

  it('alleles are clamped within [0, 100]', () => {
    const low = reconstructAlleles(0.0, 0.0);
    expect(low.allele1).toBeGreaterThanOrEqual(0);
    expect(low.allele2).toBeGreaterThanOrEqual(0);
    const high = reconstructAlleles(1.0, 0.0);
    expect(high.allele1).toBeLessThanOrEqual(100);
    expect(high.allele2).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// 2. mapCoreTrait
// ============================================================================

describe('mapCoreTrait', () => {
  describe('morphological traits', () => {
    it("maps 'size' + 'morphological' → 'size'", () => {
      expect(mapCoreTrait('size', 'morphological')).toBe('size');
    });

    it("maps 'mass' + 'morphological' → 'size'", () => {
      expect(mapCoreTrait('mass', 'morphological')).toBe('size');
    });

    it("maps 'strength' + 'morphological' → 'strength'", () => {
      expect(mapCoreTrait('strength', 'morphological')).toBe('strength');
    });

    it("maps 'speed' + 'morphological' → 'speed'", () => {
      expect(mapCoreTrait('speed', 'morphological')).toBe('speed');
    });

    it("returns null for unknown morphological trait", () => {
      expect(mapCoreTrait('unknown_trait', 'morphological')).toBeNull();
    });
  });

  describe('metabolic traits', () => {
    it("maps 'health' + 'metabolic' → 'health'", () => {
      expect(mapCoreTrait('health', 'metabolic')).toBe('health');
    });

    it("maps 'lifespan' + 'metabolic' → 'lifespan'", () => {
      expect(mapCoreTrait('lifespan', 'metabolic')).toBe('lifespan');
    });
  });

  describe('behavioral traits', () => {
    it("maps 'temperament' + 'behavioral' → 'temperament'", () => {
      expect(mapCoreTrait('temperament', 'behavioral')).toBe('temperament');
    });
  });

  describe('cognitive traits', () => {
    it("maps any cognitive trait → 'intelligence'", () => {
      expect(mapCoreTrait('reasoning', 'cognitive')).toBe('intelligence');
      expect(mapCoreTrait('problem_solving', 'cognitive')).toBe('intelligence');
      expect(mapCoreTrait('memory', 'cognitive')).toBe('intelligence');
    });
  });

  describe('social traits', () => {
    it("maps 'trainability' + 'social' → 'trainability'", () => {
      expect(mapCoreTrait('trainability', 'social')).toBe('trainability');
    });
  });

  describe('sensory traits', () => {
    it("returns null for 'pheromone_sensitivity' + 'sensory'", () => {
      expect(mapCoreTrait('pheromone_sensitivity', 'sensory')).toBeNull();
    });
  });
});

// ============================================================================
// 3. mapCoreTraitsToGenetics
// ============================================================================

const mockTraits: CoreTrait[] = [
  {
    trait_id: 'size',
    category: 'morphological',
    value: 0.7,
    heritability: 0.9,
    variance_range: null,
    transfer_fidelity: 'lossless',
    source_game: 'precursors',
    notes: null,
  },
  {
    trait_id: 'speed',
    category: 'morphological',
    value: 0.5,
    heritability: 0.8,
    variance_range: null,
    transfer_fidelity: 'lossless',
    source_game: 'precursors',
    notes: null,
  },
  {
    trait_id: 'health',
    category: 'metabolic',
    value: 0.8,
    heritability: 0.85,
    variance_range: null,
    transfer_fidelity: 'lossless',
    source_game: 'precursors',
    notes: null,
  },
  {
    trait_id: 'pheromone_sensitivity',
    category: 'sensory',
    value: 0.6,
    heritability: 0.5,
    variance_range: null,
    transfer_fidelity: 'lossy',
    source_game: 'precursors',
    notes: 'No MVEE equivalent',
  },
  {
    trait_id: 'reasoning',
    category: 'cognitive',
    value: 0.75,
    heritability: 0.7,
    variance_range: null,
    transfer_fidelity: 'medium_loss',
    source_game: 'precursors',
    notes: null,
  },
];

const mockVisualTokens: VisualTokens = {
  base_hue: 120,
  accent_hue: 200,
  saturation: 0.7,
  lightness: 0.5,
  size_class: 'medium',
  body_plan: 'quadruped',
  pattern: null,
  marking_intensity: null,
  notable_features: null,
};

describe('mapCoreTraitsToGenetics', () => {
  it('populates all 9 required MVEE genetics keys', () => {
    const { genetics } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    const requiredKeys: (keyof typeof genetics)[] = [
      'size', 'strength', 'speed', 'health', 'lifespan',
      'temperament', 'intelligence', 'trainability', 'colorVariant',
    ];
    for (const key of requiredKeys) {
      expect(genetics[key]).toBeDefined();
      expect(typeof genetics[key].allele1).toBe('number');
      expect(typeof genetics[key].allele2).toBe('number');
      expect(typeof genetics[key].expression).toBe('number');
    }
  });

  it('derives colorVariant from base_hue', () => {
    const { genetics } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    // base_hue = 120 → value = (120 / 360) * 100 = 33.33 expression ≈ 33
    expect(genetics.colorVariant.expression).toBeCloseTo(33.33, 0);
  });

  it('places traits without an MVEE analog in lossDeclaration.discarded', () => {
    const { lossDeclaration } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    const discardedIds = lossDeclaration.discarded.map((d) => d.traitId);
    expect(discardedIds).toContain('pheromone_sensitivity');
  });

  it('places missing MVEE traits in lossDeclaration.synthesized', () => {
    const { lossDeclaration } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    // strength, lifespan, temperament, trainability are not in mockTraits
    expect(lossDeclaration.synthesized).toContain('strength');
    expect(lossDeclaration.synthesized).toContain('lifespan');
    expect(lossDeclaration.synthesized).toContain('temperament');
    expect(lossDeclaration.synthesized).toContain('trainability');
  });

  it('does not synthesize traits that were provided', () => {
    const { lossDeclaration } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    expect(lossDeclaration.synthesized).not.toContain('size');
    expect(lossDeclaration.synthesized).not.toContain('speed');
    expect(lossDeclaration.synthesized).not.toContain('health');
    expect(lossDeclaration.synthesized).not.toContain('intelligence');
    expect(lossDeclaration.synthesized).not.toContain('colorVariant');
  });

  it('records lossless traits in lossDeclaration.lossless', () => {
    const { lossDeclaration } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    expect(lossDeclaration.lossless).toContain('size');
    expect(lossDeclaration.lossless).toContain('speed');
    expect(lossDeclaration.lossless).toContain('health');
    expect(lossDeclaration.lossless).toContain('visual_tokens.base_hue');
  });

  it('records medium_loss traits in lossDeclaration.lossy', () => {
    const { lossDeclaration } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    const lossyIds = lossDeclaration.lossy.map((l) => l.traitId);
    expect(lossyIds).toContain('reasoning');
  });

  it('maps size trait value correctly', () => {
    const { genetics } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    // size value = 0.7 → expression ≈ 70
    expect(genetics.size.expression).toBeCloseTo(70, 0);
  });
});

// ============================================================================
// 4. mapDrivesToNeeds
// ============================================================================

const mockDrives: DriveMapping[] = [
  {
    source_drive: 'hunger',
    target_drive: 'hunger',
    mapping_type: 'direct',
    source_value: 0.3,
    confidence: 1.0,
    notes: null,
  },
  {
    source_drive: 'thirst',
    target_drive: 'thirst',
    mapping_type: 'direct',
    source_value: 0.4,
    confidence: 1.0,
    notes: null,
  },
  {
    source_drive: 'fatigue',
    target_drive: 'energy',
    mapping_type: 'direct',
    source_value: 0.6,
    confidence: 0.9,
    notes: null,
  },
  {
    source_drive: 'pain',
    target_drive: 'health',
    mapping_type: 'derived',
    source_value: 0.2,
    confidence: 0.7,
    notes: null,
  },
  {
    source_drive: 'fear',
    target_drive: 'fearfulness',
    mapping_type: 'approximate',
    source_value: 0.5,
    confidence: 0.6,
    notes: null,
  },
  {
    source_drive: 'loneliness',
    target_drive: 'socialContact',
    mapping_type: 'derived',
    source_value: 0.4,
    confidence: 0.7,
    notes: null,
  },
  {
    source_drive: 'limbic_influence',
    target_drive: null,
    mapping_type: 'no_analog',
    source_value: 0.7,
    confidence: 0.0,
    notes: null,
  },
];

describe('mapDrivesToNeeds', () => {
  it('maps hunger directly', () => {
    const needs = mapDrivesToNeeds(mockDrives);
    expect(needs.hunger).toBeCloseTo(0.3);
  });

  it('maps thirst directly', () => {
    const needs = mapDrivesToNeeds(mockDrives);
    expect(needs.thirst).toBeCloseTo(0.4);
  });

  it('inverts fatigue to energy (1 - fatigue)', () => {
    const needs = mapDrivesToNeeds(mockDrives);
    expect(needs.energy).toBeCloseTo(1 - 0.6);
  });

  it('inverts pain to health (1 - pain)', () => {
    const needs = mapDrivesToNeeds(mockDrives);
    expect(needs.health).toBeCloseTo(1 - 0.2);
  });

  it('adds fear to stress on top of default 0.2', () => {
    const needs = mapDrivesToNeeds(mockDrives);
    // default stress = 0.2, fear = 0.5 → stress = 0.7
    expect(needs.stress).toBeCloseTo(0.2 + 0.5);
  });

  it('penalizes mood by loneliness * 0.3', () => {
    const needs = mapDrivesToNeeds(mockDrives);
    // default mood = 0.5, loneliness penalty = 0.4 * 0.3 = 0.12 → mood = 0.38
    expect(needs.mood).toBeCloseTo(0.5 - 0.4 * 0.3, 5);
  });

  it('clamps all output values to [0, 1]', () => {
    const extremeDrives: DriveMapping[] = [
      { source_drive: 'hunger', target_drive: 'hunger', mapping_type: 'direct', source_value: 2.0, confidence: 1.0, notes: null },
      { source_drive: 'fear', target_drive: 'stress', mapping_type: 'direct', source_value: 1.0, confidence: 1.0, notes: null },
      { source_drive: 'anger', target_drive: 'stress', mapping_type: 'direct', source_value: 1.0, confidence: 1.0, notes: null },
    ];
    const needs = mapDrivesToNeeds(extremeDrives);
    expect(needs.hunger).toBeLessThanOrEqual(1);
    expect(needs.stress).toBeLessThanOrEqual(1);
    expect(needs.mood).toBeGreaterThanOrEqual(0);
  });

  it('skips drives with no MVEE analog without crashing', () => {
    const needs = mapDrivesToNeeds(mockDrives);
    // limbic_influence is no_analog — just verify we got valid output
    expect(needs).toBeDefined();
    expect(typeof needs.hunger).toBe('number');
  });
});

// ============================================================================
// 5. mapDrivesToPersonality
// ============================================================================

const personalityDrives: DriveMapping[] = [
  { source_drive: 'fear', target_drive: 'fearfulness', mapping_type: 'approximate', source_value: 0.4, confidence: 0.6, notes: null },
  { source_drive: 'anger', target_drive: 'aggressiveness', mapping_type: 'approximate', source_value: 0.3, confidence: 0.6, notes: null },
  { source_drive: 'curiosity', target_drive: 'curiosity', mapping_type: 'approximate', source_value: 0.7, confidence: 0.6, notes: null },
  { source_drive: 'social', target_drive: 'sociability', mapping_type: 'approximate', source_value: 0.6, confidence: 0.6, notes: null },
];

const zeroDccProfile: DccProfile = {
  dcc_baseline: 0.0,
  behavioral_drift_vector: [0, 0, 0, 0],
  drift_vector_labels: ['fear', 'anger', 'curiosity', 'social'],
  measurement_tick: 1000,
  species_mean_drift: [0, 0, 0, 0],
  interpretation: null,
};

describe('mapDrivesToPersonality', () => {
  it('maps drive values to personality axes without drift bias when dcc_baseline <= 0.02', () => {
    const personality = mapDrivesToPersonality(personalityDrives, zeroDccProfile);
    expect(personality.fearfulness).toBeCloseTo(0.4);
    expect(personality.aggressiveness).toBeCloseTo(0.3);
    expect(personality.curiosity).toBeCloseTo(0.7);
    expect(personality.sociability).toBeCloseTo(0.6);
  });

  it('applies drift bias when dcc_baseline > 0.02', () => {
    const highDccProfile: DccProfile = {
      dcc_baseline: 0.5,
      behavioral_drift_vector: [0.6, 0.8, 0, 0],
      drift_vector_labels: ['fear', 'anger', 'curiosity', 'social'],
      measurement_tick: 2000,
      species_mean_drift: [0, 0, 0, 0],
      interpretation: 'High drift creature',
    };
    const withoutBias = mapDrivesToPersonality(personalityDrives, zeroDccProfile);
    const withBias = mapDrivesToPersonality(personalityDrives, highDccProfile);

    // drift magnitude = sqrt(0.6^2 + 0.8^2) = 1.0
    // biasFactor = 1 + 1.0 * 0.5 = 1.5
    // fearfulness = clamp(0.4 * 1.5, 0, 1) = 0.6
    expect(withBias.fearfulness).toBeCloseTo(0.4 * 1.5, 5);
    expect(withBias.fearfulness).toBeGreaterThan(withoutBias.fearfulness);
    expect(withBias.curiosity).toBeGreaterThan(withoutBias.curiosity);
  });

  it('does not apply drift bias when dcc_baseline is exactly 0.02', () => {
    const borderlineDcc: DccProfile = {
      dcc_baseline: 0.02,
      behavioral_drift_vector: [1.0, 0, 0, 0],
      drift_vector_labels: ['fear', 'anger', 'curiosity', 'social'],
      measurement_tick: 500,
      species_mean_drift: [0, 0, 0, 0],
      interpretation: null,
    };
    const personality = mapDrivesToPersonality(personalityDrives, borderlineDcc);
    // 0.02 is not > 0.02, so no bias applied
    expect(personality.fearfulness).toBeCloseTo(0.4);
  });

  it('clamps biased personality values to [0, 1]', () => {
    const extremeDcc: DccProfile = {
      dcc_baseline: 1.0,
      behavioral_drift_vector: [10, 10, 10, 10],
      drift_vector_labels: ['fear', 'anger', 'curiosity', 'social'],
      measurement_tick: 9999,
      species_mean_drift: [0, 0, 0, 0],
      interpretation: null,
    };
    const highDrives: DriveMapping[] = [
      { source_drive: 'fear', target_drive: 'fearfulness', mapping_type: 'approximate', source_value: 0.9, confidence: 0.6, notes: null },
      { source_drive: 'anger', target_drive: 'aggressiveness', mapping_type: 'approximate', source_value: 0.9, confidence: 0.6, notes: null },
      { source_drive: 'curiosity', target_drive: 'curiosity', mapping_type: 'approximate', source_value: 0.9, confidence: 0.6, notes: null },
      { source_drive: 'social', target_drive: 'sociability', mapping_type: 'approximate', source_value: 0.9, confidence: 0.6, notes: null },
    ];
    const personality = mapDrivesToPersonality(highDrives, extremeDcc);
    expect(personality.fearfulness).toBeLessThanOrEqual(1);
    expect(personality.aggressiveness).toBeLessThanOrEqual(1);
    expect(personality.curiosity).toBeLessThanOrEqual(1);
    expect(personality.sociability).toBeLessThanOrEqual(1);
  });

  it('defaults unmapped drives to 0', () => {
    const emptyDrives: DriveMapping[] = [];
    const personality = mapDrivesToPersonality(emptyDrives, zeroDccProfile);
    expect(personality.fearfulness).toBe(0);
    expect(personality.aggressiveness).toBe(0);
    expect(personality.curiosity).toBe(0);
    expect(personality.sociability).toBe(0);
  });
});

// ============================================================================
// 6. computeGDI
// ============================================================================

describe('computeGDI', () => {
  it('returns a GDI near 0 for identical source and target', () => {
    const identicalTraits: CoreTrait[] = [
      { trait_id: 'size', category: 'morphological', value: 0.6, heritability: 1.0, variance_range: null, transfer_fidelity: 'lossless', source_game: 'precursors', notes: null },
      { trait_id: 'health', category: 'metabolic', value: 0.8, heritability: 1.0, variance_range: null, transfer_fidelity: 'lossless', source_game: 'precursors', notes: null },
    ];
    const identicalVisuals: VisualTokens = { ...mockVisualTokens };
    const { genetics } = mapCoreTraitsToGenetics(identicalTraits, identicalVisuals);
    const gdi = computeGDI(identicalTraits, genetics);
    // With heritability = 1.0 and no divergence, expression exactly mirrors value
    expect(gdi).toBeCloseTo(0, 1);
  });

  it('returns 1 when source traits array is empty (no shared traits)', () => {
    const { genetics } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    const gdi = computeGDI([], genetics);
    expect(gdi).toBe(1);
  });

  it('returns 1 when no source traits map to MVEE keys', () => {
    const unmappableTraits: CoreTrait[] = [
      { trait_id: 'pheromone_sensitivity', category: 'sensory', value: 0.5, heritability: 0.5, variance_range: null, transfer_fidelity: 'lossy', source_game: 'precursors', notes: null },
    ];
    const { genetics } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    const gdi = computeGDI(unmappableTraits, genetics);
    expect(gdi).toBe(1);
  });

  it('returns a value in [0, 1]', () => {
    const { genetics } = mapCoreTraitsToGenetics(mockTraits, mockVisualTokens);
    const gdi = computeGDI(mockTraits, genetics);
    expect(gdi).toBeGreaterThanOrEqual(0);
    expect(gdi).toBeLessThanOrEqual(1);
  });

  it('returns higher GDI for more divergent trait values', () => {
    // GDI uses cosine similarity, which requires at least two traits with different
    // relative proportions to produce angular separation.
    // Build a target with size >> health (size ≈ 90, health ≈ 10).
    const skewedTraits: CoreTrait[] = [
      { trait_id: 'size', category: 'morphological', value: 0.9, heritability: 1.0, variance_range: null, transfer_fidelity: 'lossless', source_game: 'precursors', notes: null },
      { trait_id: 'health', category: 'metabolic', value: 0.1, heritability: 1.0, variance_range: null, transfer_fidelity: 'lossless', source_game: 'precursors', notes: null },
    ];
    const { genetics } = mapCoreTraitsToGenetics(skewedTraits, mockVisualTokens);

    // closeTraits: same skew as target → small GDI
    const closeTraits: CoreTrait[] = [
      { trait_id: 'size', category: 'morphological', value: 0.9, heritability: 1.0, variance_range: null, transfer_fidelity: 'lossless', source_game: 'precursors', notes: null },
      { trait_id: 'health', category: 'metabolic', value: 0.1, heritability: 1.0, variance_range: null, transfer_fidelity: 'lossless', source_game: 'precursors', notes: null },
    ];

    // farTraits: reversed skew (size low, health high) → large angular difference → higher GDI
    const farTraits: CoreTrait[] = [
      { trait_id: 'size', category: 'morphological', value: 0.1, heritability: 1.0, variance_range: null, transfer_fidelity: 'lossless', source_game: 'precursors', notes: null },
      { trait_id: 'health', category: 'metabolic', value: 0.9, heritability: 1.0, variance_range: null, transfer_fidelity: 'lossless', source_game: 'precursors', notes: null },
    ];

    const gdiClose = computeGDI(closeTraits, genetics);
    const gdiFar = computeGDI(farTraits, genetics);
    expect(gdiFar).toBeGreaterThan(gdiClose);
  });
});
