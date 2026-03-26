import { defineItem, type ItemDefinition } from './ItemDefinition.js';

export const CONTAINER_ITEMS: ItemDefinition[] = [
  defineItem('stone_shelf', 'Stone Shelf', 'misc', {
    weight: 15,
    stackSize: 1,
    isStorable: false,
    isGatherable: false,
    isEdible: false,
    baseValue: 25,
    rarity: 'common',
    traits: {
      container: { capacity: 6 },
    },
  }),
  defineItem('crystal_chest', 'Crystal Chest', 'misc', {
    weight: 20,
    stackSize: 1,
    isStorable: false,
    isGatherable: false,
    isEdible: false,
    baseValue: 80,
    rarity: 'uncommon',
    traits: {
      container: { capacity: 8 },
    },
  }),
  defineItem('frost_cache', 'Frost Cache', 'misc', {
    weight: 12,
    stackSize: 1,
    isStorable: false,
    isGatherable: false,
    isEdible: false,
    baseValue: 60,
    rarity: 'uncommon',
    traits: {
      container: { capacity: 4, preserves: true, acceptedCategories: ['food'] },
    },
  }),
  defineItem('ettin_hoard_pile', 'Ettin Hoard Pile', 'misc', {
    weight: 30,
    stackSize: 1,
    isStorable: false,
    isGatherable: false,
    isEdible: false,
    baseValue: 150,
    rarity: 'rare',
    traits: {
      container: { capacity: 12 },
    },
  }),
  defineItem('dvergar_vault', 'Dvergar Vault', 'misc', {
    weight: 25,
    stackSize: 1,
    isStorable: false,
    isGatherable: false,
    isEdible: false,
    baseValue: 200,
    rarity: 'rare',
    traits: {
      container: { capacity: 10, preserves: true, acceptedCategories: ['tool', 'consumable'] },
    },
  }),
  defineItem('shee_archive', 'Shee Archive', 'misc', {
    weight: 10,
    stackSize: 1,
    isStorable: false,
    isGatherable: false,
    isEdible: false,
    baseValue: 120,
    rarity: 'rare',
    traits: {
      container: { capacity: 6, preserves: true, acceptedCategories: ['misc'] },
    },
  }),
];
