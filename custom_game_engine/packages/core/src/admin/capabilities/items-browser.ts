/**
 * Items Browser Capability - Browse all item definitions
 *
 * Provides admin interface for:
 * - Browsing all registered item definitions by category and rarity
 * - Viewing full item detail including producer, consumer, and effects
 * - Listing items gatherable from a specific source entity type
 * - Aggregate stats on the item registry
 */

import { capabilityRegistry, defineCapability, defineQuery } from '../CapabilityRegistry.js';
import { itemRegistry } from '../../items/ItemRegistry.js';
import type { ItemDefinition } from '../../items/ItemDefinition.js';

// ============================================================================
// Option Definitions
// ============================================================================

const CATEGORY_OPTIONS = [
  { value: 'resource', label: 'Resource' },
  { value: 'food', label: 'Food' },
  { value: 'seed', label: 'Seed' },
  { value: 'tool', label: 'Tool' },
  { value: 'material', label: 'Material' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'ammo', label: 'Ammo' },
  { value: 'misc', label: 'Misc' },
];

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'legendary', label: 'Legendary' },
];

// ============================================================================
// Helpers
// ============================================================================

function traitBadges(item: ItemDefinition): string {
  const badges: string[] = [];
  if (item.traits?.weapon) badges.push('[weapon]');
  if (item.traits?.edible || item.isEdible) badges.push('[edible]');
  if (item.traits?.tool) badges.push('[tool]');
  if (item.traits?.magical) badges.push('[magical]');
  if (item.traits?.armor) badges.push('[armor]');
  if (item.traits?.container) badges.push('[container]');
  if (item.traits?.ammo) badges.push('[ammo]');
  return badges.join(' ');
}

// ============================================================================
// Items Browser Capability Definition
// ============================================================================

const itemsBrowserCapability = defineCapability({
  id: 'items-browser',
  name: 'Items Browser',
  description: 'Browse all item definitions with producer, consumer, and effects detail',
  category: 'world',

  tab: {
    icon: '🏷️',
    priority: 6,
  },

  queries: [
    // ========================================================================
    // Browse All Items
    // ========================================================================
    defineQuery({
      id: 'browse-items',
      name: 'Browse All Items',
      description: 'Browse item definitions, optionally filtered by category and rarity',
      requiresGame: false,
      params: [
        {
          name: 'category',
          type: 'select',
          required: false,
          options: CATEGORY_OPTIONS,
          description: 'Filter by item category',
        },
        {
          name: 'rarity',
          type: 'select',
          required: false,
          options: RARITY_OPTIONS,
          description: 'Filter by rarity',
        },
      ],
      handler: async (params, _gameClient, _context) => {
        const category = params.category as string | undefined;
        const rarity = params.rarity as string | undefined;

        let items: ItemDefinition[] = category
          ? itemRegistry.getByCategory(category as ItemDefinition['category'])
          : itemRegistry.getAll();

        if (rarity) {
          items = items.filter(item => item.rarity === rarity);
        }

        items = items.slice().sort((a, b) => a.id.localeCompare(b.id));

        return {
          total: items.length,
          filterCategory: category ?? null,
          filterRarity: rarity ?? null,
          items: items.map(item => ({
            id: item.id,
            displayName: item.displayName,
            category: item.category,
            rarity: item.rarity,
            baseValue: item.baseValue,
            weight: item.weight,
            stackSize: item.stackSize,
            traits: traitBadges(item),
          })),
        };
      },
      renderResult: (data: unknown) => {
        const result = data as {
          total: number;
          filterCategory: string | null;
          filterRarity: string | null;
          items: Array<{
            id: string;
            displayName: string;
            category: string;
            rarity: string;
            baseValue: number;
            weight: number;
            stackSize: number;
            traits: string;
          }>;
        };

        const filters: string[] = [];
        if (result.filterCategory) filters.push(`category=${result.filterCategory}`);
        if (result.filterRarity) filters.push(`rarity=${result.filterRarity}`);
        const filterStr = filters.length ? ` (${filters.join(', ')})` : '';

        let output = `ITEM REGISTRY${filterStr}\n`;
        output += `${'='.repeat(50)}\n`;
        output += `Total: ${result.total} items\n\n`;

        if (result.items.length === 0) {
          output += 'No items match the given filters.';
          return output;
        }

        output += `${'ID'.padEnd(30)} ${'NAME'.padEnd(25)} ${'CAT'.padEnd(12)} ${'RARITY'.padEnd(10)} ${'VALUE'.padEnd(6)} TRAITS\n`;
        output += '-'.repeat(110) + '\n';

        for (const item of result.items) {
          output += `${item.id.padEnd(30)} ${item.displayName.padEnd(25)} ${item.category.padEnd(12)} ${item.rarity.padEnd(10)} ${String(item.baseValue).padEnd(6)} ${item.traits}\n`;
        }

        return output;
      },
    }),

    // ========================================================================
    // Item Detail
    // ========================================================================
    defineQuery({
      id: 'item-detail',
      name: 'Item Detail',
      description: 'Full definition for a single item including recipe, sources, and effects',
      requiresGame: false,
      params: [
        {
          name: 'itemId',
          type: 'string',
          required: true,
          description: 'Item ID to look up',
        },
      ],
      handler: async (params, _gameClient, _context) => {
        const itemId = params.itemId as string;
        const item = itemRegistry.tryGet(itemId);

        if (!item) {
          return { found: false, itemId };
        }

        // Find items that use this item as a crafting ingredient
        const usedAs = itemRegistry
          .getAll()
          .filter(other => other.craftedFrom?.some(ing => ing.itemId === itemId))
          .map(other => ({
            itemId: other.id,
            displayName: other.displayName,
            amount: other.craftedFrom?.find(ing => ing.itemId === itemId)?.amount ?? 1,
          }));

        return {
          found: true,
          id: item.id,
          displayName: item.displayName,
          category: item.category,
          rarity: item.rarity,
          weight: item.weight,
          stackSize: item.stackSize,
          baseValue: item.baseValue,
          baseMaterial: item.baseMaterial ?? null,
          // Producer info
          isGatherable: item.isGatherable,
          gatherSources: item.gatherSources ? Array.from(item.gatherSources) : [],
          requiredTool: item.requiredTool ?? null,
          craftedFrom: item.craftedFrom
            ? item.craftedFrom.map(ing => ({ itemId: ing.itemId, amount: ing.amount }))
            : [],
          // Consumer info
          usedAsCraftingIngredient: usedAs,
          // Seeds
          growsInto: item.growsInto ?? null,
          // Research
          researchRequired: item.researchRequired
            ? Array.isArray(item.researchRequired)
              ? item.researchRequired
              : [item.researchRequired]
            : [],
          clarketechTier: item.clarketechTier ?? null,
          // Traits
          traits: item.traits
            ? {
                edible: item.traits.edible
                  ? {
                      hungerRestored: item.traits.edible.hungerRestored,
                      quality: item.traits.edible.quality,
                      flavors: item.traits.edible.flavors,
                      spoilRate: item.traits.edible.spoilRate,
                      hydrating: item.traits.edible.hydrating,
                    }
                  : null,
                weapon: item.traits.weapon
                  ? {
                      damage: item.traits.weapon.damage,
                      damageType: item.traits.weapon.damageType,
                      range: item.traits.weapon.range,
                      attackSpeed: item.traits.weapon.attackSpeed,
                      category: item.traits.weapon.category,
                      special: item.traits.weapon.special,
                    }
                  : null,
                tool: item.traits.tool
                  ? {
                      toolType: item.traits.tool.toolType,
                      efficiency: item.traits.tool.efficiency,
                      durabilityLoss: item.traits.tool.durabilityLoss,
                    }
                  : null,
                armor: item.traits.armor
                  ? {
                      defense: item.traits.armor.defense,
                      armorClass: item.traits.armor.armorClass,
                      resistances: item.traits.armor.resistances,
                    }
                  : null,
                magical: item.traits.magical
                  ? {
                      effects: item.traits.magical.effects,
                      charges: item.traits.magical.charges,
                      manaCost: item.traits.magical.manaCost,
                      magicType: item.traits.magical.magicType,
                      grantsSpells: item.traits.magical.grantsSpells,
                    }
                  : null,
              }
            : null,
          // Deprecated flat flags
          isEdible: item.isEdible,
          hungerRestored: item.hungerRestored ?? null,
        };
      },
      renderResult: (data: unknown) => {
        const result = data as {
          found: boolean;
          itemId?: string;
          id?: string;
          displayName?: string;
          category?: string;
          rarity?: string;
          weight?: number;
          stackSize?: number;
          baseValue?: number;
          baseMaterial?: string | null;
          isGatherable?: boolean;
          gatherSources?: string[];
          requiredTool?: string | null;
          craftedFrom?: Array<{ itemId: string; amount: number }>;
          usedAsCraftingIngredient?: Array<{ itemId: string; displayName: string; amount: number }>;
          growsInto?: string | null;
          researchRequired?: string[];
          clarketechTier?: number | null;
          traits?: {
            edible?: { hungerRestored?: number; quality?: number; flavors?: string[]; spoilRate?: number; hydrating?: boolean } | null;
            weapon?: { damage?: number; damageType?: string; range?: number; attackSpeed?: number; category?: string; special?: string[] } | null;
            tool?: { toolType?: string; efficiency?: number; durabilityLoss?: number } | null;
            armor?: { defense?: number; armorClass?: string; resistances?: Record<string, number> } | null;
            magical?: { effects?: string[]; charges?: number; manaCost?: number; magicType?: string; grantsSpells?: string[] } | null;
          } | null;
          isEdible?: boolean;
          hungerRestored?: number | null;
        };

        if (!result.found) {
          return `Item not found: '${result.itemId}'\nCheck the ID spelling or use "Browse All Items" to find valid IDs.`;
        }

        let output = `ITEM: ${result.displayName} (${result.id})\n`;
        output += `${'='.repeat(50)}\n\n`;

        // Basic info
        output += 'BASIC INFO\n';
        output += `  Category:   ${result.category}\n`;
        output += `  Rarity:     ${result.rarity}\n`;
        output += `  Weight:     ${result.weight}\n`;
        output += `  Stack Size: ${result.stackSize}\n`;
        output += `  Base Value: ${result.baseValue}\n`;
        if (result.baseMaterial) output += `  Material:   ${result.baseMaterial}\n`;
        output += '\n';

        // Producer info
        const hasSources = result.gatherSources && result.gatherSources.length > 0;
        const hasCrafting = result.craftedFrom && result.craftedFrom.length > 0;
        if (result.isGatherable || hasSources || hasCrafting || result.requiredTool) {
          output += 'HOW TO OBTAIN\n';
          if (result.isGatherable) {
            output += '  Gatherable: yes\n';
          }
          if (hasSources) {
            output += `  Sources:    ${result.gatherSources!.join(', ')}\n`;
          }
          if (result.requiredTool) {
            output += `  Req. Tool:  ${result.requiredTool}\n`;
          }
          if (hasCrafting) {
            output += '  Crafted from:\n';
            for (const ing of result.craftedFrom!) {
              output += `    - ${ing.itemId} x${ing.amount}\n`;
            }
          }
          output += '\n';
        }

        // Consumer info
        if (result.usedAsCraftingIngredient && result.usedAsCraftingIngredient.length > 0) {
          output += 'USED AS INGREDIENT IN\n';
          for (const use of result.usedAsCraftingIngredient) {
            output += `  - ${use.displayName} (${use.itemId}) x${use.amount}\n`;
          }
          output += '\n';
        }

        // Seed info
        if (result.growsInto) {
          output += 'SEED\n';
          output += `  Grows into: ${result.growsInto}\n\n`;
        }

        // Research requirements
        if (result.researchRequired && result.researchRequired.length > 0) {
          output += 'REQUIREMENTS\n';
          output += `  Research: ${result.researchRequired.join(', ')}\n`;
          if (result.clarketechTier != null) {
            output += `  Clarketech Tier: ${result.clarketechTier}\n`;
          }
          output += '\n';
        } else if (result.clarketechTier != null) {
          output += 'REQUIREMENTS\n';
          output += `  Clarketech Tier: ${result.clarketechTier}\n\n`;
        }

        // Traits
        if (result.traits) {
          const { edible, weapon, tool, armor, magical } = result.traits;

          if (edible) {
            output += 'EDIBLE TRAIT\n';
            if (edible.hungerRestored != null) output += `  Hunger Restored: ${edible.hungerRestored}\n`;
            if (edible.quality != null) output += `  Quality: ${edible.quality}\n`;
            if (edible.flavors?.length) output += `  Flavors: ${edible.flavors.join(', ')}\n`;
            if (edible.spoilRate != null) output += `  Spoil Rate: ${edible.spoilRate}\n`;
            if (edible.hydrating) output += `  Hydrating: yes\n`;
            output += '\n';
          } else if (result.isEdible) {
            output += 'EDIBLE (legacy)\n';
            if (result.hungerRestored != null) output += `  Hunger Restored: ${result.hungerRestored}\n`;
            output += '\n';
          }

          if (weapon) {
            output += 'WEAPON TRAIT\n';
            if (weapon.damage != null) output += `  Damage: ${weapon.damage}\n`;
            if (weapon.damageType) output += `  Damage Type: ${weapon.damageType}\n`;
            if (weapon.range != null) output += `  Range: ${weapon.range}\n`;
            if (weapon.attackSpeed != null) output += `  Attack Speed: ${weapon.attackSpeed}\n`;
            if (weapon.category) output += `  Category: ${weapon.category}\n`;
            if (weapon.special?.length) output += `  Special: ${weapon.special.join(', ')}\n`;
            output += '\n';
          }

          if (tool) {
            output += 'TOOL TRAIT\n';
            if (tool.toolType) output += `  Tool Type: ${tool.toolType}\n`;
            if (tool.efficiency != null) output += `  Efficiency: ${tool.efficiency}\n`;
            if (tool.durabilityLoss != null) output += `  Durability Loss: ${tool.durabilityLoss}\n`;
            output += '\n';
          }

          if (armor) {
            output += 'ARMOR TRAIT\n';
            if (armor.defense != null) output += `  Defense: ${armor.defense}\n`;
            if (armor.armorClass) output += `  Armor Class: ${armor.armorClass}\n`;
            if (armor.resistances && Object.keys(armor.resistances).length > 0) {
              output += '  Resistances:\n';
              for (const [type, value] of Object.entries(armor.resistances)) {
                output += `    ${type}: ${value}\n`;
              }
            }
            output += '\n';
          }

          if (magical) {
            output += 'MAGICAL TRAIT\n';
            if (magical.magicType) output += `  Magic Type: ${magical.magicType}\n`;
            if (magical.charges != null) output += `  Charges: ${magical.charges}\n`;
            if (magical.manaCost != null) output += `  Mana Cost: ${magical.manaCost}\n`;
            if (magical.effects?.length) output += `  Effects: ${magical.effects.join(', ')}\n`;
            if (magical.grantsSpells?.length) output += `  Grants Spells: ${magical.grantsSpells.join(', ')}\n`;
            output += '\n';
          }
        }

        return output;
      },
    }),

    // ========================================================================
    // Items by Source
    // ========================================================================
    defineQuery({
      id: 'items-by-source',
      name: 'Items by Source',
      description: 'List items that can be gathered from a specific source entity type',
      requiresGame: false,
      params: [
        {
          name: 'source',
          type: 'string',
          required: true,
          description: 'Source entity type (e.g., tree, berry_bush)',
        },
      ],
      handler: async (params, _gameClient, _context) => {
        const source = params.source as string;
        const items = itemRegistry.getItemsFromSource(source);

        return {
          source,
          total: items.length,
          items: items.map(item => ({
            id: item.id,
            displayName: item.displayName,
            category: item.category,
            rarity: item.rarity,
            baseValue: item.baseValue,
            requiredTool: item.requiredTool ?? null,
          })),
        };
      },
      renderResult: (data: unknown) => {
        const result = data as {
          source: string;
          total: number;
          items: Array<{
            id: string;
            displayName: string;
            category: string;
            rarity: string;
            baseValue: number;
            requiredTool: string | null;
          }>;
        };

        let output = `ITEMS FROM SOURCE: ${result.source}\n`;
        output += `${'='.repeat(50)}\n`;
        output += `Found: ${result.total} items\n\n`;

        if (result.items.length === 0) {
          output += `No items are registered as gatherable from '${result.source}'.`;
          return output;
        }

        for (const item of result.items) {
          output += `  ${item.displayName} (${item.id})\n`;
          output += `    Category: ${item.category}  Rarity: ${item.rarity}  Value: ${item.baseValue}`;
          if (item.requiredTool) output += `  Tool: ${item.requiredTool}`;
          output += '\n';
        }

        return output;
      },
    }),

    // ========================================================================
    // Item Registry Stats
    // ========================================================================
    defineQuery({
      id: 'item-stats',
      name: 'Item Registry Stats',
      description: 'Aggregate statistics for all registered item definitions',
      requiresGame: false,
      params: [],
      handler: async (_params, _gameClient, _context) => {
        const all = itemRegistry.getAll();
        const total = all.length;

        const byCategory: Record<string, number> = {};
        const byRarity: Record<string, number> = {};
        let withWeapon = 0;
        let withEdible = 0;
        let withMagical = 0;
        let withTool = 0;
        let withArmor = 0;
        let gatherable = 0;
        let craftable = 0;
        let edibleLegacy = 0;

        for (const item of all) {
          byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
          byRarity[item.rarity] = (byRarity[item.rarity] ?? 0) + 1;
          if (item.traits?.weapon) withWeapon++;
          if (item.traits?.edible) withEdible++;
          if (item.traits?.magical) withMagical++;
          if (item.traits?.tool) withTool++;
          if (item.traits?.armor) withArmor++;
          if (item.isGatherable || (item.gatherSources && item.gatherSources.length > 0)) gatherable++;
          if (item.craftedFrom && item.craftedFrom.length > 0) craftable++;
          if (item.isEdible && !item.traits?.edible) edibleLegacy++;
        }

        return {
          total,
          byCategory,
          byRarity,
          traitCounts: { withWeapon, withEdible, withMagical, withTool, withArmor },
          gatherable,
          craftable,
          edibleLegacy,
        };
      },
      renderResult: (data: unknown) => {
        const result = data as {
          total: number;
          byCategory: Record<string, number>;
          byRarity: Record<string, number>;
          traitCounts: {
            withWeapon: number;
            withEdible: number;
            withMagical: number;
            withTool: number;
            withArmor: number;
          };
          gatherable: number;
          craftable: number;
          edibleLegacy: number;
        };

        let output = 'ITEM REGISTRY STATS\n';
        output += `${'='.repeat(40)}\n\n`;
        output += `Total Items: ${result.total}\n\n`;

        output += 'BY CATEGORY:\n';
        const categoryOrder = ['resource', 'food', 'seed', 'tool', 'material', 'consumable', 'equipment', 'ammo', 'misc'];
        for (const cat of categoryOrder) {
          const count = result.byCategory[cat];
          if (count) output += `  ${cat.padEnd(12)}: ${count}\n`;
        }
        // Any unlisted categories
        for (const [cat, count] of Object.entries(result.byCategory)) {
          if (!categoryOrder.includes(cat)) output += `  ${cat.padEnd(12)}: ${count}\n`;
        }
        output += '\n';

        output += 'BY RARITY:\n';
        for (const rarity of ['common', 'uncommon', 'rare', 'legendary']) {
          const count = result.byRarity[rarity];
          if (count) output += `  ${rarity.padEnd(12)}: ${count}\n`;
        }
        output += '\n';

        output += 'TRAITS:\n';
        output += `  Weapon  : ${result.traitCounts.withWeapon}\n`;
        output += `  Edible  : ${result.traitCounts.withEdible}${result.edibleLegacy ? ` (+${result.edibleLegacy} legacy)` : ''}\n`;
        output += `  Tool    : ${result.traitCounts.withTool}\n`;
        output += `  Armor   : ${result.traitCounts.withArmor}\n`;
        output += `  Magical : ${result.traitCounts.withMagical}\n`;
        output += '\n';

        output += 'ACQUISITION:\n';
        output += `  Gatherable: ${result.gatherable}\n`;
        output += `  Craftable : ${result.craftable}\n`;

        return output;
      },
    }),
  ],

  actions: [],
});

capabilityRegistry.register(itemsBrowserCapability);
