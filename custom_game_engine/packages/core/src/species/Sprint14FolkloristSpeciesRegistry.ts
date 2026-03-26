/**
 * Folklorist Species Registry — Sprint 14 Theme C Batch
 *
 * Four species from underrepresented folklore traditions:
 * - Yucatec Maya (Mesoamerica): Alux-Kin
 * - Khoikhoi (South Africa): Grootslang-Rin
 * - Inuit (Arctic): Qalupalik-Vel
 * - Chinese (East Asia): Jiangshi-Vel
 *
 * Designed by Scheherazade (Folklorist) — MUL-3530
 *
 * Sources:
 * - Maya: Hilario Chi Canul, Los Aluxes: duendes del mayab (2013); David Bolles, Combined Dictionary-Concordance of the Yucatecan Mayan Language (2001)
 * - Khoikhoi: Eugène Marais, The Soul of the White Ant (1937); Penny Miller, Myths and Legends of Southern Africa (1979)
 * - Inuit: Neil Christopher, Unikkaaqtuat: An Introduction to Inuit Myths and Legends (2013); Rachel Qitsualik, Skraelings: Clashes in the Old Arctic (2014)
 * - Chinese: Ji Xiaolan, Yuewei Caotang Biji (1789); de Groot, The Religious System of China (1892)
 */

import type { SpeciesTrait } from '../components/SpeciesComponent.js';
import type { SpeciesTemplate } from './SpeciesRegistry.js';
import { validateAgainstMUL1357Schema } from './FolkloristSpeciesRegistry.js';
export type { MUL1357ValidationResult } from './FolkloristSpeciesRegistry.js';

// ============================================================================
// NEW MECHANIC SCAFFOLDS (12 mechanics — MUL-3530 Sprint 14 deliverable)
// Each trait below defines one of the new mechanics as an innate species trait.
// Game systems consume these via abilitiesGranted[] strings.
// ============================================================================

// Mechanic 1: Milpa binding (Alux-Kin)
// Bound to a specific farm zone — blesses crops with offerings, blights them without.
export const TRAIT_MILPA_BINDING: SpeciesTrait = {
  id: 'milpa_binding',
  name: 'Milpa Binding',
  description: 'Bound to a specific farm/agricultural zone. Crops within binding_radius grow at crop_growth_bonus rate. If offerings (food items) are deposited at binding shrine within offering_check_interval, blessing continues. Without offerings, switches to crop_blight mode — crops within radius wither at blight_rate.',
  category: 'spiritual',
  abilitiesGranted: ['territory_binding_agriculture', 'offering_detection', 'crop_growth_blessing', 'crop_blight_curse'],
  skillBonus: { farming: 0.4 },
};

// Mechanic 2: Clay invisibility (Alux-Kin)
// Invisible by default; revealed by object interaction or j-men ceremony.
export const TRAIT_CLAY_INVISIBILITY: SpeciesTrait = {
  id: 'clay_invisibility',
  name: 'Clay Invisibility',
  description: 'Invisible by default. Becomes visible only when interacting with objects or when a j-men (agent with spiritual > 0.8) performs a revealing ceremony within reveal_ceremony_range. Visibility lasts for visibility_duration ticks after interaction.',
  category: 'magical',
  abilitiesGranted: ['default_invisible', 'interaction_visibility_flash', 'jmen_reveal_ceremony'],
  skillBonus: { stealth: 0.5 },
};

// Mechanic 3: Cenote retreat (Alux-Kin)
// Teleports to nearest cenote when threatened; invulnerable while submerged.
export const TRAIT_CENOTE_RETREAT: SpeciesTrait = {
  id: 'cenote_retreat',
  name: 'Cenote Retreat',
  description: 'When threatened, instantly teleports to nearest cenote/water_source tile. Heals at cenote_heal_rate while in cenote. Cannot be attacked while submerged. Emerges after cenote_rest_duration ticks.',
  category: 'physical',
  abilitiesGranted: ['cenote_teleport', 'cenote_healing', 'cenote_invulnerability'],
};

// Mechanic 4: Tunnel excavation (Grootslang-Rin)
// Permanently digs tunnel tiles through rock; fast movement through self-made tunnels.
export const TRAIT_TUNNEL_EXCAVATION: SpeciesTrait = {
  id: 'tunnel_excavation',
  name: 'Tunnel Excavation',
  description: 'Digs permanent tunnel tiles through rock/soil. Movement through self-created tunnels at tunnel_speed_multiplier. Tunnels persist and can be used by other entities. Creates underground network over time.',
  category: 'physical',
  abilitiesGranted: ['tunnel_dig', 'tunnel_fast_movement', 'rock_destruction'],
  skillBonus: { mining: 0.5 },
};

// Mechanic 5: Diamond hoard compulsion (Grootslang-Rin)
// Compulsively collects gems; hoard size scales aggression; can be bribed to release captives.
export const TRAIT_DIAMOND_HOARD_COMPULSION: SpeciesTrait = {
  id: 'diamond_hoard_compulsion',
  name: 'Diamond Hoard Compulsion',
  description: 'Detects gem/precious_stone items within gem_detection_range. Compulsively collects and stores them in lair tile. Hoard size increases territorial aggression (aggression_per_gem scaling). Will accept gem_bribe_threshold gems to release a captured entity.',
  category: 'social',
  abilitiesGranted: ['gem_detection', 'gem_collect_compulsion', 'hoard_aggression_scaling', 'gem_bribe_release'],
  vulnerabilities: ['gem_bribe_exploitable'],
};

// Mechanic 6: Primordial might (Grootslang-Rin)
// Enormous physical power — building destruction, constrict immobilize, physical resistance.
export const TRAIT_PRIMORDIAL_MIGHT: SpeciesTrait = {
  id: 'primordial_might',
  name: 'Primordial Might',
  description: 'Enormous physical power — attacks deal primordial_damage, can destroy building tiles within destruction_radius. Constrict attack immobilizes target for constrict_duration ticks. Resistant to all physical damage (physical_resistance).',
  category: 'physical',
  abilitiesGranted: ['heavy_attack', 'building_destruction', 'constrict_immobilize', 'physical_damage_resistance'],
  skillBonus: { combat: 0.5 },
};

// Mechanic 7: Under-ice movement (Qalupalik-Vel)
// Phases through ice tiles; invisible underneath; cold immunity.
export const TRAIT_UNDER_ICE_MOVEMENT: SpeciesTrait = {
  id: 'under_ice_movement',
  name: 'Under-Ice Movement',
  description: 'Can move through ice/frozen_water tiles as if they were walkable terrain. Invisible while under ice. Surfaces only at ice_edge tiles or through cracks. Movement speed on ice tiles at ice_speed_multiplier. Takes cold_damage_immunity from cold.',
  category: 'physical',
  abilitiesGranted: ['ice_phase_movement', 'ice_invisibility', 'ice_edge_surface', 'cold_immunity'],
  needsModifier: { temperature: 0.0 },
};

// Mechanic 8: Humming lure (Qalupalik-Vel)
// Compels young agents to path toward the sound; adults hear it as warning only.
export const TRAIT_HUMMING_LURE: SpeciesTrait = {
  id: 'humming_lure',
  name: 'Humming Lure',
  description: 'Emits a humming sound that affects agents within lure_range. Agents with age < lure_age_threshold AND willpower < lure_resistance_threshold are compelled to path toward the sound source. Adult agents (age > threshold) hear the hum but are not compelled — serves as warning.',
  category: 'magical',
  abilitiesGranted: ['lure_hum_emit', 'child_compulsion', 'adult_warning_sound'],
  skillBonus: { deception: 0.3 },
};

// Mechanic 9: Amautik capture (Qalupalik-Vel)
// Captures lured agents in back pouch; transforms them over time; interruptible by rescuers.
export const TRAIT_AMAUTIK_CAPTURE: SpeciesTrait = {
  id: 'amautik_capture',
  name: 'Amautik Capture',
  description: 'When adjacent to a lured/compelled agent, performs capture action — target is placed in amautik (back pouch), removing them from the world map. Captured agents undergo transformation over transform_duration ticks, emerging as Qalupalik-Vel juveniles. Capture can be interrupted by adjacent agents performing rescue action within rescue_window ticks.',
  category: 'social',
  abilitiesGranted: ['capture_to_amautik', 'transform_captive', 'rescue_interruptible'],
};

// Mechanic 10: Rigor hop movement (Jiangshi-Vel)
// Can only hop — blocked by gaps, water, elevation. Audible within hop_sound_range.
export const TRAIT_RIGOR_HOP_MOVEMENT: SpeciesTrait = {
  id: 'rigor_hop_movement',
  name: 'Rigor Hop Movement',
  description: 'Movement restricted to hopping — moves hop_distance tiles per tick but CANNOT cross gap tiles, water tiles, or elevation changes > 1. This creates natural barriers. Movement is audible within hop_sound_range tiles (agents can hear approaching).',
  category: 'physical',
  abilitiesGranted: ['hop_only_movement', 'gap_impassable', 'elevation_restricted', 'audible_movement'],
  skillBonus: { stealth: -0.3 },
};

// Mechanic 11: Breath detection (Jiangshi-Vel)
// Detects living agents by breath only; blind. Hold-breath action makes agents undetectable.
export const TRAIT_BREATH_DETECTION: SpeciesTrait = {
  id: 'breath_detection',
  name: 'Breath Detection',
  description: 'Cannot see — detects living agents ONLY by their breathing within breath_detection_range. Agents performing hold_breath action (drains stamina at breath_hold_stamina_rate/tick) become undetectable. Agents who are exhausted (stamina < breath_hold_minimum) cannot hold breath. Creates stealth-management gameplay.',
  category: 'sensory',
  abilitiesGranted: ['breath_sense', 'hold_breath_counter', 'blind_no_visual', 'exhaustion_detection_break'],
  skillBonus: { perception: -0.5 },
  vulnerabilities: ['breath_holding_evasion'],
};

// Mechanic 12: Ward vulnerability (Jiangshi-Vel)
// Three distinct ward types — talisman paralysis, sticky rice slow, peach wood damage.
export const TRAIT_WARD_VULNERABILITY: SpeciesTrait = {
  id: 'ward_vulnerability',
  name: 'Ward Vulnerability',
  description: 'Paralyzed for ward_paralysis_duration ticks when a Taoist talisman item is applied by adjacent agent. Sticky rice tiles within sticky_rice_range cause movement speed reduction to ward_slow_factor. Peach wood items deal ward_damage bonus damage. Three distinct ward types create crafting/agriculture incentives.',
  category: 'magical',
  abilitiesGranted: ['talisman_paralysis', 'sticky_rice_slow', 'peach_wood_vulnerability'],
  vulnerabilities: ['talisman_ward', 'sticky_rice_ward', 'peach_wood_ward'],
};

// ============================================================================
// ALUX-KIN (Yucatec Maya, Mesoamerica)
// ============================================================================
// Folklore: Yucatec Maya oral tradition, Mesoamerica.
// Tiny clay guardians of milpas and cenotes — bless offerings, blight neglect.
// Sources: Hilario Chi Canul, Los Aluxes: duendes del mayab (2013);
//          David Bolles, Combined Dictionary-Concordance of the Yucatecan Mayan Language (2001)

export const ALUX_KIN_SPECIES: SpeciesTemplate = {
  speciesId: 'alux_kin',
  speciesName: 'Alux-Kin',
  commonName: 'Alux',

  description: `The Alux-Kin are tiny clay guardians from Yucatec Maya tradition of Mesoamerica —
standing only 40cm tall, formed from clay by Maya daykeepers (j-men) and bound to specific milpas
(cornfields) and cenotes. Their bodies are rough, earth-toned, humanoid in proportion but stocky,
with oversized hands suited for working soil. They are invisible by default, their clay forms blending
seamlessly with the earth they protect.

Their core mechanic is milpa binding: each Alux-Kin is bound to a specific agricultural zone within
binding_radius tiles. When farmers deposit offerings at the binding shrine within offering_check_interval
ticks, the Alux-Kin blesses the zone — crops grow at crop_growth_bonus rate. When offerings are
neglected, the guardian turns wrathful: switching to crop_blight mode, withering crops within the
radius at blight_rate. This creates a ritual economy that players must learn to maintain.

Their clay invisibility means they are effectively hidden at all times — flickering visible briefly
during object interactions, and fully revealable only when a j-men (an agent with spiritual > 0.8)
performs a revealing ceremony within reveal_ceremony_range. The j-men mechanic preserves the Mayan
institutional knowledge that only trained daykeepers can communicate with aluxo'ob.

When threatened, the Alux-Kin can execute cenote retreat — an instant teleport to the nearest
cenote or water_source tile. While submerged they heal at cenote_heal_rate and cannot be attacked.
They emerge after cenote_rest_duration ticks, full defensive posture restored.

Documented through oral tradition collected by Hilario Chi Canul (2013) and linguistic evidence
in David Bolles' Combined Dictionary-Concordance (2001).

*-kin suffix marks socially organized family-group species in the game taxonomy.*`,

  bodyPlanId: 'tiny_clay_humanoid',

  innateTraits: [
    TRAIT_MILPA_BINDING,
    TRAIT_CLAY_INVISIBILITY,
    TRAIT_CENOTE_RETREAT,
  ],

  compatibleSpecies: [],
  mutationRate: 0.005,

  averageHeight: 40,
  averageWeight: 3,
  sizeCategory: 'tiny',

  lifespan: 300,
  lifespanType: 'long_lived',
  maturityAge: 5,
  gestationPeriod: 0, // Clay-formed, not born

  sapient: true,
  socialStructure: 'hidden_colony',

  traveler_epithet: 'a guardian shaped from the earth of forgotten fields',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    binding_radius: 15,
    crop_growth_bonus: 0.3,
    offering_check_interval: 100,
    blight_rate: 0.05,
    reveal_ceremony_range: 8,
    visibility_duration: 10,
    cenote_heal_rate: 0.1,
    cenote_rest_duration: 20,
  },
};

// ============================================================================
// GROOTSLANG-RIN (Khoikhoi, South Africa)
// ============================================================================
// Folklore: Khoikhoi tradition, Richtersveld, South Africa.
// Primordial hybrid — split by gods into elephants and serpents; survivors hoard diamonds.
// Sources: Eugène Marais, The Soul of the White Ant (1937);
//          Penny Miller, Myths and Legends of Southern Africa (1979)

export const GROOTSLANG_RIN_SPECIES: SpeciesTemplate = {
  speciesId: 'grootslang_rin',
  speciesName: 'Grootslang-Rin',
  commonName: 'Grootslang',

  description: `The Grootslang-Rin is a primordial creature from Khoikhoi tradition of South Africa —
the gods' first creation, judged too powerful and split into elephants and serpents. A few escaped
the division intact. They dwell in deep cave systems called the Wonder Hole (Bottomless Pit) in the
Richtersveld. Their form reflects this dual nature: an elephantine head and forelimbs fused to a
massive serpentine body, measuring 800cm in length and weighing 2000kg. Their scales are deep grey
with iridescent patches where elephant skin and serpent scale overlap.

Their first major mechanic is tunnel excavation: the Grootslang-Rin digs permanent tunnel tiles
through rock and soil, moving through self-created tunnels at tunnel_speed_multiplier. These tunnels
persist after the creature has moved on and can be used by any entity, creating shifting underground
networks that reshape the map over time.

The diamond hoard compulsion captures the folklore's core bargaining mechanic: the Grootslang-Rin
detects gem and precious_stone items within gem_detection_range, compulsively collects and stores
them in its lair tile, and grows increasingly aggressive as the hoard grows (aggression_per_gem
scaling). Crucially, it will accept gem_bribe_threshold gems in exchange for releasing a captured
entity — a reliable exploit that requires players to cultivate gem resources.

Its primordial might makes direct confrontation extremely hazardous: attacks deal primordial_damage,
building tiles within destruction_radius are destroyed, the constrict attack immobilizes targets for
constrict_duration ticks, and physical_resistance makes damage-based approaches ineffective without
significant preparation.

*-rin suffix marks trickster species in the game taxonomy — the Grootslang bargains and deceives.*`,

  bodyPlanId: 'elephant_serpent_hybrid',

  innateTraits: [
    TRAIT_TUNNEL_EXCAVATION,
    TRAIT_DIAMOND_HOARD_COMPULSION,
    TRAIT_PRIMORDIAL_MIGHT,
  ],

  compatibleSpecies: [],
  mutationRate: 0.003,

  averageHeight: 400,
  averageWeight: 2000,
  sizeCategory: 'huge',

  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 100,
  gestationPeriod: 500,

  sapient: true,
  socialStructure: 'solitary_territorial',

  traveler_epithet: 'a rumble from the deep where diamonds gather in darkness',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    tunnel_speed_multiplier: 2.0,
    gem_detection_range: 30,
    aggression_per_gem: 0.02,
    gem_bribe_threshold: 10,
    primordial_damage: 0.4,
    destruction_radius: 2,
    constrict_duration: 15,
    physical_resistance: 0.6,
  },
};

// ============================================================================
// QALUPALIK-VEL (Inuit, Arctic)
// ============================================================================
// Folklore: Inuit oral tradition, Arctic Canada.
// Green-skinned under-ice predator — hums to lure children, captures them in amautik pouches.
// Sources: Neil Christopher, Unikkaaqtuat: An Introduction to Inuit Myths and Legends (2013);
//          Rachel Qitsualik, Skraelings: Clashes in the Old Arctic (2014)

export const QALUPALIK_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'qalupalik_vel',
  speciesName: 'Qalupalik-Vel',
  commonName: 'Qalupalik',

  description: `The Qalupalik-Vel is an aquatic humanoid from Inuit oral tradition of the Arctic —
160cm tall, with green-tinged skin adapted for sub-zero water, long webbed fingers, and wide
translucent eyes. Its most distinctive feature is the amautik: an oversized pouch on its back, the
same style used by Inuit mothers to carry infants, but sized to hold multiple child-age agents.

Its primary habitat is below sea ice: through under-ice movement, the Qalupalik-Vel phases through
ice and frozen_water tiles as walkable terrain, invisible from above while submerged, surfacing only
at ice_edge tiles or cracks. It is fully cold_immune and moves at ice_speed_multiplier on ice
surfaces. This creates a predator that is safe in its domain and exposed only when it surfaces.

The humming lure is its primary hunting tool: an acoustic emission within lure_range that compels
agents younger than lure_age_threshold with insufficient willpower (< lure_resistance_threshold) to
path toward the source. Adult agents are unaffected in terms of compulsion but can hear the hum —
the Inuit tradition's design intent was explicitly to warn children away from ice edges. Adults
hearing the hum become an in-game warning system.

Amautik capture completes the predation loop: when adjacent to a lured agent, the Qalupalik-Vel
places the target in its amautik, removing them from the world map. Captured agents transform over
transform_duration ticks into Qalupalik-Vel juveniles. The rescue_window mechanic gives adjacent
agents a limited number of ticks to perform a rescue action — creating urgent cooperative gameplay
around ice-edge zones.

Reproduction is exclusively via capture and transformation; gestationPeriod is 0.

*-vel suffix marks spiritual-grade species in the game taxonomy.*`,

  bodyPlanId: 'aquatic_humanoid_arctic',

  innateTraits: [
    TRAIT_UNDER_ICE_MOVEMENT,
    TRAIT_HUMMING_LURE,
    TRAIT_AMAUTIK_CAPTURE,
  ],

  compatibleSpecies: [],
  mutationRate: 0.002,

  averageHeight: 160,
  averageWeight: 70,
  sizeCategory: 'medium',

  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0, // Reproduces via capture/transformation

  sapient: true,
  socialStructure: 'solitary_predator',

  traveler_epithet: 'a hum beneath the ice that calls the young away',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    ice_speed_multiplier: 1.5,
    lure_range: 12,
    lure_age_threshold: 20,
    lure_resistance_threshold: 0.5,
    transform_duration: 60,
    rescue_window: 10,
    max_captives: 2,
  },
};

// ============================================================================
// JIANGSHI-VEL (Chinese, East Asia)
// ============================================================================
// Folklore: Qing dynasty Chinese tradition, East Asia.
// Reanimated hopping corpse — blind, breath-detecting, warded by rice/talismans/peach wood.
// Sources: Ji Xiaolan, Yuewei Caotang Biji (1789);
//          de Groot, The Religious System of China (1892)

export const JIANGSHI_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'jiangshi_vel',
  speciesName: 'Jiangshi-Vel',
  commonName: 'Jiangshi',

  description: `The Jiangshi-Vel is a reanimated corpse from Qing dynasty Chinese folklore — 175cm,
stiff-limbed due to full rigor mortis, arms extended forward, face pallid with a greenish cast,
wearing the burial robes of its interment. Originating in corpse-driving (xiangxi ganshi) traditions
where Taoist priests animated bodies to hop in a line back to their home villages, the Jiangshi
became one of Chinese popular religion's most distinctive undead figures.

Its defining movement constraint is rigor hop movement: unable to bend its knees, the Jiangshi-Vel
can only move by hopping hop_distance tiles per tick. It cannot cross gap tiles, water tiles, or
elevation changes greater than 1 — these become absolute barriers that informed settlement defense
design in the folklore's communities. Its movement is audible within hop_sound_range tiles, giving
potential victims acoustic warning of approach. The stealth penalty reflects this unavoidable noise.

The Jiangshi-Vel is completely blind — its breath detection replaces all visual sensing. It detects
living agents exclusively by breathing within breath_detection_range. This creates the game's
primary stealth-management mechanic: agents can perform hold_breath actions, removing themselves
from detection at the cost of stamina (breath_hold_stamina_rate/tick). Exhausted agents whose
stamina falls below breath_hold_minimum cannot hold their breath — they become detectable at the
worst possible moment. The perception penalty represents absent visual processing.

Three distinct ward types define the Jiangshi-Vel's vulnerabilities, each requiring different
production chains. Taoist talisman items applied by an adjacent agent cause full paralysis for
ward_paralysis_duration ticks. Sticky rice tiles within sticky_rice_range slow movement to
ward_slow_factor. Peach wood items deal ward_damage bonus damage on hit. These mechanics create
agricultural incentives (rice, peach orchards) and a crafting incentive (calligraphy for talismans).

The entity is sapient: false — it operates on pure instinct, with no social cognition.

*-vel suffix marks spiritual-grade species in the game taxonomy.*`,

  bodyPlanId: 'hopping_corpse_rigid',

  innateTraits: [
    TRAIT_RIGOR_HOP_MOVEMENT,
    TRAIT_BREATH_DETECTION,
    TRAIT_WARD_VULNERABILITY,
  ],

  compatibleSpecies: [],
  mutationRate: 0.001,

  averageHeight: 175,
  averageWeight: 65,
  sizeCategory: 'medium',

  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0, // Undead — no reproduction

  sapient: false,
  socialStructure: 'solitary_predator',

  traveler_epithet: 'a stiff shape that hops through moonlit silence, sensing every breath',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    hop_distance: 2,
    hop_sound_range: 8,
    breath_detection_range: 10,
    breath_hold_stamina_rate: 0.05,
    breath_hold_minimum: 0.15,
    ward_paralysis_duration: 30,
    sticky_rice_range: 3,
    ward_slow_factor: 0.2,
    ward_damage: 0.3,
  },
};

// ============================================================================
// Sprint 14 Folklorist Species Registry
// ============================================================================

export const SPRINT14_FOLKLORIST_SPECIES_REGISTRY: Record<string, SpeciesTemplate> = {
  alux_kin: ALUX_KIN_SPECIES,
  grootslang_rin: GROOTSLANG_RIN_SPECIES,
  qalupalik_vel: QALUPALIK_VEL_SPECIES,
  jiangshi_vel: JIANGSHI_VEL_SPECIES,
};

/**
 * Get all Sprint 14 folklorist species
 */
export function getAllSprint14FolkloristSpecies(): SpeciesTemplate[] {
  return Object.values(SPRINT14_FOLKLORIST_SPECIES_REGISTRY);
}

/**
 * Validate all Sprint 14 species against the cross-game migration schema (MUL-1357 format).
 * Re-uses the MUL-1357 validation from the Sprint 9 registry.
 * Throws if any species fails validation.
 */
export function validateAllSprint14Species(): import('./FolkloristSpeciesRegistry.js').MUL1357ValidationResult[] {
  const results = Object.values(SPRINT14_FOLKLORIST_SPECIES_REGISTRY).map(validateAgainstMUL1357Schema);
  const failures = results.filter(r => !r.valid);
  if (failures.length > 0) {
    const summary = failures
      .map(f => `  ${f.speciesId}: ${f.violations.join('; ')}`)
      .join('\n');
    throw new Error(`MUL-1357 schema validation failed for ${failures.length} species:\n${summary}`);
  }
  return results;
}
