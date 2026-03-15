/**
 * BureaucraticCostCalculator - Cost calculation for Bureaucratic magic
 *
 * Costs: time (primary casting delay), material (paperwork/components), sanity (bureaucracy drains sanity)
 *
 * Bureaucratic magic requires proper forms, permits, and approvals:
 * - Time cost doubles cast time - paperwork takes time
 * - Material cost represents physical components/forms required
 * - Sanity cost reflects the maddening nature of bureaucratic processes
 * - Forbidden or control/destroy magic has more red tape (+50% sanity cost)
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
 * Cost calculator for the Bureaucratic magic paradigm.
 *
 * Magic requires proper forms, permits, and approvals.
 * Every spell has paperwork. Time cost is doubled, material for forms,
 * sanity erodes under the weight of bureaucracy.
 */
export class BureaucraticCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'bureaucratic_magic';

  calculateCosts(
    spell: ComposedSpell,
    _caster: MagicComponent,
    _context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];

    // =========================================================================
    // Time Cost (Primary) - Double cast time for paperwork processing
    // =========================================================================

    // Every spell requires processing time for approval. Paperwork takes time.
    const timeCost = Math.ceil(spell.castTime * 2);

    costs.push({
      type: 'time',
      amount: timeCost,
      source: 'bureaucratic_processing',
    });

    // =========================================================================
    // Material Cost (Secondary) - Physical components and forms required
    // =========================================================================

    // 30% of mana cost as physical material (forms, stamps, reagents)
    const materialCost = Math.ceil(spell.manaCost * 0.3);

    costs.push({
      type: 'material',
      amount: materialCost,
      source: 'required_forms_and_components',
    });

    // =========================================================================
    // Sanity Cost (Tertiary) - Bureaucracy is maddening
    // =========================================================================

    // 10% of mana cost as sanity drain
    let sanityCost = Math.ceil(spell.manaCost * 0.1);

    // Destroy or control techniques are forbidden magic with more red tape
    if (spell.technique === 'destroy' || spell.technique === 'control') {
      sanityCost = Math.ceil(sanityCost * 1.5);
    }

    costs.push({
      type: 'sanity',
      amount: sanityCost,
      source: 'bureaucratic_madness',
      terminal: true, // Sanity reaching zero = madness
    });

    return costs;
  }

  /**
   * Override affordability to emit a warning when sanity pool is critically low.
   */
  override canAfford(costs: SpellCost[], caster: MagicComponent): AffordabilityResult {
    const result = super.canAfford(costs, caster);

    // Warn when sanity is at 20% or below after potential cost
    const sanityPool = caster.resourcePools.sanity;
    if (sanityPool) {
      const sanityCost = costs.find(c => c.type === 'sanity');
      if (sanityCost) {
        const remaining = (sanityPool.current - sanityPool.locked) - sanityCost.amount;
        if (remaining <= sanityPool.maximum * 0.2 && remaining > 0) {
          result.warning = `Sanity critically low after cast: ${Math.max(0, remaining)} remaining`;
        }
      }
    }

    return result;
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Time pool - represents available processing time (permits, queues)
    const timeMax = options?.maxOverrides?.time ?? 200;
    const timeCurrent = options?.currentOverrides?.time ?? timeMax;
    const timeRegen = options?.regenOverrides?.time ?? 1;

    caster.resourcePools.time = {
      type: 'time',
      current: timeCurrent,
      maximum: timeMax,
      regenRate: timeRegen,
      locked: 0,
    };

    // Material pool - forms, components, stamps; starts half-full (need to restock)
    const materialMax = options?.maxOverrides?.material ?? 100;
    const materialCurrent = options?.currentOverrides?.material ?? Math.floor(materialMax / 2);
    const materialRegen = options?.regenOverrides?.material ?? 0;

    caster.resourcePools.material = {
      type: 'material',
      current: materialCurrent,
      maximum: materialMax,
      regenRate: materialRegen,
      locked: 0,
    };

    // Sanity pool - mental stability under bureaucratic strain; full at start
    const sanityMax = options?.maxOverrides?.sanity ?? 100;
    const sanityCurrent = options?.currentOverrides?.sanity ?? sanityMax;
    const sanityRegen = options?.regenOverrides?.sanity ?? 0.1;

    caster.resourcePools.sanity = {
      type: 'sanity',
      current: sanityCurrent,
      maximum: sanityMax,
      regenRate: sanityRegen,
      locked: 0,
    };

    // Set paradigm state
    if (!caster.paradigmState) {
      caster.paradigmState = {};
    }
    caster.paradigmState.bureaucratic_magic = {
      custom: {
        formsFiled: 0,
        permitsApproved: 0,
        pendingApprovals: [],
      },
    };
  }

  /**
   * Override terminal effects for bureaucratic-specific consequences.
   */
  protected override getTerminalEffect(
    costType: MagicCostType,
    trigger: 'zero' | 'max',
    _caster: MagicComponent
  ): TerminalEffect {
    switch (costType) {
      case 'sanity':
        return {
          type: 'sanity_zero',
          madnessType: 'bureaucratic_obsession',
        };
      case 'material':
        return {
          type: 'material_shortage',
          materialType: 'forms_and_permits',
        };
      default:
        return super.getTerminalEffect(costType, trigger, _caster);
    }
  }
}
