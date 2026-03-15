/**
 * CommerceCostCalculator - Cost calculation for Commerce magic
 *
 * Costs: gold (primary) + oath (binding trade agreement)
 *
 * Commerce magic treats every spell as a fair transaction:
 * - Gold is the primary cost (spells are expensive, magic isn't free)
 * - Every spell requires exactly one binding oath (the trade agreement)
 * - Powerful spells command a premium (gold cost × 1.5 for manaCost > 40)
 * - Fair trade has literal magical power; the universe enforces the exchange
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

/** Gold cost multiplier: spells are expensive */
const GOLD_COST_MULTIPLIER = 2;

/** Premium multiplier applied to powerful spells (manaCost > 40) */
const PREMIUM_MULTIPLIER = 1.5;

/** mana cost threshold above which premium pricing applies */
const PREMIUM_THRESHOLD = 40;

/** Each spell requires exactly one binding oath */
const OATH_COST_PER_SPELL = 1;

/**
 * Cost calculator for Commerce magic.
 *
 * Every spell is a transaction. Fair trade has magical power.
 * Running out of gold or oaths means no more commerce magic can be cast.
 */
export class CommerceCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'commerce_magic';

  calculateCosts(
    spell: ComposedSpell,
    _caster: MagicComponent,
    _context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];

    // =========================================================================
    // Gold Cost (Primary) - Every spell is a transaction
    // =========================================================================

    let goldCost = spell.manaCost * GOLD_COST_MULTIPLIER;

    // Premium pricing for powerful spells - power commands higher rates
    if (spell.manaCost > PREMIUM_THRESHOLD) {
      goldCost = Math.ceil(goldCost * PREMIUM_MULTIPLIER);
    }

    costs.push({
      type: 'gold',
      amount: goldCost,
      source: 'commerce_transaction_fee',
      terminal: false, // Running out of gold blocks casting, but isn't fatal
    });

    // =========================================================================
    // Oath (Binding trade agreement - one per spell)
    // =========================================================================

    // Every spell requires exactly one binding oath: the trade agreement
    costs.push({
      type: 'oath',
      amount: OATH_COST_PER_SPELL,
      source: 'commerce_binding_agreement',
      terminal: false, // Running out of oaths blocks casting, but isn't fatal
    });

    return costs;
  }

  /**
   * Override affordability: both gold AND oath must be available to cast.
   * Commerce magic only works if you can complete the full transaction.
   */
  override canAfford(costs: SpellCost[], caster: MagicComponent): AffordabilityResult {
    const missing: SpellCost[] = [];
    let wouldBeTerminal = false;
    const warning: string | undefined = undefined;

    for (const cost of costs) {
      if (cost.type === 'gold') {
        const pool = caster.resourcePools.gold;
        if (!pool) {
          missing.push({ type: 'gold', amount: cost.amount, source: 'no_gold_pool' });
          continue;
        }

        const available = pool.current - pool.locked;
        if (available < cost.amount) {
          missing.push({
            type: 'gold',
            amount: cost.amount - available,
            source: 'insufficient_gold',
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
        }
      }
    }

    return { canAfford: missing.length === 0, missing, wouldBeTerminal, warning };
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Gold pool - the economic foundation of commerce magic
    const goldMax = options?.maxOverrides?.gold ?? 500;
    const goldCurrent = options?.currentOverrides?.gold ?? 100;
    const goldRegen = options?.regenOverrides?.gold ?? 0;

    caster.resourcePools.gold = {
      type: 'gold',
      current: goldCurrent,
      maximum: goldMax,
      regenRate: goldRegen, // Gold accumulates through trade (handled externally)
      locked: 0,
    };

    // Oath pool - binding agreements, starts full (10 oaths available)
    const oathMax = options?.maxOverrides?.oath ?? 10;
    const oathCurrent = options?.currentOverrides?.oath ?? 10;
    const oathRegen = options?.regenOverrides?.oath ?? 0;

    caster.resourcePools.oath = {
      type: 'oath',
      current: oathCurrent,
      maximum: oathMax,
      regenRate: oathRegen, // Oaths are renewed through completing trade agreements
      locked: 0,
    };

    // Set paradigm state
    if (!caster.paradigmState) {
      caster.paradigmState = {};
    }
    caster.paradigmState.commerce_magic = {
      custom: {
        commerceSpellsCast: 0,
        totalGoldSpent: 0,
        oathsCompleted: 0,
      },
    };
  }

  /**
   * Override terminal effects for commerce-specific consequences.
   */
  protected override getTerminalEffect(
    costType: MagicCostType,
    trigger: 'zero' | 'max',
    _caster: MagicComponent
  ): TerminalEffect {
    switch (costType) {
      case 'gold':
        return { type: 'exhaustion', cause: 'Commerce mage bankrupted — no gold, no magic' };
      case 'oath':
        return { type: 'exhaustion', cause: 'All binding agreements exhausted — trades must be settled before casting again' };
      default:
        return super.getTerminalEffect(costType, trigger, _caster);
    }
  }
}
