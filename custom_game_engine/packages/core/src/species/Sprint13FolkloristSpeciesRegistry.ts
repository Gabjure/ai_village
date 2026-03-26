/**
 * Folklorist Species Registry — Sprint 13 Theme C Batch
 *
 * Five species from underrepresented folklore traditions:
 * - Sámi (Arctic Scandinavia): Stállu-Rin
 * - Ainu (Hokkaido/Japan): Koropokkuru-Kin
 * - Taíno (Caribbean pre-Columbian): Opía-Vel
 * - Igbo (West Africa): Ogbanje-Kin
 * - Hmong (SE Asian Highlands): Dab-Tsog-Vel
 *
 * Designed by Scheherazade (Folklorist) — MUL-2009
 * Implemented by Huxley (Geneticist) — MUL-2084
 *
 * Sources:
 * - Sámi: Åke Hultkrantz, The Religions of the American Indians (1967); Israel Ruong, Samer i forntid och nutid (1969)
 * - Ainu: Bronisław Piłsudski, Materials for the Study of the Ainu Language and Folklore (1912)
 * - Taíno: Ramón Pané, Relación acerca de las antigüedades de los indios (c.1498)
 * - Igbo: Chinua Achebe, Things Fall Apart (1958); Victor Uchendu, The Igbo of Southeast Nigeria (1965)
 * - Hmong: Shelley Adler, Sleep Paralysis: Night-mares, Nocebos, and the Mind-Body Connection (2011)
 */

import type { SpeciesTrait } from '../components/SpeciesComponent.js';
import type { SpeciesTemplate } from './SpeciesRegistry.js';
import { validateAgainstMUL1357Schema } from './FolkloristSpeciesRegistry.js';
export type { MUL1357ValidationResult } from './FolkloristSpeciesRegistry.js';

// ============================================================================
// NEW MECHANIC SCAFFOLDS (15 mechanics — MUL-2084 Sprint 13 deliverable)
// Each trait below defines one of the new mechanics as an innate species trait.
// Game systems consume these via abilitiesGranted[] strings.
// ============================================================================

// Mechanic 1: Iron-shod pursuit (Stállu-Rin)
// Heavy but relentless — slow movement, high aggro persistence, ground-shake on movement.
export const TRAIT_IRON_SHOD_PURSUIT: SpeciesTrait = {
  id: 'iron_shod_pursuit',
  name: 'Iron-Shod Pursuit',
  description: 'Slow but relentless pursuer. Does not lose aggro for pursuit_persistence ticks. Movement shakes adjacent ground tiles, dealing minor structural damage within ground_shake_radius.',
  category: 'physical',
  abilitiesGranted: ['persistent_aggro', 'ground_shake_movement', 'structure_damage_adjacent'],
  skillBonus: { combat: 0.2 },
};

// Mechanic 2: Silver obsession interrupt (Stállu-Rin)
// Visible precious metal items override ALL other drives — exploitable weakness.
export const TRAIT_SILVER_OBSESSION: SpeciesTrait = {
  id: 'silver_obsession',
  name: 'Silver Obsession',
  description: 'Visible silver or precious metal items within detection range interrupt all current actions. Will path to and collect the item, ignoring threats, targets, and hunger. Exploitable bait mechanic.',
  category: 'social',
  abilitiesGranted: ['silver_detection', 'drive_override_silver', 'item_collect_precious'],
  vulnerabilities: ['silver_bait_exploitable'],
};

// Mechanic 3: Cleverness confusion (Stállu-Rin)
// Agents with problem_solving > threshold can confuse it, causing target loss and wandering.
export const TRAIT_CLEVERNESS_CONFUSION: SpeciesTrait = {
  id: 'cleverness_confusion',
  name: 'Cleverness Vulnerability',
  description: 'Agents with problem_solving > cleverness_confusion_threshold can perform a trick action. Success causes confusion state: loses current target, wanders randomly for confusion_duration ticks. Unlike bested_state, retains full aggression after confusion clears.',
  category: 'sensory',
  abilitiesGranted: ['confusion_state', 'trick_action_target'],
  vulnerabilities: ['intelligence_exploitable'],
  skillBonus: { perception: -0.3 },
};

// Mechanic 4: Anonymous gift deposit (Koropokkuru-Kin)
// Deposits items near settlements at night when unobserved. Gift quality scales with settlement prosperity.
export const TRAIT_ANONYMOUS_GIFT: SpeciesTrait = {
  id: 'anonymous_gift',
  name: 'Anonymous Gift Economy',
  description: 'Deposits resource items (food, herbs, small crafts) near settlement structures during night cycle. Only acts when no agent is within observation_flee_range. Gift quality scales with settlement prosperity metric.',
  category: 'social',
  abilitiesGranted: ['gift_deposit_nocturnal', 'settlement_prosperity_read', 'unobserved_action_gate'],
  skillBonus: { crafting: 0.3 },
};

// Mechanic 5: Observation flight response (Koropokkuru-Kin)
// Instant burrow when any agent approaches. Escalating cooldown on repeated disturbances.
export const TRAIT_OBSERVATION_FLIGHT: SpeciesTrait = {
  id: 'observation_flight',
  name: 'Observation Flight',
  description: 'If any agent enters observation_flee_range, instantly burrows underground (2-tick animation) becoming invisible and unreachable. Cooldown before resurfacing escalates with each disturbance (base × escalation^count). After disturbance_exodus_threshold events, permanently relocates.',
  category: 'physical',
  abilitiesGranted: ['instant_burrow', 'observation_radius_check', 'escalating_cooldown', 'settlement_exodus'],
};

// Mechanic 6: Butterbur symbiosis (Koropokkuru-Kin)
// Requires nearby butterbur plant tiles. Will cultivate them. Health drains without proximity.
export const TRAIT_BUTTERBUR_SYMBIOSIS: SpeciesTrait = {
  id: 'butterbur_symbiosis',
  name: 'Butterbur Symbiosis',
  description: 'Requires butterbur plant tiles within butterbur_proximity_requirement to survive. Health drains slowly without proximity. Performs planting actions to cultivate new butterbur patches near burrow. Oversized butterbur = tell for observant players.',
  category: 'metabolic',
  needsModifier: { hunger: 0.5 }, // Supplemented by butterbur proximity
  abilitiesGranted: ['butterbur_health_link', 'butterbur_cultivation', 'plant_proximity_survival'],
};

// Mechanic 7: Nocturnal phase-lock (Opía-Vel)
// Active only at night. Fades to dormancy at dawn; materializes at dusk.
export const TRAIT_NOCTURNAL_PHASE_LOCK: SpeciesTrait = {
  id: 'nocturnal_phase_lock',
  name: 'Nocturnal Phase-Lock',
  description: 'Active only during night cycle. At dawn, fades into dormancy: invisible, intangible, no interactions possible. At dusk, materializes at last dormancy location. Strict day/night gameplay dependency.',
  category: 'magical',
  abilitiesGranted: ['phase_dormancy_dawn', 'phase_manifest_dusk', 'nocturnal_only'],
};

// Mechanic 8: Guava dependency (Opía-Vel)
// Sole food source is guava fruit. No guava = weakened_hunger state.
export const TRAIT_GUAVA_DEPENDENCY: SpeciesTrait = {
  id: 'guava_dependency',
  name: 'Guava Dependency',
  description: 'Sole food source is guava fruit items. Will path to guava trees during night cycle. Without guava: enters weakened_hunger state (reduced speed, shapeshifting disabled). Creates agricultural incentive near settlements.',
  category: 'metabolic',
  needsModifier: { hunger: 1.2 }, // Slightly elevated hunger; narrow food source
  abilitiesGranted: ['guava_exclusive_diet', 'weakened_hunger_state', 'guava_tree_detection'],
};

// Mechanic 9: Observation-buffer shapeshifting (Opía-Vel)
// Copies observed humanoid agents. Detectable by absent navel (perception check).
export const TRAIT_NAVEL_LESS_DISGUISE: SpeciesTrait = {
  id: 'navel_less_disguise',
  name: 'Navel-less Disguise',
  description: 'Assumes appearance of any humanoid agent stored in observation_buffer (last 5 observed). Near-perfect disguise lacks a navel — agents with perception > disguise_detection_perception who inspect can detect. Detected Opía-Vel drops disguise and flees.',
  category: 'magical',
  abilitiesGranted: ['observation_buffer_copy', 'humanoid_disguise', 'disguise_detection_navel', 'flee_on_detection'],
  skillBonus: { deception: 0.4 },
};

// Mechanic 10: Rebirth loop (Ogbanje-Kin)
// Death triggers respawn at mother's location. Continues until iyi-uwa found.
export const TRAIT_REBIRTH_LOOP: SpeciesTrait = {
  id: 'rebirth_loop',
  name: 'Rebirth Loop',
  description: 'On death, respawns at mother entity location after rebirth_delay ticks. New body, same personality and memories. Cycle continues until iyi-uwa anchor is found and destroyed. Maximum max_rebirth_cycles before the spirit departs.',
  category: 'spiritual',
  abilitiesGranted: ['death_respawn_mother', 'personality_persistence', 'rebirth_counter'],
};

// Mechanic 11: Hidden anchor — iyi-uwa (Ogbanje-Kin)
// Buried invisible item that breaks the rebirth cycle when found and destroyed.
export const TRAIT_IYI_UWA_ANCHOR: SpeciesTrait = {
  id: 'iyi_uwa_anchor',
  name: 'Hidden Anchor (Iyi-Uwa)',
  description: 'At spawn, a hidden item entity is placed in a random tile within iyi_uwa_radius of birth location. Invisible but findable via dig/excavate action. Diviners (spiritual > 0.7) can narrow search radius. Destroying the item permanently breaks the rebirth loop.',
  category: 'spiritual',
  abilitiesGranted: ['iyi_uwa_spawn', 'divination_search_narrowing', 'rebirth_break_on_destroy'],
};

// Mechanic 12: Spirit companion risk influence (Ogbanje-Kin)
// Periodic invisible events that increase risk-taking and reduce self-preservation.
export const TRAIT_SPIRIT_COMPANION_CALL: SpeciesTrait = {
  id: 'spirit_companion_call',
  name: 'Spirit Companion Influence',
  description: 'Periodically receives calls from spirit companions (invisible drive-manipulation events). Increases risk_taking drive and reduces self_preservation. Causes dangerous behavior: approaching predators, ignoring hunger, wandering into hazards. This drives the repeated deaths.',
  category: 'spiritual',
  abilitiesGranted: ['spirit_call_receive', 'risk_drive_boost', 'self_preservation_penalty'],
  needsModifier: { self_preservation: -0.3 },
};

// Mechanic 13: Sleep-phase predation (Dab-Tsog-Vel)
// Targets sleeping agents. Initiates pressing action causing sleep paralysis + health drain.
export const TRAIT_SLEEP_PHASE_PREDATION: SpeciesTrait = {
  id: 'sleep_phase_predation',
  name: 'Sleep-Phase Predation',
  description: 'Targets agents in sleeping state. Initiates pressing action: target enters sleep_paralysis (cannot wake, cannot move, health drain at press_damage_rate/tick for press_duration ticks). Awake agents within intervention_range can break the paralysis via wake action.',
  category: 'physical',
  abilitiesGranted: ['sleep_target_selection', 'pressing_action', 'sleep_paralysis_inflict', 'intervention_breakable'],
  skillBonus: { stealth: 0.4 },
};

// Mechanic 14: Spiritual vulnerability detection (Dab-Tsog-Vel)
// Targets agent with lowest spiritual_protection score in range.
export const TRAIT_SPIRITUAL_VULNERABILITY_SENSE: SpeciesTrait = {
  id: 'spiritual_vulnerability_sense',
  name: 'Spiritual Vulnerability Detection',
  description: 'Detects spiritual_protection scores of all agents within vulnerability_detection_range. Always targets the agent with the LOWEST score. Agents near shamans, or who recently participated in rituals, have elevated protection. Taboo violators have reduced protection.',
  category: 'sensory',
  abilitiesGranted: ['spiritual_protection_scan', 'lowest_protection_targeting', 'taboo_vulnerability_detect'],
};

// Mechanic 15: Dawn banishment retreat (Dab-Tsog-Vel)
// At dawn, physically retreats to anchor point. Can be intercepted. Shaman ritual destroys it.
export const TRAIT_DAWN_BANISHMENT: SpeciesTrait = {
  id: 'dawn_banishment',
  name: 'Dawn Banishment',
  description: 'At dawn, forced to physically retreat to anchor tile (contaminated site). Unlike phase-dormancy, retreat is visible and interceptable. A shaman performing banishment ritual at the anchor point permanently destroys the entity.',
  category: 'spiritual',
  abilitiesGranted: ['dawn_forced_retreat', 'anchor_binding', 'shaman_banishment_vulnerability'],
  vulnerabilities: ['shaman_banishment', 'dawn_interception'],
};

// ============================================================================
// STÁLLU-RIN (Sámi, Arctic Scandinavia)
// ============================================================================
// Folklore: Sámi oral tradition, Arctic Scandinavia.
// Solitary ogre-giant — relentless pursuer, obsessed with silver, undone by cleverness.
// Sources: Åke Hultkrantz, The Religions of the American Indians (1967);
//          Israel Ruong, Samer i forntid och nutid (1969)

export const STALLU_RIN_SPECIES: SpeciesTemplate = {
  speciesId: 'stallu_rin',
  speciesName: 'Stállu-Rin',
  commonName: 'Stállu',

  description: `The Stállu-Rin is a solitary ogre-giant from Sámi oral tradition of Arctic Scandinavia
— 3m tall with grey-brown skin textured like lichen-covered stone, small red-rimmed eyes set deep
beneath a heavy brow, and long matted grey-white hair. It wears crude iron boots that spark
against rock and shake the ground with each step.

A relentless but dim-witted predator: once it acquires a target, it pursues for an extraordinary
duration (pursuit_persistence: 200 ticks) without losing aggro. Its iron-shod footfalls deal minor
structural damage to adjacent tiles — prolonged Stállu presence near a settlement degrades
buildings.

Its critical weakness is an uncontrollable obsession with silver and precious metals. Visible silver
items within detection range override ALL other drives — the Stállu-Rin will break pursuit, ignore
threats, and path directly to collect the item. Settlements can exploit this by placing silver bait
to lure it away. Additionally, agents with sufficient problem-solving ability (> 0.6) can perform a
trick action that induces a confusion state, causing it to lose its target and wander aimlessly.

In Sámi tradition, the Stállu is always defeated by human cleverness, never by brute force. The
game preserves this: direct combat is extremely dangerous, but intelligence-based counters are
reliable and repeatable.

*-rin suffix marks trickster/mischievous species in the game taxonomy.*`,

  bodyPlanId: 'giant_iron_shod',

  innateTraits: [
    TRAIT_IRON_SHOD_PURSUIT,
    TRAIT_SILVER_OBSESSION,
    TRAIT_CLEVERNESS_CONFUSION,
  ],

  compatibleSpecies: [],
  mutationRate: 0.010,

  averageHeight: 300,
  averageWeight: 400,
  sizeCategory: 'huge',

  lifespan: 500,
  lifespanType: 'long_lived',
  maturityAge: 60,
  gestationPeriod: 300,

  sapient: true,
  socialStructure: 'solitary_roamer',

  traveler_epithet: 'a heavy footfall from the frozen passes',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    pursuit_persistence: 200,
    silver_detection_range: 25,
    silver_obsession_interrupt: true,
    cleverness_confusion_threshold: 0.6,
    confusion_duration: 40,
    ground_shake_radius: 3,
    iron_boot_structure_damage: 0.05,
  },
};

// ============================================================================
// KOROPOKKURU-KIN (Ainu, Hokkaido/Japan)
// ============================================================================
// Folklore: Ainu oral tradition, Hokkaido.
// Tiny burrowing people — invisible benefactors who gift settlements at night.
// Sources: Bronisław Piłsudski, Materials for the Study of the Ainu Language and Folklore (1912);
//          Kyosuke Kindaichi, Ainu Life and Legends (1941)

export const KOROPOKKURU_KIN_SPECIES: SpeciesTemplate = {
  speciesId: 'koropokkuru_kin',
  speciesName: 'Koropokkuru-Kin',
  commonName: 'Koropokkuru',

  description: `The Koropokkuru-Kin are tiny burrowing people from Ainu oral tradition of Hokkaido —
standing only 30cm tall, with brown skin, large dark eyes adapted for low light, and woven leaf
garments. They carry miniature woven baskets and move in quick, darting motions.

They are invisible benefactors: during the night cycle, when no agent is within observation range,
they emerge from burrows near settlements and deposit small gifts — food, herbs, tiny craft items.
Gift quality scales with the settlement's prosperity. They are the game's emergent gift-economy
mechanic: settlements that thrive attract better gifts, creating a positive feedback loop that
players may not initially understand.

Their defining behavior is extreme observation flight: if ANY agent moves within observation_flee_range,
the Koropokkuru-Kin instantly burrows underground and remains hidden. Each disturbance lengthens
the cooldown before resurfacing (base × escalation^count). After enough disturbances, the colony
permanently relocates to a different settlement zone — the Ainu legend's departure made mechanical.

They require butterbur plant tiles to survive. Without proximity to butterbur, health slowly drains.
They actively cultivate butterbur patches near their burrows, creating a botanical tell: oversized
butterbur near a settlement indicates Koropokkuru-Kin presence.

*-kin suffix marks socially-organized, family-group species in the game taxonomy.*`,

  bodyPlanId: 'tiny_burrowing_humanoid',

  innateTraits: [
    TRAIT_ANONYMOUS_GIFT,
    TRAIT_OBSERVATION_FLIGHT,
    TRAIT_BUTTERBUR_SYMBIOSIS,
  ],

  compatibleSpecies: [],
  mutationRate: 0.006,

  averageHeight: 30,
  averageWeight: 2,
  sizeCategory: 'tiny',

  lifespan: 200,
  lifespanType: 'long_lived',
  maturityAge: 10,
  gestationPeriod: 60,

  sapient: true,
  socialStructure: 'hidden_colony',

  traveler_epithet: 'a small kindness left beneath a leaf',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    gift_deposit_cooldown: 40,
    observation_flee_range: 8,
    disturbance_cooldown_base: 60,
    disturbance_cooldown_escalation: 1.5,
    disturbance_exodus_threshold: 5,
    butterbur_health_drain_rate: 0.01,
    butterbur_proximity_requirement: 10,
    gift_quality_prosperity_scaling: true,
  },
};

// ============================================================================
// OPÍA-VEL (Taíno, Caribbean pre-Columbian)
// ============================================================================
// Folklore: Taíno tradition, Hispaniola, Puerto Rico, Cuba, Jamaica.
// Spirits of the dead — nocturnal, guava-eating, shapeshifting. Detectable by absent navel.
// Sources: Ramón Pané, Relación acerca de las antigüedades de los indios (c.1498);
//          Irving Rouse, The Tainos (1992)

export const OPIA_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'opia_vel',
  speciesName: 'Opía-Vel',
  commonName: 'Opía',

  description: `The Opía-Vel are spirits of the dead from Taíno tradition of the Caribbean — the
indigenous people of Hispaniola, Puerto Rico, Cuba, and Jamaica. In their true form they are
translucent grey-blue humanoids, faintly luminescent, with smooth featureless torsos (no navel),
solid dark pool-like eyes, and feet that don't quite touch the ground.

They exist in strict nocturnal phase-lock: at dawn they fade into dormancy — invisible, intangible,
unreachable. At dusk they materialize at their last position. This creates gameplay that is
fundamentally different during night cycles.

Their sole food source is guava fruit, following the Taíno belief that opía feed on guava in the
nighttime forests. Without guava access, they enter a weakened_hunger state. This creates an
agricultural incentive: settlements that cultivate guava groves attract Opía-Vel, which may be
desirable or threatening depending on context.

Their most distinctive mechanic is observation-buffer shapeshifting: they can assume the appearance
of any humanoid agent they have recently observed (buffer of 5). The disguise is near-perfect but
always lacks a navel — a detail from Taíno oral tradition. Agents with sufficient perception who
perform an inspect action can detect the deception. Detected Opía-Vel immediately drop the disguise
and flee.

Documented by Ramón Pané in 1498 — the first European ethnography of the Americas.

*-vel suffix marks spiritual-grade species in the game taxonomy.*`,

  bodyPlanId: 'phase_shifting_spirit',

  innateTraits: [
    TRAIT_NOCTURNAL_PHASE_LOCK,
    TRAIT_GUAVA_DEPENDENCY,
    TRAIT_NAVEL_LESS_DISGUISE,
  ],

  compatibleSpecies: [],
  mutationRate: 0.002,

  averageHeight: 170,
  averageWeight: 20,
  sizeCategory: 'medium',

  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,

  sapient: true,
  socialStructure: 'solitary_wanderer',

  traveler_epithet: 'a walker between dusk and dawn, with no mark of birth',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    phase_dormancy: true,
    guava_detection_range: 20,
    observation_buffer_size: 5,
    disguise_detection_perception: 0.65,
    weakened_hunger_speed_penalty: 0.5,
  },
};

// ============================================================================
// OGBANJE-KIN (Igbo, West Africa)
// ============================================================================
// Folklore: Igbo tradition, southeastern Nigeria.
// Spirit children locked in rebirth cycle — broken only by finding the hidden iyi-uwa.
// Sources: Chinua Achebe, Things Fall Apart (1958);
//          Victor Uchendu, The Igbo of Southeast Nigeria (1965);
//          M.M. Green, Igbo Village Affairs (1947)

export const OGBANJE_KIN_SPECIES: SpeciesTemplate = {
  speciesId: 'ogbanje_kin',
  speciesName: 'Ogbanje-Kin',
  commonName: 'Ogbanje',

  description: `The Ogbanje-Kin are spirit children from Igbo tradition of southeastern Nigeria — beings
caught in a rebirth loop, repeatedly dying young and returning to the same mother. They appear as
normal humanoid children with unusually bright, knowing eyes that seem older than their bodies.

Their core mechanic is the rebirth loop: when an Ogbanje-Kin dies (from any cause), it respawns at
its mother entity's location after rebirth_delay ticks with a new body but identical personality and
memories. The cycle creates emergent grief-narrative in settlements — the same child keeps dying and
returning, recognized by its persistent personality.

The cycle can only be broken by finding the iyi-uwa — a hidden anchor object buried at a random tile
within iyi_uwa_radius of the birth location. The item is invisible but can be discovered through
dig/excavate actions. Agents with high spiritual skill (> 0.7) can perform divination to narrow the
search area. Finding and destroying the iyi-uwa permanently ends the rebirth loop.

What drives the repeated deaths is spirit companion influence: periodic invisible events from the
Ogbanje-Kin's spirit-world peer group that boost risk_taking and suppress self_preservation. The
child wanders toward predators, ignores hunger, enters hazardous biomes — all driven by the call
of companions in the other world.

Chinua Achebe depicted the Ogbanje in Things Fall Apart (1958); the ethnographic basis comes from
M.M. Green's Igbo Village Affairs (1947) and Victor Uchendu's The Igbo of Southeast Nigeria (1965).

*-kin suffix marks socially-organized, family-group species in the game taxonomy.*`,

  bodyPlanId: 'humanoid_child',

  innateTraits: [
    TRAIT_REBIRTH_LOOP,
    TRAIT_IYI_UWA_ANCHOR,
    TRAIT_SPIRIT_COMPANION_CALL,
  ],

  compatibleSpecies: [],
  mutationRate: 0.009,

  averageHeight: 100,
  averageWeight: 20,
  sizeCategory: 'small',

  lifespan: 15,
  lifespanType: 'mortal',
  maturityAge: 15, // Never truly reaches maturity — locked juvenile
  gestationPeriod: 270,

  sapient: true,
  socialStructure: 'family_bound',

  traveler_epithet: 'a child who remembers the road back',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    rebirth_delay: 30,
    iyi_uwa_radius: 30,
    divination_search_narrowing: 0.5,
    spirit_call_interval: 80,
    spirit_call_risk_boost: 0.4,
    spirit_call_self_preservation_penalty: -0.3,
    max_rebirth_cycles: 7,
    iyi_uwa_dig_reveal: true,
  },
};

// ============================================================================
// DAB-TSOG-VEL (Hmong, SE Asian Highlands)
// ============================================================================
// Folklore: Hmong spiritual tradition, Laos, Vietnam, Thailand, southern China.
// Nocturnal pressing spirit — targets sleeping agents, hunts the spiritually unprotected.
// Sources: Shelley Adler, Sleep Paralysis: Night-mares, Nocebos, and the Mind-Body Connection (2011);
//          Jacques Lemoine, Yao Ceremonial Paintings (1982)

export const DAB_TSOG_VEL_SPECIES: SpeciesTemplate = {
  speciesId: 'dab_tsog_vel',
  speciesName: 'Dab-Tsog-Vel',
  commonName: 'Dab Tsog',

  description: `The Dab-Tsog-Vel is a nocturnal pressing spirit from Hmong spiritual tradition of the
Southeast Asian highlands — Laos, Vietnam, Thailand, and southern China. It manifests as a
semi-transparent dark mass, vaguely humanoid but without clear features, denser at the center and
wisping at the edges like dark smoke. Two dim red points mark where eyes would be.

It is responsible for what Hmong tradition identifies as dab tsog — the pressing spirit that causes
sudden death during sleep. In biomedicine this corresponds to SUNDS (sudden unexpected nocturnal
death syndrome), a phenomenon documented in Hmong refugee communities by Shelley Adler (2011).

Its primary mechanic is sleep-phase predation: it targets only sleeping agents, initiating a
pressing action that places the target in sleep_paralysis — unable to wake, unable to move, with
health draining at press_damage_rate per tick. Critically, nearby awake agents can perform an
intervention action to break the paralysis, creating a mechanical incentive for communal sleeping
arrangements and night watches.

It detects spiritual vulnerability: always targeting the agent with the lowest spiritual_protection
score in range. Agents near shaman entities or who have recently performed ritual actions have
elevated protection. Agents who have violated cultural taboos have reduced protection. This creates
emergent incentive for ritual participation and cultural adherence.

At dawn it must physically retreat to its anchor tile — a spiritually-contaminated site (death
location, taboo violation site). Unlike the Opía-Vel's phase-dormancy, this retreat is visible
and the entity can be intercepted or attacked during it. A shaman performing a banishment ritual
at the anchor point permanently destroys the entity.

*-vel suffix marks spiritual-grade species in the game taxonomy.*`,

  bodyPlanId: 'shadow_mass_spirit',

  innateTraits: [
    TRAIT_SLEEP_PHASE_PREDATION,
    TRAIT_SPIRITUAL_VULNERABILITY_SENSE,
    TRAIT_DAWN_BANISHMENT,
  ],

  compatibleSpecies: [],
  mutationRate: 0.001,

  averageHeight: 170,
  averageWeight: 10,
  sizeCategory: 'medium',

  lifespan: 0,
  lifespanType: 'ageless',
  maturityAge: 0,
  gestationPeriod: 0,

  sapient: false,
  socialStructure: 'solitary_predator',

  traveler_epithet: 'a weight that finds the unguarded sleeper',

  cross_game_compatible: true,
  native_game: 'both',

  genome_flags: {
    press_damage_rate: 0.08,
    press_duration: 15,
    intervention_range: 5,
    spiritual_protection_threshold: 0.4,
    vulnerability_detection_range: 15,
    dawn_retreat_speed: 2.0,
    anchor_contamination_radius: 5,
    taboo_vulnerability_multiplier: 1.5,
    shaman_banishment_ritual_duration: 20,
  },
};

// ============================================================================
// Sprint 13 Folklorist Species Registry
// ============================================================================

export const SPRINT13_FOLKLORIST_SPECIES_REGISTRY: Record<string, SpeciesTemplate> = {
  stallu_rin: STALLU_RIN_SPECIES,
  koropokkuru_kin: KOROPOKKURU_KIN_SPECIES,
  opia_vel: OPIA_VEL_SPECIES,
  ogbanje_kin: OGBANJE_KIN_SPECIES,
  dab_tsog_vel: DAB_TSOG_VEL_SPECIES,
};

/**
 * Get all Sprint 13 folklorist species
 */
export function getAllSprint13FolkloristSpecies(): SpeciesTemplate[] {
  return Object.values(SPRINT13_FOLKLORIST_SPECIES_REGISTRY);
}

/**
 * Validate all Sprint 13 species against the cross-game migration schema (MUL-1357 format).
 * Re-uses the MUL-1357 validation from the Sprint 9 registry.
 * Throws if any species fails validation.
 */
export function validateAllSprint13Species(): import('./FolkloristSpeciesRegistry.js').MUL1357ValidationResult[] {
  const results = Object.values(SPRINT13_FOLKLORIST_SPECIES_REGISTRY).map(validateAgainstMUL1357Schema);
  const failures = results.filter(r => !r.valid);
  if (failures.length > 0) {
    const summary = failures
      .map(f => `  ${f.speciesId}: ${f.violations.join('; ')}`)
      .join('\n');
    throw new Error(`MUL-1357 schema validation failed for ${failures.length} species:\n${summary}`);
  }
  return results;
}
