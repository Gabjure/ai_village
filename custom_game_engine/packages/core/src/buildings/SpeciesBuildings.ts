/**
 * Species-Specific Building Definitions
 *
 * Buildings generated for four fantasy species:
 * - Elven: Organic, nature-integrated architecture
 * - Centaur: Open spaces, quadrupedal accessibility
 * - Angelic: Vertical, divine light, sacred geometry
 * - High Fae (10D): Non-euclidean, impossible geometry
 */

import type { BuildingBlueprint } from './BuildingBlueprintRegistry.js';
import buildingsDataRaw from '../../data/buildings.json';

const buildingsData = buildingsDataRaw as { buildings: BuildingBlueprint[] };

/**
 * Get building by ID (throws if not found)
 */
function getBuilding(id: string): BuildingBlueprint {
  const building = buildingsData.buildings.find(b => b.id === id);
  if (!building) {
    throw new Error(`Building not found: ${id}`);
  }
  return building as BuildingBlueprint;
}

// =============================================================================
// ELVEN BUILDINGS - Organic, nature-integrated architecture
// =============================================================================

export const ELVEN_MOONLIT_TREEHOUSE: BuildingBlueprint = getBuilding('elven_treehouse');
export const ELVEN_MEDITATION_BOWER: BuildingBlueprint = getBuilding('elven_meditationbower');
export const ELVEN_LIVING_WOOD_LIBRARY: BuildingBlueprint = getBuilding('elven_library');
export const ELVEN_ENCHANTED_FORGE: BuildingBlueprint = getBuilding('enchanted_forge');
export const ELVEN_STARLIGHT_SANCTUARY: BuildingBlueprint = getBuilding('starlight_sanctuary');

export const ALL_ELVEN_BUILDINGS = [
  ELVEN_MOONLIT_TREEHOUSE,
  ELVEN_MEDITATION_BOWER,
  ELVEN_LIVING_WOOD_LIBRARY,
  ELVEN_ENCHANTED_FORGE,
  ELVEN_STARLIGHT_SANCTUARY,
];

// =============================================================================
// CENTAUR BUILDINGS - Open spaces for quadrupedal movement
// =============================================================================

export const CENTAUR_STABLE: BuildingBlueprint = getBuilding('centaur_stable');
export const CENTAUR_CLAN_HALL: BuildingBlueprint = getBuilding('centaur_meeting_hall');
export const CENTAUR_OPEN_SMITHY: BuildingBlueprint = getBuilding('centaur_smithy');
export const CENTAUR_TRAINING_SHELTER: BuildingBlueprint = getBuilding('centaur_training_shelter');
export const CENTAUR_WAR_COUNCIL: BuildingBlueprint = getBuilding('centaur_war_council');

export const ALL_CENTAUR_BUILDINGS = [
  CENTAUR_STABLE,
  CENTAUR_CLAN_HALL,
  CENTAUR_OPEN_SMITHY,
  CENTAUR_TRAINING_SHELTER,
  CENTAUR_WAR_COUNCIL,
];

// =============================================================================
// ANGELIC BUILDINGS - Vertical transcendence, divine light
// =============================================================================

export const ANGELIC_PRAYER_SPIRE: BuildingBlueprint = getBuilding('celestial_prayer_spire');
export const ANGELIC_CHOIR_TOWER: BuildingBlueprint = getBuilding('choir_tower');
export const ANGELIC_CELESTIAL_ARCHIVES: BuildingBlueprint = getBuilding('celestial_archives');
export const ANGELIC_MEDITATION_SANCTUM: BuildingBlueprint = getBuilding('meditation_sanctum_angelic');

export const ALL_ANGELIC_BUILDINGS = [
  ANGELIC_PRAYER_SPIRE,
  ANGELIC_CHOIR_TOWER,
  ANGELIC_CELESTIAL_ARCHIVES,
  ANGELIC_MEDITATION_SANCTUM,
];

// =============================================================================
// HIGH FAE (10D) BUILDINGS - Non-euclidean, impossible geometry
// =============================================================================

export const HIGH_FAE_FOLDED_MANOR: BuildingBlueprint = getBuilding('folded_manor');
export const HIGH_FAE_CHRONODREAM_SPIRE: BuildingBlueprint = getBuilding('high_fae_impossible_tower');
export const HIGH_FAE_TESSERACT_COURT: BuildingBlueprint = getBuilding('tesseract_court');
export const HIGH_FAE_BETWEEN_SPACE_WORKSHOP: BuildingBlueprint = getBuilding('high_fae_workshop');

export const ALL_HIGH_FAE_BUILDINGS = [
  HIGH_FAE_FOLDED_MANOR,
  HIGH_FAE_CHRONODREAM_SPIRE,
  HIGH_FAE_TESSERACT_COURT,
  HIGH_FAE_BETWEEN_SPACE_WORKSHOP,
];

// =============================================================================
// DVERGAR BUILDINGS - Underground precision engineering, stone and steel
// =============================================================================

export const DVERGAR_RUNEFORGE_HALL: BuildingBlueprint = getBuilding('dvergar_forge_hall');
export const DVERGAR_STONEKIN_HOLD: BuildingBlueprint = getBuilding('dvergar_hold');
export const DVERGAR_DEBTKEEPERS_VAULT: BuildingBlueprint = getBuilding('dvergar_vault');
export const DVERGAR_ASSAY_CHAMBER: BuildingBlueprint = getBuilding('dvergar_assay_chamber');
export const DVERGAR_ANCESTOR_HALL: BuildingBlueprint = getBuilding('dvergar_ancestor_hall');

export const ALL_DVERGAR_BUILDINGS = [
  DVERGAR_RUNEFORGE_HALL,
  DVERGAR_STONEKIN_HOLD,
  DVERGAR_DEBTKEEPERS_VAULT,
  DVERGAR_ASSAY_CHAMBER,
  DVERGAR_ANCESTOR_HALL,
];

// =============================================================================
// JOTNAR BUILDINGS - Massive primordial architecture, ice and fire
// =============================================================================

export const JOTNAR_FROST_HALL: BuildingBlueprint = getBuilding('jotnar_frost_hall');
export const JOTNAR_FORGE_PIT: BuildingBlueprint = getBuilding('jotnar_forge_pit');
export const JOTNAR_RUNE_CIRCLE: BuildingBlueprint = getBuilding('jotnar_rune_circle');
export const JOTNAR_WAR_CAIRN: BuildingBlueprint = getBuilding('jotnar_war_cairn');
export const JOTNAR_PRIMORDIAL_THRONE: BuildingBlueprint = getBuilding('jotnar_primordial_throne');

export const ALL_JOTNAR_BUILDINGS = [
  JOTNAR_FROST_HALL,
  JOTNAR_FORGE_PIT,
  JOTNAR_RUNE_CIRCLE,
  JOTNAR_WAR_CAIRN,
  JOTNAR_PRIMORDIAL_THRONE,
];

// =============================================================================
// DRAGON BUILDINGS - Post-temporal 10D architecture, time and memory
// =============================================================================

export const DRAGON_TIME_ANCHOR: BuildingBlueprint = getBuilding('dragon_time_anchor');
export const DRAGON_HOARD_NEXUS: BuildingBlueprint = getBuilding('dragon_hoard_nexus');
export const DRAGON_MEMORY_SPIRE: BuildingBlueprint = getBuilding('dragon_memory_spire');
export const DRAGON_ROOST: BuildingBlueprint = getBuilding('dragon_roost');
export const DRAGON_COUNCIL_AERIE: BuildingBlueprint = getBuilding('dragon_council_aerie');

export const ALL_DRAGON_BUILDINGS = [
  DRAGON_TIME_ANCHOR,
  DRAGON_HOARD_NEXUS,
  DRAGON_MEMORY_SPIRE,
  DRAGON_ROOST,
  DRAGON_COUNCIL_AERIE,
];

// =============================================================================
// NAGAVEL BUILDINGS - Threshold guardian architecture
// =============================================================================

export const NAGAVEL_GATE_SHRINE: BuildingBlueprint = getBuilding('nagavel_gate_shrine');
export const NAGAVEL_COIL_HOLD: BuildingBlueprint = getBuilding('nagavel_coil_hold');
export const NAGAVEL_VENOM_LAB: BuildingBlueprint = getBuilding('nagavel_venom_lab');
export const NAGAVEL_BORDER_MARKET: BuildingBlueprint = getBuilding('nagavel_border_market');
export const NAGAVEL_THRESHOLD_SANCTUM: BuildingBlueprint = getBuilding('nagavel_threshold_sanctum');

export const ALL_NAGAVEL_BUILDINGS = [
  NAGAVEL_GATE_SHRINE,
  NAGAVEL_COIL_HOLD,
  NAGAVEL_VENOM_LAB,
  NAGAVEL_BORDER_MARKET,
  NAGAVEL_THRESHOLD_SANCTUM,
];

// =============================================================================
// KITSURI BUILDINGS - Illusion-based trickster architecture
// =============================================================================

export const KITSURI_FOX_DEN: BuildingBlueprint = getBuilding('kitsuri_fox_den');
export const KITSURI_TRICK_WORKSHOP: BuildingBlueprint = getBuilding('kitsuri_trick_workshop');
export const KITSURI_MIRROR_HALL: BuildingBlueprint = getBuilding('kitsuri_mirror_hall');
export const KITSURI_RIDDLE_MARKET: BuildingBlueprint = getBuilding('kitsuri_riddle_market');
export const KITSURI_NINE_TAIL_SHRINE: BuildingBlueprint = getBuilding('kitsuri_nine_tail_shrine');

export const ALL_KITSURI_BUILDINGS = [
  KITSURI_FOX_DEN,
  KITSURI_TRICK_WORKSHOP,
  KITSURI_MIRROR_HALL,
  KITSURI_RIDDLE_MARKET,
  KITSURI_NINE_TAIL_SHRINE,
];

// =============================================================================
// ANANSIWEB BUILDINGS - Story-weaver architecture
// =============================================================================

export const ANANSIWEB_STORY_LOOM: BuildingBlueprint = getBuilding('anansiweb_story_loom');
export const ANANSIWEB_WEB_NEST: BuildingBlueprint = getBuilding('anansiweb_web_nest');
export const ANANSIWEB_TALE_ARCHIVE: BuildingBlueprint = getBuilding('anansiweb_tale_archive');
export const ANANSIWEB_RUMOR_MARKET: BuildingBlueprint = getBuilding('anansiweb_rumor_market');
export const ANANSIWEB_SPINNER_SANCTUM: BuildingBlueprint = getBuilding('anansiweb_spinner_sanctum');

export const ALL_ANANSIWEB_BUILDINGS = [
  ANANSIWEB_STORY_LOOM,
  ANANSIWEB_WEB_NEST,
  ANANSIWEB_TALE_ARCHIVE,
  ANANSIWEB_RUMOR_MARKET,
  ANANSIWEB_SPINNER_SANCTUM,
];

// =============================================================================
// VALKYR BUILDINGS - Warrior-afterlife architecture
// =============================================================================

export const VALKYR_MEAD_HALL: BuildingBlueprint = getBuilding('valkyr_mead_hall');
export const VALKYR_ARMS_FORGE: BuildingBlueprint = getBuilding('valkyr_arms_forge');
export const VALKYR_SHIELD_WALL: BuildingBlueprint = getBuilding('valkyr_shield_wall');
export const VALKYR_SOUL_VAULT: BuildingBlueprint = getBuilding('valkyr_soul_vault');
export const VALKYR_ASCENSION_SPIRE: BuildingBlueprint = getBuilding('valkyr_ascension_spire');

export const ALL_VALKYR_BUILDINGS = [
  VALKYR_MEAD_HALL,
  VALKYR_ARMS_FORGE,
  VALKYR_SHIELD_WALL,
  VALKYR_SOUL_VAULT,
  VALKYR_ASCENSION_SPIRE,
];

// =============================================================================
// NORN BUILDINGS - Fate-weaver architecture
// =============================================================================

export const NORN_THREAD_COTTAGE: BuildingBlueprint = getBuilding('norn_thread_cottage');
export const NORN_LOOM_HALL: BuildingBlueprint = getBuilding('norn_loom_hall');
export const NORN_WELL_OF_URD: BuildingBlueprint = getBuilding('norn_well_of_urd');
export const NORN_PROPHECY_SPIRE: BuildingBlueprint = getBuilding('norn_prophecy_spire');
export const NORN_SKEIN_STOREHOUSE: BuildingBlueprint = getBuilding('norn_skein_storehouse');

export const ALL_NORN_BUILDINGS = [
  NORN_THREAD_COTTAGE,
  NORN_LOOM_HALL,
  NORN_WELL_OF_URD,
  NORN_PROPHECY_SPIRE,
  NORN_SKEIN_STOREHOUSE,
];

// =============================================================================
// GRENDEL BUILDINGS - Fen-dwelling monstrous architecture
// =============================================================================

export const GRENDEL_FEN_DEN: BuildingBlueprint = getBuilding('grendel_fen_den');
export const GRENDEL_BONE_PIT: BuildingBlueprint = getBuilding('grendel_bone_pit');
export const GRENDEL_MERE_SHRINE: BuildingBlueprint = getBuilding('grendel_mere_shrine');
export const GRENDEL_CAVERN_MEAD_HALL: BuildingBlueprint = getBuilding('grendel_cavern_mead_hall');
export const GRENDEL_TROPHY_CACHE: BuildingBlueprint = getBuilding('grendel_trophy_cache');

export const ALL_GRENDEL_BUILDINGS = [
  GRENDEL_FEN_DEN,
  GRENDEL_BONE_PIT,
  GRENDEL_MERE_SHRINE,
  GRENDEL_CAVERN_MEAD_HALL,
  GRENDEL_TROPHY_CACHE,
];

// =============================================================================
// ETTIN BUILDINGS - Two-headed giant architecture
// =============================================================================

export const ETTIN_SPLIT_LODGE: BuildingBlueprint = getBuilding('ettin_split_lodge');
export const ETTIN_DOUBLE_FORGE: BuildingBlueprint = getBuilding('ettin_double_forge');
export const ETTIN_ARGUMENT_COURT: BuildingBlueprint = getBuilding('ettin_argument_court');
export const ETTIN_GIANT_GRANARY: BuildingBlueprint = getBuilding('ettin_giant_granary');
export const ETTIN_TWO_ALTAR: BuildingBlueprint = getBuilding('ettin_two_altar');

export const ALL_ETTIN_BUILDINGS = [
  ETTIN_SPLIT_LODGE,
  ETTIN_DOUBLE_FORGE,
  ETTIN_ARGUMENT_COURT,
  ETTIN_GIANT_GRANARY,
  ETTIN_TWO_ALTAR,
];

// =============================================================================
// SHEE BUILDINGS - Irish fairy mound architecture
// =============================================================================

export const SHEE_HOLLOW_HILL: BuildingBlueprint = getBuilding('shee_hollow_hill');
export const SHEE_GLAMOUR_WEAVE: BuildingBlueprint = getBuilding('shee_glamour_weave');
export const SHEE_TWILIGHT_MARKET: BuildingBlueprint = getBuilding('shee_twilight_market');
export const SHEE_SIDHE_MOUND_TEMPLE: BuildingBlueprint = getBuilding('shee_sidhe_mound_temple');
export const SHEE_DREAM_CACHE: BuildingBlueprint = getBuilding('shee_dream_cache');

export const ALL_SHEE_BUILDINGS = [
  SHEE_HOLLOW_HILL,
  SHEE_GLAMOUR_WEAVE,
  SHEE_TWILIGHT_MARKET,
  SHEE_SIDHE_MOUND_TEMPLE,
  SHEE_DREAM_CACHE,
];

// =============================================================================
// MYCON BUILDINGS - Fungal network architecture
// =============================================================================

export const MYCON_SPORE_HUT: BuildingBlueprint = getBuilding('mycon_spore_hut');
export const MYCON_DECOMPOSER_VAT: BuildingBlueprint = getBuilding('mycon_decomposer_vat');
export const MYCON_NETWORK_NODE: BuildingBlueprint = getBuilding('mycon_network_node');
export const MYCON_GREAT_FRUITING_BODY: BuildingBlueprint = getBuilding('mycon_great_fruiting_body');
export const MYCON_SPORE_CACHE: BuildingBlueprint = getBuilding('mycon_spore_cache');

export const ALL_MYCON_BUILDINGS = [
  MYCON_SPORE_HUT,
  MYCON_DECOMPOSER_VAT,
  MYCON_NETWORK_NODE,
  MYCON_GREAT_FRUITING_BODY,
  MYCON_SPORE_CACHE,
];

// =============================================================================
// ALFAR BUILDINGS - Light elf celestial architecture
// =============================================================================

export const ALFAR_LIGHT_HALL: BuildingBlueprint = getBuilding('alfar_light_hall');
export const ALFAR_JEWEL_FORGE: BuildingBlueprint = getBuilding('alfar_jewel_forge');
export const ALFAR_SKY_GARDEN: BuildingBlueprint = getBuilding('alfar_sky_garden');
export const ALFAR_AURORA_SANCTUM: BuildingBlueprint = getBuilding('alfar_aurora_sanctum');
export const ALFAR_LORE_SPIRE: BuildingBlueprint = getBuilding('alfar_lore_spire');

export const ALL_ALFAR_BUILDINGS = [
  ALFAR_LIGHT_HALL,
  ALFAR_JEWEL_FORGE,
  ALFAR_SKY_GARDEN,
  ALFAR_AURORA_SANCTUM,
  ALFAR_LORE_SPIRE,
];

// =============================================================================
// FYLGJA BUILDINGS - Spirit-guide totem architecture
// =============================================================================

export const FYLGJA_TOTEM_POST: BuildingBlueprint = getBuilding('fylgja_totem_post');
export const FYLGJA_SHAPE_DEN: BuildingBlueprint = getBuilding('fylgja_shape_den');
export const FYLGJA_WARD_CIRCLE: BuildingBlueprint = getBuilding('fylgja_ward_circle');
export const FYLGJA_SPIRIT_MENAGERIE: BuildingBlueprint = getBuilding('fylgja_spirit_menagerie');
export const FYLGJA_OMEN_LODGE: BuildingBlueprint = getBuilding('fylgja_omen_lodge');

export const ALL_FYLGJA_BUILDINGS = [
  FYLGJA_TOTEM_POST,
  FYLGJA_SHAPE_DEN,
  FYLGJA_WARD_CIRCLE,
  FYLGJA_SPIRIT_MENAGERIE,
  FYLGJA_OMEN_LODGE,
];

// =============================================================================
// LANDVAETTIR BUILDINGS - Land-spirit guardian architecture
// =============================================================================

export const LANDVAETTIR_ROOTHOUSE: BuildingBlueprint = getBuilding('landvaettir_roothouse');
export const LANDVAETTIR_BOUNDARY_STONE: BuildingBlueprint = getBuilding('landvaettir_boundary_stone');
export const LANDVAETTIR_GROVE_SHRINE: BuildingBlueprint = getBuilding('landvaettir_grove_shrine');
export const LANDVAETTIR_EARTHWORKS: BuildingBlueprint = getBuilding('landvaettir_earthworks');
export const LANDVAETTIR_GREAT_BARROW_MOOT: BuildingBlueprint = getBuilding('landvaettir_great_barrow_moot');

export const ALL_LANDVAETTIR_BUILDINGS = [
  LANDVAETTIR_ROOTHOUSE,
  LANDVAETTIR_BOUNDARY_STONE,
  LANDVAETTIR_GROVE_SHRINE,
  LANDVAETTIR_EARTHWORKS,
  LANDVAETTIR_GREAT_BARROW_MOOT,
];

// =============================================================================
// DRAUGR BUILDINGS - Undead barrow architecture
// =============================================================================

export const DRAUGR_BARROW_CELL: BuildingBlueprint = getBuilding('draugr_barrow_cell');
export const DRAUGR_BONE_WORKSHOP: BuildingBlueprint = getBuilding('draugr_bone_workshop');
export const DRAUGR_HOARD_VAULT: BuildingBlueprint = getBuilding('draugr_hoard_vault');
export const DRAUGR_ANCESTOR_MOUND: BuildingBlueprint = getBuilding('draugr_ancestor_mound');
export const DRAUGR_DEATH_THRONE: BuildingBlueprint = getBuilding('draugr_death_throne');

export const ALL_DRAUGR_BUILDINGS = [
  DRAUGR_BARROW_CELL,
  DRAUGR_BONE_WORKSHOP,
  DRAUGR_HOARD_VAULT,
  DRAUGR_ANCESTOR_MOUND,
  DRAUGR_DEATH_THRONE,
];

// =============================================================================
// RAVEN BUILDINGS - Thought-and-memory aerial architecture
// =============================================================================

export const RAVEN_WATCH_PERCH: BuildingBlueprint = getBuilding('raven_watch_perch');
export const RAVEN_MEMORY_LOFT: BuildingBlueprint = getBuilding('raven_memory_loft');
export const RAVEN_SKY_OBSERVATORY: BuildingBlueprint = getBuilding('raven_sky_observatory');
export const RAVEN_NEST_ROOST: BuildingBlueprint = getBuilding('raven_nest_roost');
export const RAVEN_THOUGHT_TEMPLE: BuildingBlueprint = getBuilding('raven_thought_temple');

export const ALL_RAVEN_BUILDINGS = [
  RAVEN_WATCH_PERCH,
  RAVEN_MEMORY_LOFT,
  RAVEN_SKY_OBSERVATORY,
  RAVEN_NEST_ROOST,
  RAVEN_THOUGHT_TEMPLE,
];

// =============================================================================
// SPRIGGAN BUILDINGS - Treasure-guardian standing-stone architecture
// =============================================================================

export const SPRIGGAN_WARREN_DEN: BuildingBlueprint = getBuilding('spriggan_warren_den');
export const SPRIGGAN_TREASURE_VAULT: BuildingBlueprint = getBuilding('spriggan_treasure_vault');
export const SPRIGGAN_STANDING_CIRCLE: BuildingBlueprint = getBuilding('spriggan_standing_circle');
export const SPRIGGAN_TINNERS_FORGE: BuildingBlueprint = getBuilding('spriggan_tinners_forge');
export const SPRIGGAN_GREAT_CAIRN: BuildingBlueprint = getBuilding('spriggan_great_cairn');

export const ALL_SPRIGGAN_BUILDINGS = [
  SPRIGGAN_WARREN_DEN,
  SPRIGGAN_TREASURE_VAULT,
  SPRIGGAN_STANDING_CIRCLE,
  SPRIGGAN_TINNERS_FORGE,
  SPRIGGAN_GREAT_CAIRN,
];

// =============================================================================
// VENTHARI BUILDINGS - Wind-riding nomadic architecture
// =============================================================================

export const VENTHARI_WIND_TENT: BuildingBlueprint = getBuilding('venthari_wind_tent');
export const VENTHARI_GUST_LOOM: BuildingBlueprint = getBuilding('venthari_gust_loom');
export const VENTHARI_ZEPHYR_SHRINE: BuildingBlueprint = getBuilding('venthari_zephyr_shrine');
export const VENTHARI_CARAVAN_DEPOT: BuildingBlueprint = getBuilding('venthari_caravan_depot');
export const VENTHARI_STORM_PALACE: BuildingBlueprint = getBuilding('venthari_storm_palace');

export const ALL_VENTHARI_BUILDINGS = [
  VENTHARI_WIND_TENT,
  VENTHARI_GUST_LOOM,
  VENTHARI_ZEPHYR_SHRINE,
  VENTHARI_CARAVAN_DEPOT,
  VENTHARI_STORM_PALACE,
];

// =============================================================================
// NYK BUILDINGS - River-spirit melody architecture
// =============================================================================

export const NYK_RIVER_DEN: BuildingBlueprint = getBuilding('nyk_river_den');
export const NYK_MELODY_GROTTO: BuildingBlueprint = getBuilding('nyk_melody_grotto');
export const NYK_FIDDLE_FORGE: BuildingBlueprint = getBuilding('nyk_fiddle_forge');
export const NYK_MIRROR_POOL: BuildingBlueprint = getBuilding('nyk_mirror_pool');
export const NYK_DEEP_COURT: BuildingBlueprint = getBuilding('nyk_deep_court');

export const ALL_NYK_BUILDINGS = [
  NYK_RIVER_DEN,
  NYK_MELODY_GROTTO,
  NYK_FIDDLE_FORGE,
  NYK_MIRROR_POOL,
  NYK_DEEP_COURT,
];

// =============================================================================
// CHERKHAN BUILDINGS - Shadow-hunter steppe architecture
// =============================================================================

export const CHERKHAN_BONE_YURT: BuildingBlueprint = getBuilding('cherkhan_bone_yurt');
export const CHERKHAN_TANNING_POST: BuildingBlueprint = getBuilding('cherkhan_tanning_post');
export const CHERKHAN_SHADOW_BLIND: BuildingBlueprint = getBuilding('cherkhan_shadow_blind');
export const CHERKHAN_SKULL_ALTAR: BuildingBlueprint = getBuilding('cherkhan_skull_altar');
export const CHERKHAN_APEX_LODGE: BuildingBlueprint = getBuilding('cherkhan_apex_lodge');

export const ALL_CHERKHAN_BUILDINGS = [
  CHERKHAN_BONE_YURT,
  CHERKHAN_TANNING_POST,
  CHERKHAN_SHADOW_BLIND,
  CHERKHAN_SKULL_ALTAR,
  CHERKHAN_APEX_LODGE,
];

// =============================================================================
// RUSALYN BUILDINGS - Mourning-water sorrow architecture
// =============================================================================

export const RUSALYN_WEEPING_HUT: BuildingBlueprint = getBuilding('rusalyn_weeping_hut');
export const RUSALYN_LAMENTATION_WELL: BuildingBlueprint = getBuilding('rusalyn_lamentation_well');
export const RUSALYN_TIDE_COURT: BuildingBlueprint = getBuilding('rusalyn_tide_court');
export const RUSALYN_DROWNING_GARDEN: BuildingBlueprint = getBuilding('rusalyn_drowning_garden');
export const RUSALYN_SORROW_SANCTUM: BuildingBlueprint = getBuilding('rusalyn_sorrow_sanctum');

export const ALL_RUSALYN_BUILDINGS = [
  RUSALYN_WEEPING_HUT,
  RUSALYN_LAMENTATION_WELL,
  RUSALYN_TIDE_COURT,
  RUSALYN_DROWNING_GARDEN,
  RUSALYN_SORROW_SANCTUM,
];

// =============================================================================
// VAASK BUILDINGS - Mask-and-persona theatrical architecture
// =============================================================================

export const VAASK_PERSONA_TENT: BuildingBlueprint = getBuilding('vaask_persona_tent');
export const VAASK_MASK_WORKSHOP: BuildingBlueprint = getBuilding('vaask_mask_workshop');
export const VAASK_STAGE_PLATFORM: BuildingBlueprint = getBuilding('vaask_stage_platform');
export const VAASK_IDENTITY_VAULT: BuildingBlueprint = getBuilding('vaask_identity_vault');
export const VAASK_GRAND_MASQUERADE: BuildingBlueprint = getBuilding('vaask_grand_masquerade');

export const ALL_VAASK_BUILDINGS = [
  VAASK_PERSONA_TENT,
  VAASK_MASK_WORKSHOP,
  VAASK_STAGE_PLATFORM,
  VAASK_IDENTITY_VAULT,
  VAASK_GRAND_MASQUERADE,
];

// =============================================================================
// QUETZALI BUILDINGS - Sun-feather step-pyramid architecture
// =============================================================================

export const QUETZALI_SUN_TERRACE: BuildingBlueprint = getBuilding('quetzali_sun_terrace');
export const QUETZALI_FEATHER_LOOM: BuildingBlueprint = getBuilding('quetzali_feather_loom');
export const QUETZALI_STEP_SHRINE: BuildingBlueprint = getBuilding('quetzali_step_shrine');
export const QUETZALI_MARKET_PLAZA: BuildingBlueprint = getBuilding('quetzali_market_plaza');
export const QUETZALI_GREAT_PYRAMID: BuildingBlueprint = getBuilding('quetzali_great_pyramid');

export const ALL_QUETZALI_BUILDINGS = [
  QUETZALI_SUN_TERRACE,
  QUETZALI_FEATHER_LOOM,
  QUETZALI_STEP_SHRINE,
  QUETZALI_MARKET_PLAZA,
  QUETZALI_GREAT_PYRAMID,
];

// =============================================================================
// DJINNAHL BUILDINGS - Smoke-and-brass wish architecture
// =============================================================================

export const DJINNAHL_SMOKE_BOWER: BuildingBlueprint = getBuilding('djinnahl_smoke_bower');
export const DJINNAHL_BRASS_FOUNDRY: BuildingBlueprint = getBuilding('djinnahl_brass_foundry');
export const DJINNAHL_WISH_BAZAAR: BuildingBlueprint = getBuilding('djinnahl_wish_bazaar');
export const DJINNAHL_FIRE_SANCTUM: BuildingBlueprint = getBuilding('djinnahl_fire_sanctum');
export const DJINNAHL_LAMP_CITADEL: BuildingBlueprint = getBuilding('djinnahl_lamp_citadel');

export const ALL_DJINNAHL_BUILDINGS = [
  DJINNAHL_SMOKE_BOWER,
  DJINNAHL_BRASS_FOUNDRY,
  DJINNAHL_WISH_BAZAAR,
  DJINNAHL_FIRE_SANCTUM,
  DJINNAHL_LAMP_CITADEL,
];

// =============================================================================
// SIDHE_VEL BUILDINGS - Faerie court palace architecture
// =============================================================================

export const SIDHE_VEL_FAERIE_BOWER: BuildingBlueprint = getBuilding('sidhe_vel_faerie_bower');
export const SIDHE_VEL_GLAMOUR_FORGE: BuildingBlueprint = getBuilding('sidhe_vel_glamour_forge');
export const SIDHE_VEL_COURT_GARDEN: BuildingBlueprint = getBuilding('sidhe_vel_court_garden');
export const SIDHE_VEL_RATH_MOUND: BuildingBlueprint = getBuilding('sidhe_vel_rath_mound');
export const SIDHE_VEL_GRAND_PALACE: BuildingBlueprint = getBuilding('sidhe_vel_grand_palace');

export const ALL_SIDHE_VEL_BUILDINGS = [
  SIDHE_VEL_FAERIE_BOWER,
  SIDHE_VEL_GLAMOUR_FORGE,
  SIDHE_VEL_COURT_GARDEN,
  SIDHE_VEL_RATH_MOUND,
  SIDHE_VEL_GRAND_PALACE,
];

// =============================================================================
// JIANGSHI_VEL BUILDINGS - Talisman-and-ancestor hopping-vampire architecture
// =============================================================================

export const JIANGSHI_VEL_PAPER_HUT: BuildingBlueprint = getBuilding('jiangshi_vel_paper_hut');
export const JIANGSHI_VEL_TALISMAN_PRESS: BuildingBlueprint = getBuilding('jiangshi_vel_talisman_press');
export const JIANGSHI_VEL_ANCESTOR_HALL: BuildingBlueprint = getBuilding('jiangshi_vel_ancestor_hall');
export const JIANGSHI_VEL_COFFIN_VAULT: BuildingBlueprint = getBuilding('jiangshi_vel_coffin_vault');
export const JIANGSHI_VEL_GRAND_TEMPLE: BuildingBlueprint = getBuilding('jiangshi_vel_grand_temple');

export const ALL_JIANGSHI_VEL_BUILDINGS = [
  JIANGSHI_VEL_PAPER_HUT,
  JIANGSHI_VEL_TALISMAN_PRESS,
  JIANGSHI_VEL_ANCESTOR_HALL,
  JIANGSHI_VEL_COFFIN_VAULT,
  JIANGSHI_VEL_GRAND_TEMPLE,
];

// =============================================================================
// TINKER BUILDINGS - Clockwork inventor workshop architecture
// =============================================================================

export const TINKER_LEAN_TO: BuildingBlueprint = getBuilding('tinker_lean_to');
export const TINKER_GEAR_MILL: BuildingBlueprint = getBuilding('tinker_gear_mill');
export const TINKER_PATENT_OFFICE: BuildingBlueprint = getBuilding('tinker_patent_office');
export const TINKER_JUNK_EXCHANGE: BuildingBlueprint = getBuilding('tinker_junk_exchange');
export const TINKER_GRAND_LABORATORY: BuildingBlueprint = getBuilding('tinker_grand_laboratory');

export const ALL_TINKER_BUILDINGS = [
  TINKER_LEAN_TO,
  TINKER_GEAR_MILL,
  TINKER_PATENT_OFFICE,
  TINKER_JUNK_EXCHANGE,
  TINKER_GRAND_LABORATORY,
];

// =============================================================================
// ECHO BUILDINGS - Resonance-and-tone acoustic architecture
// =============================================================================

export const ECHO_RESONANCE_POD: BuildingBlueprint = getBuilding('echo_resonance_pod');
export const ECHO_TONE_FORGE: BuildingBlueprint = getBuilding('echo_tone_forge');
export const ECHO_CHORUS_HALL: BuildingBlueprint = getBuilding('echo_chorus_hall');
export const ECHO_WAVE_ARCHIVE: BuildingBlueprint = getBuilding('echo_wave_archive');
export const ECHO_RESONANCE_CATHEDRAL: BuildingBlueprint = getBuilding('echo_resonance_cathedral');

export const ALL_ECHO_BUILDINGS = [
  ECHO_RESONANCE_POD,
  ECHO_TONE_FORGE,
  ECHO_CHORUS_HALL,
  ECHO_WAVE_ARCHIVE,
  ECHO_RESONANCE_CATHEDRAL,
];

// =============================================================================
// SYNTHETIC BUILDINGS - Logic-node citadel architecture
// =============================================================================

export const SYNTHETIC_NODE_CELL: BuildingBlueprint = getBuilding('synthetic_node_cell');
export const SYNTHETIC_FABRICATION_BAY: BuildingBlueprint = getBuilding('synthetic_fabrication_bay');
export const SYNTHETIC_DATA_ARCHIVE: BuildingBlueprint = getBuilding('synthetic_data_archive');
export const SYNTHETIC_LOGIC_CORE: BuildingBlueprint = getBuilding('synthetic_logic_core');
export const SYNTHETIC_NEXUS_CITADEL: BuildingBlueprint = getBuilding('synthetic_nexus_citadel');

export const ALL_SYNTHETIC_BUILDINGS = [
  SYNTHETIC_NODE_CELL,
  SYNTHETIC_FABRICATION_BAY,
  SYNTHETIC_DATA_ARCHIVE,
  SYNTHETIC_LOGIC_CORE,
  SYNTHETIC_NEXUS_CITADEL,
];

// =============================================================================
// PEUCHAN_VEL BUILDINGS - Venom-trial serpent-coil architecture
// =============================================================================

export const PEUCHAN_VEL_TRIAL_DEN: BuildingBlueprint = getBuilding('peuchan_vel_trial_den');
export const PEUCHAN_VEL_VENOM_PIT: BuildingBlueprint = getBuilding('peuchan_vel_venom_pit');
export const PEUCHAN_VEL_CHALLENGE_COURT: BuildingBlueprint = getBuilding('peuchan_vel_challenge_court');
export const PEUCHAN_VEL_SERPENT_COIL_SANCTUM: BuildingBlueprint = getBuilding('peuchan_vel_serpent_coil_sanctum');

export const ALL_PEUCHAN_VEL_BUILDINGS = [
  PEUCHAN_VEL_TRIAL_DEN,
  PEUCHAN_VEL_VENOM_PIT,
  PEUCHAN_VEL_CHALLENGE_COURT,
  PEUCHAN_VEL_SERPENT_COIL_SANCTUM,
];

// =============================================================================
// MBOI_TU_I_VEL BUILDINGS - Wetland guardian song-pool architecture
// =============================================================================

export const MBOI_TU_I_VEL_REED_NEST: BuildingBlueprint = getBuilding('mboi_tu_i_vel_reed_nest');
export const MBOI_TU_I_VEL_WETLAND_WATCH: BuildingBlueprint = getBuilding('mboi_tu_i_vel_wetland_watch');
export const MBOI_TU_I_VEL_SONG_POOL: BuildingBlueprint = getBuilding('mboi_tu_i_vel_song_pool');
export const MBOI_TU_I_VEL_GUARDIAN_SHRINE: BuildingBlueprint = getBuilding('mboi_tu_i_vel_guardian_shrine');

export const ALL_MBOI_TU_I_VEL_BUILDINGS = [
  MBOI_TU_I_VEL_REED_NEST,
  MBOI_TU_I_VEL_WETLAND_WATCH,
  MBOI_TU_I_VEL_SONG_POOL,
  MBOI_TU_I_VEL_GUARDIAN_SHRINE,
];

// =============================================================================
// BOUDA_KIN BUILDINGS - Ember-forge shifting-lodge hyena architecture
// =============================================================================

export const BOUDA_KIN_EMBER_FORGE: BuildingBlueprint = getBuilding('bouda_kin_ember_forge');
export const BOUDA_KIN_SHIFTING_LODGE: BuildingBlueprint = getBuilding('bouda_kin_shifting_lodge');
export const BOUDA_KIN_CRAFT_CIRCLE: BuildingBlueprint = getBuilding('bouda_kin_craft_circle');
export const BOUDA_KIN_HYENA_GOD_TEMPLE: BuildingBlueprint = getBuilding('bouda_kin_hyena_god_temple');

export const ALL_BOUDA_KIN_BUILDINGS = [
  BOUDA_KIN_EMBER_FORGE,
  BOUDA_KIN_SHIFTING_LODGE,
  BOUDA_KIN_CRAFT_CIRCLE,
  BOUDA_KIN_HYENA_GOD_TEMPLE,
];

// =============================================================================
// ANZAR_VEL BUILDINGS - Rain-catch sky-spring cistern architecture
// =============================================================================

export const ANZAR_VEL_RAIN_CATCH: BuildingBlueprint = getBuilding('anzar_vel_rain_catch');
export const ANZAR_VEL_CISTERN_HALL: BuildingBlueprint = getBuilding('anzar_vel_cistern_hall');
export const ANZAR_VEL_RAIN_CIRCLE: BuildingBlueprint = getBuilding('anzar_vel_rain_circle');
export const ANZAR_VEL_SKY_SPRING_TEMPLE: BuildingBlueprint = getBuilding('anzar_vel_sky_spring_temple');

export const ALL_ANZAR_VEL_BUILDINGS = [
  ANZAR_VEL_RAIN_CATCH,
  ANZAR_VEL_CISTERN_HALL,
  ANZAR_VEL_RAIN_CIRCLE,
  ANZAR_VEL_SKY_SPRING_TEMPLE,
];

// =============================================================================
// YELBEGEN_RIN BUILDINGS - Chaos-feast trickster colosseum architecture
// =============================================================================

export const YELBEGEN_RIN_CHAOS_TENT: BuildingBlueprint = getBuilding('yelbegen_rin_chaos_tent');
export const YELBEGEN_RIN_BRAWL_ARENA: BuildingBlueprint = getBuilding('yelbegen_rin_brawl_arena');
export const YELBEGEN_RIN_FEAST_HALL: BuildingBlueprint = getBuilding('yelbegen_rin_feast_hall');
export const YELBEGEN_RIN_TRICKSTER_COLOSSEUM: BuildingBlueprint = getBuilding('yelbegen_rin_trickster_colosseum');

export const ALL_YELBEGEN_RIN_BUILDINGS = [
  YELBEGEN_RIN_CHAOS_TENT,
  YELBEGEN_RIN_BRAWL_ARENA,
  YELBEGEN_RIN_FEAST_HALL,
  YELBEGEN_RIN_TRICKSTER_COLOSSEUM,
];

// =============================================================================
// LUS_VEL BUILDINGS - Bloom-garden glass-greenhouse sanctum architecture
// =============================================================================

export const LUS_VEL_SEEDLING_BOWER: BuildingBlueprint = getBuilding('lus_vel_seedling_bower');
export const LUS_VEL_BLOOM_GARDEN: BuildingBlueprint = getBuilding('lus_vel_bloom_garden');
export const LUS_VEL_GLASS_GREENHOUSE: BuildingBlueprint = getBuilding('lus_vel_glass_greenhouse');
export const LUS_VEL_GREAT_BLOOM_SANCTUM: BuildingBlueprint = getBuilding('lus_vel_great_bloom_sanctum');

export const ALL_LUS_VEL_BUILDINGS = [
  LUS_VEL_SEEDLING_BOWER,
  LUS_VEL_BLOOM_GARDEN,
  LUS_VEL_GLASS_GREENHOUSE,
  LUS_VEL_GREAT_BLOOM_SANCTUM,
];

// =============================================================================
// STALLU_RIN BUILDINGS - Frost-burrow glacier-throne cold architecture
// =============================================================================

export const STALLU_RIN_FROST_BURROW: BuildingBlueprint = getBuilding('stallu_rin_frost_burrow');
export const STALLU_RIN_TRAP_WORKSHOP: BuildingBlueprint = getBuilding('stallu_rin_trap_workshop');
export const STALLU_RIN_COLD_LONGHOUSE: BuildingBlueprint = getBuilding('stallu_rin_cold_longhouse');
export const STALLU_RIN_GLACIER_THRONE: BuildingBlueprint = getBuilding('stallu_rin_glacier_throne');

export const ALL_STALLU_RIN_BUILDINGS = [
  STALLU_RIN_FROST_BURROW,
  STALLU_RIN_TRAP_WORKSHOP,
  STALLU_RIN_COLD_LONGHOUSE,
  STALLU_RIN_GLACIER_THRONE,
];

// =============================================================================
// KOROPOKKURU_KIN BUILDINGS - Leaf-burrow root-gift temple architecture
// =============================================================================

export const KOROPOKKURU_KIN_LEAF_BURROW: BuildingBlueprint = getBuilding('koropokkuru_kin_leaf_burrow');
export const KOROPOKKURU_KIN_ROOT_STOREHOUSE: BuildingBlueprint = getBuilding('koropokkuru_kin_root_storehouse');
export const KOROPOKKURU_KIN_GIFT_HALL: BuildingBlueprint = getBuilding('koropokkuru_kin_gift_hall');
export const KOROPOKKURU_KIN_GREAT_LEAF_TEMPLE: BuildingBlueprint = getBuilding('koropokkuru_kin_great_leaf_temple');

export const ALL_KOROPOKKURU_KIN_BUILDINGS = [
  KOROPOKKURU_KIN_LEAF_BURROW,
  KOROPOKKURU_KIN_ROOT_STOREHOUSE,
  KOROPOKKURU_KIN_GIFT_HALL,
  KOROPOKKURU_KIN_GREAT_LEAF_TEMPLE,
];

// =============================================================================
// OPIA_VEL BUILDINGS - Ancestor-memory spirit-archive temple architecture
// =============================================================================

export const OPIA_VEL_ANCESTOR_CAVE: BuildingBlueprint = getBuilding('opia_vel_ancestor_cave');
export const OPIA_VEL_MEMORY_WELL: BuildingBlueprint = getBuilding('opia_vel_memory_well');
export const OPIA_VEL_SPIRIT_ARCHIVE: BuildingBlueprint = getBuilding('opia_vel_spirit_archive');
export const OPIA_VEL_ANCESTOR_TEMPLE: BuildingBlueprint = getBuilding('opia_vel_ancestor_temple');

export const ALL_OPIA_VEL_BUILDINGS = [
  OPIA_VEL_ANCESTOR_CAVE,
  OPIA_VEL_MEMORY_WELL,
  OPIA_VEL_SPIRIT_ARCHIVE,
  OPIA_VEL_ANCESTOR_TEMPLE,
];

// =============================================================================
// OGBANJE_KIN BUILDINGS - Pact-rebirth chi-shrine covenant architecture
// =============================================================================

export const OGBANJE_KIN_PACT_HUT: BuildingBlueprint = getBuilding('ogbanje_kin_pact_hut');
export const OGBANJE_KIN_REBIRTH_POOL: BuildingBlueprint = getBuilding('ogbanje_kin_rebirth_pool');
export const OGBANJE_KIN_CHI_SHRINE: BuildingBlueprint = getBuilding('ogbanje_kin_chi_shrine');
export const OGBANJE_KIN_SPIRIT_COVENANT_HOUSE: BuildingBlueprint = getBuilding('ogbanje_kin_spirit_covenant_house');

export const ALL_OGBANJE_KIN_BUILDINGS = [
  OGBANJE_KIN_PACT_HUT,
  OGBANJE_KIN_REBIRTH_POOL,
  OGBANJE_KIN_CHI_SHRINE,
  OGBANJE_KIN_SPIRIT_COVENANT_HOUSE,
];

// =============================================================================
// DAB_TSOG_VEL BUILDINGS - Shadow-dream nightmare-ward architecture
// =============================================================================

export const DAB_TSOG_VEL_SHADOW_DEN: BuildingBlueprint = getBuilding('dab_tsog_vel_shadow_den');
export const DAB_TSOG_VEL_WARD_POST: BuildingBlueprint = getBuilding('dab_tsog_vel_ward_post');
export const DAB_TSOG_VEL_DREAM_WORKSHOP: BuildingBlueprint = getBuilding('dab_tsog_vel_dream_workshop');
export const DAB_TSOG_VEL_NIGHTMARE_TEMPLE: BuildingBlueprint = getBuilding('dab_tsog_vel_nightmare_temple');

export const ALL_DAB_TSOG_VEL_BUILDINGS = [
  DAB_TSOG_VEL_SHADOW_DEN,
  DAB_TSOG_VEL_WARD_POST,
  DAB_TSOG_VEL_DREAM_WORKSHOP,
  DAB_TSOG_VEL_NIGHTMARE_TEMPLE,
];

// =============================================================================
// ALUX_KIN BUILDINGS - Milpa-field stone-sprite chultun architecture
// =============================================================================

export const ALUX_KIN_MILPA_SHELTER: BuildingBlueprint = getBuilding('alux_kin_milpa_shelter');
export const ALUX_KIN_STONE_SPRITE_SHRINE: BuildingBlueprint = getBuilding('alux_kin_stone_sprite_shrine');
export const ALUX_KIN_MILPA_FIELD: BuildingBlueprint = getBuilding('alux_kin_milpa_field');
export const ALUX_KIN_CHULTUN_SANCTUARY: BuildingBlueprint = getBuilding('alux_kin_chultun_sanctuary');

export const ALL_ALUX_KIN_BUILDINGS = [
  ALUX_KIN_MILPA_SHELTER,
  ALUX_KIN_STONE_SPRITE_SHRINE,
  ALUX_KIN_MILPA_FIELD,
  ALUX_KIN_CHULTUN_SANCTUARY,
];

// =============================================================================
// GROOTSLANG_RIN BUILDINGS - Primordial cave-gem hoard architecture
// =============================================================================

export const GROOTSLANG_RIN_CAVE_LAIR: BuildingBlueprint = getBuilding('grootslang_rin_cave_lair');
export const GROOTSLANG_RIN_GEM_VAULT: BuildingBlueprint = getBuilding('grootslang_rin_gem_vault');
export const GROOTSLANG_RIN_HOARD_MARKET: BuildingBlueprint = getBuilding('grootslang_rin_hoard_market');
export const GROOTSLANG_RIN_PRIMORDIAL_CAVERN: BuildingBlueprint = getBuilding('grootslang_rin_primordial_cavern');

export const ALL_GROOTSLANG_RIN_BUILDINGS = [
  GROOTSLANG_RIN_CAVE_LAIR,
  GROOTSLANG_RIN_GEM_VAULT,
  GROOTSLANG_RIN_HOARD_MARKET,
  GROOTSLANG_RIN_PRIMORDIAL_CAVERN,
];

// =============================================================================
// QALUPALIK_VEL BUILDINGS - Ice-hole deep-ice seaweed architecture
// =============================================================================

export const QALUPALIK_VEL_ICE_HOLE_DEN: BuildingBlueprint = getBuilding('qalupalik_vel_ice_hole_den');
export const QALUPALIK_VEL_SEAWEED_CHAMBER: BuildingBlueprint = getBuilding('qalupalik_vel_seaweed_chamber');
export const QALUPALIK_VEL_BOUNDARY_POST: BuildingBlueprint = getBuilding('qalupalik_vel_boundary_post');
export const QALUPALIK_VEL_DEEP_ICE_TEMPLE: BuildingBlueprint = getBuilding('qalupalik_vel_deep_ice_temple');

export const ALL_QALUPALIK_VEL_BUILDINGS = [
  QALUPALIK_VEL_ICE_HOLE_DEN,
  QALUPALIK_VEL_SEAWEED_CHAMBER,
  QALUPALIK_VEL_BOUNDARY_POST,
  QALUPALIK_VEL_DEEP_ICE_TEMPLE,
];

// =============================================================================
// SPECIES COLLECTIONS
// =============================================================================

/**
 * All species-specific buildings organized by species
 */
export const BUILDINGS_BY_SPECIES = {
  elven: ALL_ELVEN_BUILDINGS,
  centaur: ALL_CENTAUR_BUILDINGS,
  angelic: ALL_ANGELIC_BUILDINGS,
  high_fae: ALL_HIGH_FAE_BUILDINGS,
  dvergar: ALL_DVERGAR_BUILDINGS,
  jotnar: ALL_JOTNAR_BUILDINGS,
  dragon: ALL_DRAGON_BUILDINGS,
  nagavel: ALL_NAGAVEL_BUILDINGS,
  kitsuri: ALL_KITSURI_BUILDINGS,
  anansiweb: ALL_ANANSIWEB_BUILDINGS,
  valkyr: ALL_VALKYR_BUILDINGS,
  norn: ALL_NORN_BUILDINGS,
  grendel: ALL_GRENDEL_BUILDINGS,
  ettin: ALL_ETTIN_BUILDINGS,
  shee: ALL_SHEE_BUILDINGS,
  mycon: ALL_MYCON_BUILDINGS,
  alfar: ALL_ALFAR_BUILDINGS,
  fylgja: ALL_FYLGJA_BUILDINGS,
  landvaettir: ALL_LANDVAETTIR_BUILDINGS,
  draugr: ALL_DRAUGR_BUILDINGS,
  raven: ALL_RAVEN_BUILDINGS,
  spriggan: ALL_SPRIGGAN_BUILDINGS,
  venthari: ALL_VENTHARI_BUILDINGS,
  nyk: ALL_NYK_BUILDINGS,
  cherkhan: ALL_CHERKHAN_BUILDINGS,
  rusalyn: ALL_RUSALYN_BUILDINGS,
  vaask: ALL_VAASK_BUILDINGS,
  quetzali: ALL_QUETZALI_BUILDINGS,
  djinnahl: ALL_DJINNAHL_BUILDINGS,
  sidhe_vel: ALL_SIDHE_VEL_BUILDINGS,
  jiangshi_vel: ALL_JIANGSHI_VEL_BUILDINGS,
  tinker: ALL_TINKER_BUILDINGS,
  echo: ALL_ECHO_BUILDINGS,
  synthetic: ALL_SYNTHETIC_BUILDINGS,
  peuchan_vel: ALL_PEUCHAN_VEL_BUILDINGS,
  mboi_tu_i_vel: ALL_MBOI_TU_I_VEL_BUILDINGS,
  bouda_kin: ALL_BOUDA_KIN_BUILDINGS,
  anzar_vel: ALL_ANZAR_VEL_BUILDINGS,
  yelbegen_rin: ALL_YELBEGEN_RIN_BUILDINGS,
  lus_vel: ALL_LUS_VEL_BUILDINGS,
  stallu_rin: ALL_STALLU_RIN_BUILDINGS,
  koropokkuru_kin: ALL_KOROPOKKURU_KIN_BUILDINGS,
  opia_vel: ALL_OPIA_VEL_BUILDINGS,
  ogbanje_kin: ALL_OGBANJE_KIN_BUILDINGS,
  dab_tsog_vel: ALL_DAB_TSOG_VEL_BUILDINGS,
  alux_kin: ALL_ALUX_KIN_BUILDINGS,
  grootslang_rin: ALL_GROOTSLANG_RIN_BUILDINGS,
  qalupalik_vel: ALL_QALUPALIK_VEL_BUILDINGS,
};

/**
 * All species buildings (flat array)
 */
export const ALL_SPECIES_BUILDINGS = [
  ...ALL_ELVEN_BUILDINGS,
  ...ALL_CENTAUR_BUILDINGS,
  ...ALL_ANGELIC_BUILDINGS,
  ...ALL_HIGH_FAE_BUILDINGS,
  ...ALL_DVERGAR_BUILDINGS,
  ...ALL_JOTNAR_BUILDINGS,
  ...ALL_DRAGON_BUILDINGS,
  ...ALL_NAGAVEL_BUILDINGS,
  ...ALL_KITSURI_BUILDINGS,
  ...ALL_ANANSIWEB_BUILDINGS,
  ...ALL_VALKYR_BUILDINGS,
  ...ALL_NORN_BUILDINGS,
  ...ALL_GRENDEL_BUILDINGS,
  ...ALL_ETTIN_BUILDINGS,
  ...ALL_SHEE_BUILDINGS,
  ...ALL_MYCON_BUILDINGS,
  ...ALL_ALFAR_BUILDINGS,
  ...ALL_FYLGJA_BUILDINGS,
  ...ALL_LANDVAETTIR_BUILDINGS,
  ...ALL_DRAUGR_BUILDINGS,
  ...ALL_RAVEN_BUILDINGS,
  ...ALL_SPRIGGAN_BUILDINGS,
  ...ALL_VENTHARI_BUILDINGS,
  ...ALL_NYK_BUILDINGS,
  ...ALL_CHERKHAN_BUILDINGS,
  ...ALL_RUSALYN_BUILDINGS,
  ...ALL_VAASK_BUILDINGS,
  ...ALL_QUETZALI_BUILDINGS,
  ...ALL_DJINNAHL_BUILDINGS,
  ...ALL_SIDHE_VEL_BUILDINGS,
  ...ALL_JIANGSHI_VEL_BUILDINGS,
  ...ALL_TINKER_BUILDINGS,
  ...ALL_ECHO_BUILDINGS,
  ...ALL_SYNTHETIC_BUILDINGS,
  ...ALL_PEUCHAN_VEL_BUILDINGS,
  ...ALL_MBOI_TU_I_VEL_BUILDINGS,
  ...ALL_BOUDA_KIN_BUILDINGS,
  ...ALL_ANZAR_VEL_BUILDINGS,
  ...ALL_YELBEGEN_RIN_BUILDINGS,
  ...ALL_LUS_VEL_BUILDINGS,
  ...ALL_STALLU_RIN_BUILDINGS,
  ...ALL_KOROPOKKURU_KIN_BUILDINGS,
  ...ALL_OPIA_VEL_BUILDINGS,
  ...ALL_OGBANJE_KIN_BUILDINGS,
  ...ALL_DAB_TSOG_VEL_BUILDINGS,
  ...ALL_ALUX_KIN_BUILDINGS,
  ...ALL_GROOTSLANG_RIN_BUILDINGS,
  ...ALL_QALUPALIK_VEL_BUILDINGS,
];

/**
 * Get all buildings for a specific species
 */
export function getBuildingsForSpecies(species: string): BuildingBlueprint[] {
  const normalized = species.toLowerCase().replace(/[-_\s]/g, '_');

  if (normalized.includes('elven') || normalized.includes('elf')) {
    return ALL_ELVEN_BUILDINGS;
  }
  if (normalized.includes('centaur')) {
    return ALL_CENTAUR_BUILDINGS;
  }
  if (normalized.includes('angel')) {
    return ALL_ANGELIC_BUILDINGS;
  }
  if (normalized.includes('fae') || normalized.includes('10d')) {
    return ALL_HIGH_FAE_BUILDINGS;
  }
  if (normalized.includes('dvergar') || normalized.includes('dwarf')) {
    return ALL_DVERGAR_BUILDINGS;
  }
  if (normalized.includes('jotnar') || normalized.includes('giant') || normalized.includes('jotunn')) {
    return ALL_JOTNAR_BUILDINGS;
  }
  if (normalized.includes('dragon')) {
    return ALL_DRAGON_BUILDINGS;
  }
  if (normalized.includes('nagavel') || normalized.includes('naga')) {
    return ALL_NAGAVEL_BUILDINGS;
  }
  if (normalized.includes('kitsuri') || normalized.includes('kitsune')) {
    return ALL_KITSURI_BUILDINGS;
  }
  if (normalized.includes('anansiweb') || normalized.includes('anansi')) {
    return ALL_ANANSIWEB_BUILDINGS;
  }
  if (normalized.includes('valkyr') || normalized.includes('valkyrie')) {
    return ALL_VALKYR_BUILDINGS;
  }
  if (normalized.includes('norn')) {
    return ALL_NORN_BUILDINGS;
  }
  if (normalized.includes('grendel')) {
    return ALL_GRENDEL_BUILDINGS;
  }
  if (normalized.includes('ettin')) {
    return ALL_ETTIN_BUILDINGS;
  }
  if (normalized.includes('shee')) {
    return ALL_SHEE_BUILDINGS;
  }
  if (normalized.includes('mycon')) {
    return ALL_MYCON_BUILDINGS;
  }
  if (normalized.includes('alfar')) {
    return ALL_ALFAR_BUILDINGS;
  }
  if (normalized.includes('fylgja')) {
    return ALL_FYLGJA_BUILDINGS;
  }
  if (normalized.includes('landvaettir')) {
    return ALL_LANDVAETTIR_BUILDINGS;
  }
  if (normalized.includes('draugr')) {
    return ALL_DRAUGR_BUILDINGS;
  }
  if (normalized.includes('raven')) {
    return ALL_RAVEN_BUILDINGS;
  }
  if (normalized.includes('spriggan')) {
    return ALL_SPRIGGAN_BUILDINGS;
  }
  if (normalized.includes('venthari')) {
    return ALL_VENTHARI_BUILDINGS;
  }
  if (normalized.includes('nyk')) {
    return ALL_NYK_BUILDINGS;
  }
  if (normalized.includes('cherkhan')) {
    return ALL_CHERKHAN_BUILDINGS;
  }
  if (normalized.includes('rusalyn')) {
    return ALL_RUSALYN_BUILDINGS;
  }
  if (normalized.includes('vaask')) {
    return ALL_VAASK_BUILDINGS;
  }
  if (normalized.includes('quetzali')) {
    return ALL_QUETZALI_BUILDINGS;
  }
  if (normalized.includes('djinnahl')) {
    return ALL_DJINNAHL_BUILDINGS;
  }
  if (normalized.includes('jiangshi')) {
    return ALL_JIANGSHI_VEL_BUILDINGS;
  }
  if (normalized.includes('sidhe')) {
    return ALL_SIDHE_VEL_BUILDINGS;
  }
  if (normalized.includes('tinker')) {
    return ALL_TINKER_BUILDINGS;
  }
  if (normalized.includes('echo')) {
    return ALL_ECHO_BUILDINGS;
  }
  if (normalized.includes('synthetic')) {
    return ALL_SYNTHETIC_BUILDINGS;
  }
  if (normalized.includes('peuchan')) {
    return ALL_PEUCHAN_VEL_BUILDINGS;
  }
  if (normalized.includes('mboi')) {
    return ALL_MBOI_TU_I_VEL_BUILDINGS;
  }
  if (normalized.includes('bouda')) {
    return ALL_BOUDA_KIN_BUILDINGS;
  }
  if (normalized.includes('anzar')) {
    return ALL_ANZAR_VEL_BUILDINGS;
  }
  if (normalized.includes('yelbegen')) {
    return ALL_YELBEGEN_RIN_BUILDINGS;
  }
  if (normalized.includes('lus_vel')) {
    return ALL_LUS_VEL_BUILDINGS;
  }
  if (normalized.includes('stallu')) {
    return ALL_STALLU_RIN_BUILDINGS;
  }
  if (normalized.includes('koropokkuru')) {
    return ALL_KOROPOKKURU_KIN_BUILDINGS;
  }
  if (normalized.includes('opia')) {
    return ALL_OPIA_VEL_BUILDINGS;
  }
  if (normalized.includes('ogbanje')) {
    return ALL_OGBANJE_KIN_BUILDINGS;
  }
  if (normalized.includes('dab_tsog')) {
    return ALL_DAB_TSOG_VEL_BUILDINGS;
  }
  if (normalized.includes('alux')) {
    return ALL_ALUX_KIN_BUILDINGS;
  }
  if (normalized.includes('grootslang')) {
    return ALL_GROOTSLANG_RIN_BUILDINGS;
  }
  if (normalized.includes('qalupalik')) {
    return ALL_QALUPALIK_VEL_BUILDINGS;
  }

  return [];
}
