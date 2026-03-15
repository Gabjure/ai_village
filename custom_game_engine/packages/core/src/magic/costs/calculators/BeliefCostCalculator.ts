/**
 * BeliefCostCalculator - Cost calculation for Belief magic
 *
 * Costs: belief (primary, cumulative, terminal) + attention (secondary, draws supernatural notice)
 *
 * Belief magic is powered by collective faith:
 * - Belief is the primary cost (shared among believers, so halved)
 * - Attention ALWAYS accumulates (draws notice of higher powers)
 * - More believers = cheaper cost (group casting reduces cost further)
 * - Losing believers = power fades
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

/** Base attention gained per belief spell cast */
const BASE_ATTENTION_PER_CAST = 3;

/**
 * Cost calculator for Belief magic.
 *
 * Belief magic costs are shared among believers, making community essential.
 * Attention accumulates each cast, eventually drawing the notice of higher powers.
 */
export class BeliefCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'belief_magic';

  calculateCosts(
    spell: ComposedSpell,
    _caster: MagicComponent,
    context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];

    // =========================================================================
    // Belief Cost (Primary) - Halved because shared among believers
    // =========================================================================

    // Belief cost is halved: shared among the community of believers
    let beliefCost = Math.ceil(spell.manaCost * 0.5);

    // Group casting: believers multiply the power, reducing individual cost further
    if (context.isGroupCast && context.casterCount > 1) {
      beliefCost = Math.ceil(beliefCost / context.casterCount);
    }

    costs.push({
      type: 'belief',
      amount: beliefCost,
      source: 'belief_collective_faith',
      terminal: true, // Belief reaching zero = magic fails, power fades
    });

    // =========================================================================
    // Attention (Always accumulates - draws notice of higher powers)
    // =========================================================================

    // Attention accumulates every cast - ritual magic draws the eyes of the divine
    let attentionGain = BASE_ATTENTION_PER_CAST;

    // Attention cost: 25% of mana cost, representing supernatural notice drawn
    attentionGain += Math.ceil(spell.manaCost * 0.25);

    // Powerful spells draw far more attention
    if (spell.manaCost > 40) {
      attentionGain += Math.ceil((spell.manaCost - 40) * 0.15);
    }

    costs.push({
      type: 'attention',
      amount: attentionGain,
      source: 'belief_divine_notice',
      terminal: true, // 100 attention = higher powers intervene directly
    });

    return costs;
  }

  /**
   * Override affordability: belief pool must have enough for the spell.
   * Attention is always payable (cumulative), but warn if nearing threshold.
   */
  override canAfford(costs: SpellCost[], caster: MagicComponent): AffordabilityResult {
    const missing: SpellCost[] = [];
    let wouldBeTerminal = false;
    let warning: string | undefined;

    for (const cost of costs) {
      if (cost.type === 'belief') {
        const pool = caster.resourcePools.belief;
        if (!pool) {
          missing.push({ type: 'belief', amount: cost.amount, source: 'no_belief_pool' });
          continue;
        }

        const available = pool.current - pool.locked;
        if (available < cost.amount) {
          missing.push({
            type: 'belief',
            amount: cost.amount - available,
            source: 'insufficient_belief',
          });
          if (pool.current - cost.amount <= 0 && cost.terminal) {
            wouldBeTerminal = true;
            warning = 'Belief would reach zero — collective faith exhausted, power fades';
          }
        }
      } else if (cost.type === 'attention') {
        // Attention never blocks casting - it's always possible to draw more notice
        const pool = caster.resourcePools.attention;
        if (pool && pool.current + cost.amount >= pool.maximum) {
          wouldBeTerminal = true;
          warning = 'Attention would reach maximum — higher powers will intervene directly';
        }
      }
    }

    return { canAfford: missing.length === 0, missing, wouldBeTerminal, warning };
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Belief pool - collective faith that powers the magic
    const beliefMax = options?.maxOverrides?.belief ?? 200;
    const beliefCurrent = options?.currentOverrides?.belief ?? 100;
    const beliefRegen = options?.regenOverrides?.belief ?? 0;

    caster.resourcePools.belief = {
      type: 'belief',
      current: beliefCurrent,
      maximum: beliefMax,
      regenRate: beliefRegen, // Regenerates via gaining believers (handled externally)
      locked: 0,
    };

    // Attention pool - accumulates, starts at 0, represents supernatural notice
    const attentionMax = options?.maxOverrides?.attention ?? 100;

    caster.resourcePools.attention = {
      type: 'attention',
      current: options?.currentOverrides?.attention ?? 0,
      maximum: attentionMax,
      regenRate: 0, // Attention never fades on its own
      locked: 0,
    };

    // Set paradigm state
    if (!caster.paradigmState) {
      caster.paradigmState = {};
    }
    caster.paradigmState.belief_magic = {
      custom: {
        beliefSpellsCast: 0,
        attentionMilestones: [],
      },
    };
  }

  /**
   * Override terminal effects for belief-specific consequences.
   */
  protected override getTerminalEffect(
    costType: MagicCostType,
    trigger: 'zero' | 'max',
    _caster: MagicComponent
  ): TerminalEffect {
    switch (costType) {
      case 'belief':
        return { type: 'favor_zero', patronAction: 'faith_abandoned_power_revoked' };
      case 'attention':
        return {
          type: 'corruption_threshold',
          newForm: 'divine_marked',
          corruptionLevel: 100,
        };
      default:
        return super.getTerminalEffect(costType, trigger, _caster);
    }
  }
}
