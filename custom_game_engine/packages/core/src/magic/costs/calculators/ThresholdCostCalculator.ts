/**
 * ThresholdCostCalculator - Cost calculation for Threshold magic
 *
 * Costs: mana (only)
 *
 * Threshold magic draws power from borders, doorways, and transitions:
 * - Mana is the only cost (simpler paradigm than most)
 * - Near a threshold (ambientPower > 0.5): cost reduced by up to 50%
 * - At dawn or dusk (timeOfDay near 0.25 or 0.75): additional 25% reduction
 * - Perceive technique: 30% cheaper (sensing thresholds is natural)
 * - Mana regenerates faster than most paradigms (thresholds are everywhere)
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

/** Ambient power threshold above which boundary discounts apply */
const AMBIENT_THRESHOLD = 0.5;

/** Maximum cost reduction from ambient power (50%) */
const MAX_AMBIENT_REDUCTION = 0.5;

/** Cost reduction at dawn/dusk (25%) */
const DAWN_DUSK_REDUCTION = 0.25;

/** Cost reduction for perceive technique (30%) */
const PERCEIVE_REDUCTION = 0.3;

/** How close timeOfDay needs to be to 0.25 or 0.75 to count as dawn/dusk */
const DAWN_DUSK_WINDOW = 0.05;

/**
 * Check if the time of day is within the dawn or dusk window.
 */
function isNearDawnOrDusk(timeOfDay: number): boolean {
  const dawnDistance = Math.abs(timeOfDay - 0.25);
  const duskDistance = Math.abs(timeOfDay - 0.75);
  return dawnDistance <= DAWN_DUSK_WINDOW || duskDistance <= DAWN_DUSK_WINDOW;
}

/**
 * Cost calculator for Threshold magic.
 *
 * Draws power from boundaries and transitions. Cheaper when cast near
 * thresholds (doorways, borders, twilight, the liminal spaces of reality).
 */
export class ThresholdCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'threshold_magic';

  calculateCosts(
    spell: ComposedSpell,
    _caster: MagicComponent,
    context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];

    // =========================================================================
    // Mana Cost (Only cost) - Power from crossing boundaries
    // =========================================================================

    let manaCost = spell.manaCost;

    // Ambient power bonus: near a threshold, the magic flows freely.
    // Reduce cost by up to 50% when ambientPower > 0.5.
    if (context.ambientPower > AMBIENT_THRESHOLD) {
      const excessPower = context.ambientPower - AMBIENT_THRESHOLD;
      // excessPower ranges 0–0.5; scale to 0–MAX_AMBIENT_REDUCTION
      const ambientReduction = Math.min(MAX_AMBIENT_REDUCTION, excessPower * MAX_AMBIENT_REDUCTION * 2);
      manaCost *= (1 - ambientReduction);
    }

    // Dawn/dusk bonus: the boundary between day and night is itself a threshold.
    if (isNearDawnOrDusk(context.timeOfDay)) {
      manaCost *= (1 - DAWN_DUSK_REDUCTION);
    }

    // Perceive technique: sensing thresholds is the natural purpose of this magic.
    if (spell.technique === 'perceive') {
      manaCost *= (1 - PERCEIVE_REDUCTION);
    }

    // Group casting splits cost evenly
    if (context.isGroupCast && context.casterCount > 1) {
      manaCost = Math.ceil(manaCost / context.casterCount);
    }

    costs.push({
      type: 'mana',
      amount: Math.ceil(manaCost),
      source: 'threshold_crossing',
    });

    return costs;
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Mana pool - higher max (120) and faster regen (3/tick) than most paradigms
    // because thresholds are everywhere and power is easy to find
    const manaMax = options?.maxOverrides?.mana ?? 120;
    const manaCurrent = options?.currentOverrides?.mana ?? manaMax;
    const manaRegen = options?.regenOverrides?.mana ?? 3;

    caster.resourcePools.mana = {
      type: 'mana',
      current: manaCurrent,
      maximum: manaMax,
      regenRate: manaRegen,
      locked: 0,
    };

    // Also set up legacy mana pool for dual compatibility
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
    caster.paradigmState.threshold_magic = {
      custom: {
        thresholdSpellsCast: 0,
        thresholdsCrossed: 0,
      },
    };
  }
}
