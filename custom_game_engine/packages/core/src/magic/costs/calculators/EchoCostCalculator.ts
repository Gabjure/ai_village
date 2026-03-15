/**
 * EchoCostCalculator - Cost calculation for Echo magic
 *
 * Costs: memory (primary), time (secondary)
 *
 * Echo magic works by creating echoes of past events:
 * - Memory is the primary cost (fragments of self are consumed)
 * - Time is the secondary cost (echoes take real time to resonate)
 * - The more vivid the memory, the more power available
 * - Perceive + mind combo: memory cost halved (natural memory recall)
 * - Memories slowly return over time but are never fully recovered
 *
 * Part of Phase 30: Magic System Paradigm Implementation
 */

import {
  BaseCostCalculator,
  type CastingContext,
  type SpellCost,
  type ResourceInitOptions,
  type TerminalEffect,
} from '../CostCalculator.js';
import type { MagicCostType } from '../../MagicParadigm.js';
import type { ComposedSpell, MagicComponent } from '../../../components/MagicComponent.js';

/** Fraction of manaCost consumed as memory fragments */
const MEMORY_COST_FRACTION = 0.4;

/**
 * Cost calculator for Echo magic.
 *
 * Echo magic costs memory and time. Memories are consumed as fuel;
 * the caster slowly forgets the past in exchange for echoing it into power.
 */
export class EchoCostCalculator extends BaseCostCalculator {
  readonly paradigmId = 'echo_magic';

  calculateCosts(
    spell: ComposedSpell,
    _caster: MagicComponent,
    _context: CastingContext
  ): SpellCost[] {
    const costs: SpellCost[] = [];

    // =========================================================================
    // Memory Cost (Primary) - Fragments of memory consumed
    // =========================================================================

    let memoryCost = Math.ceil(spell.manaCost * MEMORY_COST_FRACTION);

    // Perceive + mind synergy: recalling memories to perceive is natural,
    // so the memory cost is halved for this combination
    if (spell.technique === 'perceive' && spell.form === 'mind') {
      memoryCost = Math.ceil(memoryCost * 0.5);
    }

    costs.push({
      type: 'memory',
      amount: memoryCost,
      source: 'echo_memory_drain',
      terminal: true, // Memory reaching zero = complete self-loss
    });

    // =========================================================================
    // Time Cost (Secondary) - Echoes take real time to resonate
    // =========================================================================

    // Time cost equals the spell's cast time - echoes resonate in real time
    const timeCost = spell.castTime;

    costs.push({
      type: 'time',
      amount: timeCost,
      source: 'echo_resonance_time',
      terminal: false, // Running out of time locks casting, not fatal
    });

    return costs;
  }

  initializeResourcePools(
    caster: MagicComponent,
    options?: ResourceInitOptions
  ): void {
    // Memory pool - starts at 80 (some memories already hazy), regen 0.2/tick
    const memoryMax = options?.maxOverrides?.memory ?? 100;
    const memoryCurrent = options?.currentOverrides?.memory ?? 80;
    const memoryRegen = options?.regenOverrides?.memory ?? 0.2;

    caster.resourcePools.memory = {
      type: 'memory',
      current: memoryCurrent,
      maximum: memoryMax,
      regenRate: memoryRegen,
      locked: 0,
    };

    // Time pool - starts full (200), regen 1/tick
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

    // Set paradigm state
    if (!caster.paradigmState) {
      caster.paradigmState = {};
    }
    caster.paradigmState.echo_magic = {
      custom: {
        echoSpellsCast: 0,
        memoriesLost: 0,
      },
    };
  }

  /**
   * Override terminal effects for echo-specific consequences.
   */
  protected override getTerminalEffect(
    costType: MagicCostType,
    trigger: 'zero' | 'max',
    _caster: MagicComponent
  ): TerminalEffect {
    switch (costType) {
      case 'memory':
        // Zero memory = the self is lost, only the echo remains
        return { type: 'madness', madnessType: 'echo_dissolution' };
      default:
        return super.getTerminalEffect(costType, trigger, _caster);
    }
  }
}
