/**
 * ParadoxCostCalculator - Cost calculation for Paradox magic
 *
 * Costs: sanity (primary, terminal), corruption (secondary, cumulative)
 *
 * Paradox magic works by embracing logical contradictions:
 * - Sanity is the primary cost (each paradox fractures the mind)
 * - Corruption accumulates from bending reality itself
 * - Transform technique: +50% sanity cost (changing things via paradox is extra disorienting)
 * - Cannot cast below 20 sanity (too incoherent to form paradoxes)
 * - Every paradox leaves a permanent mark on the caster's grip on reality
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

/** Fraction of manaCost consumed as sanity */
const SANITY_COST_FRACTION = 0.8;

/** Fraction of manaCost gained as corruption */
const CORRUPTION_GAIN_FRACTION = 0.3;

/** Sanity multiplier for transform technique (extra disorienting) */
const TRANSFORM_SANITY_MULTIPLIER = 1.5;

/** Minimum sanity required to cast - below this, the caster is too incoherent */
const MIN_SANITY_TO_CAST = 20;

/**
 * Cost calculator for Paradox magic.
 *
 * Every paradox cast fractures the mind a little more. Sanity depletes with
 * each casting, and corruption accumulates as reality itself is warped.
 */
export class ParadoxCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'paradox_magic';

  calculateCosts(
    spell: ComposedSpell,
    _caster: MagicComponent,
    _context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];

    // =========================================================================
    // Sanity Cost (Primary) - Paradoxes are mentally devastating
    // =========================================================================

    let sanityCost = Math.ceil(spell.manaCost * SANITY_COST_FRACTION);

    // Transform technique: changing things via paradox is extra disorienting
    if (spell.technique === 'transform') {
      sanityCost = Math.ceil(sanityCost * TRANSFORM_SANITY_MULTIPLIER);
    }

    costs.push({
      type: 'sanity',
      amount: sanityCost,
      source: 'paradox_mind_fracture',
      terminal: true, // Sanity reaching zero = permanent madness
    });

    // =========================================================================
    // Corruption (Secondary, Cumulative) - Reality warps around the caster
    // =========================================================================

    const corruptionGain = Math.ceil(spell.manaCost * CORRUPTION_GAIN_FRACTION);

    costs.push({
      type: 'corruption',
      amount: corruptionGain,
      source: 'paradox_reality_warp',
      terminal: true, // 100 corruption = transformation into paradox entity
    });

    return costs;
  }

  /**
   * Override affordability: sanity must be >= MIN_SANITY_TO_CAST to form paradoxes.
   * Below that threshold the caster is too incoherent to impose contradictions.
   */
  override canAfford(costs: SpellCost[], caster: MagicComponent): AffordabilityResult {
    const missing: SpellCost[] = [];
    let wouldBeTerminal = false;
    let warning: string | undefined;

    // First, check the hard sanity floor - this blocks casting entirely
    const sanityPool = caster.resourcePools.sanity;
    if (sanityPool) {
      const availableSanity = sanityPool.current - sanityPool.locked;
      if (availableSanity < MIN_SANITY_TO_CAST) {
        // Caster is too incoherent to cast at all
        missing.push({
          type: 'sanity',
          amount: MIN_SANITY_TO_CAST - availableSanity,
          source: 'incoherent_below_threshold',
          terminal: false,
        });
        return {
          canAfford: false,
          missing,
          wouldBeTerminal: false,
          warning: `Sanity below ${MIN_SANITY_TO_CAST} — caster is too incoherent to form paradoxes`,
        };
      }
    }

    for (const cost of costs) {
      if (cost.type === 'sanity') {
        if (!sanityPool) {
          missing.push({ type: 'sanity', amount: cost.amount, source: 'no_sanity_pool' });
          continue;
        }

        const available = sanityPool.current - sanityPool.locked;
        const remaining = available - cost.amount;

        if (available < cost.amount) {
          missing.push({
            type: 'sanity',
            amount: cost.amount - available,
            source: 'insufficient_sanity',
          });
        }

        if (remaining <= 0) {
          wouldBeTerminal = true;
          warning = 'Paradox casting would shatter the last of your sanity';
        } else if (remaining < MIN_SANITY_TO_CAST) {
          warning = `Paradox casting would leave only ${remaining} sanity — dangerously close to incoherence`;
        }
      } else if (cost.type === 'corruption') {
        // Corruption is cumulative - check if it would reach maximum
        const corruptionPool = caster.resourcePools.corruption;
        if (corruptionPool) {
          const afterAdd = corruptionPool.current + cost.amount;
          if (afterAdd >= corruptionPool.maximum) {
            wouldBeTerminal = true;
            warning = 'Paradox corruption would complete the transformation';
          }
        }
        // No pool yet means no accumulated corruption - that's fine
      }
    }

    return { canAfford: missing.length === 0, missing, wouldBeTerminal, warning };
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Sanity pool - starts at 100, regen 0.5/tick (slow mental recovery)
    const sanityMax = options?.maxOverrides?.sanity ?? 100;
    const sanityCurrent = options?.currentOverrides?.sanity ?? sanityMax;
    const sanityRegen = options?.regenOverrides?.sanity ?? 0.5;

    caster.resourcePools.sanity = {
      type: 'sanity',
      current: sanityCurrent,
      maximum: sanityMax,
      regenRate: sanityRegen,
      locked: 0,
    };

    // Corruption pool - starts at 0, never recovers (regen = 0)
    const corruptionMax = options?.maxOverrides?.corruption ?? 100;

    caster.resourcePools.corruption = {
      type: 'corruption',
      current: options?.currentOverrides?.corruption ?? 0,
      maximum: corruptionMax,
      regenRate: 0, // Paradox corruption never heals
      locked: 0,
    };

    // Set paradigm state
    if (!caster.paradigmState) {
      caster.paradigmState = {};
    }
    caster.paradigmState.paradox_magic = {
      custom: {
        paradoxSpellsCast: 0,
        sanityFracturesTotal: 0,
      },
    };
  }

  /**
   * Override terminal effects for paradox-specific consequences.
   */
  protected override getTerminalEffect(
    costType: MagicCostType,
    trigger: 'zero' | 'max',
    caster: MagicComponent
  ): TerminalEffect {
    switch (costType) {
      case 'sanity':
        return {
          type: 'sanity_zero',
          madnessType: caster.paradigmState?.paradox_magic?.custom?.['madnessType'] as string ?? 'paradox_dissolution',
        };
      case 'corruption':
        return {
          type: 'corruption_threshold',
          newForm: 'paradox_entity',
          corruptionLevel: 100,
        };
      default:
        return super.getTerminalEffect(costType, trigger, caster);
    }
  }
}
