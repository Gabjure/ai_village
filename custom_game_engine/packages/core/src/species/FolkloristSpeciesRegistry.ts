/**
 * Folklorist Species Registry — Sprint 9 Theme C Batch
 *
 * Six species from underrepresented folklore traditions:
 * - Mapuche (S. America): Peuchén-Vel
 * - Guaraní (S. America): Mboi-Tu'i-Vel
 * - Berber/Amazigh (N. Africa): Bouda-Kin
 * - Kabyle Berber (N. Africa): Anzar-Vel
 * - Altai Turkic (Central Asia): Yelbegen-Rin
 * - Mongolian (Central Asia): Lus-Vel
 *
 * Designed by Scheherazade (Folklorist) — MUL-2009
 * Implemented by Huxley (Geneticist) — MUL-2084
 *
 * Sources:
 * - Mapuche: Rodolfo Lenz, Diccionario etimológico (1905–1910)
 * - Guaraní: León Cadogan, Ayvu Rapyta (1959)
 * - Berber/Amazigh: Edmond Doutté, Magie et religion dans l'Afrique du Nord (1909)
 * - Kabyle Berber: René Basset, Contes populaires berbères (1887)
 * - Altai Turkic: Maaday-Kara (A.G. Kalkin, 1973)
 * - Mongolian: Walther Heissig, Mongolian Shamanism (1980)
 */

import type { SpeciesTrait } from '../components/SpeciesComponent.js';
import type { SpeciesTemplate } from './SpeciesRegistry.js';

// ============================================================================
// NEW MECHANIC SCAFFOLDS (13 mechanics — MUL-2084 deliverable)
// Each trait below defines one of the 13 new mechanics as an innate species trait.
// Game systems consume these via abilitiesGranted[] strings.
// ============================================================================

// Mechanic 1: Hemovore metabolic pathway (Peuchén-Vel)
// Primary energy intake is hemolymph/blood-analog rather than food items.
// Systems: NeedsSystem reads hemovore_satiation drive separately from hunger.
export const TRAIT_HEMOVORE: SpeciesTrait = {
  id: 'hemovore',
  name: 'Hemovore',
  description: 'Primary energy intake via blood-analog feeding, not food items. Drives a dedicated hemovore_satiation need.',
  category: 'metabolic',
  needsModifier: { hunger: 0.0 }, // Standard hunger is suppressed; hemovore_satiation replaces it
  abilitiesGranted: ['hemovore_feeding', 'hemovore_satiation_drive'],
};

// Mechanic 2: Paralysis biochemical broadcast (Peuchén-Vel)
// Area-of-effect cone that inflicts gaze_stunned on nearby agents.
// Range and duration scale with genome_flags.paralysis_broadcast_range and peuchan_dominance.
export const TRAIT_PARALYSIS_BROADCAST: SpeciesTrait = {
  id: 'paralysis_broadcast',
  name: 'Paralysis Broadcast',
  description: 'Biochemical gaze-cone stuns agents within range. Targets gain gaze_stunned status for 3 + (dominance × 2) ticks.',
  category: 'sensory',
  abilitiesGranted: ['paralysis_gaze_broadcast', 'gaze_stunned_inflict'],
  skillBonus: { combat: 0.15 },
};

// Mechanic 3: Aquatic idle ticks (Mboi-Tu'i-Vel)
// Semi-aquatic: can remain submerged for extended idle periods before surfacing.
// Systems: BreathingSystem checks aquatic_idle_ticks genome flag.
export const TRAIT_AQUATIC_SEMI: SpeciesTrait = {
  id: 'aquatic_semi',
  name: 'Semi-Aquatic',
  description: 'Can remain fully submerged for extended idle periods. Surfaces to vocalise. Controlled by aquatic_idle_ticks genome flag.',
  category: 'physical',
  needsModifier: { thirst: 0.3 }, // Hydration needs reduced — absorbs water through skin
  abilitiesGranted: ['aquatic_idle', 'extended_submersion', 'water_breathing_semi'],
};

// Mechanic 4: Custodian pollution tracking (Mboi-Tu'i-Vel)
// Monitors aggregate pollution events in patrol zone; triggers aggro when threshold exceeded.
// Driven by territory_pollution_threshold drive + custodian_patrol_action.
export const TRAIT_WETLAND_CUSTODIAN: SpeciesTrait = {
  id: 'wetland_custodian',
  name: 'Wetland Custodian',
  description: 'Patrols water tile boundaries. Tracks pollution events via territory_pollution_threshold drive; attacks agents exceeding extraction limits.',
  category: 'social',
  abilitiesGranted: ['custodian_patrol', 'pollution_memory', 'ecological_aggro'],
  skillBonus: { perception: 0.2 },
};

// Mechanic 5: Dual-form biochemistry profile (Bouda-Kin)
// Humanoid and hyena forms have distinct active drive sets.
// Systems: BiochemistrySystem switches drive profiles on form change.
export const TRAIT_DUAL_FORM_BIOCHEMISTRY: SpeciesTrait = {
  id: 'dual_form_biochemistry',
  name: 'Dual-Form Biochemistry',
  description: 'Humanoid and hyena forms run distinct biochemistry profiles. Drive set swaps on shift: humanoid uses omnivore drives; hyena activates carrion_scent_sensitivity and scavenger_patience.',
  category: 'metabolic',
  abilitiesGranted: ['form_biochemistry_swap', 'carrion_scent_sensitivity', 'scavenger_patience_drive'],
};

// Mechanic 6: Heritable shift_threshold (Bouda-Kin)
// Quantitative trait with additive inheritance. Offspring shift_threshold is mean of parents'.
// Systems: ReproductionSystem treats shift_threshold as a heritable float allele.
export const TRAIT_LINEAGE_SHIFT: SpeciesTrait = {
  id: 'lineage_shift',
  name: 'Lineage Shift',
  description: 'Shape-shift ability is heritable. shift_threshold (0.0–1.0) is a quantitative trait with additive inheritance. High threshold = harder to shift.',
  category: 'magical',
  abilitiesGranted: ['shape_shift_humanoid_hyena', 'heritable_shift_threshold'],
};

// Mechanic 7: Rapport relationship type (Anzar-Vel)
// New relationship type beyond known_agent. Tracks cumulative ritual-action score.
// Systems: SocialSystem registers rapport entries; BiomeSystem reads rapport to compute rainfall modifier.
export const TRAIT_RAPPORT_ATTUNEMENT: SpeciesTrait = {
  id: 'rapport_attunement',
  name: 'Rapport Attunement',
  description: 'Agents who perform ritual actions (offerings, peaceful proximity) earn rapport relationship status with this individual. Rapport unlocks passive biome benefits; its absence or damage triggers drought conditions.',
  category: 'spiritual',
  abilitiesGranted: ['rapport_relationship_tracking', 'rapport_decay', 'biome_benefit_unlock'],
  skillBonus: { social: 0.2 },
};

// Mechanic 8: Rainfall probability modifier hook (Anzar-Vel)
// Float emitted per individual into its biome quadrant; summed if multiple present.
// Systems: WeatherSystem reads rainfall_probability_modifier from nearby Anzar-Vel entities.
export const TRAIT_RAINFALL_SOVEREIGN: SpeciesTrait = {
  id: 'rainfall_sovereign',
  name: 'Rainfall Sovereign',
  description: 'Passively modifies precipitation probability in its quadrant. Content individual: +0.4 modifier. Stressed or dying: -0.3. Multiple individuals sum their modifiers.',
  category: 'magical',
  abilitiesGranted: ['rainfall_probability_modifier', 'weather_system_hook'],
  needsModifier: { hunger: 0.0 }, // Absorbs moisture/vapor directly; no food item interaction
};

// Mechanic 9: Three-form metabolism cycling (Yelbegen-Rin)
// Giant, predator, and livestock-decoy forms each have a distinct metabolism_multiplier.
// Systems: MetabolismSystem multiplies base hunger_decay_rate by active form's multiplier.
export const TRAIT_THREE_FORM_METABOLISM: SpeciesTrait = {
  id: 'three_form_metabolism',
  name: 'Three-Form Metabolism',
  description: 'Cycles through three metabolic forms: giant (3.0× hunger rate), predator (1.8×), livestock decoy (0.8×). Form switch changes energy consumption, locomotion, and predation profile.',
  category: 'metabolic',
  needsModifier: { hunger: 3.0 }, // Base multiplier is giant form; overridden per active form by MetabolismSystem
  abilitiesGranted: ['form_cycle_giant', 'form_cycle_predator', 'form_cycle_livestock_decoy', 'three_form_metabolism_cycling'],
};

// Mechanic 10: Perception-gated deception detection (Yelbegen-Rin)
// Agents with perception > 0.75 or experience_with_yelbegen > 2 see through livestock form.
// Systems: PerceptionSystem exposes detect_yelbegen_decoy ability check.
export const TRAIT_PERCEPTION_GATED_DECOY: SpeciesTrait = {
  id: 'perception_gated_decoy',
  name: 'Livestock Decoy',
  description: 'In livestock form, appears as a large healthy yak or bison indistinguishable to naive agents. Agents with perception > 0.75 or yelbegen experience > 2 can detect the deception.',
  category: 'sensory',
  abilitiesGranted: ['livestock_decoy_form', 'deception_detection_threshold'],
  skillBonus: { deception: 0.5 },
};

// Mechanic 11: Water sovereignty domain system (Lus-Vel)
// Each individual claims a water tile cluster as sovereign domain.
// Systems: TerritorySystem registers water_domain_id; one Lus-Vel per domain.
export const TRAIT_WATER_SOVEREIGNTY: SpeciesTrait = {
  id: 'water_sovereignty',
  name: 'Water Sovereignty',
  description: 'Claims a freshwater body (min 10 tiles) as sovereign domain. Monitors extraction events; exceeding tolerance triggers lus_displeasure biome flag. Grants lus_favor buff to offering agents.',
  category: 'spiritual',
  abilitiesGranted: ['water_domain_claim', 'extraction_monitoring', 'lus_favor_grant', 'depth_retreat'],
};

// Mechanic 12: Spirit satiation drive (Lus-Vel)
// Absorbs spiritual energy from offerings and ambient water-energy; no standard food needed.
// Systems: NeedsSystem handles spirit_satiation as a distinct drive with offering-based recovery.
export const TRAIT_SPIRIT_SATIATION: SpeciesTrait = {
  id: 'spirit_satiation',
  name: 'Spirit Satiation',
  description: 'Sustained by spiritual energy from offerings and ambient water-presence, not food. Drives a dedicated spirit_satiation need; standard hunger drive is absent.',
  category: 'spiritual',
  needsModifier: { hunger: 0.0 }, // No standard food need
  abilitiesGranted: ['spirit_satiation_drive', 'offering_absorption', 'water_energy_absorption'],
};

// Mechanic 13: lus_displeasure biome-level status flag (Lus-Vel)
// Set when extraction events in domain exceed extraction_tolerance within a time window.
// Systems: BiomeSystem reads lus_displeasure flag; reduces water tile productivity, raises flood risk.
export const TRAIT_LUS_DISPLEASURE_EMITTER: SpeciesTrait = {
  id: 'lus_displeasure_emitter',
  name: 'Displeasure Emitter',
  description: 'Emits the lus_displeasure biome-level status flag when domain extraction tolerance is exceeded. Causes reduced water tile productivity and elevated flood risk until displeasure clears.',
  category: 'spiritual',
  abilitiesGranted: ['lus_displeasure_flag_emit', 'biome_status_propagate'],
};

// ============================================================================
// Additional shared traits
// ============================================================================

export const TRAIT_SHAPE_FLUX: SpeciesTrait = {
  id: 'shape_flux',
  name: 'Shape Flux',
  description: 'Cycles between resting disc-of-light form (low visibility, low energy) and extended serpent form (hunting-ready). Form shift telegraphs imminent predation.',
  category: 'magical',
  abilitiesGranted: ['shape_flux_rest', 'disc_form', 'serpent_form'],
  skillBonus: { stealth: 0.25 },
};

export const TRAIT_SONIC_INTIMIDATION: SpeciesTrait = {
  id: 'sonic_intimidation',
  name: 'Sonic Intimidation',
  description: 'Periodic shriek debuffs nearby hostile agents (reduced action speed, elevated fear drive). Long cooldown makes it a notable ecological event when it fires.',
  category: 'sensory',
  abilitiesGranted: ['sonic_shriek', 'fear_drive_elevate'],
  skillBonus: { combat: 0.1 },
};

export const TRAIT_PARROT_MIMICRY: SpeciesTrait = {
  id: 'parrot_mimicry',
  name: 'Parrot Mimicry',
  description: 'Passively accumulates vocalizations from observed agents and replays them in garbled form. Causes confusion about signal source; not deliberate deception.',
  category: 'social',
  abilitiesGranted: ['vocalization_buffer', 'signal_confusion'],
};

export const TRAIT_CARRION_ECONOMY: SpeciesTrait = {
  id: 'carrion_economy',
  name: 'Carrion Economy',
  description: 'Primary scavenger; follows apex predators at safe distance to take carrion. Clears corpse tiles. Does not hunt live prey when carrion is available.',
  category: 'metabolic',
  abilitiesGranted: ['carrion_tracking', 'scavenger_follow', 'corpse_tile_clear'],
  needsModifier: { hunger: 0.9 },
};

export const TRAIT_CLOUD_WITHDRAWAL: SpeciesTrait = {
  id: 'cloud_withdrawal',
  name: 'Cloud Withdrawal',
  description: 'When threatened, ascends into cloud/sky layer — becomes temporarily invisible and unreachable. Variable cooldown before descent. Does not fight directly.',
  category: 'magical',
  abilitiesGranted: ['sky_retreat', 'temporary_invisibility', 'unreachable_state'],
};

export const TRAIT_EPIC_APPETITE: SpeciesTrait = {
  id: 'epic_appetite',
  name: 'Epic Appetite',
  description: 'Consumes resources at 3× normal rate. Requires a very large territory to sustain. High resource pressure drives wide roaming, making it a mobile ecosystem stressor.',
  category: 'metabolic',
  needsModifier: { hunger: 3.0 },
  abilitiesGranted: ['high_resource_consumption', 'wide_territory_roaming'],
};

export const TRAIT_CLEVERNESS_TEST: SpeciesTrait = {
  id: 'cleverness_test',
  name: 'Cleverness Test',
  description: 'Can be redirected by high-intelligence agents who perform a challenge action. If challenger problem_solving exceeds threshold, enters a brief bested state (reduced hunger, non-aggressive).',
  category: 'social',
  abilitiesGranted: ['cleverness_bypass', 'bested_state'],
};

export const TRAIT_DEPTH_RETREAT: SpeciesTrait = {
  id: 'depth_retreat',
  name: 'Depth Retreat',
  description: 'Sinks into its water body and becomes inaccessible when severely stressed. Cannot be reached, attacked, or interacted with. Re-emerges after a long cooldown.',
  category: 'physical',
  abilitiesGranted: ['depth_submersion', 'inaccessible_state'],
};

// ============================================================================
// PEUCHÉN-VEL (Mapuche)
// ============================================================================
// Folklore: Mapuche tradition, Chile and Argentina.
// Shape-shifting predator — flying serpent or spinning disc of light.
// Paralyzes prey through its gaze; drains blood-analog hemolymph.
// Sources: Rodolfo Lenz, Diccionario etimológico (1905–1910);
//          Miguel de Olivares, Historia de la Compañía de Jesús en Chile (c.1736)

export const PEUCHAN_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'peuchan_vel',
  speciesName: 'Peuchén-Vel',
  commonName: 'Peuchén',

  description: `The Peuchén-Vel is a shape-shifting aerial predator from Mapuche tradition of
southern Chile and Argentina. In its resting form it appears as a spinning iridescent disc of
blue-white light, coasting thermals above the temperate rainforest canopy. In hunting form it
unspools into an elongated 2–3m serpent with indigo-to-copper scales and twin crest-fins.

It paralyzes prey not through gaze-contact alone but via a short-range biochemical broadcast —
a hemotoxic agent released into the air that induces the gaze_stunned state in any agent within
its cone. After the stun, it feeds through hemovore metabolism: blood-analog extraction rather
than consuming food items. It does not pursue fleeing prey that breaks line-of-sight.

Strictly solitary; two Peuchén-Vel in the same biome quadrant will engage in aerial spiral
displays until one retreats. Oviparous — single egg per clutch, laid in concealed rock clefts
in cliff faces.

*-vel suffix marks spiritual-grade species in the game taxonomy.*`,

  bodyPlanId: 'serpentine_disc_flier',

  innateTraits: [
    TRAIT_HEMOVORE,
    TRAIT_PARALYSIS_BROADCAST,
    TRAIT_SHAPE_FLUX,
  ],

  compatibleSpecies: [],
  mutationRate: 0.008,

  averageHeight: 80,   // Disc form: ~0.8m diameter. Serpent form elongated.
  averageWeight: 12,
  sizeCategory: 'small',

  lifespan: 400,
  lifespanType: 'long_lived',
  maturityAge: 30,
  gestationPeriod: 180, // Oviparous — long incubation in rock clefts

  sapient: false,
  socialStructure: 'solitary_apex',

  traveler_epithet: 'a hunter from the turning sky',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    shape_shift_cost: 0.3,
    paralysis_broadcast_range: 6,
    territorial_radius: 40,
    hemovore: true,
    paralysis_duration_base: 3,
    paralysis_duration_dominance_multiplier: 2,
    aerial_display_threshold: 1, // Number of conspecifics in zone before display triggers
  },
};

// ============================================================================
// MBOI-TU'I-VEL (Guaraní)
// ============================================================================
// Folklore: Guaraní oral tradition, Paraguay, southern Brazil, NE Argentina.
// Colossal serpent with parrot head — guardian of waterways.
// Protects wetlands from ecological damage; sonic shriek debuffs violators.
// Sources: León Cadogan, Ayvu Rapyta (1959); La literatura de los Guaraníes (1959)

export const MBOI_TUI_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'mboi_tui_vel',
  speciesName: "Mboi-Tu'i-Vel",
  commonName: "Mboi-Tu'i",

  description: `The Mboi-Tu'i-Vel is the great water-guardian of Guaraní cosmology — a colossal
serpent 4–6m long with a brilliant scarlet-and-yellow parrot head and teal-green iridescent
scales. It is the child of Ñamandú and the sentinel of rivers, wetlands, and confluences.

It enforces ecological balance in its territory: agents that dump refuse, kill water plants, or
extract resources beyond the territorial tolerance trigger its aggro state. The sonic shriek —
a periodic event with a long cooldown — debuffs hostile agents in range without physical combat,
elevating their fear drive and reducing action speed.

A passive parrot-mimicry trait causes it to replay garbled vocalizations of agents it has
observed, occasionally generating false signals that confuse nearby agents about the source.

Semi-aquatic: can remain submerged for extended idle periods (aquatic_idle_ticks: 60), surfacing
only to vocalise or feed. Piscivore and aquatic invertebrate omnivore — fully integrated with the
water-fauna food chain.

*-vel suffix marks spiritual-grade species in the game taxonomy.*`,

  bodyPlanId: 'aquatic_parrot_serpent',

  innateTraits: [
    TRAIT_AQUATIC_SEMI,
    TRAIT_WETLAND_CUSTODIAN,
    TRAIT_SONIC_INTIMIDATION,
    TRAIT_PARROT_MIMICRY,
  ],

  compatibleSpecies: [],
  mutationRate: 0.007,

  averageHeight: 120,  // Head height when raised above water
  averageWeight: 280,
  sizeCategory: 'large',

  lifespan: 600,
  lifespanType: 'long_lived',
  maturityAge: 40,
  gestationPeriod: 200,

  sapient: false,
  socialStructure: 'solitary_guardian',

  traveler_epithet: 'a guardian crossed from the deep rivers',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    aquatic_idle_ticks: 60,
    sonic_intimidation_radius: 12,
    sonic_intimidation_cooldown: 80,
    custodian_patrol_radius: 30,
    pollution_memory_window: 200,
    territory_pollution_threshold: 3, // Events before aggro state triggers
    near_water_requirement: 15,       // Must be within 15 tiles of water at all times
  },
};

// ============================================================================
// BOUDA-KIN (Berber/Amazigh)
// ============================================================================
// Folklore: Berber/Amazigh oral tradition across Morocco, Algeria, Ethiopia.
// Hereditary shape-shifting lineage — humanoid ↔ spotted hyena.
// Ambivalent social role: funeral intermediaries, grave-robbers, curse-casters.
// Sources: Edmond Doutté, Magie et religion dans l'Afrique du Nord (1909);
//          Ernest Laoust, Mots et choses berbères (1920)

export const BOUDA_KIN_SPECIES: SpeciesTemplate = {
  speciesId: 'bouda_kin',
  speciesName: 'Bouda-Kin',
  commonName: 'Bouda',

  description: `The Bouda-Kin are not a spirit but a lineage — a human family line with hereditary
shape-shifting ability. Born in humanoid form (tall, lean, ochre-and-rust robes, golden-brown eyes
slightly too wide-set), they shift to spotted hyena form under biochemical trigger: high threat
drive combined with night cycle, or proximity to corpse tiles.

Their shift is heritable. The shift_threshold — a float from 0.0 to 1.0 — is a quantitative
trait with additive inheritance. Offspring of two low-threshold parents shift easily; offspring
of two high-threshold parents shift only under extreme stress. This creates emergent lineage
diversity across generations.

In hyena form, the dual_form_biochemistry trait activates carrion_scent_sensitivity and
scavenger_patience drives. They follow apex predators at safe distance, clearing corpse tiles.
In humanoid form, they can perform a costly mediation action that reduces conflict drive between
two agents — a rare event that builds lasting trust with both parties.

*-kin suffix marks socially-organized, shape-shifting species in the game taxonomy.*`,

  bodyPlanId: 'humanoid_werebyena',

  innateTraits: [
    TRAIT_DUAL_FORM_BIOCHEMISTRY,
    TRAIT_LINEAGE_SHIFT,
    TRAIT_CARRION_ECONOMY,
    {
      id: 'curse_broker',
      name: 'Curse-Broker Diplomacy',
      description: 'In humanoid form, can perform mediation between conflicting agents. Costly action (high energy) but creates lasting goodwill and trusted_contact relationship status.',
      category: 'social',
      abilitiesGranted: ['mediation_action', 'trusted_contact_status'],
      skillBonus: { persuasion: 0.3, social: 0.2 },
    },
  ],

  compatibleSpecies: [],
  mutationRate: 0.012,

  averageHeight: 185,
  averageWeight: 75,
  sizeCategory: 'medium',

  lifespan: 80,
  lifespanType: 'mortal',
  maturityAge: 16,
  gestationPeriod: 270,

  sapient: true,
  socialStructure: 'lineage_clan',

  traveler_epithet: 'a lineage-bearer from the night roads',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    shift_threshold: 0.65,             // Default; heritable float, varies per individual
    shift_trigger_threat_level: 0.7,   // threat_level > this OR (night AND corpse_in_range)
    carrion_detection_range: 20,
    scavenger_patience: 0.8,
    mediation_energy_cost: 40,
    shift_threshold_inheritance: 'additive', // Quantitative trait — mean of parents
  },
};

// ============================================================================
// ANZAR-VEL (Kabyle Berber)
// ============================================================================
// Folklore: Kabyle Berber tradition, Algeria and northern Morocco.
// Rain deity courted through ritual — withholds or bestows rainfall.
// Sources: René Basset, Contes populaires berbères (1887);
//          Mouloud Mammeri ethnographic poetry compilations

export const ANZAR_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'anzar_vel',
  speciesName: 'Anzar-Vel',
  commonName: 'Anzar',

  description: `The Anzar-Vel is a sky-and-water spirit from Kabyle Berber tradition — tall and
translucent, skin with blue-grey iridescence like rain-wet stone, hair floating as if underwater,
eyes solid pale blue with no pupil. It drifts half a meter off the ground; it leaves no
footprints. When content, gentle mist radiates from its feet; when alarmed, the mist turns to
sharp frost.

It passively modifies rainfall probability in its quadrant: content individuals tilt the local
weather system wet (+0.4 modifier); stressed or dying individuals trigger drought (-0.3). If
multiple Anzar-Vel are present, their modifiers sum.

It does not fight. When threatened it ascends into the cloud layer — dissolving upward into a
column of mist within 2 seconds — and becomes temporarily unreachable. It descends after a
variable cooldown.

Agents who perform ritual actions (offerings, peaceful proximity without aggression) earn a
rapport relationship with the individual Anzar-Vel. Rapport unlocks passive biome benefits;
agents who harm or ignore it suffer drought conditions. Rapport decays slowly over time if
ritual attention lapses.

Absorbs moisture and vapor directly — no food item interaction.

*-vel suffix marks spiritual-grade species in the game taxonomy.*`,

  bodyPlanId: 'mist_humanoid_floating',

  innateTraits: [
    TRAIT_RAINFALL_SOVEREIGN,
    TRAIT_RAPPORT_ATTUNEMENT,
    TRAIT_CLOUD_WITHDRAWAL,
  ],

  compatibleSpecies: [],
  mutationRate: 0.003,

  averageHeight: 200,
  averageWeight: 30,  // Translucent, near-weightless
  sizeCategory: 'large',

  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,    // Created/manifested fully formed
  gestationPeriod: 0,

  sapient: true,
  socialStructure: 'solitary_spirit',

  traveler_epithet: 'a cloud-walker from the cedar highlands',

  cross_game_compatible: false, // Precursors-native; limited migration potential
  native_game: 'precursors',

  genome_flags: {
    rainfall_modifier_content: 0.4,
    rainfall_modifier_stressed: -0.3,
    withdrawal_threshold: 0.5,
    rapport_decay_rate: 0.02,
    vapor_absorption: true, // No food item interaction
  },
};

// ============================================================================
// YELBEGEN-RIN (Altai Turkic)
// ============================================================================
// Folklore: Altai Turkic oral epic tradition.
// Multi-headed giant trickster shapeshifter — tests heroes through cunning.
// Sources: Maaday-Kara (A.G. Kalkin, 1973);
//          Nora Chadwick & Victor Zhirmunsky, Oral Epics of Central Asia (1969)

export const YELBEGEN_RIN_SPECIES: SpeciesTemplate = {
  speciesId: 'yelbegen_rin',
  speciesName: 'Yelbegen-Rin',
  commonName: 'Yelbegen',

  description: `The Yelbegen-Rin is a multi-headed giant trickster from Altai Turkic epic
tradition. It cycles between three stable forms: a 4–5m humanoid giant with three heads and
weathered stone-grey skin, a large feline-like predator quadruped, and a livestock decoy that
appears as a large, healthy yak or bison — slightly too still, slightly too perfect.

Each form has a distinct metabolism_multiplier. Giant form (3.0×) consumes resources at extreme
rates and requires a vast territory. Predator form (1.8×) is its active hunting mode. Livestock
decoy form (0.8×) is a patience state for infiltrating herds.

Naive agents cannot distinguish the decoy form. Agents with perception > 0.75 or experience
with_yelbegen > 2 can detect it as false. A tell persists across all forms: the faint smell of
cold stone and a shimmer at form boundaries in angled light.

High-intelligence agents can perform a cleverness challenge. If their problem_solving stat
exceeds 0.75, the Yelbegen-Rin enters a brief bested state — reduced hunger, non-aggressive —
before resuming normal behavior. This creates a puzzle-element in player-adjacent encounters.

*-rin suffix marks trickster/mischievous shape-changers in the game taxonomy.*`,

  bodyPlanId: 'giant_trickster_multiheaded',

  innateTraits: [
    TRAIT_THREE_FORM_METABOLISM,
    TRAIT_PERCEPTION_GATED_DECOY,
    TRAIT_EPIC_APPETITE,
    TRAIT_CLEVERNESS_TEST,
  ],

  compatibleSpecies: [],
  mutationRate: 0.015,

  averageHeight: 450,   // Giant form: 4–5m
  averageWeight: 800,
  sizeCategory: 'huge',

  lifespan: 800,
  lifespanType: 'long_lived',
  maturityAge: 80,
  gestationPeriod: 400,

  sapient: true,
  socialStructure: 'solitary_roamer',

  traveler_epithet: 'a hunger that walked down from the high passes',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    metabolism_giant: 3.0,
    metabolism_predator: 1.8,
    metabolism_decoy: 0.8,
    territory_roam_radius: 80,
    cleverness_bypass_threshold: 0.75,
    decoy_detection_perception_threshold: 0.75,
    decoy_detection_experience_threshold: 2,
  },
};

// ============================================================================
// LUS-VEL (Mongolian)
// ============================================================================
// Folklore: Mongolian shamanic and Buddhist folk tradition.
// Water sovereign — lord of rivers, lakes, springs.
// Sources: Walther Heissig, Mongolian Shamanism (1980);
//          The Religions of Mongolia (Heissig, 1970)

export const LUS_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'lus_vel',
  speciesName: 'Lus-Vel',
  commonName: 'Lus',

  description: `The Lus-Vel is a water sovereign from Mongolian shamanic and Buddhist folk
tradition — an enormous serpent 6–8m, the deep blue-green of still lake water, scales that
refract light like a water surface. The head is wide and flat with a fringe of long water-weed
tendrils around the jaw. Eyes are silver-white, glowing faintly at night.

Each Lus-Vel claims a freshwater body (minimum 10 tiles) as its sovereign domain. One Lus-Vel
per domain — if two enter the same water body, they engage in a slow status-war until one
retreats or dies. It monitors extraction events: fishing within limit is permitted; exceeding
extraction_tolerance within the memory window sets the lus_displeasure biome flag, reducing
water tile productivity and raising flood risk until displeasure clears.

Agents who deposit resource items at the water's edge trigger an offering_received event. The
Lus-Vel registers that agent as acknowledged; acknowledged agents receive the lus_favor buff
(faster travel over water tiles, reduced disease risk from water consumption). lus_favor stacks
up to 3 times and lasts 500 ticks per stack.

When severely stressed, it sinks into the water body and becomes inaccessible — unreachable,
unattackable — until a long cooldown passes.

Sustained by spirit_satiation: absorbs spiritual energy from offerings and ambient water-energy.
No standard food drive.

*-vel suffix marks spiritual-grade species in the game taxonomy.*`,

  bodyPlanId: 'water_dragon_serpent',

  innateTraits: [
    TRAIT_WATER_SOVEREIGNTY,
    TRAIT_SPIRIT_SATIATION,
    TRAIT_LUS_DISPLEASURE_EMITTER,
    TRAIT_DEPTH_RETREAT,
  ],

  compatibleSpecies: [],
  mutationRate: 0.004,

  averageHeight: 150,   // Head height when raised from water
  averageWeight: 600,
  sizeCategory: 'huge',

  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 100,
  gestationPeriod: 0, // Manifests; does not reproduce through standard breeding

  sapient: true,
  socialStructure: 'water_sovereign',

  traveler_epithet: 'a sovereign of still water, seeking a new domain',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    extraction_tolerance: 5,
    extraction_window: 100,
    offering_favor_duration: 500,
    offering_favor_max_stacks: 3,
    domain_min_tiles: 10,
    depth_retreat_threshold: 0.3,
    lus_displeasure_propagation_radius: 20,
  },
};

// ============================================================================
// Folklorist Species Registry
// ============================================================================

export const FOLKLORIST_SPECIES_REGISTRY: Record<string, SpeciesTemplate> = {
  peuchan_vel: PEUCHAN_VEL_SPECIES,
  mboi_tui_vel: MBOI_TUI_VEL_SPECIES,
  bouda_kin: BOUDA_KIN_SPECIES,
  anzar_vel: ANZAR_VEL_SPECIES,
  yelbegen_rin: YELBEGEN_RIN_SPECIES,
  lus_vel: LUS_VEL_SPECIES,
};

/**
 * Get all folklorist species
 */
export function getAllFolkloristSpecies(): SpeciesTemplate[] {
  return Object.values(FOLKLORIST_SPECIES_REGISTRY);
}

/**
 * Validate a species template against the cross-game migration schema (MUL-1357 format).
 *
 * The MUL-1357 schema requires that species templates declare:
 * 1. speciesId (string, non-empty)
 * 2. sizeCategory (valid value)
 * 3. traveler_epithet (required for cross-game-compatible species)
 * 4. cross_game_compatible (explicit boolean)
 * 5. native_game (declared origin)
 * 6. genome_flags (required map for biochemistry parameters)
 *
 * Returns a validation result with any schema violations.
 */
export interface MUL1357ValidationResult {
  speciesId: string;
  valid: boolean;
  violations: string[];
}

export function validateAgainstMUL1357Schema(template: SpeciesTemplate): MUL1357ValidationResult {
  const violations: string[] = [];
  const validSizeCategories = ['tiny', 'small', 'medium', 'large', 'huge', 'colossal'];
  const validGames = ['mvee', 'precursors', 'both'];

  if (!template.speciesId || template.speciesId.trim().length === 0) {
    violations.push('speciesId must be a non-empty string');
  }

  if (!validSizeCategories.includes(template.sizeCategory)) {
    violations.push(`sizeCategory "${template.sizeCategory}" is not a valid value`);
  }

  if (template.cross_game_compatible === undefined) {
    violations.push('cross_game_compatible must be explicitly declared (true/false)');
  }

  if (!template.native_game || !validGames.includes(template.native_game)) {
    violations.push(`native_game must be one of: ${validGames.join(', ')}`);
  }

  if (template.cross_game_compatible && !template.traveler_epithet) {
    violations.push('cross_game_compatible species must declare a traveler_epithet for Folkfork UI');
  }

  if (!template.genome_flags || Object.keys(template.genome_flags).length === 0) {
    violations.push('genome_flags must be declared with at least one biochemistry parameter');
  }

  // Verify required traits: species must have at least one innate trait
  if (!template.innateTraits || template.innateTraits.length === 0) {
    violations.push('species must define at least one innate trait');
  }

  return {
    speciesId: template.speciesId,
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Validate all 6 folklorist species against the MUL-1357 schema.
 * Throws if any species fails validation.
 */
export function validateAllFolkloristSpecies(): MUL1357ValidationResult[] {
  const results = Object.values(FOLKLORIST_SPECIES_REGISTRY).map(validateAgainstMUL1357Schema);

  const failures = results.filter(r => !r.valid);
  if (failures.length > 0) {
    const summary = failures
      .map(f => `  ${f.speciesId}: ${f.violations.join('; ')}`)
      .join('\n');
    throw new Error(`MUL-1357 schema validation failed for ${failures.length} species:\n${summary}`);
  }

  return results;
}
