/**
 * LuckCostCalculator - Cost calculation for Luck magic
 *
 * Costs: luck (primary), karma (cosmic balance)
 *
 * Luck magic: spend luck now, pay karma later. Fortune is currency.
 * - Luck is the primary cost - direct fortune expenditure
 * - Karma accumulates as cosmic balance shifts (cumulative cost)
 * - Enhance/create techniques: luck cost halved (improving fortune is cheaper)
 * - Destroy techniques: karma cost doubled (destroying fortune has cosmic consequences)
 * - Warning emitted when karma pool is at zero (balanced on a knife's edge)
 *
 * Part of Phase 30: Magic System Paradigm Implementation
 */

import {
  BaseCostCalculator,
  type CastingContext,
  type SpellCost,
  type AffordabilityResult,
  type ResourceInitOptions,
  type TerminalEffect,
} from '../CostCalculator.js';
import type { MagicCostType } from '../../MagicParadigm.js';
import type { ComposedSpell, MagicComponent } from '../../../components/MagicComponent.js';

/**
 * Cost calculator for the Luck magic paradigm.
 *
 * Fortune is currency: spend luck now, pay karma later.
 * Enhance and create are in harmony with fortune - cheaper.
 * Destroy disrupts the cosmic order - karma consequences are doubled.
 */
export class LuckCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'luck_magic';

  calculateCosts(
    spell: ComposedSpell,
    _caster: MagicComponent,
    _context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];

    // =========================================================================
    // Luck Cost (Primary) - Direct fortune expenditure
    // =========================================================================

    // Base luck cost: 60% of mana cost
    let luckCost = Math.ceil(spell.manaCost * 0.6);

    // Enhance and create techniques align with fortune - improving luck is cheaper
    if (spell.technique === 'enhance' || spell.technique === 'create') {
      luckCost = Math.ceil(luckCost * 0.5);
    }

    costs.push({
      type: 'luck',
      amount: luckCost,
      source: 'fortune_expenditure',
    });

    // =========================================================================
    // Karma Cost (Cumulative) - Cosmic balance shifts
    // =========================================================================

    // Base karma cost: 20% of mana cost (accumulates - karma is a long game)
    let karmaCost = Math.ceil(spell.manaCost * 0.2);

    // Destroy technique disrupts cosmic order - doubled karma consequences
    if (spell.technique === 'destroy') {
      karmaCost = Math.ceil(karmaCost * 2);
    }

    costs.push({
      type: 'karma',
      amount: karmaCost,
      source: 'cosmic_balance_shift',
      terminal: true, // Karma reaching max = cosmic reckoning
    });

    return costs;
  }

  /**
   * Override affordability to warn when karma pool is at 0 (balanced on a knife's edge).
   */
  override canAfford(costs: SpellCost[], caster: MagicComponent): AffordabilityResult {
    const result = super.canAfford(costs, caster);

    // Warn if karma pool is at zero - dangerous cosmic equilibrium
    const karmaPool = caster.resourcePools.karma;
    if (karmaPool && karmaPool.current === 0) {
      result.warning = 'Karma is at zero - balanced on a knife\'s edge. Any action risks cosmic reckoning.';
    }

    return result;
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Luck pool - fortune as primary currency; starts at half (already used some)
    const luckMax = options?.maxOverrides?.luck ?? 100;
    const luckCurrent = options?.currentOverrides?.luck ?? Math.floor(luckMax / 2);
    const luckRegen = options?.regenOverrides?.luck ?? 0.3;

    caster.resourcePools.luck = {
      type: 'luck',
      current: luckCurrent,
      maximum: luckMax,
      regenRate: luckRegen,
      locked: 0,
    };

    // Karma pool - cosmic balance; starts at half (neither lucky nor unlucky)
    const karmaMax = options?.maxOverrides?.karma ?? 100;
    const karmaCurrent = options?.currentOverrides?.karma ?? Math.floor(karmaMax / 2);
    const karmaRegen = options?.regenOverrides?.karma ?? 0.1;

    caster.resourcePools.karma = {
      type: 'karma',
      current: karmaCurrent,
      maximum: karmaMax,
      regenRate: karmaRegen,
      locked: 0,
    };

    // Set paradigm state
    if (!caster.paradigmState) {
      caster.paradigmState = {};
    }
    caster.paradigmState.luck_magic = {
      custom: {
        fortuneSpent: 0,
        karmaBalance: 0,
        cosmicDebt: 0,
      },
    };
  }

  /**
   * Override terminal effects for luck-specific consequences.
   */
  protected override getTerminalEffect(
    costType: MagicCostType,
    trigger: 'zero' | 'max',
    _caster: MagicComponent
  ): TerminalEffect {
    switch (costType) {
      case 'luck':
        return { type: 'death', cause: 'Fortune fully exhausted - all luck has run out' };
      case 'karma':
        return {
          type: 'corruption_threshold',
          newForm: 'cosmic_debtor',
          corruptionLevel: 100,
        };
      default:
        return super.getTerminalEffect(costType, trigger, _caster);
    }
  }
}
