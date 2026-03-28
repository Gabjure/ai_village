/**
 * Sprint16GenomeIntegration — Genome integration for Sprint 16 R6 species
 *
 * Integrates Sachamama-Vel, Phi Krasue-Vel, Jenglot-Kin, Yacuruna-Kin,
 * and Yara-ma-yha-who-Rin into the GeneticComponent system.
 *
 * Provides:
 * 1. Species-specific GeneticAllele presets (Mendelian inheritance)
 * 2. Breeding compatibility groups
 * 3. Trait inheritance rules for novel mechanics
 * 4. Genome extension flags for: terrain-as-entity, two-entity split,
 *    keeper symbiosis, species conversion
 * 5. Factory function to create configured GeneticComponents
 *
 * Reference: MUL-3947
 */

import type { GeneticAllele } from '../components/GeneticComponent.js';
import { GeneticComponent, createDefaultGenetics } from '../components/GeneticComponent.js';
import { SPRINT16_FOLKLORIST_SPECIES_REGISTRY } from './Sprint16FolkloristSpeciesRegistry.js';

// ============================================================================
// Sprint 16 Species IDs
// ============================================================================

const SPRINT16_SPECIES_IDS = [
  'sachamama_vel',
  'phi_krasue_vel',
  'jenglot_kin',
  'yacuruna_kin',
  'yara_ma_yha_who_rin',
] as const;

export type Sprint16SpeciesId = (typeof SPRINT16_SPECIES_IDS)[number];

// ============================================================================
// 1. Allele Presets
// ============================================================================

export const SACHAMAMA_VEL_ALLELES: GeneticAllele[] = [
  {
    traitId: 'terrain_integration',
    dominantAllele: 'dormancy',
    recessiveAllele: 'active',
    expression: 'codominant',
    expressedAllele: 'both',
    category: 'physical',
  },
  {
    traitId: 'camouflage_depth',
    dominantAllele: 'deep',
    recessiveAllele: 'shallow',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'sensory',
  },
  {
    traitId: 'upheaval_magnitude',
    dominantAllele: 'high',
    recessiveAllele: 'low',
    expression: 'codominant',
    expressedAllele: 'both',
    category: 'physical',
  },
  {
    traitId: 'digestion_efficiency',
    dominantAllele: 'efficient',
    recessiveAllele: 'slow',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'metabolic',
  },
];

export const PHI_KRASUE_VEL_ALLELES: GeneticAllele[] = [
  {
    traitId: 'separation_affinity',
    dominantAllele: 'full_separation',
    recessiveAllele: 'partial',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'behavioral',
  },
  {
    traitId: 'visceral_luminance',
    dominantAllele: 'bright',
    recessiveAllele: 'dim',
    expression: 'codominant',
    expressedAllele: 'both',
    category: 'sensory',
  },
  {
    traitId: 'predation_selectivity',
    dominantAllele: 'selective',
    recessiveAllele: 'opportunistic',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'behavioral',
  },
  {
    traitId: 'curse_potency',
    dominantAllele: 'high',
    recessiveAllele: 'low',
    expression: 'recessive',
    expressedAllele: 'recessive',
    category: 'metabolic',
  },
];

export const JENGLOT_KIN_ALLELES: GeneticAllele[] = [
  {
    traitId: 'bond_resonance',
    dominantAllele: 'strong',
    recessiveAllele: 'weak',
    expression: 'codominant',
    expressedAllele: 'both',
    category: 'behavioral',
  },
  {
    traitId: 'blood_efficiency',
    dominantAllele: 'efficient',
    recessiveAllele: 'hungry',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'metabolic',
  },
  {
    traitId: 'feral_threshold',
    dominantAllele: 'patient',
    recessiveAllele: 'volatile',
    expression: 'recessive',
    expressedAllele: 'recessive',
    category: 'behavioral',
  },
  {
    traitId: 'stealth_aptitude',
    dominantAllele: 'near_invisible',
    recessiveAllele: 'detectable',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'sensory',
  },
];

export const YACURUNA_KIN_ALLELES: GeneticAllele[] = [
  {
    traitId: 'mirror_realm_depth',
    dominantAllele: 'deep',
    recessiveAllele: 'shallow',
    expression: 'codominant',
    expressedAllele: 'both',
    category: 'sensory',
  },
  {
    traitId: 'seduction_resonance',
    dominantAllele: 'powerful',
    recessiveAllele: 'subtle',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'behavioral',
  },
  {
    traitId: 'transformation_rate',
    dominantAllele: 'fast',
    recessiveAllele: 'slow',
    expression: 'codominant',
    expressedAllele: 'both',
    category: 'metabolic',
  },
  {
    traitId: 'aquatic_mastery',
    dominantAllele: 'superior',
    recessiveAllele: 'basic',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'physical',
  },
];

export const YARA_MA_YHA_WHO_RIN_ALLELES: GeneticAllele[] = [
  {
    traitId: 'sucker_adhesion',
    dominantAllele: 'strong',
    recessiveAllele: 'weak',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'physical',
  },
  {
    traitId: 'conversion_potency',
    dominantAllele: 'fast',
    recessiveAllele: 'slow',
    expression: 'codominant',
    expressedAllele: 'both',
    category: 'metabolic',
  },
  {
    traitId: 'territorial_fidelity',
    dominantAllele: 'tight',
    recessiveAllele: 'loose',
    expression: 'dominant',
    expressedAllele: 'dominant',
    category: 'behavioral',
  },
  {
    traitId: 'post_meal_dormancy',
    dominantAllele: 'deep',
    recessiveAllele: 'light',
    expression: 'recessive',
    expressedAllele: 'recessive',
    category: 'behavioral',
  },
];

// ============================================================================
// 2. Breeding Compatibility Groups
// ============================================================================

export const SPRINT16_BREEDING_COMPATIBILITY: Record<string, string[]> = {
  // Solitary immortal — no breeding
  sachamama_vel: [],
  // Reproduces via curse transmission only, not breeding
  phi_krasue_vel: [],
  // Ageless, no biological reproduction
  jenglot_kin: [],
  // Breeds within own civilization; also converts surface agents
  yacuruna_kin: ['yacuruna_kin'],
  // Reproduces via species conversion only
  yara_ma_yha_who_rin: [],
};

// ============================================================================
// 3. Genome Extension Flags
// ============================================================================

export type GenomeExtensionType =
  | 'terrain_as_entity'      // Sachamama: entity renders as/occupies terrain tiles
  | 'two_entity_split'       // Phi Krasue: single entity splits into two at runtime
  | 'keeper_symbiosis'       // Jenglot: exclusive bidirectional agent bond
  | 'species_conversion'     // Yara-ma-yha-who + Yacuruna: victim becomes new species member
  | 'mirror_realm_sublayer'; // Yacuruna: creates navigable sub-layer

export interface GenomeExtension {
  type: GenomeExtensionType;
  speciesId: string;
  description: string;
  /** Which genome_flags keys from the species template drive this mechanic */
  governingFlags: string[];
  /** Whether this mechanic is inheritable via breeding (vs only via conversion) */
  inheritable: boolean;
}

export const SPRINT16_GENOME_EXTENSIONS: GenomeExtension[] = [
  // ── Sachamama-Vel ──────────────────────────────────────────────────────────
  {
    type: 'terrain_as_entity',
    speciesId: 'sachamama_vel',
    description:
      'The Sachamama-Vel renders its body as terrain tiles during dormancy. ' +
      'The entity occupies 12 contiguous tile slots which resolve as fallen-log/earth-mound ' +
      'terrain with vegetation rendered on the surface. Activation reveals the terrain as alive.',
    governingFlags: [
      'dormancy_duration',
      'sachamama_body_length',
      'perception_detect_threshold',
      'camouflage_regrowth_ticks',
    ],
    inheritable: false,
  },

  // ── Phi Krasue-Vel ────────────────────────────────────────────────────────
  {
    type: 'two_entity_split',
    speciesId: 'phi_krasue_vel',
    description:
      'Below the separation light threshold, the Phi Krasue-Vel divides into two runtime entities: ' +
      'the mobile Head (active predator) and the stationary Body (catatonic, vulnerable). ' +
      'Both share a single health pool. The split resolves at dawn when the Head reattaches.',
    governingFlags: [
      'separation_light_threshold',
      'reattachment_light_threshold',
      'head_flight_speed',
      'bioluminescence_range',
      'body_damage_multiplier',
      'reattachment_window',
      'dawn_damage_per_tick',
    ],
    inheritable: false,
  },

  // ── Jenglot-Kin ───────────────────────────────────────────────────────────
  {
    type: 'keeper_symbiosis',
    speciesId: 'jenglot_kin',
    description:
      'The Jenglot-Kin forms an exclusive bidirectional bond with a single keeper agent. ' +
      'The bond is gated behind a spiritual skill threshold and maintained through a ' +
      'periodic blood tithe. Bond loss triggers feral state.',
    governingFlags: [
      'spiritual_skill_bind_threshold',
      'keeper_perception_bonus',
      'keeper_spiritual_bonus',
      'keeper_luck_modifier',
      'feeding_cooldown',
      'hunger_stage_1',
      'hunger_stage_2',
      'hunger_stage_3',
      'binding_range',
    ],
    inheritable: false,
  },

  // ── Yacuruna-Kin ──────────────────────────────────────────────────────────
  {
    type: 'species_conversion',
    speciesId: 'yacuruna_kin',
    description:
      'Yacuruna-Kin convert surface agents via seductive enchantment and gradual transformation. ' +
      'A victim who reaches stage 5 of the transformation pipeline is irreversibly converted ' +
      'into a new Yacuruna-Kin member. Shamanic retrieval before stage 3 can reverse the process.',
    governingFlags: [
      'seduction_range',
      'seduction_resistance_threshold',
      'transformation_tick_interval',
      'transformation_stages_max',
      'surface_desire_decay',
      'retrieval_max_stage',
      'retrieval_ceremony_duration',
      'retrieval_spiritual_threshold',
    ],
    inheritable: true,
  },
  {
    type: 'mirror_realm_sublayer',
    speciesId: 'yacuruna_kin',
    description:
      'Yacuruna-Kin settlements establish a navigable mirror realm sub-layer within their zone. ' +
      'Water tiles become layer-transition portals. The sub-layer is an inverted reflection of the ' +
      'nearest surface settlement rendered in bioluminescent aquatic tones. Agents with insufficient ' +
      'spiritual skill perceive only ordinary water.',
    governingFlags: [
      'mirror_realm_radius',
      'spiritual_perception_threshold',
      'settlement_min_tiles',
      'surface_settlement_proximity',
    ],
    inheritable: true,
  },

  // ── Yara-ma-yha-who-Rin ───────────────────────────────────────────────────
  {
    type: 'species_conversion',
    speciesId: 'yara_ma_yha_who_rin',
    description:
      'The Yara-ma-yha-who-Rin converts victims through repeated swallow-regurgitate cycles. ' +
      'Each cycle adds one increment to a persistent counter. At 4 accumulated increments ' +
      '(from any combination of encounters) the victim is irreversibly converted into a ' +
      'new Yara-ma-yha-who-Rin, overwriting the original agent.',
    governingFlags: [
      'transformation_increment',
      'transformation_threshold',
      'height_reduction_per_cycle',
      'sleep_duration',
      'play_dead_duration',
      'post_regurgitation_chase_speed',
    ],
    inheritable: false,
  },
];

// ============================================================================
// 4. Trait Inheritance Rules
// ============================================================================

export interface TraitInheritanceRule {
  speciesId: string;
  traitId: string;
  /** How this trait passes to offspring */
  inheritanceMode: 'mendelian' | 'maternal' | 'paternal' | 'conversion_only' | 'non_heritable';
  /** Probability of expression in offspring (0-1) */
  expressionProbability: number;
  /** Traits that must also be present for this trait to express */
  prerequisiteTraits?: string[];
  /** Description of inheritance behavior */
  notes: string;
}

export const SPRINT16_TRAIT_INHERITANCE_RULES: TraitInheritanceRule[] = [
  // ── Sachamama-Vel — immortal, no offspring ─────────────────────────────────
  {
    speciesId: 'sachamama_vel',
    traitId: 'terrain_camouflage',
    inheritanceMode: 'non_heritable',
    expressionProbability: 0,
    notes:
      'Sachamama-Vel is a solitary immortal with no reproductive biology. ' +
      'Terrain camouflage does not transfer to any offspring; no offspring exist.',
  },
  {
    speciesId: 'sachamama_vel',
    traitId: 'landscape_upheaval',
    inheritanceMode: 'non_heritable',
    expressionProbability: 0,
    notes:
      'Landscape upheaval is intrinsic to the individual Sachamama-Vel body. ' +
      'No reproductive pathway exists through which it could be transmitted.',
  },
  {
    speciesId: 'sachamama_vel',
    traitId: 'swallow_ambush',
    inheritanceMode: 'non_heritable',
    expressionProbability: 0,
    notes:
      'Swallow ambush depends on the entity\'s colossal body tile mass. ' +
      'The Sachamama-Vel does not reproduce; the trait is non-heritable.',
  },

  // ── Phi Krasue-Vel — curse transmission, not breeding ─────────────────────
  {
    speciesId: 'phi_krasue_vel',
    traitId: 'nocturnal_separation',
    inheritanceMode: 'conversion_only',
    expressionProbability: 0.15,
    notes:
      'Nocturnal separation is transmitted via curse, not biological reproduction. ' +
      'A victim drained below 0.1 health has a 15% chance to incubate the curse ' +
      '(500-tick incubation). Expression probability reflects the curse transmission chance ' +
      'from genome_flags.curse_transmission_chance.',
  },
  {
    speciesId: 'phi_krasue_vel',
    traitId: 'visceral_predation',
    inheritanceMode: 'conversion_only',
    expressionProbability: 0.15,
    notes:
      'Visceral predation is acquired as part of the full Phi Krasue curse package. ' +
      'New Phi Krasue produced by curse inherit the complete trait set at conversion.',
  },
  {
    speciesId: 'phi_krasue_vel',
    traitId: 'neck_seal_vulnerability',
    inheritanceMode: 'conversion_only',
    expressionProbability: 0.15,
    notes:
      'The neck seal vulnerability is structurally inseparable from nocturnal separation. ' +
      'All curse-converted Phi Krasue inherit it as part of the separation mechanic.',
  },

  // ── Jenglot-Kin — ageless, no biological reproduction ─────────────────────
  {
    speciesId: 'jenglot_kin',
    traitId: 'keeper_bond',
    inheritanceMode: 'non_heritable',
    expressionProbability: 0,
    notes:
      'The keeper bond is a relational state, not a heritable genetic trait. ' +
      'Jenglot-Kin are ageless and produce no offspring; bond capacity does not transfer.',
  },
  {
    speciesId: 'jenglot_kin',
    traitId: 'blood_tithe',
    inheritanceMode: 'non_heritable',
    expressionProbability: 0,
    notes:
      'Blood tithe is intrinsic to each Jenglot-Kin instance and cannot be transmitted. ' +
      'No reproductive pathway exists for this species.',
  },
  {
    speciesId: 'jenglot_kin',
    traitId: 'feral_feeding',
    inheritanceMode: 'non_heritable',
    expressionProbability: 0,
    notes:
      'Feral feeding is an unbonded operational mode, not a trait with a heritable locus. ' +
      'Jenglot-Kin are ageless and produce no offspring.',
  },

  // ── Yacuruna-Kin — breeds within civilization, also converts surface agents ─
  {
    speciesId: 'yacuruna_kin',
    traitId: 'mirror_realm',
    inheritanceMode: 'mendelian',
    expressionProbability: 0.85,
    notes:
      'Mirror realm capacity is strongly dominant in Yacuruna-Kin lineages. ' +
      'High expression probability (0.85) reflects its near-universal presence ' +
      'in civilizationally-bred offspring. Reduced probability only in backcross edge cases.',
  },
  {
    speciesId: 'yacuruna_kin',
    traitId: 'seductive_enchantment',
    inheritanceMode: 'mendelian',
    expressionProbability: 0.7,
    notes:
      'Seductive enchantment segregates in Yacuruna-Kin breeding populations. ' +
      'Conversion-origin Yacuruna sometimes carry a suppressed form; ' +
      'civilizationally-bred offspring express it at 0.7 probability.',
  },
  {
    speciesId: 'yacuruna_kin',
    traitId: 'crocodile_riders',
    inheritanceMode: 'mendelian',
    expressionProbability: 0.6,
    prerequisiteTraits: ['mirror_realm'],
    notes:
      'Crocodile riding capacity requires mirror realm to be expressed — mounts are ' +
      'domesticated within the sublayer. Offspring who do not express mirror_realm cannot ' +
      'express crocodile_riders regardless of genotype. Expression probability is 0.6 ' +
      'conditional on the prerequisite being met.',
  },

  // ── Yara-ma-yha-who-Rin — species conversion only ─────────────────────────
  {
    speciesId: 'yara_ma_yha_who_rin',
    traitId: 'fig_tree_ambush',
    inheritanceMode: 'conversion_only',
    expressionProbability: 1.0,
    notes:
      'Fig tree ambush is expressed in every converted Yara-ma-yha-who-Rin. ' +
      'The tree binding is intrinsic to the species form; conversion produces a fully ' +
      'formed instance. No biological reproduction pathway exists.',
  },
  {
    speciesId: 'yara_ma_yha_who_rin',
    traitId: 'swallow_regurgitate_cycle',
    inheritanceMode: 'conversion_only',
    expressionProbability: 1.0,
    notes:
      'The swallow-regurgitate cycle is how this species reproduces. Every converted ' +
      'instance inherits the complete cycle mechanic automatically — this trait is the ' +
      'mechanism of reproduction itself.',
  },
  {
    speciesId: 'yara_ma_yha_who_rin',
    traitId: 'playing_dead_counter',
    inheritanceMode: 'conversion_only',
    expressionProbability: 1.0,
    notes:
      'The playing dead vulnerability is structurally inseparable from the conversion cycle. ' +
      'All converted Yara-ma-yha-who-Rin express this exploitable behavioral trait. ' +
      'The counter is the complement of the swallow-regurgitate mechanic.',
  },
];

// ============================================================================
// 5. Factory Functions
// ============================================================================

/**
 * Create a fully configured GeneticComponent for a Sprint 16 species.
 * Throws if speciesId is not a known Sprint 16 species.
 */
export function createSprint16Genetics(speciesId: string): GeneticComponent {
  const template = SPRINT16_FOLKLORIST_SPECIES_REGISTRY[speciesId];
  if (!template) {
    throw new Error(
      `[System] createSprint16Genetics: unknown Sprint 16 species ID "${speciesId}". ` +
        `Valid IDs: ${SPRINT16_SPECIES_IDS.join(', ')}`,
    );
  }

  const compatibleSpecies = getSprint16BreedingCompatibility(speciesId);
  const genetics = createDefaultGenetics(speciesId, compatibleSpecies, template.mutationRate);

  const alleles = getSprint16AllelePreset(speciesId);
  if (!alleles) {
    throw new Error(
      `[System] createSprint16Genetics: no allele preset registered for species "${speciesId}"`,
    );
  }

  for (const allele of alleles) {
    genetics.addAllele(allele);
  }

  return genetics;
}

/**
 * Return the GeneticAllele preset for a Sprint 16 species.
 * Returns undefined for unknown species rather than throwing,
 * to allow safe presence checks.
 */
export function getSprint16AllelePreset(speciesId: string): GeneticAllele[] | undefined {
  switch (speciesId) {
    case 'sachamama_vel':
      return SACHAMAMA_VEL_ALLELES;
    case 'phi_krasue_vel':
      return PHI_KRASUE_VEL_ALLELES;
    case 'jenglot_kin':
      return JENGLOT_KIN_ALLELES;
    case 'yacuruna_kin':
      return YACURUNA_KIN_ALLELES;
    case 'yara_ma_yha_who_rin':
      return YARA_MA_YHA_WHO_RIN_ALLELES;
    default:
      return undefined;
  }
}

/**
 * Return all GenomeExtension entries for a Sprint 16 species.
 * Returns an empty array for unknown species.
 */
export function getSprint16GenomeExtensions(speciesId: string): GenomeExtension[] {
  return SPRINT16_GENOME_EXTENSIONS.filter((ext) => ext.speciesId === speciesId);
}

/**
 * Return all TraitInheritanceRule entries for a Sprint 16 species.
 * Returns an empty array for unknown species.
 */
export function getSprint16TraitInheritanceRules(speciesId: string): TraitInheritanceRule[] {
  return SPRINT16_TRAIT_INHERITANCE_RULES.filter((rule) => rule.speciesId === speciesId);
}

/**
 * Return the breeding compatibility list for a Sprint 16 species.
 * Throws if speciesId is not a known Sprint 16 species.
 */
export function getSprint16BreedingCompatibility(speciesId: string): string[] {
  if (!(speciesId in SPRINT16_BREEDING_COMPATIBILITY)) {
    return [];
  }
  return SPRINT16_BREEDING_COMPATIBILITY[speciesId]!;
}

// ============================================================================
// 6. Validation
// ============================================================================

export interface Sprint16GenomeValidationResult {
  speciesId: string;
  valid: boolean;
  issues: string[];
}

/**
 * Validate the genome integration for all Sprint 16 species.
 *
 * Checks:
 * - Allele presets are defined for each species
 * - Breeding compatibility entries exist for each species
 * - All genome_flags referenced in GenomeExtension.governingFlags exist on the species template
 * - All traitIds referenced in inheritance rules exist in the species' innateTraits
 */
export function validateSprint16GenomeIntegration(): Sprint16GenomeValidationResult[] {
  return SPRINT16_SPECIES_IDS.map((speciesId) => {
    const issues: string[] = [];

    // ── Check: allele preset exists ──────────────────────────────────────────
    const alleles = getSprint16AllelePreset(speciesId);
    if (!alleles || alleles.length === 0) {
      issues.push(`No allele preset defined for species "${speciesId}"`);
    }

    // ── Check: breeding compatibility entry exists ───────────────────────────
    if (!(speciesId in SPRINT16_BREEDING_COMPATIBILITY)) {
      issues.push(`No breeding compatibility entry for species "${speciesId}"`);
    }

    // ── Check: genome_flags referenced in extensions exist on template ───────
    const template = SPRINT16_FOLKLORIST_SPECIES_REGISTRY[speciesId];
    if (!template) {
      issues.push(`Species "${speciesId}" not found in SPRINT16_FOLKLORIST_SPECIES_REGISTRY`);
    } else {
      const extensions = getSprint16GenomeExtensions(speciesId);
      for (const ext of extensions) {
        for (const flag of ext.governingFlags) {
          if (!template.genome_flags || !(flag in template.genome_flags)) {
            issues.push(
              `GenomeExtension(${ext.type}) references genome_flag "${flag}" ` +
                `which does not exist on species "${speciesId}"`,
            );
          }
        }
      }

      // ── Check: traitIds in inheritance rules exist in innateTraits ──────────
      const innateTraitIds = new Set(template.innateTraits.map((t) => t.id));
      const inheritanceRules = getSprint16TraitInheritanceRules(speciesId);
      for (const rule of inheritanceRules) {
        if (!innateTraitIds.has(rule.traitId)) {
          issues.push(
            `TraitInheritanceRule references traitId "${rule.traitId}" ` +
              `which is not an innate trait of species "${speciesId}"`,
          );
        }
      }
    }

    return {
      speciesId,
      valid: issues.length === 0,
      issues,
    };
  });
}
