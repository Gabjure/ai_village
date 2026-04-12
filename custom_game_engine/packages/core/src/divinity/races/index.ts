/**
 * Race Templates - Organized by Pantheon/Culture
 *
 * This module organizes divine race templates by their mythological origin.
 */

// Import from the original file
import {
  COMMON_TRAITS,
  // Chorus-Ascendant
  OLYMPIAN_RACE,
  DEMIGOD_RACE,
  NYMPH_RACE,
  SATYR_RACE,
  // Veil-Touched
  SIDHE_RACE,
  PIXIE_RACE,
  REDCAP_RACE,
  // Underworld
  SHADE_RACE,
  FURY_RACE,
  // Storm-Kindred
  AESIR_RACE,
  VALKYRIE_RACE,
  EINHERJAR_RACE,
  // Celestial
  SERAPH_RACE,
  ANGEL_RACE,
  // Dream Realm
  ONEIROI_RACE,
  NIGHTMARE_RACE,
  // Elemental
  EFREET_RACE,
} from '../RaceTemplates.js';

// Re-export everything
export {
  COMMON_TRAITS,
  OLYMPIAN_RACE,
  DEMIGOD_RACE,
  NYMPH_RACE,
  SATYR_RACE,
  SIDHE_RACE,
  PIXIE_RACE,
  REDCAP_RACE,
  SHADE_RACE,
  FURY_RACE,
  AESIR_RACE,
  VALKYRIE_RACE,
  EINHERJAR_RACE,
  SERAPH_RACE,
  ANGEL_RACE,
  ONEIROI_RACE,
  NIGHTMARE_RACE,
  EFREET_RACE,
};

// Pantheon groupings
export const CHORUS_ASCENDANT_RACES = [OLYMPIAN_RACE, DEMIGOD_RACE, NYMPH_RACE, SATYR_RACE];
export const VEIL_TOUCHED_RACES = [SIDHE_RACE, PIXIE_RACE, REDCAP_RACE];
export const UNDERWORLD_RACES = [SHADE_RACE, FURY_RACE];
export const STORM_KINDRED_RACES = [AESIR_RACE, VALKYRIE_RACE, EINHERJAR_RACE];
export const CELESTIAL_RACES = [SERAPH_RACE, ANGEL_RACE];
export const DREAM_RACES = [ONEIROI_RACE, NIGHTMARE_RACE];
export const ELEMENTAL_RACES = [EFREET_RACE];

// All races combined
export const ALL_RACES = [
  ...CHORUS_ASCENDANT_RACES,
  ...VEIL_TOUCHED_RACES,
  ...UNDERWORLD_RACES,
  ...STORM_KINDRED_RACES,
  ...CELESTIAL_RACES,
  ...DREAM_RACES,
  ...ELEMENTAL_RACES,
];

// Pantheon metadata
export const PANTHEONS = {
  chorus_ascendant: {
    name: 'Chorus-Ascendant',
    description: 'Beings who ascended through resonance with the Chorus — divine power through harmony with the Emergence Frequency',
    races: CHORUS_ASCENDANT_RACES,
  },
  veil_touched: {
    name: 'Veil-Touched',
    description: 'Beings touched by the Void — existing at the boundary between material and post-material, where the Frequency thins to silence',
    races: VEIL_TOUCHED_RACES,
  },
  underworld: {
    name: 'Underworld',
    description: 'Spirits and entities from the realm of the dead',
    races: UNDERWORLD_RACES,
  },
  storm_kindred: {
    name: 'Storm-Kindred',
    description: 'Beings forged by the inverted Chorus of the Outer Rim — divinity earned through struggle against the signal\'s distortion',
    races: STORM_KINDRED_RACES,
  },
  celestial: {
    name: 'Celestial',
    description: 'Divine servants and heavenly beings',
    races: CELESTIAL_RACES,
  },
  dream: {
    name: 'Dream Realm',
    description: 'Entities born of dreams and nightmares',
    races: DREAM_RACES,
  },
  elemental: {
    name: 'Elemental',
    description: 'Beings of pure elemental force',
    races: ELEMENTAL_RACES,
  },
} as const;

export type Pantheon = keyof typeof PANTHEONS;
