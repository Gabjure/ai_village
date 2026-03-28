/**
 * Folklorist Species Registry — Sprint 16 Theme C Batch
 *
 * Five species from underrepresented folklore traditions:
 * - Amazonian/Quechua (South America): Sachamama-Vel
 * - Thai (Southeast Asia): Phi Krasue-Vel
 * - Javanese (Southeast Asia): Jenglot-Kin
 * - Amazonian/Quechua (South America): Yacuruna-Kin
 * - Aboriginal Australian (Oceania): Yara-ma-yha-who-Rin
 *
 * Designed by Scheherazade (Folklorist) — MUL-3933
 *
 * Sources:
 * - Amazonian/Quechua: Viveiros de Castro, From the Enemy's Point of View (1992); Santos-Granero, Vital Enemies (2009); Regan, Hacia la tierra sin mal (1993)
 * - Thai: Phraya Anuman Rajadhon, Essays on Thai Folklore (1968); Pattana Kitiarsa, Mediums, Monks, and Amulets (2012)
 * - Javanese: Koentjaraningrat, Javanese Culture (1985); Geertz, The Religion of Java (1960)
 * - Aboriginal Australian: Ramsay Smith, Myths and Legends of the Australian Aboriginals (1930); Reed, Aboriginal Myths, Legends & Fables (1982)
 */

import type { SpeciesTrait } from '../components/SpeciesComponent.js';
import type { SpeciesTemplate } from './SpeciesRegistry.js';
import { validateAgainstMUL1357Schema } from './FolkloristSpeciesRegistry.js';
export type { MUL1357ValidationResult } from './FolkloristSpeciesRegistry.js';

// ─────────────────────────────────────────────────────────────────────────────
// TRAIT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── Sachamama-Vel traits ──────────────────────────────────────────────────────

export const TRAIT_TERRAIN_CAMOUFLAGE: SpeciesTrait = {
  id: 'terrain_camouflage',
  name: 'Terrain Camouflage',
  category: 'physical',
  description:
    'The Sachamama-Vel is not hiding in the terrain — she IS the terrain that happens to be alive. In ' +
    'the Quechua cosmological framework, she is not a creature that has lain down in the forest; she ' +
    'is the substrate on which the forest built itself. The forest grew over her because she invited ' +
    'it. Her body is the ground other life stands on. In Eduardo Viveiros de Castro\'s perspectivism ' +
    'framework, the boundary between entity and environment dissolves for beings operating at this ' +
    'cosmological scale — the Sachamama does not wear the forest as camouflage, she constitutes it. ' +
    'The ecosystem on her back is real, functional, and genuinely supports life. Organisms live on ' +
    'her without knowing they do. This is her gift to the forest as much as her danger to travelers. ' +
    'Mechanically: during dormancy (minimum 2000 ticks between movements), she resolves as 12 ' +
    'contiguous tiles of fallen-log/earth-mound terrain. Vegetation, moss, and small plants render ' +
    'correctly on the surface. Agents passing across body tiles receive no warning unless their ' +
    'perception exceeds the 0.8 threshold — one of the highest detection requirements in the game. ' +
    'The camouflage operates as a tile-type override, not a stealth modifier; perception-boosting ' +
    'equipment alone is insufficient. Only activation reveals what the terrain was.',
  abilitiesGranted: ['terrain_mimicry', 'dormancy_camouflage', 'perception_bypass'],
  skillBonus: { stealth: 0.9 },
};

export const TRAIT_LANDSCAPE_UPHEAVAL: SpeciesTrait = {
  id: 'landscape_upheaval',
  name: 'Landscape Upheaval',
  category: 'magical',
  description:
    'When the Sachamama-Vel moves, it is not destruction — it is the land breathing. The Quechua do ' +
    'not frame upheaval as catastrophe but as forest renewal through geological transformation: the ' +
    'churned earth she leaves in her wake has higher fertility than what was there before, new river ' +
    'channels appear where water was needed, and the clearings created by upheaval become primary ' +
    'sites of new growth within seasons. What looks like ruin to a settlement is succession to the ' +
    'forest. Destruction and creation are the same event at this scale — the Sachamama does not ' +
    'pass through the land, she revises it, and the revision is not random but ecologically ' +
    'purposive. Mechanically: movement triggers on hunger or territorial threat, at 0.3 speed ' +
    'multiplier, affecting a 3-tile-wide corridor on each side of the path. Forest tiles become ' +
    'churned earth, water tiles become new channels, and structures take 0.8 damage sufficient to ' +
    'destroy most construction. After relocation she re-enters dormancy, camouflage regrowing over ' +
    '200 ticks as vegetation re-establishes. Each movement is a permanent geological event. The ' +
    'upheaval_fertility_bonus genome flag (0.4) means churned earth supports accelerated new ' +
    'growth; upheaval_water_channel_chance (0.3) determines whether new channels become permanent ' +
    'water features. These are not compensation mechanics — they are the ecological truth of what ' +
    'the Sachamama\'s movement actually is.',
  abilitiesGranted: ['terrain_transformation', 'geological_movement', 'permanent_terrain_modification', 'ecological_renewal'],
  skillBonus: { combat: 0.3 },
};

export const TRAIT_SWALLOW_AMBUSH: SpeciesTrait = {
  id: 'swallow_ambush',
  name: 'Swallow Ambush',
  category: 'physical',
  description:
    'The Sachamama-Vel swallows what does not belong. In the Quechua tradition documented by Regan, ' +
    'she enforces the boundary between human settlement and untamed jungle — not as hostile predator ' +
    'but as the cosmological force that defines where the forest begins and human territory ends. ' +
    'Those who respect that boundary, who acknowledge her sovereignty through propitiation, are safe. ' +
    'Those who trespass without acknowledgment are claimed. The boundary is not fixed; it can be ' +
    'negotiated through ritual, but not through force or simple passage. The peaceful coexistence ' +
    'pathway is available: agents who perform propitiation rituals — placing offerings on body tiles ' +
    'during the dormancy period — receive a territorial pass encoded as the propitiation_ritual_immunity ' +
    'ability. This immunity prevents ambush from triggering for propitiation_immunity_duration (500) ' +
    'ticks. This is not a combat-avoidance exploit but the cosmologically correct relationship: ' +
    'acknowledgment of the Sachamama\'s sovereignty grants safe passage across her territory. ' +
    'Communities that learn propitiation live in partnership with the forest boundary she defines; ' +
    'those that ignore her are swallowed. Mechanically: agents who remain on body tiles for more than ' +
    '5 consecutive ticks without immunity trigger the ambush. The body rises and engulfs up to 2 ' +
    'agents simultaneously. Swallowed agents enter digestion state taking 0.04 damage per tick, ' +
    'unable to act or be targeted. Escape requires either passing a 0.7 strength check (cumulative ' +
    'decay makes each attempt easier) or an external ally dealing 1.5 damage in a single hit to ' +
    'force regurgitation. The ambush does not trigger Landscape Upheaval.',
  abilitiesGranted: ['swallow_attack', 'digestion_damage', 'terrain_ambush', 'propitiation_ritual_immunity'],
  skillBonus: { combat: 0.4 },
};

// ── Phi Krasue-Vel traits ──────────────────────────────────────────────────────

export const TRAIT_NOCTURNAL_SEPARATION: SpeciesTrait = {
  id: 'nocturnal_separation',
  name: 'Nocturnal Separation',
  category: 'magical',
  description:
    'At nightfall (light below 0.3), the Phi Krasue-Vel separates into two entities: the floating ' +
    'Head (mobile predator at 1.5 speed with bioluminescent glow at 6-tile range) and the stationary ' +
    'Body (catatonic, no self-defense). They share a health pool but damage to the Body is 3x more ' +
    'effective. At dawn (light above 0.7), the Head must reattach within 20 ticks or take 0.1 damage ' +
    'per tick until reattachment or death.',
  abilitiesGranted: ['entity_separation', 'head_flight', 'bioluminescence', 'shared_health_pool'],
  skillBonus: { stealth: 0.3 },
};

export const TRAIT_VISCERAL_PREDATION: SpeciesTrait = {
  id: 'visceral_predation',
  name: 'Visceral Predation',
  category: 'physical',
  description:
    'The floating Head hunts by scent, detecting agents at 25-tile range. Preferentially attracted ' +
    'to low-health, pregnant, or sleeping agents at 2x detection range. Performs visceral latch attack ' +
    'draining 0.06 health per tick. Broken by strength check at 0.5, ally attack, or ward items ' +
    '(thorns, salt, lime) within 3 tiles which forces 15-tile flee. The trailing viscera are visible ' +
    'even in darkness.',
  abilitiesGranted: ['blood_scent_tracking', 'visceral_latch', 'health_drain', 'ward_vulnerability'],
  skillBonus: { perception: 0.4 },
};

export const TRAIT_NECK_SEAL_VULNERABILITY: SpeciesTrait = {
  id: 'neck_seal_vulnerability',
  name: 'Neck Seal Vulnerability',
  category: 'spiritual',
  description:
    'The Body\'s neck stump is the critical weak point. An agent who discovers the hidden Body can ' +
    'perform a neck seal action using ward items (thorns, salt, lime — any phi_krasue_ward tagged ' +
    'item). A sealed Body prevents reattachment: the Head cannot rejoin at dawn and takes 0.1 damage ' +
    'per tick until death. Finding the Body requires tracking the Head\'s departure trajectory (visible ' +
    'separation particle trail for 10 ticks) or identifying daytime behavioral tells (avoids garlic ' +
    'areas, never eats cooked meat, flinches from religious items within 4 tiles).',
  abilitiesGranted: ['neck_seal_mechanic', 'separation_trail', 'daytime_tells'],
  vulnerabilities: ['neck_seal_vulnerability', 'ward_item_vulnerability'],
};

// ── Jenglot-Kin traits ────────────────────────────────────────────────────────

export const TRAIT_KEEPER_BOND: SpeciesTrait = {
  id: 'keeper_bond',
  name: 'Keeper Bond',
  category: 'spiritual',
  description:
    'The Jenglot-Kin bonds to a single agent through a binding ritual requiring spiritual skill above ' +
    '0.4. The keeper receives passive bonuses: perception +0.3, spiritual +0.2, and luck modifier ' +
    '+0.15 improving probabilistic outcomes across resource gathering, crafting, and social ' +
    'interactions. The bond is exclusive — one Jenglot per keeper, one keeper per Jenglot. If the ' +
    'keeper dies, the Jenglot enters unbonded feral state. The bond can be voluntarily dissolved but ' +
    'bonuses are immediately lost.',
  abilitiesGranted: ['keeper_binding', 'perception_enhancement', 'spiritual_enhancement', 'luck_modification'],
  skillBonus: { spiritual: 0.2 },
};

export const TRAIT_BLOOD_TITHE: SpeciesTrait = {
  id: 'blood_tithe',
  name: 'Blood Tithe',
  category: 'metabolic',
  description:
    'The Jenglot must be fed blood on a 60-tick cycle. The offering agent performs a blood offering ' +
    'within 2 tiles, costing 0.08 health. If the feeding lapses: Stage 1 (60 ticks overdue) halves ' +
    'keeper bonuses. Stage 2 (120 ticks overdue) removes bonuses and emits hunger pheromones within ' +
    '5 tiles causing unease. Stage 3 (200 ticks overdue) breaks the keeper bond and enters feral ' +
    'state, actively hunting sleeping agents within 20 tiles. A blood offering at any stage resets ' +
    'the cycle immediately.',
  abilitiesGranted: ['blood_feeding', 'hunger_escalation', 'hunger_aura'],
  needsModifier: { hunger: 0.3 },
};

export const TRAIT_FERAL_FEEDING: SpeciesTrait = {
  id: 'feral_feeding',
  name: 'Feral Feeding',
  category: 'physical',
  description:
    'An unbonded or stage-3 hungry Jenglot hunts independently. Despite tiny size, it has 0.9 ' +
    'stealth rating and moves at 2.0 speed. It targets sleeping agents with a micro drain of 0.02 ' +
    'health per tick, continuing until the target wakes or an ally detects it. The drain is subtle ' +
    'enough that victims may not immediately notice health loss. A feral Jenglot can be re-bonded ' +
    'by any agent performing the binding ritual after detecting it and closing to within 1 tile.',
  abilitiesGranted: ['feral_hunt', 'micro_drain', 'sleep_detection', 'extreme_stealth'],
  skillBonus: { stealth: 0.9 },
};

// ── Yacuruna-Kin traits ───────────────────────────────────────────────────────

export const TRAIT_MIRROR_REALM: SpeciesTrait = {
  id: 'mirror_realm',
  name: 'Mirror Realm',
  category: 'magical',
  description:
    'Yacuruna-Kin establish underwater settlements creating a mirror realm zone within 15 tiles. All ' +
    'water tiles in the zone become portals to an underwater sub-layer — an inverted reflection of ' +
    'the nearest surface settlement in bioluminescent aquatic tones. Surface agents with spiritual ' +
    'skill above 0.5 can perceive the mirror realm from shore; others see normal water. The mirror ' +
    'realm functions as a separate navigable sub-layer. Yacuruna move freely between layers via any ' +
    'water tile in their zone.',
  abilitiesGranted: ['mirror_realm_creation', 'underwater_settlement', 'layer_transition', 'spiritual_perception_gate'],
  skillBonus: { spiritual: 0.4 },
};

export const TRAIT_SEDUCTIVE_ENCHANTMENT: SpeciesTrait = {
  id: 'seductive_enchantment',
  name: 'Seductive Enchantment',
  category: 'social',
  description:
    'Yacuruna-Kin target surface agents with a seduction call. Agents within 20 tiles near water must ' +
    'pass a 0.6 willpower check or begin enchantment approach — walking to the nearest mirror realm ' +
    'water tile unable to perform other actions. Once in the mirror realm, transformation begins: ' +
    'every 50 ticks one stage accrues (5 stages total). At each stage appearance changes (eyes ' +
    'migrating, feet reversing, aquatic skin tones) and desire to return decreases by 0.2. Stage 5 ' +
    'is complete irreversible transformation into a Yacuruna-Kin. A shaman with spiritual skill above ' +
    '0.7 can retrieve the victim from the water\'s edge if transformation is below stage 3, taking ' +
    '30 ticks.',
  abilitiesGranted: ['seduction_call', 'enchantment_induction', 'gradual_transformation', 'retrieval_vulnerability'],
  skillBonus: { social: 0.5 },
};

export const TRAIT_CROCODILE_RIDERS: SpeciesTrait = {
  id: 'crocodile_riders',
  name: 'Crocodile Riders',
  category: 'physical',
  description:
    'Yacuruna-Kin summon and ride large aquatic creatures as mounts within their mirror realm zone. ' +
    'Mounted Yacuruna gain 2.0 water movement speed bonus and 0.3 melee damage bonus from the ' +
    'mount\'s attacks. Mounts also patrol 25 tiles around the settlement, deterring approach and ' +
    'attacking hostile entities in mirror realm waters. Up to 4 mounts per settlement. The mounts ' +
    'are wild crocodilian entities domesticated through mirror realm influence, not summoned from ' +
    'nothing.',
  abilitiesGranted: ['mount_summoning', 'mounted_combat', 'crocodile_patrol', 'aquatic_domestication'],
  skillBonus: { leadership: 0.3 },
};

// ── Yara-ma-yha-who-Rin traits ────────────────────────────────────────────────

export const TRAIT_FIG_TREE_AMBUSH: SpeciesTrait = {
  id: 'fig_tree_ambush',
  name: 'Fig Tree Ambush',
  category: 'physical',
  description:
    'The Yara-ma-yha-who-Rin is bound to fig tree tiles, unable to stray more than 3 tiles from its ' +
    'host tree. When an agent enters an adjacent tile, it drops from the canopy instantly and latches ' +
    'on with sucker-fingers, draining 0.05 health per tick for 15 ticks or until health drops below ' +
    '0.2 floor. Victims can attempt to break free each tick with a 0.6 strength check. After ' +
    'draining, the victim enters weakened state with halved movement speed for 10 ticks.',
  abilitiesGranted: ['canopy_drop', 'sucker_drain', 'tree_binding', 'weakening_attack'],
  skillBonus: { stealth: 0.5 },
};

export const TRAIT_SWALLOW_REGURGITATE_CYCLE: SpeciesTrait = {
  id: 'swallow_regurgitate_cycle',
  name: 'Swallow Regurgitate Cycle',
  category: 'magical',
  description:
    'After draining a victim, the Yara-ma-yha-who-Rin swallows them whole (requires weakened state). ' +
    'The victim enters swallowed state — inside the creature, unable to act, taking no damage. The ' +
    'creature drinks water from the nearest source within 10 tiles and sleeps for 40 ticks. On waking, ' +
    'it regurgitates the victim alive but with one transformation increment added to a persistent ' +
    'counter. Physical changes accumulate: height reduced 8% per cycle, skin reddened, head-to-body ' +
    'ratio shifted. At 4 accumulated cycles (from any Yara-ma-yha-who), the victim is irreversibly ' +
    'transformed into a new Yara-ma-yha-who-Rin, replacing the original agent. This is the most ' +
    'extreme predation outcome in the registry.',
  abilitiesGranted: ['whole_swallow', 'transformation_increment', 'species_conversion', 'post_meal_sleep'],
  skillBonus: { combat: 0.2 },
};

export const TRAIT_PLAYING_DEAD_COUNTER: SpeciesTrait = {
  id: 'playing_dead_counter',
  name: 'Playing Dead Counter',
  category: 'social',
  description:
    'After regurgitation, if the victim performs a play dead action — remaining completely motionless ' +
    'for 15 ticks with no movement, actions, or item use — the Yara-ma-yha-who loses interest and ' +
    'returns to its tree without attempting a second cycle. If the victim moves or acts during this ' +
    'window, the creature re-drains and re-swallows immediately, accelerating transformation. The ' +
    'creature is faster than weakened agents at 1.8 speed, making escape by running futile. Knowledge ' +
    'is the primary defense — NPC agents require folklore knowledge memory to select play dead ' +
    'autonomously. Player-directed agents can always choose it.',
  abilitiesGranted: ['play_dead_detection', 'interest_loss', 'knowledge_based_defense'],
  vulnerabilities: ['play_dead_exploitable', 'patience_exploitable'],
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIES TEMPLATE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const SPECIES_SACHAMAMA_VEL: SpeciesTemplate = {
  speciesId: 'sachamama_vel',
  speciesName: 'Sachamama-Vel',
  commonName: 'Sachamama',
  bodyPlanId: 'colossal_camouflage_serpent',
  sizeCategory: 'colossal',
  averageHeight: 200,
  averageWeight: 8000,
  lifespan: 0,
  lifespanType: 'immortal',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_territorial',
  mutationRate: 0.001,
  compatibleSpecies: [],
  innateTraits: [TRAIT_TERRAIN_CAMOUFLAGE, TRAIT_LANDSCAPE_UPHEAVAL, TRAIT_SWALLOW_AMBUSH],
  traveler_epithet: 'a ridge in the earth that was not there yesterday and will swallow what rests upon it',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    dormancy_duration: 2000,
    sachamama_body_length: 12,
    perception_detect_threshold: 0.8,
    hunger_threshold: 0.3,
    upheaval_movement_speed: 0.3,
    upheaval_width: 3,
    regrowth_delay: 500,
    camouflage_regrowth_ticks: 200,
    upheaval_structure_damage: 0.8,
    ambush_trigger_ticks: 5,
    swallow_capacity: 2,
    digestion_damage_per_tick: 0.04,
    escape_strength_threshold: 0.7,
    escape_threshold_decay: 0.05,
    regurgitation_damage_threshold: 1.5,
    upheaval_fertility_bonus: 0.4,
    upheaval_water_channel_chance: 0.3,
    propitiation_ritual_cooldown: 200,
    propitiation_immunity_duration: 500,
    territorial_boundary_radius: 20,
    settlement_warning_range: 30,
    ecological_renewal_rate: 0.02,
    peaceful_coexistence_threshold: 0.6,
  },
  description:
    `The Sachamama — Mother of the Forest — is not a predator who lives in the jungle. She is the jungle, or the part of it that was here before anything else and will be here after everything else is gone. In Amazonian Quechua cosmology, documented with particular care by Eduardo Viveiros de Castro in From the Enemy's Point of View (1992) and Fernando Santos-Granero in Vital Enemies (2009), she exists as one half of a paired serpent cosmology: the Yakumama governs rivers, anaconda-infested depths, and the subaquatic domain; the Sachamama governs the terrestrial, her body so vast and so ancient that the forest floor has grown over her while she sleeps. Jesuita scholar Joaquín Regan's Hacia la tierra sin mal (1993) documents the Quechua understanding of her not as creature but as cosmological force — a geological intelligence whose hunger and movement are the same event, whose existence defines the boundary where human settlement ends and the untamed forest begins.` +
    `\n\nThat boundary is the Sachamama's primary function. She does not patrol it; she constitutes it. Communities that have learned to live alongside the Sachamama understand the relationship as one requiring acknowledgment: propitiation offerings placed on her body tiles during dormancy are the correct relational form, the ritual acknowledgment of her sovereignty over the terrestrial wild. Communities that make those offerings receive what the tradition describes as safe passage — the Sachamama's territorial immunity, which in gameplay terms is encoded as propitiation_ritual_immunity, preventing ambush from triggering for 500 ticks. This is not a loophole but the cosmologically correct relationship. Those who trespass without acknowledgment are claimed. Those who acknowledge are partners in the forest boundary she defines. The boundary itself is not hostile — it is a fact of cosmological geography that can be negotiated through ritual but not through force.` +
    `\n\nIn gameplay, TERRAIN_CAMOUFLAGE is the Sachamama-Vel's defining constraint and most dangerous feature simultaneously. She is not hiding; she is being what she is. During dormancy — minimum 2000 ticks between movements — her body resolves as 12 contiguous tiles of fallen-log and earth-mound terrain, with vegetation and moss rendering correctly on the surface. The ecosystem on her back is real and functional; organisms live there without knowing what they stand on. Agents passing across her body tiles receive no indication unless their perception score exceeds 0.8, the highest detection threshold in the Folklorist registry. The camouflage operates at the tile-type level, not as a stealth modifier, meaning perception-boosting equipment alone cannot guarantee detection. Only activation — hunger or territorial breach — reveals what the terrain was. LANDSCAPE_UPHEAVAL fires when those thresholds are exceeded: movement at 0.3 speed multiplier, 3-tile corridor on each side, structural damage of 0.8 sufficient to destroy most construction. But the upheaval is not destruction in the Quechua framing — it is the land breathing, the forest renewing itself through geological transformation. The churned earth left in her wake carries upheaval_fertility_bonus (0.4), meaning new growth establishes faster there than anywhere else. New water channels created at upheaval_water_channel_chance (0.3) may become permanent features of the map. Clearings created by upheaval become primary sites of succession. What looks like catastrophe to a settlement is ecological revision at geological scale. SWALLOW_AMBUSH completes the territorial enforcement: agents lingering on body tiles for more than 5 consecutive ticks without propitiation immunity trigger engulfment of up to two simultaneously. Digestion state deals 0.04 damage per tick; escape requires incremental strength checks or a single massive external blow.` +
    `\n\nThe Sachamama's immortality is not biological persistence but cosmological permanence — she is the memory of the land, the record of every forest that has grown over every version of her body across geological time. Settlements that learn to read upheaval zones as ecological history rather than disaster zones, that understand the territorial_boundary_radius (20 tiles) as a negotiated space rather than a threat perimeter, can coexist with the Sachamama in a relationship that the tradition describes as mutual: she defines the forest boundary, and they live within the settlement boundary, and propitiation is the protocol that keeps the two from colliding.` +
    `\n\nThe -vel suffix places the Sachamama-Vel in the Traveler taxonomic class — beings whose cosmological scope is not confined to a single world. Her fundamental nature is geological permanence. She does not die when a game instance ends; she becomes terrain in the new world, dormant across whatever ticks of transition pass. The trail of altered topography she leaves in each world — new channels, churned earth, upheaval clearings — is the permanent record of her existence in that instance, readable by any agent with sufficient geological knowledge as the path of something vast that rested here once and may rest here again.`,
};

export const SPECIES_PHI_KRASUE_VEL: SpeciesTemplate = {
  speciesId: 'phi_krasue_vel',
  speciesName: 'Phi Krasue-Vel',
  commonName: 'Phi Krasue',
  bodyPlanId: 'split_humanoid_aerial',
  sizeCategory: 'medium',
  averageHeight: 165,
  averageWeight: 55,
  lifespan: 300,
  lifespanType: 'long_lived',
  maturityAge: 20,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'embedded_predator',
  mutationRate: 0.001,
  compatibleSpecies: [],
  innateTraits: [TRAIT_NOCTURNAL_SEPARATION, TRAIT_VISCERAL_PREDATION, TRAIT_NECK_SEAL_VULNERABILITY],
  traveler_epithet: 'a light drifting where no lantern should be, trailing something wet beneath it',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    separation_light_threshold: 0.3,
    reattachment_light_threshold: 0.7,
    head_flight_speed: 1.5,
    bioluminescence_range: 6,
    body_damage_multiplier: 3.0,
    reattachment_window: 20,
    dawn_damage_per_tick: 0.1,
    blood_scent_range: 25,
    priority_target_scent_multiplier: 2.0,
    latch_drain_rate: 0.06,
    latch_break_strength: 0.5,
    ward_range: 3,
    ward_flee_distance: 15,
    trail_visible_duration: 10,
    religious_item_flinch_range: 4,
    settlement_proximity_range: 30,
    curse_transmission_threshold: 0.1,
    curse_transmission_chance: 0.15,
    curse_incubation: 500,
  },
  description:
    `The Phi Krasue is among the most thoroughly documented spirits in the Thai folklore corpus, treated with systematic care by Phraya Anuman Rajadhon in his 1968 Essays on Thai Folklore and revisited by Pattana Kitiarsa in Mediums, Monks, and Amulets (2012) as a figure that concentrates anxieties about bodily integrity, female transgression, and the vulnerability of the domestic threshold. She appears as a beautiful woman by day, indistinguishable from any other member of the settlement, and separates at nightfall into a floating luminous head trailing viscera — the organs of digestion visible, still functioning, beneath the severed neck. Cognate forms appear across mainland and maritime Southeast Asia under different names: the Cambodian ap, the Malay penanggalan, the Burmese kaso, the Lao phi kasu. Each variant shares the central logic of the split: a being who is two things at once, whose daylight presence and nocturnal predation are simultaneous ongoing conditions rather than transformations.` +
    `\n\nNOCTURNAL_SEPARATION encodes this duality as a genuine two-entity mechanic. Below light threshold 0.3, the Phi Krasue-Vel divides: the Head launches at 1.5 movement speed with bioluminescent glow extending 6 tiles, while the Body becomes catatonic and completely defenseless at the separation site. They share a single health pool, but damage dealt to the Body is tripled in effectiveness — discovering the hidden Body is therefore the tactical priority for any agent facing a Phi Krasue. At dawn (light above 0.7), the Head has a 20-tick window to reattach; failure to close that window deals 0.1 damage per tick until reattachment occurs or the creature dies. VISCERAL_PREDATION drives the Head's hunting: blood scent tracks targets at 25-tile range, with priority detection at 2x range for low-health, pregnant, or sleeping agents. The visceral latch drains 0.06 health per tick and can be broken by ward items within 3 tiles — thorns, salt, and lime, all materials with deep folkloric anti-krasue valence. NECK_SEAL_VULNERABILITY provides the decisive counterplay: an agent who locates the Body and performs the neck seal action using any phi_krasue_ward tagged item permanently blocks reattachment, condemning the Head to dawn dissolution.` +
    `\n\nThe curse transmission mechanic encodes the Phi Krasue's most insidious dimension: draining any agent below 0.1 health carries a 15% chance to begin a 500-tick incubation that will transform the victim into a new Phi Krasue-Vel at completion. This is not announced to the target. The new Phi Krasue will appear to behave normally until the first nightfall triggers separation for the first time, at which point the original agent identity is overwritten. The -vel suffix marks the Phi Krasue-Vel as a predator whose hunting pattern — embedded in a settlement by day, parasitic by night — is portable across worlds. Wherever there are communities with sleeping members and no ward items near the door, a Phi Krasue-Vel can establish herself and persist indefinitely.`,
};

export const SPECIES_JENGLOT_KIN: SpeciesTemplate = {
  speciesId: 'jenglot_kin',
  speciesName: 'Jenglot-Kin',
  commonName: 'Jenglot',
  bodyPlanId: 'tiny_mummified_humanoid',
  sizeCategory: 'tiny',
  averageHeight: 12,
  averageWeight: 0.1,
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'symbiotic_bonded',
  mutationRate: 0.001,
  compatibleSpecies: [],
  innateTraits: [TRAIT_KEEPER_BOND, TRAIT_BLOOD_TITHE, TRAIT_FERAL_FEEDING],
  traveler_epithet: 'a thing smaller than a hand that drinks what keeps you alive and gives back what you cannot earn alone',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    spiritual_skill_bind_threshold: 0.4,
    keeper_perception_bonus: 0.3,
    keeper_spiritual_bonus: 0.2,
    keeper_luck_modifier: 0.15,
    feeding_cooldown: 60,
    feeding_range: 2,
    blood_offering_health_cost: 0.08,
    hunger_stage_1: 60,
    hunger_stage_2: 120,
    hunger_stage_3: 200,
    hunger_aura_range: 5,
    feral_hunt_range: 20,
    feral_stealth: 0.9,
    feral_movement_speed: 2.0,
    feral_drain_rate: 0.02,
    binding_range: 1,
  },
  description:
    `The jenglot sits in an unusually ambiguous position within the Javanese dukun tradition as documented by Koentjaraningrat in Javanese Culture (1985) and Clifford Geertz in The Religion of Java (1960): it is simultaneously a creature and a crafted object, a living familiar and a carved talisman, with practitioners disaggreeing about whether jenglots found in the wild are genuine discovered entities or manufactured ones whose animation was induced through ritual. In either reading, the relationship structure is identical — a dukun or spiritually skilled practitioner maintains the jenglot through periodic blood feeding, and the jenglot in return amplifies the practitioner's capacity to perceive, intuit, and influence. The feeding obligation is not metaphorical. Jenglot keepers in documented practice kept small vials of blood for scheduled offerings; the obligation was understood as the maintenance cost of a power that exceeded anything achievable without the bond. Neglect did not simply end the relationship. It introduced danger.` +
    `\n\nKEEPER_BOND encodes the symbiosis as a binding ritual gated behind spiritual skill 0.4 — meaningful investment but achievable early in a spiritual development path. Once bonded, the keeper gains perception +0.3, spiritual +0.2, and a luck modifier of +0.15 that improves probabilistic outcomes across gathering, crafting, and social systems. The bond is strictly exclusive in both directions. BLOOD_TITHE implements the maintenance obligation as a three-stage escalation: Stage 1 (60 ticks overdue) halves keeper bonuses, Stage 2 (120 ticks overdue) removes bonuses entirely and begins emitting a hunger pheromone aura within 5 tiles that causes nearby agents to register unease, and Stage 3 (200 ticks overdue) breaks the bond entirely and transitions the Jenglot-Kin to active feral state targeting sleeping agents within 20 tiles. Blood offering at any stage immediately resets the cycle — the escalation is reversible until the bond breaks. FERAL_FEEDING describes the Jenglot-Kin's unbonded mode: 0.9 stealth rating and 2.0 movement speed make it nearly undetectable, and its micro drain of 0.02 health per tick is calibrated to be subtle enough that sleeping victims may not identify the source until significant damage has accumulated.` +
    `\n\nThe -kin suffix marks the Jenglot-Kin within the Folklorist taxonomic system as a socially-organized species — one that exists not as a solitary entity but exclusively in relation to another agent. It is the first true symbiont in the Folklorist registry. Unlike the vel species (whose portable power operates independently) or the rin species (whose dangers emerge from known behavioral patterns), the Jenglot-Kin has no meaningful existence outside the keeper relationship. Feral state is not freedom — it is the Jenglot-Kin functioning below its design parameters, a warning about what happens when the social bond that defines the species is severed by neglect. A keeper who feeds the Jenglot on schedule gains some of the most reliable passive bonuses available in the game; a keeper who forgets will find those bonuses inverted into a mobile hazard sleeping agents cannot see coming.`,
};

export const SPECIES_YACURUNA_KIN: SpeciesTemplate = {
  speciesId: 'yacuruna_kin',
  speciesName: 'Yacuruna-Kin',
  commonName: 'Yacuruna',
  bodyPlanId: 'aquatic_humanoid_beautiful',
  sizeCategory: 'medium',
  averageHeight: 175,
  averageWeight: 70,
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 25,
  gestationPeriod: 200,
  sapient: true,
  socialStructure: 'underwater_civilization',
  mutationRate: 0.002,
  compatibleSpecies: [],
  innateTraits: [TRAIT_MIRROR_REALM, TRAIT_SEDUCTIVE_ENCHANTMENT, TRAIT_CROCODILE_RIDERS],
  traveler_epithet: 'a face beneath the water surface that looks exactly like yours but is looking up',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    mirror_realm_radius: 15,
    spiritual_perception_threshold: 0.5,
    seduction_range: 20,
    seduction_resistance_threshold: 0.6,
    transformation_tick_interval: 50,
    transformation_stages_max: 5,
    surface_desire_decay: 0.2,
    retrieval_max_stage: 3,
    retrieval_ceremony_duration: 30,
    retrieval_spiritual_threshold: 0.7,
    mounted_speed_bonus: 2.0,
    mounted_combat_bonus: 0.3,
    crocodile_patrol_range: 25,
    max_mounts_per_settlement: 4,
    settlement_min_tiles: 8,
    surface_settlement_proximity: 40,
  },
  description:
    `The Yacuruna — water people — are documented in Amazonian Quechua oral tradition by Jesuita scholar Joaquín Regan in Hacia la tierra sin mal (1993) and in the ethnobotanical literature of Barbira Freedman and Cárdenas Klusmann (2008, 2015) as a full civilization mirroring the surface world below the rivers. Their settlements are described as inversions of the nearest human community: architecturally recognizable but reflected, illuminated by bioluminescent organisms rather than fire, navigated on the backs of crocodiles and anacondas rather than on foot. The yacuruna are not hostile in the conventional sense — they are acquisitive. They want surface-dwellers to join them, and their seduction is patient and incremental. A person who wades too often in the wrong river, who lingers at the waterline when the call comes, does not experience a single dramatic abduction but a gradual reorientation: desires shifting, the pull of the surface diminishing, physical changes accumulating until the transformation is complete and the person has become what they were being called toward all along.` +
    `\n\nMIRROR_REALM is a sub-layer system — the first in the Folklorist registry — establishing a full navigable underwater space within 15 tiles of a Yacuruna settlement. The mirror realm reflects the nearest surface settlement in bioluminescent aquatic tones and is accessible through any water tile in the zone. Agents with spiritual skill above 0.5 can perceive the mirror realm from shore; others see ordinary water and have no indication that a second layer exists beneath it. SEDUCTIVE_ENCHANTMENT drives the transformation pipeline: agents within 20 tiles near water must pass a 0.6 willpower check when the seduction call sounds, or enter enchanted approach state — compelled movement toward the water, all other actions locked out. Once in the mirror realm, transformation accrues one stage every 50 ticks across a 5-stage progression, with surface desire decaying 0.2 per stage. Stage 5 is complete irreversible species conversion. The shamanic retrieval mechanic (spiritual skill 0.7, reachable before stage 3, 30-tick ceremony) models the recorded counter-practice in which specialist healers entered altered states to retrieve enchanted individuals from the boundary of the water. CROCODILE_RIDERS provides the Yacuruna-Kin's military dimension: up to 4 domesticated crocodilian mounts patrol 25 tiles around the settlement, and mounted Yacuruna gain 2.0 water speed and 0.3 melee bonus.` +
    `\n\nThe -kin suffix marks the Yacuruna-Kin as the first full civilization species in the Folklorist registry — not individuals with unusual traits but a society with a settlement structure, a territorial defense system, a reproduction pipeline, and a cultural logic of acquisition that treats transformation as incorporation rather than destruction. The Yacuruna-Kin does not kill its victims; it converts them. The cross-game portability of this species takes a particular form: wherever bodies of water exist in the multiverse's game worlds, Yacuruna-Kin settlements can establish their mirror realms below, invisible to spiritual skill below 0.5, conducting their patient seduction of the surface population above.`,
};

export const SPECIES_YARA_MA_YHA_WHO_RIN: SpeciesTemplate = {
  speciesId: 'yara_ma_yha_who_rin',
  speciesName: 'Yara-ma-yha-who-Rin',
  commonName: 'Yara-ma-yha-who',
  bodyPlanId: 'small_red_arboreal_humanoid',
  sizeCategory: 'small',
  averageHeight: 120,
  averageWeight: 35,
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_arboreal',
  mutationRate: 0.001,
  compatibleSpecies: [],
  innateTraits: [TRAIT_FIG_TREE_AMBUSH, TRAIT_SWALLOW_REGURGITATE_CYCLE, TRAIT_PLAYING_DEAD_COUNTER],
  traveler_epithet: 'a red thing in the canopy that will eat you and spit you out shorter each time until you are one of them',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    tree_tether_range: 3,
    sucker_drain_rate: 0.05,
    sucker_drain_duration: 15,
    drain_floor: 0.2,
    sucker_break_strength: 0.6,
    weakened_duration: 10,
    water_seek_range: 10,
    sleep_duration: 40,
    transformation_increment: 1,
    height_reduction_per_cycle: 0.08,
    transformation_threshold: 4,
    play_dead_duration: 15,
    post_regurgitation_chase_speed: 1.8,
  },
  description:
    `The Yara-ma-yha-who appears in the Aboriginal Australian oral tradition of southeastern Australia, documented by W. Ramsay Smith in Myths and Legends of the Australian Aboriginals (1930) and A.W. Reed in Aboriginal Myths, Legends and Fables (1982), as a small red creature that lives in fig trees and reproduces not through any biological process but by iterative consumption and regurgitation of its victims. It is not large. It is not powerful in the way that colossal predators are powerful. Its danger is entirely procedural: a victim who survives one encounter is smaller; a victim who survives three encounters is much shorter and somewhat redder; a victim who reaches the fourth cycle wakes from the final regurgitation as a new Yara-ma-yha-who themselves, the original person overwritten by the accumulated physical transformation. The creature is well-fed and slow — predictable in its post-meal sleep, consistent in its cycle, vulnerable to a defense that requires only stillness and knowledge. That defense is the point. In traditional accounts, travelers who knew about the Yara-ma-yha-who knew what to do when spit out. Those who did not were converted.` +
    `\n\nFIG_TREE_AMBUSH establishes the terrain binding: the Yara-ma-yha-who-Rin cannot move more than 3 tiles from its host fig tree tile, making its location predictable and its threat zone mappable by any agent who has identified the tree. The canopy drop triggers the instant an agent enters an adjacent tile — no warning, immediate sucker latch, 0.05 drain per tick for up to 15 ticks or until health hits the 0.2 floor. Strength checks at 0.6 allow gradual escape, and the post-drain weakened state halves movement speed for 10 ticks. SWALLOW_REGURGITATE_CYCLE requires weakened state to activate, meaning the full predation cycle is blocked against an agent who successfully resists the initial drain. Once swallowed, the victim is entirely safe — no ongoing damage — while the creature seeks water within 10 tiles and sleeps for 40 ticks. The regurgitation adds one transformation increment to a persistent counter tracked across the agent's entire history. At 4 accumulated increments from any combination of Yara-ma-yha-who encounters, species conversion triggers irreversibly. PLAYING_DEAD_COUNTER encodes the single known defense: 15 consecutive ticks of complete inaction after regurgitation causes the creature to lose interest and return to its tree. The creature cannot be outrun at 1.8 speed by a weakened victim. It can only be outlasted by someone who knows what it wants and knows that what it wants is the opposite of stillness.` +
    `\n\nThe -rin suffix marks the Yara-ma-yha-who-Rin as a trickster species in the Folklorist taxonomy: a being whose danger is not raw power but a predictable cycle that punishes ignorance and rewards patience. It is the first species-conversion predator in the registry — the first species that does not kill but reproduces by overwriting its victims — and the first species whose primary counter is encoded as a knowledge gate rather than a material requirement. NPC agents with folklore knowledge memory can select play dead autonomously after regurgitation; NPC agents without that knowledge will attempt flight and be caught. Player-directed agents can always choose it, provided the player knows to try. In cross-game context, the -rin suffix signals to travelers that predictable behavior patterns exist to be learned: the Yara-ma-yha-who-Rin will always be near a fig tree, will always sleep after swallowing, and will always lose interest in a still body. The creature is not cruel. It is simply consistent, and consistency is something a patient traveler can use.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY OBJECT
// ─────────────────────────────────────────────────────────────────────────────

export const SPRINT16_FOLKLORIST_SPECIES_REGISTRY: Record<string, SpeciesTemplate> = {
  sachamama_vel: SPECIES_SACHAMAMA_VEL,
  phi_krasue_vel: SPECIES_PHI_KRASUE_VEL,
  jenglot_kin: SPECIES_JENGLOT_KIN,
  yacuruna_kin: SPECIES_YACURUNA_KIN,
  yara_ma_yha_who_rin: SPECIES_YARA_MA_YHA_WHO_RIN,
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSOR
// ─────────────────────────────────────────────────────────────────────────────

export function getSprint16FolkloristSpecies(speciesId: string): SpeciesTemplate | undefined {
  return SPRINT16_FOLKLORIST_SPECIES_REGISTRY[speciesId];
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────

export function validateSprint16FolkloristSpecies(speciesId: string) {
  const template = getSprint16FolkloristSpecies(speciesId);
  if (!template) {
    return { valid: false, errors: [`Unknown species ID: ${speciesId}`] };
  }
  return validateAgainstMUL1357Schema(template);
}

export function validateAllSprint16Species() {
  const results = Object.keys(SPRINT16_FOLKLORIST_SPECIES_REGISTRY).map((id) =>
    validateAgainstMUL1357Schema(SPRINT16_FOLKLORIST_SPECIES_REGISTRY[id]!),
  );
  const failures = results.filter((r) => !r.valid);
  if (failures.length > 0) {
    throw new Error(
      `Sprint 16 species validation failed:\n${failures.map((f) => `  ${f.speciesId}: ${f.violations.join(', ')}`).join('\n')}`,
    );
  }
  return results;
}
