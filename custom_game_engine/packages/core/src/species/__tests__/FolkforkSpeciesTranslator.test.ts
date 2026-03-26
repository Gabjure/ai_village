// @vitest-environment node
/**
 * FolkforkSpeciesTranslator Tests
 *
 * Tests the translation of Folkfork SpeciesExchangeV1 JSON into MVEE SpeciesTemplate,
 * and the registration helpers that write into SPECIES_REGISTRY.
 *
 * Pipeline spec references: §4.2 (Physical), §4.3 (Traits), §4.4 (Social),
 * §4.5 (Sapience/Intelligence), §4.6 (Genome flags)
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  translateToSpeciesTemplate,
  registerFolkforkSpecies,
  isSpeciesImported,
  type SpeciesExchangeV1,
} from '../FolkforkSpeciesTranslator.js';
import { SPECIES_REGISTRY, getSpeciesTemplate } from '../SpeciesRegistry.js';

// ============================================================================
// Fixture factory
// ============================================================================

function makeValidExchange(overrides?: Record<string, any>): SpeciesExchangeV1 {
  return {
    formatVersion: '1.0.0',
    speciesId: 'ven_thari',
    speciesName: "Ven'thari",
    commonName: 'Wind Reader',
    archetypeSeed: 'territorial_predator',
    ecologicalRole: 'secondary_consumer',
    dietType: 'carnivore',
    homeBiome: 'tundra_steppe',
    minViableGenes: [
      { traitId: 'size', category: 'morphological', value: 0.75, heritability: 0.8 },
      { traitId: 'aggression', category: 'behavioral', value: 0.7, heritability: 0.6 },
      { traitId: 'intelligence', category: 'cognitive', value: 0.6, heritability: 0.7 },
    ],
    personalityRanges: {
      curiosity: [0.3, 0.6],
      empathy: [0.1, 0.3],
      aggression: [0.5, 0.8],
      playfulness: [0.2, 0.5],
      stubbornness: [0.4, 0.7],
      creativity: [0.3, 0.5],
      sociability: [0.3, 0.5],
      courage: [0.6, 0.9],
    },
    cultureRanges: {
      learningRate: [0.3, 0.6],
      teachingDrive: [0.2, 0.4],
      traditionAffinity: [0.5, 0.8],
      innovationRate: [0.2, 0.4],
    },
    intelligenceRanges: {
      cognitiveCapacity: [0.5, 0.7],
      learningRate: [0.4, 0.6],
      abstractionAffinity: [0.3, 0.5],
      memoryDepth: [0.4, 0.7],
    },
    mutationRate: 0.015,
    compatibleSpecies: [],
    visualTokens: {
      baseHue: 200,
      accentHue: 30,
      saturation: 0.7,
      lightness: 0.5,
      sizeClass: 'large',
      bodyPlan: 'quadruped',
      pattern: 'banded',
      markingIntensity: 0.6,
      notableFeatures: ['wind-sensing antlers', 'frost-resistant fur'],
    },
    lore: {
      epithet: 'Wind Readers of the Frozen Steppe',
      creationMyth: 'Born from the first winter storm, shaped by the howling winds.',
      culturalPractices: ['wind-reading rituals', 'pack hunts at dusk'],
      folkloreTradition: 'Algonquian/Windigo',
    },
    sensitivity: {
      livingTradition: false,
      sourceAttribution: 'Algonquian, Ojibwe, Cree traditions',
    },
    provenance: {
      sourceGame: 'precursors',
      sourceGameVersion: '0.1.0',
      exportedAt: '2026-03-20T12:00:00Z',
      exporterVersion: '1.0.0',
      waveUnlocked: 3,
      checksum: 'abc123def456',
    },
    ...overrides,
  } as SpeciesExchangeV1;
}

// ============================================================================
// describe('translateToSpeciesTemplate')
// ============================================================================

describe('translateToSpeciesTemplate', () => {
  describe('identity', () => {
    it('prefixes speciesId with folkfork_', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.speciesId).toBe('folkfork_ven_thari');
    });

    it('preserves speciesName from exchange', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.speciesName).toBe("Ven'thari");
    });

    it('uses commonName from exchange when provided', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.commonName).toBe('Wind Reader');
    });

    it('falls back to speciesName when commonName is absent', () => {
      const exchange = makeValidExchange();
      delete (exchange as any).commonName;
      const template = translateToSpeciesTemplate(exchange);
      expect(template.commonName).toBe("Ven'thari");
    });

    it('includes lore epithet in description', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.description).toContain('Wind Readers of the Frozen Steppe');
    });
  });

  describe('physical stats', () => {
    it('averageHeight for large sizeClass is 250cm', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.averageHeight).toBe(250);
    });

    it('averageHeight for tiny sizeClass is 30cm', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ visualTokens: { sizeClass: 'tiny', bodyPlan: 'quadruped' } }),
      );
      expect(template.averageHeight).toBe(30);
    });

    it('averageHeight for medium sizeClass is 160cm', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ visualTokens: { sizeClass: 'medium', bodyPlan: 'quadruped' } }),
      );
      expect(template.averageHeight).toBe(160);
    });

    it('averageWeight = height × bodyPlanDensity (250 × 0.55 = 137.5 for large quadruped)', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.averageWeight).toBeCloseTo(137.5);
    });

    it('sizeCategory directly from exchange sizeClass: large', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.sizeCategory).toBe('large');
    });

    it('gestationPeriod for large sizeClass is 30 days', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.gestationPeriod).toBe(30);
    });
  });

  describe('lifespan', () => {
    it('lifespan for large sizeClass is 150', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.lifespan).toBe(150);
    });

    it('lifespanType is mortal when lifespan is 150 (< 200)', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.lifespanType).toBe('mortal');
    });

    it('maturityAge = lifespan × 0.15 × (1 + cogMidpoint): 150 × 0.15 × 1.6 = 36', () => {
      // cognitiveCapacity [0.5, 0.7] → midpoint = 0.6; 150 × 0.15 × (1 + 0.6) = 36
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.maturityAge).toBeCloseTo(36);
    });

    it('lifespanType is long_lived for huge sizeClass (lifespan 300)', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ visualTokens: { sizeClass: 'huge', bodyPlan: 'quadruped' } }),
      );
      expect(template.lifespan).toBe(300);
      expect(template.lifespanType).toBe('long_lived');
    });
  });

  describe('innate traits (§4.3)', () => {
    it('default aggression midpoint 0.65 (< 0.7) does not produce aggressive trait', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).not.toContain('aggressive');
    });

    it('aggression midpoint > 0.7 produces aggressive trait', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ personalityRanges: { ...makeValidExchange().personalityRanges, aggression: [0.75, 0.85] } }),
      );
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).toContain('aggressive');
    });

    it('default courage midpoint 0.75 (> 0.7) produces brave trait', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).toContain('brave');
    });

    it('default creativity midpoint 0.4 (< 0.7) does not produce creative trait', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).not.toContain('creative');
    });

    it('creativity midpoint > 0.7 produces creative trait', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ personalityRanges: { ...makeValidExchange().personalityRanges, creativity: [0.8, 0.9] } }),
      );
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).toContain('creative');
    });

    it('empathy midpoint > 0.7 produces empathic trait', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ personalityRanges: { ...makeValidExchange().personalityRanges, empathy: [0.75, 0.9] } }),
      );
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).toContain('empathic');
    });

    it('sociability midpoint > 0.7 produces gregarious trait with loneliness needsModifier', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ personalityRanges: { ...makeValidExchange().personalityRanges, sociability: [0.75, 0.85] } }),
      );
      const gregarious = template.innateTraits.find((t) => t.id === 'gregarious');
      expect(gregarious).toBeDefined();
      expect(gregarious?.needsModifier).toMatchObject({ loneliness: 1.5 });
    });

    it('curiosity midpoint > 0.7 produces curious trait', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ personalityRanges: { ...makeValidExchange().personalityRanges, curiosity: [0.8, 0.9] } }),
      );
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).toContain('curious');
    });
  });

  describe('intelligence traits (§4.5)', () => {
    it('default abstractionAffinity midpoint 0.4 (< 0.7) does not produce spirit_sight', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).not.toContain('spirit_sight');
    });

    it('abstractionAffinity midpoint > 0.7 produces spirit_sight trait', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ intelligenceRanges: { ...makeValidExchange().intelligenceRanges, abstractionAffinity: [0.75, 0.9] } }),
      );
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).toContain('spirit_sight');
    });

    it('default memoryDepth midpoint 0.55 (< 0.7) does not produce ancestral_memory', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).not.toContain('ancestral_memory');
    });

    it('memoryDepth midpoint > 0.7 produces ancestral_memory trait', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ intelligenceRanges: { ...makeValidExchange().intelligenceRanges, memoryDepth: [0.75, 0.9] } }),
      );
      const ids = template.innateTraits.map((t) => t.id);
      expect(ids).toContain('ancestral_memory');
    });
  });

  describe('sapience', () => {
    it('cognitiveCapacity midpoint exactly 0.6 is NOT sapient (requires > 0.6)', () => {
      // fixture: cognitiveCapacity [0.5, 0.7] → midpoint = 0.6
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.sapient).toBe(false);
    });

    it('cognitiveCapacity midpoint 0.725 is sapient', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ intelligenceRanges: { ...makeValidExchange().intelligenceRanges, cognitiveCapacity: [0.65, 0.8] } }),
      );
      expect(template.sapient).toBe(true);
    });

    it('very low cognitiveCapacity [0.1, 0.2] midpoint 0.15 is not sapient', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ intelligenceRanges: { ...makeValidExchange().intelligenceRanges, cognitiveCapacity: [0.1, 0.2] } }),
      );
      expect(template.sapient).toBe(false);
    });
  });

  describe('social structure (§4.4)', () => {
    it('traditionAffinity dominant by > 0.15 margin → hierarchical_traditional', () => {
      // Default fixture: traditionAffinity=0.65, learningRate=0.45, diff=0.20 > 0.15
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.socialStructure).toBe('hierarchical_traditional');
    });

    it('innovationRate dominant → egalitarian_innovative', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({
          cultureRanges: {
            learningRate: [0.1, 0.2],
            teachingDrive: [0.1, 0.2],
            traditionAffinity: [0.1, 0.2],
            innovationRate: [0.8, 0.9],
          },
        }),
      );
      expect(template.socialStructure).toBe('egalitarian_innovative');
    });

    it('all balanced culture ranges → communal_balanced', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({
          cultureRanges: {
            learningRate: [0.4, 0.6],
            teachingDrive: [0.4, 0.6],
            traditionAffinity: [0.4, 0.6],
            innovationRate: [0.4, 0.6],
          },
        }),
      );
      expect(template.socialStructure).toBe('communal_balanced');
    });
  });

  describe('body plan mapping', () => {
    it('quadruped → quadruped_standard', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.bodyPlanId).toBe('quadruped_standard');
    });

    it('bipedal → humanoid_standard', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ visualTokens: { sizeClass: 'medium', bodyPlan: 'bipedal' } }),
      );
      expect(template.bodyPlanId).toBe('humanoid_standard');
    });

    it('serpentine → serpentine_standard', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ visualTokens: { sizeClass: 'medium', bodyPlan: 'serpentine' } }),
      );
      expect(template.bodyPlanId).toBe('serpentine_standard');
    });

    it('insectoid → insectoid_4arm', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ visualTokens: { sizeClass: 'medium', bodyPlan: 'insectoid' } }),
      );
      expect(template.bodyPlanId).toBe('insectoid_4arm');
    });

    it('unknown bodyPlan → humanoid_standard (fallback)', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ visualTokens: { sizeClass: 'medium', bodyPlan: 'unknown_plan' } }),
      );
      expect(template.bodyPlanId).toBe('humanoid_standard');
    });
  });

  describe('genetics', () => {
    it('mutationRate preserved from exchange', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.mutationRate).toBe(0.015);
    });

    it('mutationRate defaults to 0.01 when absent', () => {
      const exchange = makeValidExchange();
      delete (exchange as any).mutationRate;
      const template = translateToSpeciesTemplate(exchange);
      expect(template.mutationRate).toBe(0.01);
    });

    it('compatibleSpecies preserved from exchange', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ compatibleSpecies: ['folkfork_kel_vai', 'human'] }),
      );
      expect(template.compatibleSpecies).toEqual(['folkfork_kel_vai', 'human']);
    });
  });

  describe('cross-game fields', () => {
    it('cross_game_compatible is true', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.cross_game_compatible).toBe(true);
    });

    it('native_game is precursors', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.native_game).toBe('precursors');
    });

    it('traveler_epithet matches lore.epithet', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.traveler_epithet).toBe('Wind Readers of the Frozen Steppe');
    });

    it('genome_flags has 7 loci', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      const keys = Object.keys(template.genome_flags ?? {});
      expect(keys).toHaveLength(7);
      expect(keys).toEqual(
        expect.arrayContaining([
          'social_orientation',
          'combat_readiness',
          'craft_focus',
          'patience',
          'curiosity',
          'territory_focus',
          'independence',
        ]),
      );
    });

    it('genome_flags.curiosity matches personalityRanges.curiosity', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.genome_flags?.curiosity).toEqual([0.3, 0.6]);
    });

    it('genome_flags.territory_focus is [0.6, 0.9] for territorial_predator', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.genome_flags?.territory_focus).toEqual([0.6, 0.9]);
    });

    it('genome_flags.territory_focus is [0.1, 0.4] for social_generalist', () => {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ archetypeSeed: 'social_generalist' }),
      );
      expect(template.genome_flags?.territory_focus).toEqual([0.1, 0.4]);
    });

    it('precursors_lineage.precursors_species_id matches exchange.speciesId', () => {
      const template = translateToSpeciesTemplate(makeValidExchange());
      expect(template.precursors_lineage?.precursors_species_id).toBe('ven_thari');
    });
  });
});

// ============================================================================
// describe('registerFolkforkSpecies')
// ============================================================================

describe('registerFolkforkSpecies', () => {
  afterEach(() => {
    delete (SPECIES_REGISTRY as Record<string, unknown>)['folkfork_ven_thari'];
    delete (SPECIES_REGISTRY as Record<string, unknown>)['folkfork_kel_vai'];
  });

  it('registers species in SPECIES_REGISTRY', () => {
    registerFolkforkSpecies(makeValidExchange());
    expect('folkfork_ven_thari' in SPECIES_REGISTRY).toBe(true);
  });

  it('returns the created SpeciesTemplate', () => {
    const template = registerFolkforkSpecies(makeValidExchange());
    expect(template.speciesId).toBe('folkfork_ven_thari');
    expect(template.speciesName).toBe("Ven'thari");
  });

  it('can be found by getSpeciesTemplate after registration', () => {
    registerFolkforkSpecies(makeValidExchange());
    const found = getSpeciesTemplate('folkfork_ven_thari');
    expect(found).toBeDefined();
    expect(found?.commonName).toBe('Wind Reader');
  });
});

// ============================================================================
// describe('isSpeciesImported')
// ============================================================================

describe('isSpeciesImported', () => {
  afterEach(() => {
    delete (SPECIES_REGISTRY as Record<string, unknown>)['folkfork_ven_thari'];
  });

  it('returns false for unregistered species', () => {
    expect(isSpeciesImported('ven_thari')).toBe(false);
  });

  it('returns true after registerFolkforkSpecies', () => {
    registerFolkforkSpecies(makeValidExchange());
    expect(isSpeciesImported('ven_thari')).toBe(true);
  });
});

// ============================================================================
// describe('round-trip completeness')
// ============================================================================

describe('round-trip completeness', () => {
  const ALL_ARCHETYPES: SpeciesExchangeV1['archetypeSeed'][] = [
    'social_generalist',
    'territorial_predator',
    'collector_engineer',
    'knowledge_keeper',
    'environmental_adapter',
    'trickster',
    'guardian',
    'parasite_symbiont',
  ];

  const ALL_SIZE_CLASSES: Array<'tiny' | 'small' | 'medium' | 'large' | 'huge'> = [
    'tiny',
    'small',
    'medium',
    'large',
    'huge',
  ];

  const ALL_BODY_PLANS = [
    'bipedal',
    'quadruped',
    'serpentine',
    'avian',
    'amorphous',
    'insectoid',
    'aquatic',
  ];

  const REQUIRED_FIELDS: Array<keyof ReturnType<typeof translateToSpeciesTemplate>> = [
    'speciesId',
    'speciesName',
    'commonName',
    'description',
    'bodyPlanId',
    'innateTraits',
    'compatibleSpecies',
    'mutationRate',
    'averageHeight',
    'averageWeight',
    'sizeCategory',
    'lifespan',
    'lifespanType',
    'maturityAge',
    'gestationPeriod',
    'sapient',
  ];

  it('all 8 archetypes produce valid SpeciesTemplates with required fields', () => {
    for (const archetype of ALL_ARCHETYPES) {
      const template = translateToSpeciesTemplate(makeValidExchange({ archetypeSeed: archetype }));
      for (const field of REQUIRED_FIELDS) {
        expect(template[field], `field '${field}' missing for archetype '${archetype}'`).toBeDefined();
      }
    }
  });

  it('all 5 size classes produce correct physical stats', () => {
    const expectedHeights: Record<string, number> = {
      tiny: 30,
      small: 80,
      medium: 160,
      large: 250,
      huge: 500,
    };

    for (const sizeClass of ALL_SIZE_CLASSES) {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ visualTokens: { sizeClass, bodyPlan: 'bipedal' } }),
      );
      expect(template.averageHeight, `height for sizeClass '${sizeClass}'`).toBe(expectedHeights[sizeClass]);
      expect(template.sizeCategory, `sizeCategory for '${sizeClass}'`).toBe(sizeClass);
      expect(template.averageWeight, `weight for '${sizeClass}'`).toBeGreaterThan(0);
      expect(template.gestationPeriod, `gestation for '${sizeClass}'`).toBeGreaterThan(0);
    }
  });

  it('all 7 body plans produce valid bodyPlanIds', () => {
    const validBodyPlanIds = new Set([
      'humanoid_standard',
      'quadruped_standard',
      'serpentine_standard',
      'avian_standard',
      'amorphous_standard',
      'insectoid_4arm',
      'aquatic_tentacled',
    ]);

    for (const bodyPlan of ALL_BODY_PLANS) {
      const template = translateToSpeciesTemplate(
        makeValidExchange({ visualTokens: { sizeClass: 'medium', bodyPlan } }),
      );
      expect(
        validBodyPlanIds.has(template.bodyPlanId),
        `bodyPlanId '${template.bodyPlanId}' not valid for bodyPlan '${bodyPlan}'`,
      ).toBe(true);
    }
  });
});
