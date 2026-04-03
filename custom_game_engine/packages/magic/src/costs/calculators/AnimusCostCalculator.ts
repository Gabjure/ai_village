/**
 * AnimusCostCalculator - Cost calculation for Animus paradigm (Animus paradigm style)
 *
 * Costs: animus_bond (primary), dust_connection, separation_trauma
 *
 * Animus magic works through soul-bond:
 * - Animus is external soul manifestation
 * - Bond strength determines power
 * - Separation causes trauma
 * - Aether Motes enhance connection
 */

import {
  BaseCostCalculator,
  type CastingContext,
  type SpellCost,
  type ResourceInitOptions,
  type TerminalEffect,
} from '../CostCalculator.js';
import type { MagicCostType } from '../../MagicParadigm.js';
import type { ComposedSpell, MagicComponent } from '@ai-village/core';

/** Animus settlement status */
type AnimusStatus = 'unsettled' | 'settling' | 'settled' | 'severed';

/**
 * Cost calculator for the Animus magic paradigm.
 */
export class AnimusCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'animus';

  calculateCosts(
    spell: ComposedSpell,
    caster: MagicComponent,
    context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];
    const state = caster.paradigmState?.animus;
    const animusStatus = (state?.settlementStatus ?? 'settled') as AnimusStatus;
    const distance = (context.custom?.animusDistance ?? 0) as number;

    // =========================================================================
    // Animus Bond Cost (Primary)
    // =========================================================================

    let bondCost = Math.ceil(spell.manaCost * 0.35);

    // Unsettled animuses are more versatile but less stable
    if (animusStatus === 'unsettled') {
      bondCost = Math.ceil(bondCost * 0.7);
    }

    // Settled animuses are more efficient in their form's domain
    if (animusStatus === 'settled' && this.matchesAnimusForm(spell, state?.animusForm as string)) {
      bondCost = Math.ceil(bondCost * 0.5);
    }

    // Severed individuals have greatly reduced magic
    if (animusStatus === 'severed') {
      bondCost = Math.ceil(bondCost * 3);
    }

    costs.push({
      type: 'animus_bond',
      amount: bondCost,
      source: 'soul_channeling',
      terminal: true,
    });

    // =========================================================================
    // Separation Trauma (Distance from animus)
    // =========================================================================

    if (distance > 0) {
      // Being apart from animus causes pain
      const traumaCost = Math.ceil(distance * 2);

      costs.push({
        type: 'separation_trauma',
        amount: traumaCost,
        source: 'animus_distance',
      });
    }

    // =========================================================================
    // Aether Mote Connection (For enhanced magic)
    // =========================================================================

    // Higher-level spells require dust connection
    if (spell.manaCost > 30) {
      const dustCost = Math.ceil((spell.manaCost - 30) * 0.3);

      costs.push({
        type: 'aether_motes',
        amount: dustCost,
        source: 'dust_channel',
      });
    }

    // =========================================================================
    // Form Mismatch Penalty
    // =========================================================================

    if (animusStatus === 'settled' && !this.matchesAnimusForm(spell, state?.animusForm as string)) {
      // Using magic that doesn't match animus's settled form
      costs.push({
        type: 'animus_bond',
        amount: Math.ceil(bondCost * 0.3),
        source: 'form_mismatch',
      });
    }

    return costs;
  }

  /**
   * Check if spell matches the animus's settled form.
   */
  private matchesAnimusForm(spell: ComposedSpell, form?: string): boolean {
    if (!form) return false;

    // Form-to-spell-type mappings
    const formAffinities: Record<string, string[]> = {
      wolf: ['body', 'animal', 'earth'],
      hawk: ['air', 'perceive', 'spirit'],
      cat: ['shadow', 'perceive', 'mind'],
      bear: ['body', 'earth', 'protect'],
      snake: ['poison', 'mind', 'control'],
      raven: ['spirit', 'mind', 'perceive'],
      lion: ['fire', 'body', 'command'],
    };

    const affinities = formAffinities[form.toLowerCase()] ?? [];
    return affinities.includes(spell.form) || affinities.includes(spell.technique);
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Animus bond pool - soul connection strength
    const bondMax = options?.maxOverrides?.animus_bond ?? 100;
    const bondStart = options?.currentOverrides?.animus_bond ?? 100;

    caster.resourcePools.animus_bond = {
      type: 'animus_bond',
      current: bondStart,
      maximum: bondMax,
      regenRate: 1, // Recovers through rest/proximity
      locked: 0,
    };

    // Separation trauma pool (accumulates when apart)
    caster.resourcePools.separation_trauma = {
      type: 'separation_trauma',
      current: options?.currentOverrides?.separation_trauma ?? 0,
      maximum: 100,
      regenRate: -0.5, // Slowly heals when together
      locked: 0,
    };

    // Aether Mote connection pool
    caster.resourcePools.aether_motes = {
      type: 'aether_motes',
      current: options?.currentOverrides?.aether_motes ?? 50,
      maximum: options?.maxOverrides?.aether_motes ?? 100,
      regenRate: 0.2, // Slow ambient accumulation
      locked: 0,
    };

    // Set paradigm state
    caster.paradigmState.animus = {
      animusName: undefined,
      animusForm: undefined, // Undefined = unsettled
      settlementStatus: 'unsettled' as AnimusStatus,
      custom: {
        previousForms: [],
        dustSensitivity: 50,
        witchClan: undefined,
        canSeparate: false,
      },
    };
  }

  /**
   * Override terminal effect for animus-specific consequences.
   */
  protected override getTerminalEffect(
    costType: MagicCostType,
    trigger: 'zero' | 'max',
    _caster: MagicComponent
  ): TerminalEffect {
    if (costType === 'animus_bond' && trigger === 'zero') {
      return {
        type: 'bond_severed',
        animusLost: true,
      };
    }

    if (costType === 'separation_trauma' && trigger === 'max') {
      return {
        type: 'death',
        cause: 'Soul torn apart from animus - fatal separation',
      };
    }

    if (costType === 'aether_motes' && trigger === 'zero') {
      return {
        type: 'dust_depleted',
        connectionLost: true,
      };
    }

    return super.getTerminalEffect(costType, trigger, _caster);
  }

  /**
   * Separation trauma is cumulative.
   */
  protected override isCumulativeCost(costType: MagicCostType): boolean {
    return costType === 'separation_trauma' || super.isCumulativeCost(costType);
  }
}
