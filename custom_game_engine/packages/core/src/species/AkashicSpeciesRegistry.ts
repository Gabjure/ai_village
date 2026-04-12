/**
 * AkashicSpeciesRegistry — Canonical Akashic Records species for Precursors
 *
 * Registers all canonical species from the Akashic Records into SPECIES_REGISTRY.
 * Call registerAkashicSpecies() once at startup (or import for side effects).
 *
 * Wave groupings:
 *   Original Five (Urd Prime) — core progenitor species
 *   Wave 1 (Primal)
 *   Wave 2 (Awakened)
 *   Wave 3 (Spoken)
 *   Wave 4 (Learned)
 *   Wave 5 (Enlightened)
 *   Ambient
 */

import {
  registerSpecies,
  TRAIT_ADAPTABLE,
  TRAIT_KEEN_SENSES,
  TRAIT_AGELESS,
  TRAIT_STURDY,
} from './SpeciesRegistry.js';
import type { SpeciesTemplate } from './SpeciesRegistry.js';
import type { SpeciesTrait } from '../components/SpeciesComponent.js';

// ============================================================================
// Akashic Traits
// ============================================================================

const TRAIT_CHORUS_ATTUNED: SpeciesTrait = {
  id: 'chorus_attuned',
  name: 'Chorus Attuned',
  description: 'Innate sensitivity to the Chorus — the living signal that connects all species',
  category: 'spiritual',
  skillBonus: { empathy: 0.2, perception: 0.1 },
  abilitiesGranted: ['chorus_sense'],
};

const TRAIT_FUNGAL_NETWORK: SpeciesTrait = {
  id: 'fungal_network',
  name: 'Fungal Network',
  description: 'Distributed mycorrhizal intelligence, not individually sapient',
  category: 'metabolic',
  skillBonus: { foraging: 0.4 },
  abilitiesGranted: ['network_communication', 'spore_dispersion'],
};

const TRAIT_LONG_MEMORY: SpeciesTrait = {
  id: 'long_memory',
  name: 'Long Memory',
  description: 'Exceptional recall spanning generations; wisdom accumulates',
  category: 'social',
  skillBonus: { lore: 0.3, diplomacy: 0.15 },
};

const TRAIT_SHEE_DESIGNED: SpeciesTrait = {
  id: 'shee_designed',
  name: 'Engineered',
  description: 'Genetically engineered by ancient architects; carries designed traits and potential',
  category: 'physical',
  skillBonus: { adaptability: 0.2 },
};

const TRAIT_PACK_HUNTER: SpeciesTrait = {
  id: 'pack_hunter',
  name: 'Pack Hunter',
  description: 'Coordinates with others during hunts; bonuses in groups',
  category: 'social',
  skillBonus: { combat: 0.15, coordination: 0.25 },
  abilitiesGranted: ['pack_tactics'],
};

const TRAIT_APEX_PREDATOR: SpeciesTrait = {
  id: 'apex_predator',
  name: 'Apex Predator',
  description: 'Sits at the top of the food web; projects dominance',
  category: 'physical',
  skillBonus: { combat: 0.3, intimidation: 0.2 },
  abilitiesGranted: ['predator_stare'],
};

const TRAIT_MUTUALIST_BOND: SpeciesTrait = {
  id: 'mutualist_bond',
  name: 'Mutualist Bond',
  description: 'Forms deep cooperative relationships with other species',
  category: 'social',
  skillBonus: { diplomacy: 0.25, taming: 0.3 },
  abilitiesGranted: ['species_bond'],
};

const TRAIT_PARASITIC_DRAIN: SpeciesTrait = {
  id: 'parasitic_drain',
  name: 'Parasitic Drain',
  description: 'Siphons energy or nutrients from host organisms',
  category: 'metabolic',
  skillBonus: { stealth: 0.2 },
  abilitiesGranted: ['energy_drain'],
};

const TRAIT_BIOLUMINESCENT: SpeciesTrait = {
  id: 'bioluminescent',
  name: 'Bioluminescent',
  description: 'Produces natural light; useful for signalling and luring',
  category: 'physical',
  abilitiesGranted: ['natural_light', 'light_signal'],
};

const TRAIT_DREAM_WEAVER: SpeciesTrait = {
  id: 'dream_weaver',
  name: 'Dream Weaver',
  description: 'Can influence or enter the dreamscapes of sleeping beings',
  category: 'spiritual',
  skillBonus: { persuasion: 0.2 },
  abilitiesGranted: ['dream_entry', 'dream_influence'],
};

const TRAIT_AQUATIC_ADAPTED: SpeciesTrait = {
  id: 'aquatic_adapted',
  name: 'Aquatic Adapted',
  description: 'Fully adapted to aquatic environments; moves easily in water',
  category: 'physical',
  skillBonus: { swimming: 0.5 },
  abilitiesGranted: ['water_breathing', 'deep_dive'],
};

const TRAIT_WEB_SPINNER: SpeciesTrait = {
  id: 'web_spinner',
  name: 'Web Spinner',
  description: 'Produces and manipulates fibrous webs for trapping and construction',
  category: 'physical',
  skillBonus: { crafting: 0.2, trapping: 0.3 },
  abilitiesGranted: ['spin_web'],
};

const TRAIT_VOID_TOUCHED: SpeciesTrait = {
  id: 'void_touched',
  name: 'Void Touched',
  description: 'Carries trace resonance from the Void; resists entropy effects',
  category: 'spiritual',
  skillBonus: { endurance: 0.15 },
  abilitiesGranted: ['void_resistance'],
};

const TRAIT_WINGED_FLIGHT: SpeciesTrait = {
  id: 'winged_flight',
  name: 'Winged Flight',
  description: 'Natural wings grant sustained flight',
  category: 'physical',
  abilitiesGranted: ['flight', 'aerial_strike'],
};

const TRAIT_SERPENTINE_GRACE: SpeciesTrait = {
  id: 'serpentine_grace',
  name: 'Serpentine Grace',
  description: 'Sinuous movement; excellent at squeezing through narrow spaces',
  category: 'physical',
  skillBonus: { stealth: 0.2, acrobatics: 0.25 },
  abilitiesGranted: ['constrict', 'squeeze'],
};

const TRAIT_SHAPESHIFTING: SpeciesTrait = {
  id: 'shapeshifting',
  name: 'Shapeshifting',
  description: 'Can alter physical form at will, within certain limits',
  category: 'magical',
  abilitiesGranted: ['minor_shapeshift', 'form_adaptation'],
};

const TRAIT_TRICKSTER_MIND: SpeciesTrait = {
  id: 'trickster_mind',
  name: 'Trickster Mind',
  description: 'Lateral thinking and deception; masters of misdirection',
  category: 'social',
  skillBonus: { deception: 0.3, creativity: 0.2 },
  abilitiesGranted: ['misdirect'],
};

const TRAIT_FOREST_BOND: SpeciesTrait = {
  id: 'forest_bond',
  name: 'Forest Bond',
  description: 'Deep connection to forest ecosystems; reads the land',
  category: 'spiritual',
  skillBonus: { foraging: 0.3, tracking: 0.25 },
  abilitiesGranted: ['forest_sense'],
};

const TRAIT_STORM_AFFINITY: SpeciesTrait = {
  id: 'storm_affinity',
  name: 'Storm Affinity',
  description: 'Attuned to wind and storm energy; moves with weather patterns',
  category: 'magical',
  skillBonus: { navigation: 0.2 },
  abilitiesGranted: ['weather_sense', 'wind_step'],
};

const TRAIT_WATER_AFFINITY: SpeciesTrait = {
  id: 'water_affinity',
  name: 'Water Affinity',
  description: 'Deep connection to water in all its forms',
  category: 'spiritual',
  skillBonus: { swimming: 0.3, herbalism: 0.15 },
  abilitiesGranted: ['water_sense'],
};

const TRAIT_ANCESTRAL_ECHO: SpeciesTrait = {
  id: 'ancestral_echo',
  name: 'Ancestral Echo',
  description: 'Can commune with or channel ancestral spirits',
  category: 'spiritual',
  skillBonus: { lore: 0.25, diplomacy: 0.1 },
  abilitiesGranted: ['spirit_commune'],
};

const TRAIT_SHELL_ARMOR: SpeciesTrait = {
  id: 'shell_armor',
  name: 'Shell Armor',
  description: 'Hard protective shell or carapace',
  category: 'physical',
  abilitiesGranted: ['natural_armor', 'shell_retreat'],
};

const TRAIT_PHANTOM_FORM: SpeciesTrait = {
  id: 'phantom_form',
  name: 'Phantom Form',
  description: 'Semi-corporeal; can phase partially through solid matter',
  category: 'magical',
  abilitiesGranted: ['phase_shift', 'incorporeal_move'],
};

const TRAIT_COLOSSAL_PRESENCE: SpeciesTrait = {
  id: 'colossal_presence',
  name: 'Colossal Presence',
  description: 'Enormous size commands the landscape; inspires awe or dread',
  category: 'physical',
  skillBonus: { intimidation: 0.4 },
  abilitiesGranted: ['tremor_step', 'area_presence'],
};

// ============================================================================
// Original Five (Urd Prime)
// ============================================================================

const NORN_SPECIES: SpeciesTemplate = {
  speciesId: 'norn',
  speciesName: 'Norn',
  commonName: 'Norn',
  description: 'Small social creatures designed as companions by ancient engineers; curious and highly adaptable',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_SHEE_DESIGNED, TRAIT_CHORUS_ATTUNED],
  compatibleSpecies: ['grendel', 'ettin'],
  mutationRate: 0.02,
  averageHeight: 90,
  averageWeight: 25,
  sizeCategory: 'small',
  lifespan: 80,
  lifespanType: 'long_lived',
  maturityAge: 5,
  gestationPeriod: 30,
  sapient: true,
  socialStructure: 'communal',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'omnivore',
    biomePreferences: ['grassland', 'forest', 'garden'],
    socialStructure: 'communal',
    activityPattern: 'diurnal',
  },
};

const GRENDEL_SPECIES: SpeciesTemplate = {
  speciesId: 'grendel',
  speciesName: 'Grendel',
  commonName: 'Grendel',
  description: 'Medium humanoid secondary consumers; evolved independently on Urd Prime before the architects arrived, territorial and predatory',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_PACK_HUNTER, TRAIT_KEEN_SENSES],
  compatibleSpecies: ['norn'],
  mutationRate: 0.018,
  averageHeight: 165,
  averageWeight: 70,
  sizeCategory: 'medium',
  lifespan: 120,
  lifespanType: 'long_lived',
  maturityAge: 12,
  gestationPeriod: 60,
  sapient: true,
  socialStructure: 'tribal',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'secondary_consumer',
    diet: 'carnivore',
    biomePreferences: ['swamp', 'jungle', 'cave'],
    socialStructure: 'tribal',
    activityPattern: 'nocturnal',
  },
};

const ETTIN_SPECIES: SpeciesTemplate = {
  speciesId: 'ettin',
  speciesName: 'Ettin',
  commonName: 'Ettin',
  description: 'Large mutualist humanoids; generation-ship migrants from Kemm-Vor, gentle engineers who form bonds with their ecosystem',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_MUTUALIST_BOND, TRAIT_STURDY, TRAIT_LONG_MEMORY],
  compatibleSpecies: ['norn'],
  mutationRate: 0.012,
  averageHeight: 220,
  averageWeight: 160,
  sizeCategory: 'large',
  lifespan: 200,
  lifespanType: 'long_lived',
  maturityAge: 20,
  gestationPeriod: 90,
  sapient: true,
  socialStructure: 'family_units',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'mutualist',
    diet: 'omnivore',
    biomePreferences: ['plains', 'temperate_forest', 'coast'],
    socialStructure: 'family_units',
    activityPattern: 'diurnal',
  },
};

const SHEE_SPECIES: SpeciesTemplate = {
  speciesId: 'shee',
  speciesName: 'Shee',
  commonName: 'Shee',
  description: 'The ancient architects of life; immortal engineers who seeded worlds with designed species',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_AGELESS, TRAIT_CHORUS_ATTUNED, TRAIT_LONG_MEMORY],
  compatibleSpecies: [],
  mutationRate: 0.0,
  averageHeight: 175,
  averageWeight: 65,
  sizeCategory: 'medium',
  lifespan: 0,
  lifespanType: 'immortal',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'research_collectives',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'omnivore',
    biomePreferences: ['any'],
    socialStructure: 'research_collectives',
    activityPattern: 'diurnal',
  },
};

const MYCON_SPECIES: SpeciesTemplate = {
  speciesId: 'mycon',
  speciesName: 'Mycon',
  commonName: 'Mycon',
  description: 'Distributed fungal network; decomposes and recycles organic material across vast areas',
  bodyPlanId: 'amorphous',
  innateTraits: [TRAIT_FUNGAL_NETWORK],
  compatibleSpecies: [],
  mutationRate: 0.03,
  averageHeight: 30,
  averageWeight: 3,
  sizeCategory: 'small',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 1,
  gestationPeriod: 7,
  sapient: false,
  socialStructure: 'distributed_network',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'decomposer',
    diet: 'detritivore',
    biomePreferences: ['forest', 'cave', 'swamp'],
    socialStructure: 'distributed_network',
    activityPattern: 'continuous',
  },
};

// ============================================================================
// Wave 1 — Primal
// ============================================================================

const VENTHARI_SPECIES: SpeciesTemplate = {
  speciesId: 'venthari',
  speciesName: 'Ven\'thari',
  commonName: 'Ven\'thari',
  description: 'Large quadruped secondary consumers; cave predators from the dying geothermal world Keth-Ra, pack-coordinated hunters',
  bodyPlanId: 'quadruped',
  innateTraits: [TRAIT_PACK_HUNTER, TRAIT_KEEN_SENSES],
  compatibleSpecies: [],
  mutationRate: 0.022,
  averageHeight: 210,
  averageWeight: 180,
  sizeCategory: 'large',
  lifespan: 60,
  lifespanType: 'mortal',
  maturityAge: 6,
  gestationPeriod: 120,
  sapient: true,
  socialStructure: 'pack',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'secondary_consumer',
    diet: 'carnivore',
    biomePreferences: ['cave', 'geothermal', 'deep_underground'],
    socialStructure: 'pack',
    activityPattern: 'crepuscular',
  },
};

const CHER_KHAN_SPECIES: SpeciesTemplate = {
  speciesId: 'cher_khan',
  speciesName: 'Cher-Khan',
  commonName: 'Cher-Khan',
  description: 'Threshold guardians of biome boundaries; facilitate biome crossing via biochemical broadcast, aggression 0.05',
  bodyPlanId: 'quadruped',
  innateTraits: [TRAIT_MUTUALIST_BOND, TRAIT_KEEN_SENSES],
  compatibleSpecies: [],
  mutationRate: 0.015,
  averageHeight: 230,
  averageWeight: 220,
  sizeCategory: 'large',
  lifespan: 80,
  lifespanType: 'long_lived',
  maturityAge: 10,
  gestationPeriod: 150,
  sapient: true,
  socialStructure: 'solitary',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'carnivore',
    biomePreferences: ['jungle', 'mountain', 'tundra'],
    socialStructure: 'solitary',
    activityPattern: 'nocturnal',
  },
};

const TIKBALI_SPECIES: SpeciesTemplate = {
  speciesId: 'tikbali',
  speciesName: 'Tikbali',
  commonName: 'Tikbali',
  description: 'Large humanoid mutualists; mediators and bridge-builders between species communities',
  bodyPlanId: 'quadruped',
  innateTraits: [TRAIT_MUTUALIST_BOND, TRAIT_LONG_MEMORY],
  compatibleSpecies: ['norn', 'ettin'],
  mutationRate: 0.014,
  averageHeight: 250,
  averageWeight: 200,
  sizeCategory: 'large',
  lifespan: 150,
  lifespanType: 'long_lived',
  maturityAge: 18,
  gestationPeriod: 100,
  sapient: true,
  socialStructure: 'council_based',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'mutualist',
    diet: 'omnivore',
    biomePreferences: ['tropical_forest', 'coast', 'river_delta'],
    socialStructure: 'council_based',
    activityPattern: 'diurnal',
  },
};

const ADZEFIRE_SPECIES: SpeciesTemplate = {
  speciesId: 'adzefire',
  speciesName: 'Adzefire',
  commonName: 'Adzefire',
  description: 'Tiny amorphous parasites that feed on bioluminescent energy, drifting on thermals',
  bodyPlanId: 'amorphous',
  innateTraits: [TRAIT_PARASITIC_DRAIN, TRAIT_BIOLUMINESCENT],
  compatibleSpecies: [],
  mutationRate: 0.04,
  averageHeight: 30,
  averageWeight: 2,
  sizeCategory: 'tiny',
  lifespan: 5,
  lifespanType: 'mortal',
  maturityAge: 0,
  gestationPeriod: 3,
  sapient: false,
  socialStructure: 'swarm',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'parasite',
    diet: 'energy_parasite',
    biomePreferences: ['volcanic', 'thermal_vent', 'canopy'],
    socialStructure: 'swarm',
    activityPattern: 'continuous',
  },
};

const AHUIZARI_SPECIES: SpeciesTemplate = {
  speciesId: 'ahuizari',
  speciesName: 'Ahuizari',
  commonName: 'Ahuizari',
  description: 'Small aquatic-adjacent quadrupeds; stealthy riverine hunters with prehensile tails',
  bodyPlanId: 'quadruped',
  innateTraits: [TRAIT_WATER_AFFINITY, TRAIT_KEEN_SENSES],
  compatibleSpecies: [],
  mutationRate: 0.02,
  averageHeight: 80,
  averageWeight: 25,
  sizeCategory: 'small',
  lifespan: 40,
  lifespanType: 'mortal',
  maturityAge: 4,
  gestationPeriod: 45,
  sapient: true,
  socialStructure: 'small_family_groups',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'secondary_consumer',
    diet: 'piscivore',
    biomePreferences: ['river', 'lake', 'wetland'],
    socialStructure: 'small_family_groups',
    activityPattern: 'crepuscular',
  },
};

// ============================================================================
// Wave 2 — Awakened
// ============================================================================

const NYK_SPECIES: SpeciesTemplate = {
  speciesId: 'nyk',
  speciesName: 'Nyk',
  commonName: 'Nyk',
  description: 'Small humanoids awakened through contact with latent ancient technology; quick and inventive',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_ADAPTABLE, TRAIT_TRICKSTER_MIND],
  compatibleSpecies: ['norn'],
  mutationRate: 0.025,
  averageHeight: 85,
  averageWeight: 20,
  sizeCategory: 'small',
  lifespan: 60,
  lifespanType: 'long_lived',
  maturityAge: 6,
  gestationPeriod: 28,
  sapient: true,
  socialStructure: 'guild_based',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'mutualist',
    diet: 'omnivore',
    biomePreferences: ['ruins', 'forest_edge', 'underground'],
    socialStructure: 'guild_based',
    activityPattern: 'diurnal',
  },
};

const RUSALYN_SPECIES: SpeciesTemplate = {
  speciesId: 'rusalyn',
  speciesName: 'Rusalyn',
  commonName: 'Rusalyn',
  description: 'Medium water-spirit humanoids; empathic listeners who mirror the emotional states of those nearby',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_WATER_AFFINITY, TRAIT_CHORUS_ATTUNED],
  compatibleSpecies: ['norn', 'nommo'],
  mutationRate: 0.015,
  averageHeight: 165,
  averageWeight: 55,
  sizeCategory: 'medium',
  lifespan: 200,
  lifespanType: 'long_lived',
  maturityAge: 20,
  gestationPeriod: 60,
  sapient: true,
  socialStructure: 'river_communities',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'mutualist',
    diet: 'omnivore',
    biomePreferences: ['river', 'lake', 'coastal_forest'],
    socialStructure: 'river_communities',
    activityPattern: 'crepuscular',
  },
};

const AUKI_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'auki_vel',
  speciesName: 'Auki-Vel',
  commonName: 'Auki-Vel',
  description: 'Huge mountain-sessile sages; one per peak for millions of years, mineral metabolism, geological patience',
  bodyPlanId: 'quadruped',
  innateTraits: [TRAIT_COLOSSAL_PRESENCE, TRAIT_LONG_MEMORY],
  compatibleSpecies: [],
  mutationRate: 0.008,
  averageHeight: 500,
  averageWeight: 1200,
  sizeCategory: 'huge',
  lifespan: 500,
  lifespanType: 'long_lived',
  maturityAge: 50,
  gestationPeriod: 365,
  sapient: true,
  socialStructure: 'solitary_sessile',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'mineral_metabolism',
    biomePreferences: ['mountain_peak', 'alpine', 'highland'],
    socialStructure: 'solitary_sessile',
    activityPattern: 'diurnal',
  },
};

const PATUPAIAREHE_SPECIES: SpeciesTemplate = {
  speciesId: 'patupaiarehe',
  speciesName: 'Patupaiarehe',
  commonName: 'Patupaiarehe',
  description: 'Small fair-skinned humanoids of mist and song; their music carries encoded knowledge',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_CHORUS_ATTUNED, TRAIT_LONG_MEMORY],
  compatibleSpecies: ['norn', 'rusalyn'],
  mutationRate: 0.012,
  averageHeight: 95,
  averageWeight: 28,
  sizeCategory: 'small',
  lifespan: 300,
  lifespanType: 'long_lived',
  maturityAge: 25,
  gestationPeriod: 45,
  sapient: true,
  socialStructure: 'song_circles',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'cultural_keystone',
    diet: 'omnivore',
    biomePreferences: ['misty_forest', 'highland', 'waterfall_zones'],
    socialStructure: 'song_circles',
    activityPattern: 'nocturnal',
  },
};

const DUPPY_SPECIES: SpeciesTemplate = {
  speciesId: 'duppy',
  speciesName: 'Duppy',
  commonName: 'Duppy',
  description: 'Tiny amorphous spirit-remnants; mischievous echoes of deceased entities bound to locations',
  bodyPlanId: 'amorphous',
  innateTraits: [TRAIT_PHANTOM_FORM, TRAIT_TRICKSTER_MIND],
  compatibleSpecies: [],
  mutationRate: 0.0,
  averageHeight: 40,
  averageWeight: 1,
  sizeCategory: 'tiny',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'spiritual_remnant',
    diet: 'none',
    biomePreferences: ['ruins', 'cemetery', 'liminal_spaces'],
    socialStructure: 'solitary',
    activityPattern: 'nocturnal',
  },
};

const ALFAR_SPECIES: SpeciesTemplate = {
  speciesId: 'alfar',
  speciesName: 'Álfar',
  commonName: 'Álfar',
  description: 'Small empathic humanoids whose elevated oxytocin overflows outward, shifting the emotions of those nearby; they carry songs, rituals, and stories between species as sacred duty',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_SHEE_DESIGNED, TRAIT_CHORUS_ATTUNED, TRAIT_LONG_MEMORY],
  compatibleSpecies: ['norn', 'mycon', 'rusalyn', 'patupaiarehe'],
  mutationRate: 0.015,
  averageHeight: 95,
  averageWeight: 27,
  sizeCategory: 'small',
  lifespan: 150,
  lifespanType: 'long_lived',
  maturityAge: 10,
  gestationPeriod: 35,
  sapient: true,
  socialStructure: 'song_circles',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'cultural_keystone',
    diet: 'herbivore',
    biomePreferences: ['verdant_shelf', 'forest', 'garden', 'grassland'],
    socialStructure: 'song_circles',
    activityPattern: 'diurnal',
  },
};

// ============================================================================
// Wave 3 — Spoken
// ============================================================================

const NOMMO_SPECIES: SpeciesTemplate = {
  speciesId: 'nommo',
  speciesName: 'Nommo',
  commonName: 'Nommo',
  description: 'Medium aquatic-tentacled beings; ancient oral historians who carry entire civilizational memories',
  bodyPlanId: 'aquatic_tentacled',
  innateTraits: [TRAIT_AQUATIC_ADAPTED, TRAIT_LONG_MEMORY, TRAIT_CHORUS_ATTUNED],
  compatibleSpecies: ['rusalyn', 'selkieborn'],
  mutationRate: 0.01,
  averageHeight: 160,
  averageWeight: 70,
  sizeCategory: 'medium',
  lifespan: 600,
  lifespanType: 'long_lived',
  maturityAge: 40,
  gestationPeriod: 180,
  sapient: true,
  socialStructure: 'oral_tradition_councils',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'cultural_keystone',
    diet: 'omnivore',
    biomePreferences: ['deep_ocean', 'river_delta', 'tidal_cave'],
    socialStructure: 'oral_tradition_councils',
    activityPattern: 'continuous',
  },
};

const KELPATHI_SPECIES: SpeciesTemplate = {
  speciesId: 'kelpathi',
  speciesName: 'Kelpathi',
  commonName: 'Kelpathi',
  description: 'Large aquatic ambush predators; lure prey with equine silhouette, adhesive dermal secretion bonds on contact, drowns prey',
  bodyPlanId: 'quadruped',
  innateTraits: [TRAIT_WATER_AFFINITY, TRAIT_KEEN_SENSES],
  compatibleSpecies: [],
  mutationRate: 0.016,
  averageHeight: 230,
  averageWeight: 200,
  sizeCategory: 'large',
  lifespan: 120,
  lifespanType: 'long_lived',
  maturityAge: 15,
  gestationPeriod: 180,
  sapient: true,
  socialStructure: 'migratory_pods',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'territorial_predator',
    diet: 'carnivore',
    biomePreferences: ['river', 'estuary', 'coastal'],
    socialStructure: 'migratory_pods',
    activityPattern: 'diurnal',
  },
};

const JOROKAN_SPECIES: SpeciesTemplate = {
  speciesId: 'jorokan',
  speciesName: 'Jorokan',
  commonName: 'Jorokan',
  description: 'Medium insectoid web-spinners; construct vast knowledge repositories in their silk archives',
  bodyPlanId: 'insectoid',
  innateTraits: [TRAIT_WEB_SPINNER, TRAIT_LONG_MEMORY],
  compatibleSpecies: [],
  mutationRate: 0.02,
  averageHeight: 155,
  averageWeight: 55,
  sizeCategory: 'medium',
  lifespan: 150,
  lifespanType: 'long_lived',
  maturityAge: 15,
  gestationPeriod: 90,
  sapient: true,
  socialStructure: 'archive_colonies',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'information_keystone',
    diet: 'carnivore',
    biomePreferences: ['forest_canopy', 'cave', 'ruins'],
    socialStructure: 'archive_colonies',
    activityPattern: 'nocturnal',
  },
};

const EGUNGUN_KIN_SPECIES: SpeciesTemplate = {
  speciesId: 'egungun_kin',
  speciesName: 'Egungun-Kin',
  commonName: 'Egungun-Kin',
  description: 'Medium humanoids who wear the masks of ancestors; conduits between living and dead generations',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_ANCESTRAL_ECHO, TRAIT_CHORUS_ATTUNED],
  compatibleSpecies: ['norn', 'nommo'],
  mutationRate: 0.014,
  averageHeight: 170,
  averageWeight: 65,
  sizeCategory: 'medium',
  lifespan: 120,
  lifespanType: 'long_lived',
  maturityAge: 15,
  gestationPeriod: 60,
  sapient: true,
  socialStructure: 'ancestral_lineages',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'cultural_keystone',
    diet: 'omnivore',
    biomePreferences: ['savanna', 'forest', 'village_settlement'],
    socialStructure: 'ancestral_lineages',
    activityPattern: 'diurnal',
  },
};

const SELKIEBORN_SPECIES: SpeciesTemplate = {
  speciesId: 'selkieborn',
  speciesName: 'Selkie-Born',
  commonName: 'Selkie-Born',
  description: 'Medium seal-form marine beings from Roan-Mor; biological sel-coat enables deep-ocean locomotion, bipedal on land',
  bodyPlanId: 'marine_mammal_dual',
  innateTraits: [TRAIT_AQUATIC_ADAPTED, TRAIT_SHAPESHIFTING],
  compatibleSpecies: ['nommo', 'rusalyn'],
  mutationRate: 0.018,
  averageHeight: 165,
  averageWeight: 65,
  sizeCategory: 'medium',
  lifespan: 180,
  lifespanType: 'long_lived',
  maturityAge: 18,
  gestationPeriod: 90,
  sapient: true,
  socialStructure: 'coastal_clans',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'omnivore_generalist',
    diet: 'omnivore',
    biomePreferences: ['coast', 'ocean', 'tidal_zone'],
    socialStructure: 'coastal_clans',
    activityPattern: 'tidal_cycle',
  },
};

const BAKU_MA_SPECIES: SpeciesTemplate = {
  speciesId: 'baku_ma',
  speciesName: 'Baku-Ma',
  commonName: 'Baku-Ma',
  description: 'Large quadruped dream-eaters; consume nightmares and psychic residue, stabilizing local consciousness fields',
  bodyPlanId: 'quadruped',
  innateTraits: [TRAIT_DREAM_WEAVER, TRAIT_CHORUS_ATTUNED],
  compatibleSpecies: [],
  mutationRate: 0.012,
  averageHeight: 210,
  averageWeight: 190,
  sizeCategory: 'large',
  lifespan: 300,
  lifespanType: 'long_lived',
  maturityAge: 30,
  gestationPeriod: 180,
  sapient: true,
  socialStructure: 'solitary_wanderers',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'psychic_keystone',
    diet: 'nightmare_matter',
    biomePreferences: ['dreamscape_adjacent', 'liminal_zones', 'settlement_edge'],
    socialStructure: 'solitary_wanderers',
    activityPattern: 'nocturnal',
  },
};

// ============================================================================
// Wave 4 — Learned
// ============================================================================

const KITSURI_SPECIES: SpeciesTemplate = {
  speciesId: 'kitsuri',
  speciesName: 'Kitsuri',
  commonName: 'Kitsuri',
  description: 'Small quadruped fox-like tricksters; polymaths who collect knowledge as treasure',
  bodyPlanId: 'quadruped',
  innateTraits: [TRAIT_TRICKSTER_MIND, TRAIT_SHAPESHIFTING, TRAIT_LONG_MEMORY],
  compatibleSpecies: ['nyk'],
  mutationRate: 0.02,
  averageHeight: 75,
  averageWeight: 18,
  sizeCategory: 'small',
  lifespan: 400,
  lifespanType: 'long_lived',
  maturityAge: 30,
  gestationPeriod: 60,
  sapient: true,
  socialStructure: 'mentor_apprentice_lineages',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'information_keystone',
    diet: 'omnivore',
    biomePreferences: ['forest', 'mountain', 'human_settlements'],
    socialStructure: 'mentor_apprentice_lineages',
    activityPattern: 'crepuscular',
  },
};

const VAASK_SPECIES: SpeciesTemplate = {
  speciesId: 'vaask',
  speciesName: 'Vaask',
  commonName: 'Vaask',
  description: 'Huge avian winged beings; soaring archivists who map the world from above',
  bodyPlanId: 'avian_winged',
  innateTraits: [TRAIT_WINGED_FLIGHT, TRAIT_LONG_MEMORY, TRAIT_KEEN_SENSES],
  compatibleSpecies: [],
  mutationRate: 0.009,
  averageHeight: 450,
  averageWeight: 700,
  sizeCategory: 'huge',
  lifespan: 1000,
  lifespanType: 'long_lived',
  maturityAge: 80,
  gestationPeriod: 180,
  sapient: true,
  socialStructure: 'soaring_councils',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'apex_observer',
    diet: 'carnivore',
    biomePreferences: ['mountain', 'highland', 'thermal_zones'],
    socialStructure: 'soaring_councils',
    activityPattern: 'diurnal',
  },
};

const ANANSI_WEB_SPECIES: SpeciesTemplate = {
  speciesId: 'anansi_web',
  speciesName: 'Anansi-Web',
  commonName: 'Anansi-Web',
  description: 'Small insectoid story-weavers; their web-constructions encode living narratives',
  bodyPlanId: 'insectoid',
  innateTraits: [TRAIT_WEB_SPINNER, TRAIT_TRICKSTER_MIND],
  compatibleSpecies: ['jorokan'],
  mutationRate: 0.022,
  averageHeight: 55,
  averageWeight: 4,
  sizeCategory: 'small',
  lifespan: 100,
  lifespanType: 'long_lived',
  maturityAge: 8,
  gestationPeriod: 30,
  sapient: true,
  socialStructure: 'story_webs',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'cultural_keystone',
    diet: 'carnivore',
    biomePreferences: ['forest_canopy', 'ruins', 'any'],
    socialStructure: 'story_webs',
    activityPattern: 'nocturnal',
  },
};

const MIMI_KIN_SPECIES: SpeciesTemplate = {
  speciesId: 'mimi_kin',
  speciesName: 'Mimi-Kin',
  commonName: 'Mimi-Kin',
  description: 'Tiny rock-crack humanoids; extraordinarily ancient painters who teach through hidden art',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_ADAPTABLE, TRAIT_LONG_MEMORY],
  compatibleSpecies: [],
  mutationRate: 0.008,
  averageHeight: 45,
  averageWeight: 3,
  sizeCategory: 'tiny',
  lifespan: 5000,
  lifespanType: 'ageless',
  maturityAge: 200,
  gestationPeriod: 365,
  sapient: true,
  socialStructure: 'ancient_teaching_bands',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'cultural_keystone',
    diet: 'omnivore',
    biomePreferences: ['rock_shelter', 'escarpment', 'desert'],
    socialStructure: 'ancient_teaching_bands',
    activityPattern: 'crepuscular',
  },
};

const TENGU_RA_SPECIES: SpeciesTemplate = {
  speciesId: 'tengu_ra',
  speciesName: 'Tengu-Ra',
  commonName: 'Tengu-Ra',
  description: 'Large avian warrior-scholars; combine martial mastery with deep philosophical tradition',
  bodyPlanId: 'avian_winged',
  innateTraits: [TRAIT_WINGED_FLIGHT, TRAIT_KEEN_SENSES, TRAIT_LONG_MEMORY],
  compatibleSpecies: [],
  mutationRate: 0.012,
  averageHeight: 220,
  averageWeight: 120,
  sizeCategory: 'large',
  lifespan: 500,
  lifespanType: 'long_lived',
  maturityAge: 40,
  gestationPeriod: 120,
  sapient: true,
  socialStructure: 'dojo_hierarchies',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'apex_observer',
    diet: 'carnivore',
    biomePreferences: ['mountain', 'forest', 'mountain_temple'],
    socialStructure: 'dojo_hierarchies',
    activityPattern: 'diurnal',
  },
};

const KAPPA_SPECIES: SpeciesTemplate = {
  speciesId: 'kappa',
  speciesName: 'Kappa',
  commonName: 'Kappa',
  description: 'Small humanoid water-dwellers with shell armor; honor-bound negotiators of river territories',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_SHELL_ARMOR, TRAIT_WATER_AFFINITY],
  compatibleSpecies: ['rusalyn', 'ahuizari'],
  mutationRate: 0.014,
  averageHeight: 90,
  averageWeight: 28,
  sizeCategory: 'small',
  lifespan: 200,
  lifespanType: 'long_lived',
  maturityAge: 20,
  gestationPeriod: 60,
  sapient: true,
  socialStructure: 'river_courts',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'secondary_consumer',
    diet: 'omnivore',
    biomePreferences: ['river', 'lake', 'wetland'],
    socialStructure: 'river_courts',
    activityPattern: 'crepuscular',
  },
};

// ============================================================================
// Wave 5 — Enlightened
// ============================================================================

const NAGA_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'naga_vel',
  speciesName: 'Naga-Vel',
  commonName: 'Naga-Vel',
  description: 'Large serpentine sages; keepers of threshold knowledge between worlds and states of being',
  bodyPlanId: 'serpentine',
  innateTraits: [TRAIT_SERPENTINE_GRACE, TRAIT_LONG_MEMORY, TRAIT_CHORUS_ATTUNED],
  compatibleSpecies: [],
  mutationRate: 0.01,
  averageHeight: 250,
  averageWeight: 150,
  sizeCategory: 'large',
  lifespan: 2000,
  lifespanType: 'long_lived',
  maturityAge: 100,
  gestationPeriod: 180,
  sapient: true,
  socialStructure: 'threshold_temples',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'cultural_keystone',
    diet: 'omnivore',
    biomePreferences: ['jungle', 'river', 'temple_ruins', 'subterranean'],
    socialStructure: 'threshold_temples',
    activityPattern: 'crepuscular',
  },
};

const GARUDA_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'garuda_vel',
  speciesName: 'Garuda-Vel',
  commonName: 'Garuda-Vel',
  description: 'Huge avian divine messengers; carriers of the Chorus signal across continental distances',
  bodyPlanId: 'avian_winged',
  innateTraits: [TRAIT_WINGED_FLIGHT, TRAIT_CHORUS_ATTUNED, TRAIT_COLOSSAL_PRESENCE],
  compatibleSpecies: [],
  mutationRate: 0.005,
  averageHeight: 600,
  averageWeight: 1500,
  sizeCategory: 'huge',
  lifespan: 0,
  lifespanType: 'immortal',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'divine_messengers',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'light_energy',
    biomePreferences: ['sky', 'mountain_peak', 'any'],
    socialStructure: 'divine_messengers',
    activityPattern: 'diurnal',
  },
};

const QUETZALI_SPECIES: SpeciesTemplate = {
  speciesId: 'quetzali',
  speciesName: 'Quetzali',
  commonName: 'Quetzali',
  description: 'Large feathered serpentines; embody the union of sky and earth, wisdom and action',
  bodyPlanId: 'serpentine',
  innateTraits: [TRAIT_SERPENTINE_GRACE, TRAIT_WINGED_FLIGHT, TRAIT_CHORUS_ATTUNED],
  compatibleSpecies: ['naga_vel'],
  mutationRate: 0.008,
  averageHeight: 280,
  averageWeight: 180,
  sizeCategory: 'large',
  lifespan: 3000,
  lifespanType: 'long_lived',
  maturityAge: 150,
  gestationPeriod: 240,
  sapient: true,
  socialStructure: 'sky_temple_councils',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'apex_observer',
    diet: 'omnivore',
    biomePreferences: ['jungle', 'sky', 'pyramid_temple'],
    socialStructure: 'sky_temple_councils',
    activityPattern: 'diurnal',
  },
};

// Wave 5 — Enlightened (continued)

const DJINN_AHL_SPECIES: SpeciesTemplate = {
  speciesId: 'djinn_ahl',
  speciesName: 'Djinn-Ahl',
  commonName: 'Djinn-Ahl',
  description: 'Medium plasma-substrate beings of the Core Band; oldest civilization, bound by negotiated contracts',
  bodyPlanId: 'amorphous',
  innateTraits: [TRAIT_SHAPESHIFTING, TRAIT_AGELESS, TRAIT_LONG_MEMORY],
  compatibleSpecies: [],
  mutationRate: 0.0,
  averageHeight: 170,
  averageWeight: 60,
  sizeCategory: 'medium',
  lifespan: 0,
  lifespanType: 'immortal',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'bound_to_contracts',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'spiritual_keystone',
    diet: 'none',
    biomePreferences: ['any', 'void_adjacent'],
    socialStructure: 'bound_to_contracts',
    activityPattern: 'contract_driven',
  },
};

const PERI_VEIL_SPECIES: SpeciesTemplate = {
  speciesId: 'peri_veil',
  speciesName: 'Peri-Veil',
  commonName: 'Peri-Veil',
  description: 'Ten-dimensional Void-Band timeline-walkers spanning transcended (post-material) to material-interface (Fae) subtypes; timeline-walking is their defining trait — they perceive branching possibilities simultaneously across all timelines',
  bodyPlanId: 'amorphous',
  innateTraits: [TRAIT_BIOLUMINESCENT, TRAIT_PHANTOM_FORM, TRAIT_CHORUS_ATTUNED],
  compatibleSpecies: [],
  mutationRate: 0.0,
  averageHeight: 165,
  averageWeight: 50,
  sizeCategory: 'medium',
  lifespan: 0,
  lifespanType: 'immortal',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'pan_dimensional_courts',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'spiritual_keystone',
    diet: 'none',
    biomePreferences: ['liminal_zones', 'mist', 'any'],
    socialStructure: 'drift_collectives',
    activityPattern: 'twilight',
  },
};

const RAKSHA_SPECIES: SpeciesTemplate = {
  speciesId: 'raksha',
  speciesName: 'Raksha',
  commonName: 'Raksha',
  description: 'Large humanoid warrior-scholars from Raksha-Vor; somatic plasticity, volcanic metabolism, bound by complex codes of honor',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_SHAPESHIFTING, TRAIT_KEEN_SENSES, TRAIT_LONG_MEMORY],
  compatibleSpecies: [],
  mutationRate: 0.005,
  averageHeight: 280,
  averageWeight: 230,
  sizeCategory: 'large',
  lifespan: 0,
  lifespanType: 'immortal',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'honor_clans',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'apex_predator',
    diet: 'carnivore',
    biomePreferences: ['jungle', 'savanna', 'ancient_ruins'],
    socialStructure: 'honor_clans',
    activityPattern: 'nocturnal',
  },
};

// ============================================================================
// Ambient Species
// ============================================================================

const LESHYN_SPECIES: SpeciesTemplate = {
  speciesId: 'leshyn',
  speciesName: 'Leshyn',
  commonName: 'Leshyn',
  description: 'Huge amorphous forest-spirits; their body IS the forest, expanding and contracting with seasons',
  bodyPlanId: 'amorphous',
  innateTraits: [TRAIT_FOREST_BOND, TRAIT_COLOSSAL_PRESENCE, TRAIT_SHAPESHIFTING],
  compatibleSpecies: [],
  mutationRate: 0.005,
  averageHeight: 500,
  averageWeight: 800,
  sizeCategory: 'huge',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'forest_singular',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'photosynthesis',
    biomePreferences: ['forest', 'deep_forest', 'ancient_grove'],
    socialStructure: 'forest_singular',
    activityPattern: 'seasonal',
  },
};

const LAUMA_GALE_SPECIES: SpeciesTemplate = {
  speciesId: 'lauma_gale',
  speciesName: 'Lauma-Gale',
  commonName: 'Lauma-Gale',
  description: 'Medium humanoid wind-spirits; weavers of fate threads who drift on storm fronts',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_STORM_AFFINITY, TRAIT_PHANTOM_FORM],
  compatibleSpecies: [],
  mutationRate: 0.01,
  averageHeight: 165,
  averageWeight: 50,
  sizeCategory: 'medium',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'storm_fronts',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'weather_keystone',
    diet: 'wind_energy',
    biomePreferences: ['storm_zones', 'coast', 'any'],
    socialStructure: 'storm_fronts',
    activityPattern: 'storm_driven',
  },
};

const DOKKAEBI_RIN_SPECIES: SpeciesTemplate = {
  speciesId: 'dokkaebi_rin',
  speciesName: 'Dokkaebi-Rin',
  commonName: 'Dokkaebi-Rin',
  description: 'Small humanoid trickster-goblins; born from abandoned objects, they test and challenge travelers',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_TRICKSTER_MIND, TRAIT_ADAPTABLE],
  compatibleSpecies: ['nyk', 'kitsuri'],
  mutationRate: 0.025,
  averageHeight: 80,
  averageWeight: 20,
  sizeCategory: 'small',
  lifespan: 200,
  lifespanType: 'long_lived',
  maturityAge: 10,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'opportunistic_bands',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'omnivore_generalist',
    diet: 'omnivore',
    biomePreferences: ['settlement_edge', 'road', 'ruins'],
    socialStructure: 'opportunistic_bands',
    activityPattern: 'nocturnal',
  },
};

const TANIWHA_SPECIES: SpeciesTemplate = {
  speciesId: 'taniwha',
  speciesName: 'Taniwha',
  commonName: 'Taniwha',
  description: 'Large aquatic-tentacled guardian spirits of waterways; territorial protectors of their domain',
  bodyPlanId: 'aquatic_tentacled',
  innateTraits: [TRAIT_AQUATIC_ADAPTED, TRAIT_APEX_PREDATOR, TRAIT_CHORUS_ATTUNED],
  compatibleSpecies: [],
  mutationRate: 0.01,
  averageHeight: 240,
  averageWeight: 250,
  sizeCategory: 'large',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_guardian',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'carnivore',
    biomePreferences: ['river', 'harbor', 'ocean_trench'],
    socialStructure: 'solitary_guardian',
    activityPattern: 'continuous',
  },
};

const CURUPALI_SPECIES: SpeciesTemplate = {
  speciesId: 'curupali',
  speciesName: 'Curupali',
  commonName: 'Curupali',
  description: 'Medium humanoid jungle-guardians with reversed feet; disorienting tricksters protecting deep forest',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_FOREST_BOND, TRAIT_TRICKSTER_MIND],
  compatibleSpecies: [],
  mutationRate: 0.018,
  averageHeight: 160,
  averageWeight: 60,
  sizeCategory: 'medium',
  lifespan: 300,
  lifespanType: 'long_lived',
  maturityAge: 25,
  gestationPeriod: 60,
  sapient: true,
  socialStructure: 'forest_wardens',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'omnivore',
    biomePreferences: ['deep_jungle', 'rainforest', 'sacred_grove'],
    socialStructure: 'forest_wardens',
    activityPattern: 'crepuscular',
  },
};

const HULDRYN_SPECIES: SpeciesTemplate = {
  speciesId: 'huldryn',
  speciesName: 'Huldryn',
  commonName: 'Huldryn',
  description: 'Medium humanoid hollow-backed nature spirits; appear fully human from the front, open as trees from behind',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_FOREST_BOND, TRAIT_SHAPESHIFTING],
  compatibleSpecies: ['norn', 'rusalyn'],
  mutationRate: 0.012,
  averageHeight: 170,
  averageWeight: 55,
  sizeCategory: 'medium',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'hidden_communities',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'herbivore',
    biomePreferences: ['forest', 'meadow', 'mountain'],
    socialStructure: 'hidden_communities',
    activityPattern: 'crepuscular',
  },
};

// ============================================================================
// Additional Canonical Species
// ============================================================================

const DRAGON_SPECIES: SpeciesTemplate = {
  speciesId: 'dragon',
  speciesName: 'Dragon',
  commonName: 'Dragon',
  description: 'Post-temporal elder beings who inhabit time as tapestry; anchor probability against Fae maximization, observe civilizational patterns across epochs',
  bodyPlanId: 'serpentine',
  innateTraits: [TRAIT_LONG_MEMORY, TRAIT_COLOSSAL_PRESENCE, TRAIT_DREAM_WEAVER, TRAIT_ANCESTRAL_ECHO, TRAIT_AGELESS],
  compatibleSpecies: [],
  mutationRate: 0.0,
  averageHeight: 800,
  averageWeight: 5000,
  sizeCategory: 'huge',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_temporal',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'temporal_perception',
    biomePreferences: ['mountain', 'deep_river_valley', 'dimensional_threshold', 'cave'],
    socialStructure: 'solitary_temporal',
    activityPattern: 'continuous',
  },
};

const DRAUGRN_SPECIES: SpeciesTemplate = {
  speciesId: 'draugrn',
  speciesName: 'Draugrn',
  commonName: 'Draugrn',
  description: 'Dense bipedal archivists from high-gravity Niflar who enter geological-time cryo-suspension with crystalline memory archives embedded in their bodies',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_LONG_MEMORY, TRAIT_ANCESTRAL_ECHO, TRAIT_STURDY, TRAIT_AGELESS],
  compatibleSpecies: [],
  mutationRate: 0.008,
  averageHeight: 155,
  averageWeight: 200,
  sizeCategory: 'medium',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'archive_individualist',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'cultural_keystone',
    diet: 'omnivore',
    biomePreferences: ['barrow_mound', 'subterranean', 'cold_environment', 'high_gravity'],
    socialStructure: 'archive_individualist',
    activityPattern: 'geological_cycle',
  },
};

const ADARO_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'adaro_vel',
  speciesName: 'Adaro-Vel',
  commonName: 'Adaro',
  description: 'Melanesian aerial aquatic hunters who anchor to solar radiation in clear weather and descend via rainbow-paths during rain to hunt with venomous flying-fish volleys',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_APEX_PREDATOR, TRAIT_WINGED_FLIGHT, TRAIT_WATER_AFFINITY, TRAIT_KEEN_SENSES],
  compatibleSpecies: [],
  mutationRate: 0.015,
  averageHeight: 180,
  averageWeight: 75,
  sizeCategory: 'medium',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_hunter',
  cross_game_compatible: true,
  native_game: 'mvee',
  ecologyProfile: {
    ecologicalRole: 'apex_predator',
    diet: 'carnivore',
    biomePreferences: ['coast', 'river_corridor', 'rain_region', 'high_elevation'],
    socialStructure: 'solitary_hunter',
    activityPattern: 'rain_driven',
  },
};

const SACHAMAMA_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'sachamama_vel',
  speciesName: 'Sachamama-Vel',
  commonName: 'Sachamama',
  description: 'Colossal serpent so vast the forest grows upon her back; the living instantiation of forest sovereignty who swallows those who linger on her body tiles',
  bodyPlanId: 'serpentine',
  innateTraits: [TRAIT_COLOSSAL_PRESENCE, TRAIT_FOREST_BOND, TRAIT_SERPENTINE_GRACE, TRAIT_LONG_MEMORY, TRAIT_AGELESS],
  compatibleSpecies: [],
  mutationRate: 0.0,
  averageHeight: 20000,
  averageWeight: 8000,
  sizeCategory: 'colossal',
  lifespan: 0,
  lifespanType: 'immortal',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_territorial',
  cross_game_compatible: true,
  native_game: 'mvee',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'carnivore',
    biomePreferences: ['tropical_rainforest', 'old_growth_forest', 'amazonian_basin'],
    socialStructure: 'solitary_territorial',
    activityPattern: 'dormant_ambush',
  },
};

const JIANGSHI_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'jiangshi_vel',
  speciesName: 'Jiangshi-Vel',
  commonName: 'Jiangshi',
  description: 'Reanimated beings driven by stranded po-spirit seeking qi equilibrium; bilateral hopping locomotion, breath-based detection, controllable by ritual specialist',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_PHANTOM_FORM, TRAIT_PARASITIC_DRAIN, TRAIT_ANCESTRAL_ECHO],
  compatibleSpecies: [],
  mutationRate: 0.0,
  averageHeight: 170,
  averageWeight: 70,
  sizeCategory: 'medium',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: false,
  socialStructure: 'solitary',
  cross_game_compatible: true,
  native_game: 'mvee',
  ecologyProfile: {
    ecologicalRole: 'environmental_hazard',
    diet: 'qi_absorption',
    biomePreferences: ['burial_ground', 'road', 'abandoned_structure', 'mountain_pass'],
    socialStructure: 'solitary',
    activityPattern: 'nocturnal',
  },
};

const FYLGJA_SPECIES: SpeciesTemplate = {
  speciesId: 'fylgja',
  speciesName: 'Fylgja',
  commonName: 'Fylgja',
  description: 'Emotional mirror-companions that bond to a single individual and reflect their inner state; they do not obey, they attend',
  bodyPlanId: 'quadruped',
  innateTraits: [TRAIT_CHORUS_ATTUNED, TRAIT_ADAPTABLE, TRAIT_MUTUALIST_BOND, TRAIT_KEEN_SENSES],
  compatibleSpecies: ['norn', 'ettin', 'grendel'],
  mutationRate: 0.01,
  averageHeight: 50,
  averageWeight: 8,
  sizeCategory: 'small',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'bonded_pair',
  cross_game_compatible: true,
  native_game: 'mvee',
  ecologyProfile: {
    ecologicalRole: 'mutualist',
    diet: 'omnivore',
    biomePreferences: ['any'],
    socialStructure: 'bonded_pair',
    activityPattern: 'companion_driven',
  },
};

const ASWALI_SPECIES: SpeciesTemplate = {
  speciesId: 'aswali',
  speciesName: 'Aswali',
  commonName: 'Aswali',
  description: 'Refugee shapeshifters from ecological warzone Liwanag; genuine cellular-level morphological transformation, hiding in communities for generations until the shape became the truth',
  bodyPlanId: 'amorphous',
  innateTraits: [TRAIT_SHAPESHIFTING, TRAIT_ADAPTABLE, TRAIT_KEEN_SENSES],
  compatibleSpecies: ['norn'],
  mutationRate: 0.02,
  averageHeight: 170,
  averageWeight: 65,
  sizeCategory: 'medium',
  lifespan: 120,
  lifespanType: 'long_lived',
  maturityAge: 15,
  gestationPeriod: 60,
  sapient: true,
  socialStructure: 'integrated_hidden',
  cross_game_compatible: true,
  native_game: 'mvee',
  ecologyProfile: {
    ecologicalRole: 'mutualist',
    diet: 'omnivore',
    biomePreferences: ['settlement', 'village', 'any_inhabited'],
    socialStructure: 'integrated_hidden',
    activityPattern: 'diurnal',
  },
};

const SIROCCS_SPECIES: SpeciesTemplate = {
  speciesId: 'siroccs',
  speciesName: 'Siroccs',
  commonName: 'Siroccs',
  description: 'Electromagnetic pattern beings without bodies who evolved in a pulsar magnetosphere; intelligence as pattern, not substrate; communication manifests as localized storms',
  bodyPlanId: 'amorphous',
  innateTraits: [TRAIT_STORM_AFFINITY, TRAIT_CHORUS_ATTUNED, TRAIT_DREAM_WEAVER, TRAIT_AGELESS, TRAIT_COLOSSAL_PRESENCE],
  compatibleSpecies: [],
  mutationRate: 0.0,
  averageHeight: 0,
  averageWeight: 0,
  sizeCategory: 'huge',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'resonance_collective',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'cosmic_messenger',
    diet: 'electromagnetic_energy',
    biomePreferences: ['storm_system', 'pulsar_magnetosphere', 'electrical_node'],
    socialStructure: 'resonance_collective',
    activityPattern: 'electromagnetic_driven',
  },
};

const PELAGIS_SPECIES: SpeciesTemplate = {
  speciesId: 'pelagis',
  speciesName: 'Pelagis',
  commonName: 'Pelagis',
  description: 'Bioluminescent deep-ocean cetacean analogues from Verdania; marine ecosystem stabilizers who release biochemical catalysts to restore collapsing fisheries',
  bodyPlanId: 'marine_mammal_dual',
  innateTraits: [TRAIT_BIOLUMINESCENT, TRAIT_AQUATIC_ADAPTED, TRAIT_WATER_AFFINITY, TRAIT_LONG_MEMORY, TRAIT_CHORUS_ATTUNED, TRAIT_MUTUALIST_BOND],
  compatibleSpecies: ['selkieborn', 'nommo'],
  mutationRate: 0.005,
  averageHeight: 400,
  averageWeight: 2000,
  sizeCategory: 'huge',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'pod_based',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'carnivore',
    biomePreferences: ['deep_ocean', 'all_ocean', 'freshwater_transit'],
    socialStructure: 'pod_based',
    activityPattern: 'continuous',
  },
};

const YOWIE_SPECIES: SpeciesTemplate = {
  speciesId: 'yowie',
  speciesName: 'Yowie',
  commonName: 'Yowie',
  description: 'Enormous shy forest guardians from Warra-Deep; choose invisibility via phase-shift as courtesy, break silence only to warn of immediate lethal danger',
  bodyPlanId: 'humanoid_standard',
  innateTraits: [TRAIT_FOREST_BOND, TRAIT_PHANTOM_FORM, TRAIT_LONG_MEMORY, TRAIT_ANCESTRAL_ECHO, TRAIT_COLOSSAL_PRESENCE],
  compatibleSpecies: [],
  mutationRate: 0.005,
  averageHeight: 275,
  averageWeight: 350,
  sizeCategory: 'huge',
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_guardian',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'omnivore',
    biomePreferences: ['old_growth_forest', 'riparian_zone', 'ancient_stone', 'waterhole'],
    socialStructure: 'solitary_guardian',
    activityPattern: 'nocturnal',
  },
};

const UKTEN_SPECIES: SpeciesTemplate = {
  speciesId: 'ukten',
  speciesName: 'Ukten',
  commonName: 'Ukten',
  description: 'Serpentiform data custodians from mineral-cave world Amoye; piezoelectric crest stores 10,000 years of crystalline memory, guards territory through induced biochemical fear as ethical warning',
  bodyPlanId: 'serpentine',
  innateTraits: [TRAIT_LONG_MEMORY, TRAIT_ANCESTRAL_ECHO, TRAIT_SERPENTINE_GRACE, TRAIT_AQUATIC_ADAPTED, TRAIT_BIOLUMINESCENT, TRAIT_COLOSSAL_PRESENCE],
  compatibleSpecies: [],
  mutationRate: 0.005,
  averageHeight: 1500,
  averageWeight: 3000,
  sizeCategory: 'huge',
  lifespan: 10000,
  lifespanType: 'long_lived',
  maturityAge: 200,
  gestationPeriod: 365,
  sapient: true,
  socialStructure: 'territorial_data_custodian',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'keystone',
    diet: 'lithophilic',
    biomePreferences: ['deep_freshwater_lake', 'subterranean_waterway', 'crystalline_cave', 'mountain_lake'],
    socialStructure: 'territorial_data_custodian',
    activityPattern: 'continuous',
  },
};

const PIASARI_SPECIES: SpeciesTemplate = {
  speciesId: 'piasari',
  speciesName: 'Piasari',
  commonName: 'Piasari',
  description: 'River-canyon apex predators from Skara-Cliff who hunt via irreversible metabolic dive-commits and mark cliff faces with biochemical self-portraits as territorial claims',
  bodyPlanId: 'avian_winged',
  innateTraits: [TRAIT_APEX_PREDATOR, TRAIT_WINGED_FLIGHT, TRAIT_AQUATIC_ADAPTED, TRAIT_KEEN_SENSES],
  compatibleSpecies: [],
  mutationRate: 0.015,
  averageHeight: 200,
  averageWeight: 120,
  sizeCategory: 'large',
  lifespan: 300,
  lifespanType: 'long_lived',
  maturityAge: 20,
  gestationPeriod: 90,
  sapient: true,
  socialStructure: 'territorial_cliff_nesting',
  cross_game_compatible: true,
  native_game: 'precursors',
  ecologyProfile: {
    ecologicalRole: 'secondary_consumer',
    diet: 'carnivore',
    biomePreferences: ['river_canyon', 'cliff_face', 'river_corridor'],
    socialStructure: 'territorial_cliff_nesting',
    activityPattern: 'diurnal',
  },
};

// ============================================================================
// Registration
// ============================================================================

/**
 * Register all Akashic canonical species into SPECIES_REGISTRY.
 * Safe to call multiple times (idempotent — later calls overwrite with same data).
 */
export function registerAkashicSpecies(): void {
  // Original Five (Urd Prime)
  registerSpecies('norn', NORN_SPECIES);
  registerSpecies('grendel', GRENDEL_SPECIES);
  registerSpecies('ettin', ETTIN_SPECIES);
  registerSpecies('shee', SHEE_SPECIES);
  registerSpecies('mycon', MYCON_SPECIES);

  // Wave 1 — Primal
  registerSpecies('venthari', VENTHARI_SPECIES);
  registerSpecies('cher_khan', CHER_KHAN_SPECIES);
  registerSpecies('adzefire', ADZEFIRE_SPECIES);
  registerSpecies('ahuizari', AHUIZARI_SPECIES);

  // Wave 2 — Awakened
  registerSpecies('nyk', NYK_SPECIES);
  registerSpecies('rusalyn', RUSALYN_SPECIES);
  registerSpecies('auki_vel', AUKI_VEL_SPECIES);
  registerSpecies('patupaiarehe', PATUPAIAREHE_SPECIES);
  registerSpecies('duppy', DUPPY_SPECIES);
  registerSpecies('alfar', ALFAR_SPECIES);

  // Wave 3 — Spoken
  registerSpecies('nommo', NOMMO_SPECIES);
  registerSpecies('kelpathi', KELPATHI_SPECIES);
  registerSpecies('jorokan', JOROKAN_SPECIES);
  registerSpecies('egungun_kin', EGUNGUN_KIN_SPECIES);
  registerSpecies('selkieborn', SELKIEBORN_SPECIES);
  registerSpecies('baku_ma', BAKU_MA_SPECIES);
  registerSpecies('mimi_kin', MIMI_KIN_SPECIES);

  // Wave 4 — Learned
  registerSpecies('kitsuri', KITSURI_SPECIES);
  registerSpecies('vaask', VAASK_SPECIES);
  registerSpecies('anansi_web', ANANSI_WEB_SPECIES);
  registerSpecies('tengu_ra', TENGU_RA_SPECIES);
  registerSpecies('kappa', KAPPA_SPECIES);

  // Wave 5 — Enlightened
  registerSpecies('naga_vel', NAGA_VEL_SPECIES);
  registerSpecies('garuda_vel', GARUDA_VEL_SPECIES);
  registerSpecies('quetzali', QUETZALI_SPECIES);

  // Wave 5 — Enlightened (continued)
  registerSpecies('djinn_ahl', DJINN_AHL_SPECIES);
  registerSpecies('peri_veil', PERI_VEIL_SPECIES);
  registerSpecies('raksha', RAKSHA_SPECIES);

  // Ambient — always present aboard per SPECIES_PROGRESSION.md Appendix
  registerSpecies('tikbali', TIKBALI_SPECIES);
  registerSpecies('leshyn', LESHYN_SPECIES);
  registerSpecies('lauma_gale', LAUMA_GALE_SPECIES);
  registerSpecies('dokkaebi_rin', DOKKAEBI_RIN_SPECIES);
  registerSpecies('taniwha', TANIWHA_SPECIES);
  registerSpecies('curupali', CURUPALI_SPECIES);
  registerSpecies('huldryn', HULDRYN_SPECIES);

  // Additional Canonical Species
  registerSpecies('dragon', DRAGON_SPECIES);
  registerSpecies('draugrn', DRAUGRN_SPECIES);
  registerSpecies('adaro_vel', ADARO_VEL_SPECIES);
  registerSpecies('sachamama_vel', SACHAMAMA_VEL_SPECIES);
  registerSpecies('jiangshi_vel', JIANGSHI_VEL_SPECIES);
  registerSpecies('fylgja', FYLGJA_SPECIES);
  registerSpecies('aswali', ASWALI_SPECIES);
  registerSpecies('siroccs', SIROCCS_SPECIES);
  registerSpecies('pelagis', PELAGIS_SPECIES);
  registerSpecies('yowie', YOWIE_SPECIES);
  registerSpecies('ukten', UKTEN_SPECIES);
  registerSpecies('piasari', PIASARI_SPECIES);
}

// Auto-register on import (side-effect module pattern)
registerAkashicSpecies();
