/**
 * Folklorist Species Registry — Sprint 15 Theme C Batch
 *
 * Five species from underrepresented folklore traditions:
 * - Solomon Islands (Pacific): Adaro-Vel
 * - Tatar/Bashkir (Central Asia): Shurale-Rin
 * - Kazakh-Kyrgyz (Central Asia): Albasti-Vel
 * - Sawa/Cameroon (Sub-Saharan Africa): Jengu-Vel
 * - Māori/New Zealand (Pacific): Taniwha-Vel
 *
 * Designed by Scheherazade (Folklorist) — MUL-3839
 *
 * Sources:
 * - Solomon Islands: Codrington, The Melanesians (1891); Fox, The Threshold of the Pacific (1924)
 * - Tatar/Bashkir: Tukay, Şüräle (1907); Bashkir narodnye skazki compilations
 * - Kazakh-Kyrgyz: Basilov, Shamanism in Central Asia (1992); Johansen, Shamanistic Rituals (2006)
 * - Sawa: Austen & Derrick, Middlemen of the Cameroons Rivers (1999); de Rosny, Healers in the Night (1985)
 * - Māori: Orbell, The Natural World of the Maori (1985); Best, Maori Religion and Mythology (1924)
 */

import type { SpeciesTrait } from '../components/SpeciesComponent.js';
import type { SpeciesTemplate } from './SpeciesRegistry.js';
import { validateAgainstMUL1357Schema } from './FolkloristSpeciesRegistry.js';
export type { MUL1357ValidationResult } from './FolkloristSpeciesRegistry.js';

// ─────────────────────────────────────────────────────────────────────────────
// TRAIT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── Adaro-Vel traits ──────────────────────────────────────────────────────────

export const TRAIT_RAINBOW_RIDING: SpeciesTrait = {
  id: 'rainbow_riding',
  name: 'Rainbow Riding',
  category: 'magical',
  description:
    'During rain weather events, the Adaro-Vel can traverse any two rain-affected tiles ' +
    'via diagonal aerial rainbow paths at extraordinary speed. The rainbow is both vehicle ' +
    'and weapon platform — their aerial transit cannot be interrupted mid-arc. Outside of ' +
    'rain, this power goes entirely dormant; the Adaro-Vel cannot fly or leap between tiles ' +
    'and must move at ground speed.',
  abilitiesGranted: ['rainbow_path_movement', 'rain_detection', 'aerial_transit'],
  skillBonus: { athletics: 0.3 },
};

export const TRAIT_POISONOUS_VOLLEY: SpeciesTrait = {
  id: 'poisonous_volley',
  name: 'Poisonous Volley',
  category: 'physical',
  description:
    'The Adaro-Vel launches living flying fish as ranged projectiles, each coated with ' +
    'venom. Targets struck enter a poisoned state, taking damage every tick for the ' +
    'duration. Agile enough agents may dodge incoming volleys if their agility surpasses ' +
    'the dodge threshold — standing still or being encumbered makes evasion nearly ' +
    'impossible. The Adaro-Vel can fire while descending along a rainbow arc, making the ' +
    'attack nearly impossible to anticipate.',
  abilitiesGranted: ['flying_fish_projectile', 'poison_application', 'ranged_attack'],
  skillBonus: { combat: 0.2, ranged: 0.4 },
};

export const TRAIT_SOLAR_ANCHOR: SpeciesTrait = {
  id: 'solar_anchor',
  name: 'Solar Anchor',
  category: 'spiritual',
  description:
    'In clear weather, the Adaro-Vel retreats to the highest available elevation tile and ' +
    'ascends into the sun — effectively exiting the mortal plane. While fully anchored it ' +
    'cannot be targeted, attacked, or perceived by other agents. Solar exposure steadily ' +
    'restores its vitality. When rain returns and clouds block the sun, it descends ' +
    'immediately via rainbow, fully reconstituted and active. This cycle makes the ' +
    'Adaro-Vel a purely storm-bound threat: unstoppable in rain, completely unreachable in ' +
    'sun.',
  abilitiesGranted: ['solar_retreat', 'elevation_seeking', 'sun_healing', 'mortal_plane_exit'],
  needsModifier: { energy: -0.3 },
};

// ── Shurale-Rin traits ────────────────────────────────────────────────────────

export const TRAIT_TICKLE_AMBUSH: SpeciesTrait = {
  id: 'tickle_ambush',
  name: 'Tickle Ambush',
  category: 'social',
  description:
    'Hidden within forest tiles, the Shurale-Rin waits in silence until a victim enters ' +
    'ambush range. It then seizes the target and begins tickling with its unnaturally long ' +
    'fingers. The afflicted agent enters helpless laughter — utterly unable to act while ' +
    'stamina drains each tick. The laughter is contagious: nearby agents who fail a ' +
    'willpower check may be dragged into the same helpless state. Exiting forest tiles ' +
    'breaks the ambush setup; this is a wholly terrain-dependent power.',
  abilitiesGranted: [
    'forest_ambush',
    'tickle_attack',
    'laughter_contagion',
    'helpless_laughter_inflict',
  ],
  skillBonus: { stealth: 0.4 },
};

export const TRAIT_STAR_COUNTING_COMPULSION: SpeciesTrait = {
  id: 'star_counting_compulsion',
  name: 'Star Counting Compulsion',
  category: 'social',
  description:
    'On clear nights when stars are visible, the Shurale-Rin becomes completely absorbed ' +
    'in counting them. It enters a deep trance, ignoring all environmental stimuli: ' +
    'approaching agents, sounds, even direct contact. It cannot attack, flee, or defend ' +
    'itself for the duration. The trance breaks only at dawn or when cloud cover obscures ' +
    'the stars. A knowledgeable traveler who times their approach correctly can exploit ' +
    'this window entirely without risk.',
  abilitiesGranted: ['star_counting_trance', 'night_vulnerability'],
  vulnerabilities: ['star_counting_exploitable'],
};

export const TRAIT_HYDROPHOBIA: SpeciesTrait = {
  id: 'hydrophobia',
  name: 'Hydrophobia',
  category: 'physical',
  description:
    'The Shurale-Rin cannot cross water tiles and takes ongoing damage from sustained ' +
    'water contact. Rain tiles impose a severe movement penalty as the creature instinctively ' +
    'recoils. This creates natural sanctuaries: rivers, lakes, and rain-soaked clearings all ' +
    'serve as impassable barriers. A traveler who understands this vulnerability can exploit ' +
    'waterways as safe corridors or use the finger-trap escape (strength check against ' +
    'finger_trap_escape_strength) when caught in a log-wedge situation from folklore.',
  abilitiesGranted: ['water_avoidance', 'rain_weakness'],
  vulnerabilities: ['water_vulnerability'],
};

// ── Albasti-Vel traits ────────────────────────────────────────────────────────

export const TRAIT_SLEEP_PREDATION: SpeciesTrait = {
  id: 'sleep_predation',
  name: 'Sleep Predation',
  category: 'magical',
  description:
    'The Albasti-Vel senses sleeping or resting agents within detection range and ' +
    'silently approaches to perform a chest press. While the press continues, the ' +
    'target\'s stamina drains steadily as breath is stolen. The target cannot wake ' +
    'unaided — only a nearby ally performing a wake intervention, or an iron item in ' +
    'the target\'s inventory (which auto-repels the Albasti), can break the attack. ' +
    'A target drained to zero stamina suffers a long-term exhaustion debuff that ' +
    'persists long after the encounter ends. This makes iron inventory management a ' +
    'meaningful survival consideration for sleeping agents.',
  abilitiesGranted: [
    'sleep_detection',
    'chest_press_attack',
    'breath_stealing',
    'wake_intervention_counter',
  ],
  skillBonus: { stealth: 0.5 },
};

export const TRAIT_FAMILIAR_FORM: SpeciesTrait = {
  id: 'familiar_form',
  name: 'Familiar Form',
  category: 'magical',
  description:
    'The Albasti-Vel can shapeshift into the appearance of any agent the target holds ' +
    'in high regard — a friend, companion, or loved one. While wearing this form, the ' +
    'target\'s trust response suppresses fight-or-flight instincts, preventing escape or ' +
    'combat. Detection requires strong spiritual skill; an untrained target has almost ' +
    'no chance of seeing through the disguise. Shifting between forms costs stamina, ' +
    'limiting how frequently the Albasti can cycle through appearances. This mechanic ' +
    'creates a social vulnerability tied directly to relationship scores.',
  abilitiesGranted: ['shapeshift_familiar', 'trust_exploitation', 'spiritual_detection_counter'],
  skillBonus: { deception: 0.5 },
};

export const TRAIT_IRON_WARD: SpeciesTrait = {
  id: 'iron_ward',
  name: 'Iron Ward',
  category: 'physical',
  description:
    'Iron objects exert a repulsive field on the Albasti-Vel. Any agent carrying iron ' +
    'items is effectively immune to approach: the Albasti detects iron at range and ' +
    'cannot close the distance. Iron structure tiles function as walls. True-name ' +
    'revelation — achieved through sufficiently high spiritual skill — also neutralises ' +
    'the Albasti entirely. These two counters create concrete crafting and progression ' +
    'incentives: acquiring iron protects sleepers, and developing spiritual skill ' +
    'unlocks the deeper defence of the true name.',
  abilitiesGranted: ['iron_repulsion', 'iron_detection'],
  vulnerabilities: ['iron_vulnerability', 'true_name_vulnerability'],
};

// ── Jengu-Vel traits ──────────────────────────────────────────────────────────

export const TRAIT_MIENGU_HEALING: SpeciesTrait = {
  id: 'miengu_healing',
  name: 'Miengu Healing',
  category: 'spiritual',
  description:
    'The Jengu-Vel radiates restorative power from water tiles. Agents within healing ' +
    'range have disease conditions, poison states, and debuffs steadily cleared, while ' +
    'health is restored each tick. Effectiveness scales with the target\'s spiritual ' +
    'skill — a spiritually attuned beneficiary receives dramatically enhanced healing. ' +
    'The Jengu must be standing in water for the effect to activate; dry land breaks ' +
    'the connection entirely. This makes Jengu-guarded rivers and coastal pools ' +
    'valuable safe zones worth protecting and navigating toward.',
  abilitiesGranted: ['disease_cure', 'poison_cure', 'debuff_cleanse', 'health_restoration'],
  skillBonus: { healing: 0.6 },
};

export const TRAIT_FORTUNE_BLESSING: SpeciesTrait = {
  id: 'fortune_blessing',
  name: 'Fortune Blessing',
  category: 'spiritual',
  description:
    'Agents who make offerings or prayers at water tiles near the Jengu-Vel receive a ' +
    'fortune blessing that improves outcomes across resource gathering, crafting, and ' +
    'social interaction. The blessing persists for a fixed duration before requiring ' +
    'renewal; the Jengu can only bestow each blessing after a cooldown period, ' +
    'preventing exploitation. This models the Ngondo ceremonial relationship between ' +
    'the Sawa peoples and their river spirits: reciprocal, periodic, and contingent ' +
    'on respectful approach.',
  abilitiesGranted: ['fortune_grant', 'offering_detection', 'blessing_application'],
  skillBonus: { spiritual: 0.3 },
};

export const TRAIT_RIVER_SOVEREIGNTY: SpeciesTrait = {
  id: 'river_sovereignty',
  name: 'River Sovereignty',
  category: 'magical',
  description:
    'The Jengu-Vel holds dominion over its stretch of river or coastline. It can ' +
    'conjure whirlpool tiles that trap and hold hostile entities, calm turbulent water ' +
    'for friendly passage, or impose current resistance on enemies to slow their ' +
    'advance. This territorial control makes the Jengu an active environmental factor ' +
    'rather than a passive healer: a Jengu-held waterway is genuinely safer for ' +
    'allies and genuinely more dangerous for those who arrive with hostile intent.',
  abilitiesGranted: [
    'whirlpool_creation',
    'water_calming',
    'current_control',
    'aquatic_territory',
  ],
  skillBonus: { leadership: 0.2 },
};

// ── Taniwha-Vel traits ────────────────────────────────────────────────────────

export const TRAIT_FORM_SHIFTING: SpeciesTrait = {
  id: 'form_shifting',
  name: 'Form Shifting',
  category: 'physical',
  description:
    'The Taniwha-Vel cycles between four distinct forms, each suited to different ' +
    'tactical roles. Reptilian form maximises melee combat effectiveness but is slow. ' +
    'Shark form delivers exceptional water speed and solid combat capability. Log form ' +
    'renders the Taniwha indistinguishable from terrain — perfectly stealthy, but ' +
    'unable to act offensively. Whale form trades speed for devastating area knockback, ' +
    'displacing multiple entities simultaneously. Each transition costs stamina and ' +
    'triggers a cooldown, requiring deliberate form selection rather than rapid cycling.',
  abilitiesGranted: [
    'reptile_form',
    'shark_form',
    'log_form',
    'whale_form',
    'form_transition',
  ],
  skillBonus: { adaptability: 0.4 },
};

export const TRAIT_KAITIAKI_BINDING: SpeciesTrait = {
  id: 'kaitiaki_binding',
  name: 'Kaitiaki Binding',
  category: 'spiritual',
  description:
    'The Taniwha-Vel is bound to a specific waterway, pool, or cave tile cluster as its ' +
    'kaitiaki — its sacred guardianship obligation. Friendly agents within the binding ' +
    'range receive passive damage reduction from the guardian\'s protective presence. ' +
    'Hostile agents feel territorial fear that elevates their fear drive, destabilising ' +
    'their decision-making. If the bound location is damaged or polluted, the Taniwha ' +
    'enters a rage state, dramatically multiplying its damage output until the ' +
    'desecration is resolved. This creates an ecological protection incentive deeply ' +
    'rooted in Māori tikanga.',
  abilitiesGranted: [
    'kaitiaki_protection',
    'territorial_fear_aura',
    'pollution_rage',
    'guardian_binding',
  ],
  skillBonus: { perception: 0.3 },
};

export const TRAIT_TIDAL_COMMAND: SpeciesTrait = {
  id: 'tidal_command',
  name: 'Tidal Command',
  category: 'magical',
  description:
    'Within water tiles, the Taniwha-Vel can generate tidal surges that push entities ' +
    'outward a significant distance, scatter crowds, or break formations. Alternatively, ' +
    'it can summon whirlpool pulls, drawing targets inward toward its position. It can ' +
    'also fully calm water, negating all currents and environmental hazards for allied ' +
    'passage. A cooldown enforces tactical spacing between these interventions, ' +
    'preventing the Taniwha from simply cycling through tidal effects in rapid ' +
    'succession.',
  abilitiesGranted: [
    'tidal_surge',
    'whirlpool_pull',
    'water_calming',
    'current_manipulation',
  ],
  skillBonus: { combat: 0.2 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIES TEMPLATE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const SPECIES_ADARO_VEL: SpeciesTemplate = {
  speciesId: 'adaro_vel',
  speciesName: 'Adaro-Vel',
  commonName: 'Adaro',
  bodyPlanId: 'fish_humanoid_aerial',
  sizeCategory: 'medium',
  averageHeight: 180,
  averageWeight: 75,
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_hunter',
  mutationRate: 0.002,
  compatibleSpecies: [],
  innateTraits: [TRAIT_RAINBOW_RIDING, TRAIT_POISONOUS_VOLLEY, TRAIT_SOLAR_ANCHOR],
  traveler_epithet: 'a shadow that rides the rain and strikes from the arc of light',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    rainbow_speed_multiplier: 3.0,
    rain_detection_range: 50,
    volley_range: 15,
    poison_duration: 30,
    poison_damage_per_tick: 0.03,
    dodge_threshold: 0.5,
    solar_heal_rate: 0.05,
    solar_retreat_elevation_preference: 0.9,
  },
  description: `The Adaro-Vel emerges from the oral tradition of San Cristobal — now Makira — in the Solomon Islands, documented by R.H. Codrington in 1891 and later elaborated by C.E. Fox in 1924. They are understood as malevolent water spirits: half-human, half-fish, with a swordfish horn projecting from the forehead and gill slits visible along the neck. Unlike the benevolent spirits of many Pacific traditions, the Adaro are predatory and deliberately cruel. They dwell in the sun itself and can only reach the mortal world when rain falls, because the rainbow serves as their bridge between the solar realm and the earth below. Without rain, there is no bridge; without the bridge, there is no danger.

In gameplay, this cycle is the Adaro-Vel's defining constraint. The SOLAR_ANCHOR trait represents their sun-dwelling nature directly: in clear weather, they retreat to the highest elevation tile and fully exit the mortal plane — untargetable, invisible, unreachable, slowly healing. The moment rain begins, they descend via diagonal aerial rainbow paths (RAINBOW_RIDING), moving at three times normal speed between any two rain-affected tiles. The descent is their attack window. POISONOUS_VOLLEY completes the threat: from any point along the rainbow arc, the Adaro launches living flying fish as venomous projectiles at up to fifteen tiles' distance. Targets struck are poisoned for thirty ticks. Agile agents can dodge; encumbered or stationary agents almost certainly cannot.

The -vel suffix places this spirit in the Traveler taxonomic classification — a designation for beings whose native cosmology is not bound to a single world. In the shared multiverse context, vel-suffixed species have been observed crossing between game instances along channels that approximate their original mythological transit routes. For the Adaro-Vel, those routes are weather-dependent: their cross-game movement is only possible during rain events in the destination world. A world without rain is a world they cannot enter.`,
};

export const SPECIES_SHURALE_RIN: SpeciesTemplate = {
  speciesId: 'shurale_rin',
  speciesName: 'Shurale-Rin',
  commonName: 'Shurale',
  bodyPlanId: 'hairy_forest_humanoid',
  sizeCategory: 'large',
  averageHeight: 220,
  averageWeight: 130,
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_territorial',
  mutationRate: 0.002,
  compatibleSpecies: [],
  innateTraits: [TRAIT_TICKLE_AMBUSH, TRAIT_STAR_COUNTING_COMPULSION, TRAIT_HYDROPHOBIA],
  traveler_epithet: 'a laugh from the deep wood where no one walks willingly after dark',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    tickle_ambush_range: 4,
    laughter_stamina_drain: 0.08,
    laughter_contagion_range: 6,
    laughter_resistance_threshold: 0.5,
    water_damage_per_tick: 0.15,
    rain_movement_penalty: 0.4,
    star_counting_vulnerability_multiplier: 2.0,
    finger_trap_escape_strength: 0.6,
  },
  description: `The Shurale appears across Tatar and Bashkir folklore as the quintessential forest trickster — hairy, tall, and equipped with impossibly long fingers perfect for a single grim purpose. Gabdulla Tukay's 1907 poem Şüräle fixed the creature in Tatar literary consciousness: a spirit that does not kill with violence or venom but with helpless, uncontrollable laughter. The Tatar hero of the folk cycle survives by trapping the Shurale's fingers in the wedge of a split log — a trick that exploits the creature's own reach against it. The Shurale is clever enough to ambush but not clever enough to avoid fixation on what it cannot count or resist touching.

The TICKLE_AMBUSH trait requires forest tile cover and close range to activate. Once triggered, the target enters helpless laughter — a complete action lockout with stamina draining each tick. The contagion radius means a group ambush can cascade if multiple agents fail their willpower checks. The finger-trap mechanic from folklore is encoded in the genome as finger_trap_escape_strength: agents who are themselves caught can attempt escape by passing a strength threshold check, replicating the hero's solution. HYDROPHOBIA is the Shurale-Rin's most exploitable limit: rivers and lakes are absolute barriers, rain tiles impose severe movement penalties, and any world built around water geography can be designed to contain it entirely.

STAR_COUNTING_COMPULSION is the third vertex of the design — an exploitable vulnerability that rewards player knowledge. A traveler who knows the Shurale will stand motionless counting stars from dusk to dawn on clear nights can plan an approach or escape accordingly. The -rin suffix denotes the trickster taxonomic class in the folklorist registry: beings whose dangers emerge from specific behavioral patterns and known compulsions rather than raw power, and who can therefore be outfoxed by anyone patient enough to study them.`,
};

export const SPECIES_ALBASTI_VEL: SpeciesTemplate = {
  speciesId: 'albasti_vel',
  speciesName: 'Albasti-Vel',
  commonName: 'Albasti',
  bodyPlanId: 'shapeshifting_humanoid',
  sizeCategory: 'medium',
  averageHeight: 165,
  averageWeight: 55,
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'solitary_predator',
  mutationRate: 0.001,
  compatibleSpecies: [],
  innateTraits: [TRAIT_SLEEP_PREDATION, TRAIT_FAMILIAR_FORM, TRAIT_IRON_WARD],
  traveler_epithet: 'a weight upon the chest that wears a trusted face',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    sleep_detection_range: 20,
    breath_steal_rate: 0.04,
    intervention_range: 5,
    exhaustion_debuff_duration: 200,
    familiar_relationship_threshold: 0.6,
    familiar_detection_threshold: 0.7,
    shift_stamina_cost: 0.2,
    iron_ward_range: 8,
    true_name_reveal_spiritual_threshold: 0.8,
  },
  description: `The Albasti is recorded across Kazakh and Kyrgyz steppe tradition as one of the most dangerous nocturnal spirits precisely because her violence is so quiet. She does not attack; she settles. Appearing as a woman — sometimes with backward-pointing feet as her only tell — she finds sleeping agents and sits on their chest, stealing breath tick by tick. Her victims do not wake. They simply drain. V.N. Basilov's 1992 survey of Central Asian shamanism documents how seriously communities took her threat: sleeping alone, sleeping without iron nearby, sleeping in unfamiliar locations were all considered genuine risk factors, not superstition.

SLEEP_PREDATION encodes this directly. A sleeping or resting agent is detectable from twenty tiles away. The Albasti approaches undetected and initiates the chest press; the only counters are a nearby ally performing a wake intervention or iron in the target's inventory, which auto-repels her. An agent who reaches zero stamina suffers an exhaustion debuff lasting two hundred ticks — a penalty that persists through the next day and makes subsequent encounters more dangerous. FAMILIAR_FORM compounds the threat: in cases where direct sleep approach is impossible, the Albasti can shapeshift to appear as a trusted companion, suppressing the target's defensive responses entirely. Detecting the disguise requires spiritual skill above 0.7, making spiritual development a meaningful survival investment.

IRON_WARD creates the material counter-system. Iron items repel the Albasti within eight tiles; iron structures block passage entirely. This makes iron a priority resource for any faction sharing territory with an Albasti population. The true-name vulnerability requires spiritual skill above 0.8, unlocking the deeper, permanent defence recorded in shaman practice. The -vel suffix places the Albasti-Vel in the Traveler class: a spirit whose predatory pattern is portable across worlds, following sleeping agents wherever they rest.`,
};

export const SPECIES_JENGU_VEL: SpeciesTemplate = {
  speciesId: 'jengu_vel',
  speciesName: 'Jengu-Vel',
  commonName: 'Jengu',
  bodyPlanId: 'aquatic_humanoid_tropical',
  sizeCategory: 'medium',
  averageHeight: 170,
  averageWeight: 60,
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'community_guardian',
  mutationRate: 0.002,
  compatibleSpecies: [],
  innateTraits: [TRAIT_MIENGU_HEALING, TRAIT_FORTUNE_BLESSING, TRAIT_RIVER_SOVEREIGNTY],
  traveler_epithet: 'a shimmer beneath the river that heals what the current carries',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    healing_range: 10,
    cure_rate: 0.06,
    healing_rate: 0.03,
    spiritual_scaling_factor: 1.5,
    fortune_resource_bonus: 0.25,
    fortune_craft_bonus: 0.2,
    fortune_social_bonus: 0.15,
    blessing_duration: 100,
    blessing_cooldown: 200,
    sovereignty_range: 15,
    current_resistance: 0.5,
    whirlpool_damage_per_tick: 0.05,
  },
  description: `The Miengu — plural of Jengu — are water spirits central to the ceremonial life of the Sawa coastal peoples of Cameroon: the Duala, the Bakweri, and their neighbours along the rivers and coast. Described as beautiful beings with long flowing hair and the characteristic gap-toothed smile that marks spiritual power in the tradition, they occupy a fundamentally different niche from most spirits in the Folklorist registry. They are healers first. The Ngondo festival, held by the Duala on the Wouri River, is in part a ceremony of direct communication with the Miengu, seeking their intercession for health, protection, and community fortune. É. de Rosny's documentation of Sawa healing practice records jengu possession as a legitimate medical intervention: a practitioner possessed by a Jengu could cure diseases that other methods could not reach.

MIENGU_HEALING makes the Jengu-Vel the first dedicated healing species in the Folklorist registry. Within ten tiles of a water-standing Jengu, disease, poison, and debuff conditions clear at a steady rate while health restores each tick. The spiritual scaling factor means a highly developed spiritual skill in the recipient amplifies the healing dramatically — an incentive structure that rewards the kind of long-term devotional relationship that the Ngondo tradition models. FORTUNE_BLESSING encodes the reciprocal ceremonial dimension: agents who make offerings at nearby water tiles receive improved outcomes across resource gathering, crafting, and social interactions. The cooldown prevents farming and enforces the periodic, ritual quality of the original practice.

RIVER_SOVEREIGNTY gives the Jengu-Vel territorial authority over its waterway. Whirlpool tiles trap hostiles; calmed water eases allied passage; current resistance penalises those who arrive with ill intent. A Jengu-held river is a genuinely safer corridor for allied factions — and a genuine hazard for those who approach without respect. The -vel suffix marks the Jengu-Vel as a being whose healing and mediating function is not fixed to one world but portable across the shared multiverse, showing up wherever rivers run and communities need a spirit worth approaching with an offering.`,
};

export const SPECIES_TANIWHA_VEL: SpeciesTemplate = {
  speciesId: 'taniwha_vel',
  speciesName: 'Taniwha-Vel',
  commonName: 'Taniwha',
  bodyPlanId: 'shapeshifting_aquatic',
  sizeCategory: 'large',
  averageHeight: 300,
  averageWeight: 500,
  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,
  sapient: true,
  socialStructure: 'kaitiaki_guardian',
  mutationRate: 0.003,
  compatibleSpecies: [],
  innateTraits: [TRAIT_FORM_SHIFTING, TRAIT_KAITIAKI_BINDING, TRAIT_TIDAL_COMMAND],
  traveler_epithet:
    'a shape beneath the water that is sometimes guardian and sometimes the reason the water is forbidden',
  cross_game_compatible: true,
  native_game: 'both',
  genome_flags: {
    form_shift_stamina: 0.15,
    form_shift_cooldown: 20,
    reptile_combat_bonus: 0.4,
    shark_water_speed: 2.0,
    log_stealth_rating: 1.0,
    whale_displacement_radius: 4,
    kaitiaki_range: 20,
    protection_bonus: 0.2,
    territorial_fear_intensity: 0.3,
    rage_damage_multiplier: 2.0,
    surge_push_distance: 6,
    pull_range: 8,
    tidal_command_cooldown: 15,
  },
  description: `The Taniwha occupy a uniquely ambiguous position in Māori cosmology that most European frameworks of spirit classification struggle to accommodate. They are not simply good or evil — they are bound. Each Taniwha is associated with a specific geographic feature: a deep pool in a river, a coastal cave, a stretch of sea between headlands. Some are kaitiaki, guardians, protecting the iwi (tribal group) whose territory includes their waterway. Others are dangers to be navigated, appeased, or in some narratives defeated by a rangatira of sufficient mana. Elsdon Best's 1924 documentation and Margaret Orbell's 1985 work both emphasise the same quality: a Taniwha is inseparable from its place, and the condition of that place is the condition of the Taniwha.

FORM_SHIFTING encodes the traditional accounts directly. The Taniwha is recorded taking reptilian, shark, whale, and even log forms — each documented in different regional oral traditions. In gameplay, each form serves a distinct tactical role: reptile for close combat, shark for water-speed pursuit, log for terrain-blending ambush, whale for area disruption. The stamina cost and cooldown on transitions enforce deliberate form selection; the Taniwha cannot simply cycle through forms reactively. KAITIAKI_BINDING ties the Taniwha to its specific waterway tile cluster, generating protective auras for allied agents within range and territorial fear in hostiles. If the bound location is damaged or polluted, the rage multiplier doubles all outgoing damage — an ecological accountability mechanic rooted in the tikanga principle that desecration has consequences.

TIDAL_COMMAND provides the Taniwha's environmental control: surge, pull, and calm. These three tidal states let a Taniwha manage the flow of a waterway engagement — pushing threats away from the bound location, drawing prey inward, or smoothing passage for allied movement. The -vel suffix marks the Taniwha-Vel as a being whose kaitiaki obligation is portable: wherever a waterway needs a guardian across the multiverse's game worlds, a Taniwha-Vel may be found bound to it, indistinguishable from a submerged log until the water moves wrong.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY OBJECT
// ─────────────────────────────────────────────────────────────────────────────

export const SPRINT15_FOLKLORIST_SPECIES_REGISTRY: Record<string, SpeciesTemplate> = {
  adaro_vel: SPECIES_ADARO_VEL,
  shurale_rin: SPECIES_SHURALE_RIN,
  albasti_vel: SPECIES_ALBASTI_VEL,
  jengu_vel: SPECIES_JENGU_VEL,
  taniwha_vel: SPECIES_TANIWHA_VEL,
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSOR
// ─────────────────────────────────────────────────────────────────────────────

export function getSprint15FolkloristSpecies(speciesId: string): SpeciesTemplate | undefined {
  return SPRINT15_FOLKLORIST_SPECIES_REGISTRY[speciesId];
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────

export function validateSprint15FolkloristSpecies(speciesId: string) {
  const template = getSprint15FolkloristSpecies(speciesId);
  if (!template) {
    return { valid: false, errors: [`Unknown species ID: ${speciesId}`] };
  }
  return validateAgainstMUL1357Schema(template);
}
