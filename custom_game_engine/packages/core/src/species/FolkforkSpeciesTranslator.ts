/**
 * FolkforkSpeciesTranslator - Genetics Translation Layer
 *
 * Translates SpeciesExchangeV1 JSON data (from the Folkfork cross-game species
 * pipeline) into MVEE's SpeciesTemplate format, and registers imported species
 * in the SPECIES_REGISTRY.
 *
 * Pipeline spec reference: §4 (Physical), §4.3 (Traits), §4.4 (Social),
 * §4.5 (Sapience/Intelligence), §4.6 (Genome flags)
 *
 * NOTE: SpeciesExchangeV1 is declared locally — do NOT import from folkfork-bridge.
 * Same pattern as AlienSpeciesImporter.ts.
 */

import type { SpeciesTemplate } from './SpeciesRegistry.js';
import { SPECIES_REGISTRY } from './SpeciesRegistry.js';
import type { SpeciesTrait } from '../components/SpeciesComponent.js';

// ============================================================================
// SpeciesExchangeV1 Types (locally declared — do not import from folkfork-bridge)
// ============================================================================

type ArchetypeSeed =
  | 'social_generalist'
  | 'territorial_predator'
  | 'collector_engineer'
  | 'knowledge_keeper'
  | 'environmental_adapter'
  | 'trickster'
  | 'guardian'
  | 'parasite_symbiont';

interface MinViableGene {
  traitId: string;
  category: string;
  value: number;
  heritability: number;
}

interface PersonalityExchange {
  curiosity: [number, number];
  empathy: [number, number];
  aggression: [number, number];
  playfulness: [number, number];
  stubbornness: [number, number];
  creativity: [number, number];
  sociability: [number, number];
  courage: [number, number];
}

interface CultureExchange {
  learningRate: [number, number];
  teachingDrive: [number, number];
  traditionAffinity: [number, number];
  innovationRate: [number, number];
}

interface IntelligenceExchange {
  cognitiveCapacity: [number, number];
  learningRate: [number, number];
  abstractionAffinity: [number, number];
  memoryDepth: [number, number];
}

type SizeClass = 'tiny' | 'small' | 'medium' | 'large' | 'huge';

interface LoreExchange {
  epithet: string;
  creationMyth?: string;
  culturalPractices: string[];
  languagePattern?: string;
  folkloreTradition?: string;
}

interface SensitivityFlags {
  livingTradition: boolean;
  sourceAttribution: string;
  sensitivityNotes?: string;
  consultationStatus?: string;
}

interface SpeciesProvenance {
  sourceGame: string;
  sourceGameVersion: string;
  exportedAt: string;
  exporterVersion: string;
  waveUnlocked: number;
  checksum: string;
}

export interface SpeciesExchangeV1 {
  formatVersion: '1.0.0' | '0.1.0';
  speciesId: string;
  speciesName: string;
  commonName?: string;
  archetypeSeed: ArchetypeSeed;
  ecologicalRole: string;
  dietType: 'herbivore' | 'carnivore' | 'omnivore';
  homeBiome: string;
  minViableGenes: MinViableGene[];
  personalityRanges: PersonalityExchange;
  cultureRanges: CultureExchange;
  intelligenceRanges: IntelligenceExchange;
  mutationRate?: number;
  compatibleSpecies?: string[];
  visualTokens: { sizeClass: SizeClass; bodyPlan: string; [key: string]: unknown };
  lore: LoreExchange;
  sensitivity: SensitivityFlags;
  provenance: SpeciesProvenance;
}

// ============================================================================
// Pure helper functions
// ============================================================================

function midpoint(range: [number, number]): number {
  return (range[0] + range[1]) / 2;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ============================================================================
// Lookup tables (pipeline spec §4.2)
// ============================================================================

const SPECIES_HEIGHT_SCALE: Record<SizeClass, number> = {
  tiny: 30,
  small: 80,
  medium: 160,
  large: 250,
  huge: 500,
};

const BODY_PLAN_DENSITY: Record<string, number> = {
  bipedal: 0.45,
  quadruped: 0.55,
  serpentine: 0.35,
  avian: 0.25,
  amorphous: 0.40,
  insectoid: 0.30,
  aquatic: 0.50,
};

const GESTATION_BY_SIZE: Record<SizeClass, number> = {
  tiny: 5,
  small: 10,
  medium: 20,
  large: 30,
  huge: 60,
};

const BASE_LIFESPAN_BY_SIZE: Record<SizeClass, number> = {
  tiny: 20,
  small: 40,
  medium: 80,
  large: 150,
  huge: 300,
};

const BODY_PLAN_ID_MAP: Record<string, string> = {
  bipedal: 'humanoid_standard',
  quadruped: 'quadruped_standard',
  serpentine: 'serpentine_standard',
  avian: 'avian_standard',
  amorphous: 'amorphous_standard',
  insectoid: 'insectoid_4arm',
  aquatic: 'aquatic_tentacled',
};

// ============================================================================
// Private derivation helpers
// ============================================================================

function deriveLifespanType(lifespan: number): 'mortal' | 'long_lived' | 'ageless' | 'immortal' {
  if (lifespan < 200) return 'mortal';
  if (lifespan < 1000) return 'long_lived';
  if (lifespan < 10000) return 'ageless';
  return 'immortal';
}

function deriveInnateTraits(
  personality: PersonalityExchange,
  intelligence: IntelligenceExchange,
): SpeciesTrait[] {
  const traits: SpeciesTrait[] = [];

  if (midpoint(personality.aggression) > 0.7) {
    traits.push({
      id: 'aggressive',
      name: 'Aggressive',
      description: 'Naturally combative',
      category: 'social',
      skillBonus: { combat: 0.2 },
    });
  }

  if (midpoint(personality.curiosity) > 0.7) {
    traits.push({
      id: 'curious',
      name: 'Curious',
      description: 'Driven to explore',
      category: 'social',
      skillBonus: { research: 0.2 },
    });
  }

  if (midpoint(personality.empathy) > 0.7) {
    traits.push({
      id: 'empathic',
      name: 'Empathic',
      description: 'Deeply attuned to others',
      category: 'social',
      skillBonus: { diplomacy: 0.2 },
    });
  }

  if (midpoint(personality.sociability) > 0.7) {
    traits.push({
      id: 'gregarious',
      name: 'Gregarious',
      description: 'Thrives in groups',
      category: 'social',
      needsModifier: { loneliness: 1.5 },
    });
  }

  if (midpoint(personality.courage) > 0.7) {
    traits.push({
      id: 'brave',
      name: 'Brave',
      description: 'Fearless in danger',
      category: 'social',
      skillBonus: { exploration: 0.15 },
    });
  }

  if (midpoint(personality.creativity) > 0.7) {
    traits.push({
      id: 'creative',
      name: 'Creative',
      description: 'Inventive and artistic',
      category: 'social',
      skillBonus: { crafting: 0.15 },
    });
  }

  // Intelligence-derived traits (§4.5)
  if (midpoint(intelligence.abstractionAffinity) > 0.7) {
    traits.push({
      id: 'spirit_sight',
      name: 'Spirit Sight',
      description: 'Can perceive spiritual realm',
      category: 'spiritual',
      abilitiesGranted: ['spirit_sight'],
    });
  }

  if (midpoint(intelligence.memoryDepth) > 0.7) {
    traits.push({
      id: 'ancestral_memory',
      name: 'Ancestral Memory',
      description: 'Carries memories of ancestors',
      category: 'spiritual',
      abilitiesGranted: ['ancestral_memory'],
    });
  }

  return traits;
}

function deriveSocialStructure(culture: CultureExchange): string {
  const scores: Record<string, number> = {
    traditionAffinity: midpoint(culture.traditionAffinity),
    innovationRate: midpoint(culture.innovationRate),
    teachingDrive: midpoint(culture.teachingDrive),
    learningRate: midpoint(culture.learningRate),
  };

  const keys = Object.keys(scores);
  const sorted = keys.slice().sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
  const highest = sorted[0] ?? '';
  const secondHighest = sorted[1] ?? '';

  const DOMINANCE_THRESHOLD = 0.15;
  const isDominant = (scores[highest] ?? 0) - (scores[secondHighest] ?? 0) > DOMINANCE_THRESHOLD;

  if (!isDominant) return 'communal_balanced';

  switch (highest) {
    case 'traditionAffinity': return 'hierarchical_traditional';
    case 'innovationRate': return 'egalitarian_innovative';
    case 'teachingDrive': return 'mentor_apprentice';
    case 'learningRate': return 'adaptive_nomadic';
    default: return 'communal_balanced';
  }
}

function deriveTerritoryFocus(archetypeSeed: ArchetypeSeed): [number, number] {
  switch (archetypeSeed) {
    case 'territorial_predator':
    case 'guardian':
      return [0.6, 0.9];
    case 'social_generalist':
    case 'environmental_adapter':
      return [0.1, 0.4];
    default:
      return [0.3, 0.6];
  }
}

function deriveGenomeFlags(
  personality: PersonalityExchange,
  culture: CultureExchange,
  archetypeSeed: ArchetypeSeed,
): Record<string, [number, number]> {
  const social_orientation: [number, number] = [
    clamp01((personality.sociability[0] + personality.empathy[0]) / 2),
    clamp01((personality.sociability[1] + personality.empathy[1]) / 2),
  ];

  const combat_readiness: [number, number] = [
    clamp01((personality.aggression[0] + personality.courage[0]) / 2),
    clamp01((personality.aggression[1] + personality.courage[1]) / 2),
  ];

  const craft_focus: [number, number] = [
    clamp01((personality.creativity[0] + culture.innovationRate[0]) / 2),
    clamp01((personality.creativity[1] + culture.innovationRate[1]) / 2),
  ];

  const patience: [number, number] = [
    clamp01(1 - (personality.playfulness[1] + personality.stubbornness[1]) / 2),
    clamp01(1 - (personality.playfulness[0] + personality.stubbornness[0]) / 2),
  ];

  const curiosity: [number, number] = [
    personality.curiosity[0],
    personality.curiosity[1],
  ];

  const territory_focus = deriveTerritoryFocus(archetypeSeed);

  const independence: [number, number] = [
    clamp01(1 - (personality.sociability[1] + culture.traditionAffinity[1]) / 2),
    clamp01(1 - (personality.sociability[0] + culture.traditionAffinity[0]) / 2),
  ];

  return {
    social_orientation,
    combat_readiness,
    craft_focus,
    patience,
    curiosity,
    territory_focus,
    independence,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Pure function: translate a SpeciesExchangeV1 payload into an MVEE SpeciesTemplate.
 * No I/O; does not mutate SPECIES_REGISTRY.
 */
export function translateToSpeciesTemplate(exchange: SpeciesExchangeV1): SpeciesTemplate {
  const { visualTokens, personalityRanges, cultureRanges, intelligenceRanges, lore } = exchange;

  const sizeClass = visualTokens.sizeClass;
  const bodyPlan = visualTokens.bodyPlan;

  // Physical stats (§4.2)
  const averageHeight = SPECIES_HEIGHT_SCALE[sizeClass];
  const density = BODY_PLAN_DENSITY[bodyPlan] ?? 0.45;
  const averageWeight = averageHeight * density;
  const gestationPeriod = GESTATION_BY_SIZE[sizeClass];

  // Lifespan
  const lifespan = BASE_LIFESPAN_BY_SIZE[sizeClass];
  const lifespanType = deriveLifespanType(lifespan);
  const maturityAge = lifespan * 0.15 * (1 + midpoint(intelligenceRanges.cognitiveCapacity));

  // Body plan mapping
  const bodyPlanId = BODY_PLAN_ID_MAP[bodyPlan] ?? 'humanoid_standard';

  // Traits (§4.3, §4.5)
  const innateTraits = deriveInnateTraits(personalityRanges, intelligenceRanges);

  // Social structure (§4.4)
  const socialStructure = deriveSocialStructure(cultureRanges);

  // Sapience (§4.5)
  const sapient = midpoint(intelligenceRanges.cognitiveCapacity) > 0.6;

  // Genetics
  const mutationRate = exchange.mutationRate ?? 0.01;
  const compatibleSpecies = exchange.compatibleSpecies ?? [];

  // Cross-game genome flags (§4.6)
  const genome_flags = deriveGenomeFlags(personalityRanges, cultureRanges, exchange.archetypeSeed);

  const template: SpeciesTemplate = {
    speciesId: `folkfork_${exchange.speciesId}`,
    speciesName: exchange.speciesName,
    commonName: exchange.commonName ?? exchange.speciesName,
    description: `${lore.epithet}. Arrived via Folkfork from Precursors.`,
    bodyPlanId,

    innateTraits,

    compatibleSpecies,
    mutationRate,

    averageHeight,
    averageWeight,
    sizeCategory: sizeClass,

    lifespan,
    lifespanType,
    maturityAge,
    gestationPeriod,

    sapient,
    socialStructure,

    cross_game_compatible: true,
    native_game: 'precursors',
    traveler_epithet: lore.epithet,
    genome_flags,

    precursors_lineage: {
      precursors_species_id: exchange.speciesId,
      emergence_band: 'mid_rim',
      sapience_date: 'folkfork_imported',
      chorus_connection: lore.folkloreTradition ?? 'unknown',
    },
  };

  return template;
}

/**
 * Translate and register a Folkfork species into SPECIES_REGISTRY.
 * Returns the registered SpeciesTemplate.
 */
export function registerFolkforkSpecies(exchange: SpeciesExchangeV1): SpeciesTemplate {
  const template = translateToSpeciesTemplate(exchange);
  SPECIES_REGISTRY[template.speciesId] = template;
  return template;
}

/**
 * Check whether a species (by its source speciesId) has already been imported.
 */
export function isSpeciesImported(speciesId: string): boolean {
  return `folkfork_${speciesId}` in SPECIES_REGISTRY;
}
