/**
 * GameCostCalculator - Cost calculation for Game magic
 *
 * Costs: luck (primary gamble), mana (backing energy)
 *
 * Game magic follows the rules of games - rolls, chance, stakes:
 * - Luck is the primary cost - all game magic has stakes
 * - Mana is the backing energy for the gamble
 * - High-stakes spells (manaCost > 50): luck cost doubled but mana halved
 *   (bigger gamble, less grind - put your fortune on the line)
 *
 * Part of Phase 30: Magic System Paradigm Implementation
 */

import {
  BaseCostCalculator,
  type CastingContext,
  type SpellCost,
  type ResourceInitOptions,
} from '../CostCalculator.js';
import type { ComposedSpell, MagicComponent } from '../../../components/MagicComponent.js';

/** Threshold above which a spell is considered high-stakes */
const HIGH_STAKES_MANA_THRESHOLD = 50;

/**
 * Cost calculator for the Game magic paradigm.
 *
 * Magic follows the rules of games - rolls, chance, stakes.
 * Every spell is a gamble: spend luck to cast, with mana as backing energy.
 * High-stakes spells double the luck bet but halve the mana grind.
 */
export class GameCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'game_magic';

  calculateCosts(
    spell: ComposedSpell,
    _caster: MagicComponent,
    _context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];

    const isHighStakes = spell.manaCost > HIGH_STAKES_MANA_THRESHOLD;

    // =========================================================================
    // Luck Cost (Primary) - All game magic has stakes
    // =========================================================================

    // Base luck cost: 50% of mana cost
    let luckCost = Math.ceil(spell.manaCost * 0.5);

    if (isHighStakes) {
      // High-stakes: double the luck bet - bigger gamble
      luckCost = Math.ceil(luckCost * 2);
    }

    costs.push({
      type: 'luck',
      amount: luckCost,
      source: 'game_magic_stake',
    });

    // =========================================================================
    // Mana Cost (Secondary) - Energy backing the gamble
    // =========================================================================

    // Base mana cost: 40% of spell mana cost
    let manaCost = Math.ceil(spell.manaCost * 0.4);

    if (isHighStakes) {
      // High-stakes: halve the mana - less grind, more fortune
      manaCost = Math.ceil(manaCost * 0.5);
    }

    costs.push({
      type: 'mana',
      amount: manaCost,
      source: 'game_magic_backing',
    });

    return costs;
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Luck pool - fortune as currency; starts at half (already spent some)
    const luckMax = options?.maxOverrides?.luck ?? 100;
    const luckCurrent = options?.currentOverrides?.luck ?? Math.floor(luckMax / 2);
    const luckRegen = options?.regenOverrides?.luck ?? 0.5;

    caster.resourcePools.luck = {
      type: 'luck',
      current: luckCurrent,
      maximum: luckMax,
      regenRate: luckRegen,
      locked: 0,
    };

    // Mana pool - energy backing the gamble; starts full
    const manaMax = options?.maxOverrides?.mana ?? 100;
    const manaCurrent = options?.currentOverrides?.mana ?? manaMax;
    const manaRegen = options?.regenOverrides?.mana ?? 2;

    caster.resourcePools.mana = {
      type: 'mana',
      current: manaCurrent,
      maximum: manaMax,
      regenRate: manaRegen,
      locked: 0,
    };

    // Also initialize legacy mana pool for dual compatibility
    if (!caster.manaPools) {
      caster.manaPools = [];
    }
    if (!caster.manaPools.find(p => p.source === 'arcane')) {
      caster.manaPools.push({
        source: 'arcane',
        current: manaCurrent,
        maximum: manaMax,
        regenRate: manaRegen,
        locked: 0,
      });
    }

    // Set paradigm state
    if (!caster.paradigmState) {
      caster.paradigmState = {};
    }
    caster.paradigmState.game_magic = {
      custom: {
        gamesPlayed: 0,
        bigWins: 0,
        bigLosses: 0,
        currentStreak: 0,
      },
    };
  }
}
