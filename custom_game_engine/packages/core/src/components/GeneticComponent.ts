/**
 * GeneticComponent - Genetic information for reproduction and inheritance
 *
 * Handles:
 * - Genetic alleles (dominant/recessive traits)
 * - Hereditary body modifications (divine wings passed to children)
 * - Mutation rates
 * - Species compatibility for hybrids
 */

import { ComponentBase } from '../ecs/Component.js';

// ============================================================================
// Genetic Alleles
// ============================================================================

export type AlleleExpression = 'dominant' | 'recessive' | 'codominant';

export interface GeneticAllele {
  traitId: string;           // e.g., 'eye_color', 'height', 'wing_presence'
  dominantAllele: string;    // e.g., 'brown', 'tall', 'winged'
  recessiveAllele: string;   // e.g., 'blue', 'short', 'wingless'
  expression: AlleleExpression;

  // Which allele is currently expressed
  expressedAllele: 'dominant' | 'recessive' | 'both';

  // Metadata
  category: 'physical' | 'sensory' | 'metabolic' | 'behavioral';
}

// ============================================================================
// Mate Preference Strategy
// ============================================================================

export interface MatePreferenceVector {
  /** Preference for similar genotypes and courtship styles. */
  assortativePreference: number;
  /** Preference for dissimilar / complementary genotypes. */
  disassortativePreference: number;
  /** How strongly biochemistry shapes attraction. */
  biochemicalAffinity: number;
  /** How much fertility signals influence conception chances. */
  fertilitySensitivity: number;
  /** How much biochemistry shifts gestation pacing. */
  gestationSensitivity: number;
  /** How strongly taboo / forbidden tactics suppress courtship. */
  tabooSensitivity: number;
}

const MATE_PREFERENCE_TRAIT_IDS = {
  assortativePreference: 'courtship_assortative_preference',
  disassortativePreference: 'courtship_disassortative_preference',
  biochemicalAffinity: 'courtship_biochemical_affinity',
  fertilitySensitivity: 'courtship_fertility_sensitivity',
  gestationSensitivity: 'courtship_gestation_sensitivity',
  tabooSensitivity: 'courtship_taboo_sensitivity',
} as const;

export const DEFAULT_MATE_PREFERENCE_VECTOR: MatePreferenceVector = {
  assortativePreference: 0.5,
  disassortativePreference: 0.5,
  biochemicalAffinity: 0.5,
  fertilitySensitivity: 0.5,
  gestationSensitivity: 0.5,
  tabooSensitivity: 0.5,
};

// ============================================================================
// Social/Cultural Affinity Strategy
// ============================================================================

export interface SocialCulturalAffinityVector {
  /** Affinity for social cohesion and group bonding. */
  socialAffinity: number;
  /** Affinity for shared cultural practices and norms. */
  culturalAffinity: number;
  /** Affinity for collective / communal decision-making. */
  collectiveAffinity: number;
  /** Affinity for tradition, ritual, and inherited custom. */
  traditionAffinity: number;
}

const SOCIAL_CULTURAL_AFFINITY_TRAIT_IDS = {
  socialAffinity: 'social_affinity',
  culturalAffinity: 'cultural_affinity',
  collectiveAffinity: 'collective_affinity',
  traditionAffinity: 'tradition_affinity',
} as const;

export const DEFAULT_SOCIAL_CULTURAL_AFFINITY_VECTOR: SocialCulturalAffinityVector = {
  socialAffinity: 0.5,
  culturalAffinity: 0.5,
  collectiveAffinity: 0.5,
  traditionAffinity: 0.5,
};

const CULTURE_AFFINITY_WEIGHTS = {
  socialAffinity: 0.35,
  culturalAffinity: 0.25,
  collectiveAffinity: 0.25,
  traditionAffinity: 0.15,
} as const;

const SYNCHRONIZED_PARTICIPATION_WEIGHTS = {
  socialAffinity: 0.2,
  culturalAffinity: 0.2,
  collectiveAffinity: 0.35,
  traditionAffinity: 0.25,
} as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeMatePreferenceVector(
  vector?: Partial<MatePreferenceVector>
): MatePreferenceVector {
  return {
    assortativePreference: clamp01(vector?.assortativePreference ?? DEFAULT_MATE_PREFERENCE_VECTOR.assortativePreference),
    disassortativePreference: clamp01(vector?.disassortativePreference ?? DEFAULT_MATE_PREFERENCE_VECTOR.disassortativePreference),
    biochemicalAffinity: clamp01(vector?.biochemicalAffinity ?? DEFAULT_MATE_PREFERENCE_VECTOR.biochemicalAffinity),
    fertilitySensitivity: clamp01(vector?.fertilitySensitivity ?? DEFAULT_MATE_PREFERENCE_VECTOR.fertilitySensitivity),
    gestationSensitivity: clamp01(vector?.gestationSensitivity ?? DEFAULT_MATE_PREFERENCE_VECTOR.gestationSensitivity),
    tabooSensitivity: clamp01(vector?.tabooSensitivity ?? DEFAULT_MATE_PREFERENCE_VECTOR.tabooSensitivity),
  };
}

function normalizeSocialCulturalAffinityVector(
  vector?: Partial<SocialCulturalAffinityVector>
): SocialCulturalAffinityVector {
  return {
    socialAffinity: clamp01(vector?.socialAffinity ?? DEFAULT_SOCIAL_CULTURAL_AFFINITY_VECTOR.socialAffinity),
    culturalAffinity: clamp01(vector?.culturalAffinity ?? DEFAULT_SOCIAL_CULTURAL_AFFINITY_VECTOR.culturalAffinity),
    collectiveAffinity: clamp01(vector?.collectiveAffinity ?? DEFAULT_SOCIAL_CULTURAL_AFFINITY_VECTOR.collectiveAffinity),
    traditionAffinity: clamp01(vector?.traditionAffinity ?? DEFAULT_SOCIAL_CULTURAL_AFFINITY_VECTOR.traditionAffinity),
  };
}

function weightedVectorAverage(
  vector: SocialCulturalAffinityVector,
  weights: Record<keyof SocialCulturalAffinityVector, number>
): number {
  return clamp01(
    (vector.socialAffinity * weights.socialAffinity) +
    (vector.culturalAffinity * weights.culturalAffinity) +
    (vector.collectiveAffinity * weights.collectiveAffinity) +
    (vector.traditionAffinity * weights.traditionAffinity)
  );
}

function parsePreferenceAlleleValue(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? clamp01(parsed) : undefined;
}

function extractMatePreferenceVectorFromGenome(
  genome: GeneticAllele[]
): Partial<MatePreferenceVector> {
  const byTrait = new Map(genome.map(allele => [allele.traitId, allele] as const));

  return {
    assortativePreference: parsePreferenceAlleleValue(
      byTrait.get(MATE_PREFERENCE_TRAIT_IDS.assortativePreference)?.dominantAllele
    ),
    disassortativePreference: parsePreferenceAlleleValue(
      byTrait.get(MATE_PREFERENCE_TRAIT_IDS.disassortativePreference)?.dominantAllele
    ),
    biochemicalAffinity: parsePreferenceAlleleValue(
      byTrait.get(MATE_PREFERENCE_TRAIT_IDS.biochemicalAffinity)?.dominantAllele
    ),
    fertilitySensitivity: parsePreferenceAlleleValue(
      byTrait.get(MATE_PREFERENCE_TRAIT_IDS.fertilitySensitivity)?.dominantAllele
    ),
    gestationSensitivity: parsePreferenceAlleleValue(
      byTrait.get(MATE_PREFERENCE_TRAIT_IDS.gestationSensitivity)?.dominantAllele
    ),
    tabooSensitivity: parsePreferenceAlleleValue(
      byTrait.get(MATE_PREFERENCE_TRAIT_IDS.tabooSensitivity)?.dominantAllele
    ),
  };
}

function extractSocialCulturalAffinityVectorFromGenome(
  genome: GeneticAllele[]
): Partial<SocialCulturalAffinityVector> {
  const byTrait = new Map(genome.map(allele => [allele.traitId, allele] as const));

  return {
    socialAffinity: parsePreferenceAlleleValue(
      byTrait.get(SOCIAL_CULTURAL_AFFINITY_TRAIT_IDS.socialAffinity)?.dominantAllele
    ),
    culturalAffinity: parsePreferenceAlleleValue(
      byTrait.get(SOCIAL_CULTURAL_AFFINITY_TRAIT_IDS.culturalAffinity)?.dominantAllele
    ),
    collectiveAffinity: parsePreferenceAlleleValue(
      byTrait.get(SOCIAL_CULTURAL_AFFINITY_TRAIT_IDS.collectiveAffinity)?.dominantAllele
    ),
    traditionAffinity: parsePreferenceAlleleValue(
      byTrait.get(SOCIAL_CULTURAL_AFFINITY_TRAIT_IDS.traditionAffinity)?.dominantAllele
    ),
  };
}

function deriveSpeciesSocialCulturalAffinityVector(
  speciesId: string
): SocialCulturalAffinityVector {
  const normalized = speciesId.toLowerCase();

  if (normalized.includes('norn')) {
    return {
      socialAffinity: 0.82,
      culturalAffinity: 0.84,
      collectiveAffinity: 0.8,
      traditionAffinity: 0.9,
    };
  }

  if (normalized.includes('ettin')) {
    return {
      socialAffinity: 0.58,
      culturalAffinity: 0.52,
      collectiveAffinity: 0.55,
      traditionAffinity: 0.62,
    };
  }

  if (normalized.includes('grendel')) {
    return {
      socialAffinity: 0.3,
      culturalAffinity: 0.35,
      collectiveAffinity: 0.28,
      traditionAffinity: 0.25,
    };
  }

  return DEFAULT_SOCIAL_CULTURAL_AFFINITY_VECTOR;
}

// ============================================================================
// Hereditary Modifications
// ============================================================================

export type GeneticModificationSource = 'divine' | 'magical' | 'genetic_engineering' | 'mutation' | 'natural';

export interface HereditaryModification {
  id: string;

  // Body modifications that can be passed to offspring
  type: 'wings' | 'extra_arms' | 'extra_legs' | 'tail' | 'horns' | 'enhanced_part' | 'extra_organ';

  bodyPartType: string;      // e.g., 'wing', 'arm', 'heart'
  bodyPartCount?: number;    // How many parts (e.g., 2 wings, 4 arms)

  // Inheritance
  inheritanceChance: number; // 0-1, probability offspring inherits this
  dominance: 'dominant' | 'recessive'; // Genetic dominance

  // Source
  source: GeneticModificationSource;
  sourceEntityId?: string;   // Deity who granted it, spell that created it, etc.

  // When acquired
  acquiredAt: number;        // Tick when acquired
  generationsActive: number; // How many generations has this been passed down

  // Properties
  permanent: boolean;        // Can this be removed?
  description: string;
}

// ============================================================================
// GeneticComponent
// ============================================================================

export class GeneticComponent extends ComponentBase {
  public readonly type = 'genetic';

  // Genome - simplified as trait alleles
  public genome: GeneticAllele[];

  // Hereditary body modifications (wings, extra limbs, etc.)
  public hereditaryModifications: HereditaryModification[];

  // Mutation rate for offspring
  public mutationRate: number;  // Default 0.01 (1%)

  // Genetic compatibility
  public compatibleSpecies: string[];  // Can hybridize with these species IDs

  // Heritable courtship strategy
  public matePreferenceVector: MatePreferenceVector;

  // Heritable social/cultural affinity strategy
  public socialCulturalAffinityVector: SocialCulturalAffinityVector;

  // Genetic health
  public geneticHealth: number; // 0-1, affects mutation resistance and offspring viability
  public inbreedingCoefficient: number; // 0-1, tracks genetic diversity loss

  // Lineage tracking
  public parentIds?: [string, string]; // IDs of biological parents
  public generation: number;           // How many generations from "first" ancestor

  constructor(options: Partial<GeneticComponent> = {}) {
    super();

    this.genome = options.genome ? options.genome.map(allele => ({ ...allele })) : [];
    this.hereditaryModifications = options.hereditaryModifications ?? [];
    this.mutationRate = options.mutationRate ?? 0.01; // 1% default
    this.compatibleSpecies = options.compatibleSpecies ?? [];
    const genomePreferenceVector = normalizeMatePreferenceVector(
      extractMatePreferenceVectorFromGenome(this.genome)
    );
    this.matePreferenceVector = normalizeMatePreferenceVector(
      options.matePreferenceVector ?? genomePreferenceVector
    );
    const genomeSocialCulturalAffinityVector = normalizeSocialCulturalAffinityVector(
      extractSocialCulturalAffinityVectorFromGenome(this.genome)
    );
    this.socialCulturalAffinityVector = normalizeSocialCulturalAffinityVector(
      options.socialCulturalAffinityVector ?? genomeSocialCulturalAffinityVector
    );
    this.geneticHealth = options.geneticHealth ?? 1.0;
    this.inbreedingCoefficient = options.inbreedingCoefficient ?? 0.0;
    this.parentIds = options.parentIds;
    this.generation = options.generation ?? 0;
  }

  /**
   * Add a hereditary modification (divine wings, extra arms, etc.)
   */
  addHereditaryModification(modification: HereditaryModification): void {
    this.hereditaryModifications.push(modification);
  }

  /**
   * Remove a hereditary modification
   */
  removeHereditaryModification(modificationId: string): void {
    this.hereditaryModifications = this.hereditaryModifications.filter(
      m => m.id !== modificationId
    );
  }

  /**
   * Get hereditary modifications that will pass to offspring
   */
  getInheritableModifications(): HereditaryModification[] {
    return this.hereditaryModifications.filter(m => {
      // Only inheritable if:
      // 1. Has inheritance chance > 0
      // 2. Is permanent (temporary mods don't pass down)
      return m.inheritanceChance > 0 && m.permanent;
    });
  }

  /**
   * Roll for inheritance of a specific modification
   */
  willInherit(modification: HereditaryModification): boolean {
    return Math.random() < modification.inheritanceChance;
  }

  /**
   * Add an allele to the genome
   */
  addAllele(allele: GeneticAllele): void {
    // Remove existing allele for this trait if present
    this.genome = this.genome.filter(a => a.traitId !== allele.traitId);
    this.genome.push(allele);
  }

  /**
   * Get allele for a specific trait
   */
  getAllele(traitId: string): GeneticAllele | undefined {
    return this.genome.find(a => a.traitId === traitId);
  }

  /**
   * Get expressed value for a trait
   */
  getExpressedTrait(traitId: string): string | null {
    const allele = this.getAllele(traitId);
    if (!allele) return null;

    switch (allele.expressedAllele) {
      case 'dominant':
        return allele.dominantAllele;
      case 'recessive':
        return allele.recessiveAllele;
      case 'both':
        // Codominant - return both
        return `${allele.dominantAllele}+${allele.recessiveAllele}`;
      default:
        return null;
    }
  }

  /**
   * Check if compatible with another entity for reproduction
   */
  isCompatibleWith(_otherGenetics: GeneticComponent, otherSpeciesId: string): boolean {
    // Check if other species is in compatible list
    return this.compatibleSpecies.includes(otherSpeciesId);
  }

  /**
   * Combine genomes from two parents (Mendelian inheritance)
   */
  static combineGenomes(
    parent1: GeneticComponent,
    parent2: GeneticComponent
  ): GeneticAllele[] {
    const offspring: GeneticAllele[] = [];
    const processedTraits = new Set<string>();

    // Combine alleles from both parents
    for (const allele1 of parent1.genome) {
      const allele2 = parent2.getAllele(allele1.traitId);

      if (allele2) {
        // Both parents have this trait
        const inheritedAllele = this.inheritAllele(allele1, allele2);
        offspring.push(inheritedAllele);
        processedTraits.add(allele1.traitId);
      } else {
        // Only parent1 has this trait - pass it down
        offspring.push({ ...allele1 });
        processedTraits.add(allele1.traitId);
      }
    }

    // Add any traits from parent2 that parent1 didn't have
    for (const allele2 of parent2.genome) {
      if (!processedTraits.has(allele2.traitId)) {
        offspring.push({ ...allele2 });
      }
    }

    return offspring;
  }

  /**
   * Mendelian inheritance for a single trait
   */
  private static inheritAllele(
    allele1: GeneticAllele,
    allele2: GeneticAllele
  ): GeneticAllele {
    // Randomly pick one allele from each parent
    const fromParent1 = Math.random() < 0.5 ? allele1.dominantAllele : allele1.recessiveAllele;
    const fromParent2 = Math.random() < 0.5 ? allele2.dominantAllele : allele2.recessiveAllele;

    // Determine expression
    let expressedAllele: 'dominant' | 'recessive' | 'both';

    if (allele1.expression === 'codominant' || allele2.expression === 'codominant') {
      // Codominant - both express
      expressedAllele = 'both';
    } else if (fromParent1 === allele1.dominantAllele || fromParent2 === allele2.dominantAllele) {
      // At least one dominant allele
      expressedAllele = 'dominant';
    } else {
      // Both recessive
      expressedAllele = 'recessive';
    }

    return {
      traitId: allele1.traitId,
      dominantAllele: allele1.dominantAllele,
      recessiveAllele: allele1.recessiveAllele,
      expression: allele1.expression,
      expressedAllele,
      category: allele1.category,
    };
  }

  /**
   * Combine hereditary modifications from both parents
   */
  static combineHereditaryModifications(
    parent1: GeneticComponent,
    parent2: GeneticComponent
  ): HereditaryModification[] {
    const offspring: HereditaryModification[] = [];

    // Check each parent's modifications for inheritance
    for (const mod of parent1.getInheritableModifications()) {
      if (parent1.willInherit(mod)) {
        offspring.push({
          ...mod,
          generationsActive: mod.generationsActive + 1,
        });
      }
    }

    for (const mod of parent2.getInheritableModifications()) {
      // Don't duplicate if both parents have same modification
      const alreadyHas = offspring.some(m => m.type === mod.type && m.bodyPartType === mod.bodyPartType);
      if (!alreadyHas && parent2.willInherit(mod)) {
        offspring.push({
          ...mod,
          generationsActive: mod.generationsActive + 1,
        });
      }
    }

    return offspring;
  }

  /**
   * Calculate inbreeding coefficient
   * (Simplified - in reality would need full pedigree analysis)
   */
  static calculateInbreeding(
    parent1: GeneticComponent,
    parent2: GeneticComponent
  ): number {
    // If parents have same parent IDs, they're siblings
    if (parent1.parentIds && parent2.parentIds) {
      const [p1_parent1, p1_parent2] = parent1.parentIds;
      const [p2_parent1, p2_parent2] = parent2.parentIds;

      if ((p1_parent1 === p2_parent1 && p1_parent2 === p2_parent2) ||
          (p1_parent1 === p2_parent2 && p1_parent2 === p2_parent1)) {
        // Full siblings
        return 0.25;
      }

      // Half siblings
      if (p1_parent1 === p2_parent1 || p1_parent1 === p2_parent2 ||
          p1_parent2 === p2_parent1 || p1_parent2 === p2_parent2) {
        return 0.125;
      }
    }

    // Average the parent's inbreeding coefficients
    return (parent1.inbreedingCoefficient + parent2.inbreedingCoefficient) / 2;
  }

  /**
   * Clone this genetic component
   */
  clone(): GeneticComponent {
    return new GeneticComponent({
      genome: this.genome.map(a => ({ ...a })),
      hereditaryModifications: this.hereditaryModifications.map(m => ({ ...m })),
      mutationRate: this.mutationRate,
      compatibleSpecies: [...this.compatibleSpecies],
      matePreferenceVector: { ...this.matePreferenceVector },
      socialCulturalAffinityVector: { ...this.socialCulturalAffinityVector },
      geneticHealth: this.geneticHealth,
      inbreedingCoefficient: this.inbreedingCoefficient,
      parentIds: this.parentIds ? [...this.parentIds] : undefined,
      generation: this.generation,
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a default genetic component for a species
 */
export function createDefaultGenetics(
  speciesId: string,
  compatibleSpecies: string[] = [],
  mutationRate: number = 0.01,
  matePreferenceVector: Partial<MatePreferenceVector> = {},
  socialCulturalAffinityVector: Partial<SocialCulturalAffinityVector> = {}
): GeneticComponent {
  const speciesAffinityDefaults = deriveSpeciesSocialCulturalAffinityVector(speciesId);

  return new GeneticComponent({
    genome: [],
    hereditaryModifications: [],
    mutationRate,
    compatibleSpecies,
    matePreferenceVector: normalizeMatePreferenceVector(matePreferenceVector),
    socialCulturalAffinityVector: normalizeSocialCulturalAffinityVector({
      ...speciesAffinityDefaults,
      ...socialCulturalAffinityVector,
    }),
    geneticHealth: 1.0,
    inbreedingCoefficient: 0.0,
    generation: 0,
  });
}

export function getCultureAffinityScore(
  genetics: { socialCulturalAffinityVector?: SocialCulturalAffinityVector } | null | undefined
): number {
  if (!genetics?.socialCulturalAffinityVector) return 0.5;
  return weightedVectorAverage(genetics.socialCulturalAffinityVector, CULTURE_AFFINITY_WEIGHTS);
}

export function getSynchronizedParticipationScore(
  genetics: { socialCulturalAffinityVector?: SocialCulturalAffinityVector } | null | undefined
): number {
  if (!genetics?.socialCulturalAffinityVector) return 0.5;
  return weightedVectorAverage(
    genetics.socialCulturalAffinityVector,
    SYNCHRONIZED_PARTICIPATION_WEIGHTS
  );
}

/**
 * Create a hereditary modification for divine transformations
 */
export function createHereditaryModification(
  type: HereditaryModification['type'],
  bodyPartType: string,
  inheritanceChance: number,
  source: GeneticModificationSource,
  tick: number,
  options: Partial<HereditaryModification> = {}
): HereditaryModification {
  return {
    id: `hereditary_${type}_${Date.now()}`,
    type,
    bodyPartType,
    inheritanceChance,
    dominance: options.dominance ?? 'dominant',
    source,
    sourceEntityId: options.sourceEntityId,
    acquiredAt: tick,
    generationsActive: 0,
    permanent: true,
    description: options.description ?? `Hereditary ${type}`,
    bodyPartCount: options.bodyPartCount,
  };
}
