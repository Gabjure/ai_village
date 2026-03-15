/**
 * DebtCostCalculator - Cost calculation for Debt magic (Fae debt magic)
 *
 * Costs: favor (owed favors as currency) + oath (binding promises for large spells)
 *
 * Debt magic runs on the economy of obligation:
 * - Being owed gives power; spending favors to cast spells
 * - Favors are specific and valuable (80% of mana cost)
 * - Large spells (manaCost > 30) additionally require a binding oath
 * - Favor pool regenerates via RECEIVING favors (handled externally, not time-based)
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

/** Favor cost fraction: favors are specific and valuable */
const FAVOR_COST_FRACTION = 0.8;

/** Mana cost threshold above which an oath is required */
const OATH_REQUIRED_THRESHOLD = 30;

/** Binding oaths required for large spells */
const OATH_COST_PER_LARGE_SPELL = 1;

/**
 * Cost calculator for Debt magic.
 *
 * Fae debt magic: being owed gives power. The caster spends favors owed to them
 * to fuel spells. Larger spells bind the caster with an oath.
 * Favors are earned by doing things for others — not regenerated passively.
 */
export class DebtCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'debt_magic';

  calculateCosts(
    spell: ComposedSpell,
    _caster: MagicComponent,
    _context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];

    // =========================================================================
    // Favor Cost (Primary) - Owed favors spent to fuel magic
    // =========================================================================

    // Favors are specific and valuable: 80% of mana cost
    const favorCost = Math.ceil(spell.manaCost * FAVOR_COST_FRACTION);

    costs.push({
      type: 'favor',
      amount: favorCost,
      source: 'debt_favor_spent',
      terminal: false, // Running out of favors blocks casting, but isn't fatal
    });

    // =========================================================================
    // Oath (Binding promise - only for large spells)
    // =========================================================================

    // Large spells require a binding oath: the caster commits to something
    if (spell.manaCost > OATH_REQUIRED_THRESHOLD) {
      costs.push({
        type: 'oath',
        amount: OATH_COST_PER_LARGE_SPELL,
        source: 'debt_binding_oath',
        terminal: false, // Running out of oaths blocks large spells, but isn't fatal
      });
    }

    return costs;
  }

  /**
   * Override affordability:
   * - Favors must be > 0 (cannot cast with empty favor pool)
   * - Oath pool must have capacity for oaths when large spells are cast
   */
  override canAfford(costs: SpellCost[], caster: MagicComponent): AffordabilityResult {
    const missing: SpellCost[] = [];
    let wouldBeTerminal = false;
    let warning: string | undefined;

    for (const cost of costs) {
      if (cost.type === 'favor') {
        const pool = caster.resourcePools.favor;
        if (!pool) {
          missing.push({ type: 'favor', amount: cost.amount, source: 'no_favor_pool' });
          continue;
        }

        const available = pool.current - pool.locked;

        // Favors must be > 0 to cast: cannot operate on empty debt
        if (available <= 0) {
          missing.push({ type: 'favor', amount: cost.amount, source: 'no_favors_owed' });
          warning = 'No favors owed — earn debts from others before casting';
          continue;
        }

        if (available < cost.amount) {
          missing.push({
            type: 'favor',
            amount: cost.amount - available,
            source: 'insufficient_favors',
          });
        }
      } else if (cost.type === 'oath') {
        const pool = caster.resourcePools.oath;
        if (!pool) {
          missing.push({ type: 'oath', amount: cost.amount, source: 'no_oath_pool' });
          continue;
        }

        const available = pool.current - pool.locked;
        if (available < cost.amount) {
          missing.push({
            type: 'oath',
            amount: cost.amount - available,
            source: 'insufficient_oaths',
          });
          warning = 'No oaths remaining — fulfill existing promises before making new ones';
        }
      }
    }

    return { canAfford: missing.length === 0, missing, wouldBeTerminal, warning };
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Favor pool - owed favors as magical currency; starts at 0, no passive regen
    const favorMax = options?.maxOverrides?.favor ?? 100;
    const favorCurrent = options?.currentOverrides?.favor ?? 0;

    caster.resourcePools.favor = {
      type: 'favor',
      current: favorCurrent,
      maximum: favorMax,
      regenRate: 0, // Favor regenerates via RECEIVING favors (handled externally)
      locked: 0,
    };

    // Oath pool - binding promises; starts full (20 oaths available)
    const oathMax = options?.maxOverrides?.oath ?? 20;
    const oathCurrent = options?.currentOverrides?.oath ?? 20;
    const oathRegen = options?.regenOverrides?.oath ?? 0;

    caster.resourcePools.oath = {
      type: 'oath',
      current: oathCurrent,
      maximum: oathMax,
      regenRate: oathRegen, // Oaths are renewed through fulfilling promises
      locked: 0,
    };

    // Set paradigm state
    if (!caster.paradigmState) {
      caster.paradigmState = {};
    }
    caster.paradigmState.debt_magic = {
      custom: {
        debtSpellsCast: 0,
        totalFavorsSpent: 0,
        totalFavorsEarned: 0,
        oathsMade: 0,
        oathsFulfilled: 0,
      },
    };
  }

  /**
   * Override terminal effects for debt-specific consequences.
   */
  protected override getTerminalEffect(
    costType: MagicCostType,
    trigger: 'zero' | 'max',
    _caster: MagicComponent
  ): TerminalEffect {
    switch (costType) {
      case 'favor':
        return { type: 'favor_zero', patronAction: 'all_debts_called_simultaneously' };
      case 'oath':
        return { type: 'exhaustion', cause: 'Bound by too many oaths — fae law prevents further commitments' };
      default:
        return super.getTerminalEffect(costType, trigger, _caster);
    }
  }
}
