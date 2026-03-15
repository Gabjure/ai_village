/**
 * Tests for creative paradigm cost calculators, SkillGates, and MagicSourceRegistry
 *
 * Covers: VoidCostCalculator, BeliefCostCalculator, CommerceCostCalculator,
 * ParadoxCostCalculator, ThresholdCostCalculator, LuckCostCalculator,
 * SkillGates, MagicSourceRegistry, and registration verification.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type { ComposedSpell } from '../../components/MagicComponent.js';
import type { MagicComponent } from '../../components/MagicComponent.js';
import type { CastingContext } from '../costs/CostCalculator.js';
import { costCalculatorRegistry } from '../costs/CostCalculatorRegistry.js';
import {
  registerAllCostCalculators,
  verifyCreativeParadigmsRegistered,
} from '../costs/calculators/registerAll.js';
import {
  isTechniqueUnlocked,
  isFormUnlocked,
  getUnlockedTechniques,
} from '../SkillGates.js';
import {
  getMagicSource,
  isMagicSourceAccessible,
  MagicSourceRegistry,
} from '../MagicSourceRegistry.js';

// ============================================================================
// Test setup
// ============================================================================

beforeAll(() => {
  registerAllCostCalculators();
});

/** Create a minimal MagicComponent suitable for testing */
function makeCaster(poolOverrides: Record<string, Record<string, unknown>> = {}): MagicComponent {
  return {
    resourcePools: poolOverrides,
    paradigmState: {},
    knownSpells: [],
    manaPools: [],
  } as unknown as MagicComponent;
}

/** Default casting context */
function makeContext(overrides: Partial<CastingContext> = {}): CastingContext {
  return {
    tick: 1000,
    timeOfDay: 0.5,
    ambientPower: 0,
    isGroupCast: false,
    casterCount: 1,
    ...overrides,
  };
}

// ============================================================================
// 1. Registration tests
// ============================================================================

describe('Registration - creative paradigms', () => {
  it('verifyCreativeParadigmsRegistered returns true after registerAllCostCalculators', () => {
    expect(verifyCreativeParadigmsRegistered()).toBe(true);
  });

  const creativeParadigmIds = [
    'void',
    'belief_magic',
    'commerce_magic',
    'debt_magic',
    'bureaucratic_magic',
    'game_magic',
    'luck_magic',
    'echo_magic',
    'paradox_magic',
    'threshold_magic',
  ];

  for (const id of creativeParadigmIds) {
    it(`paradigm '${id}' is registered`, () => {
      expect(costCalculatorRegistry.has(id)).toBe(true);
    });
  }
});

// ============================================================================
// 2. VoidCostCalculator tests
// ============================================================================

describe('VoidCostCalculator', () => {
  let voidCalc: any;
  let caster: MagicComponent;
  let context: CastingContext;
  let spell: ComposedSpell;

  beforeEach(() => {
    voidCalc = costCalculatorRegistry.get('void');

    caster = makeCaster();
    voidCalc.initializeResourcePools(caster);

    context = makeContext();

    spell = {
      id: 'test',
      name: 'Void Bolt',
      technique: 'destroy',
      form: 'void',
      source: 'void',
      manaCost: 20,
      castTime: 1,
      range: 5,
      effectId: 'void_bolt',
    };
  });

  it('calculates health cost = Math.ceil(Math.ceil(20 * 0.75) * 0.85) for destroy+void spell', () => {
    // Both technique === 'destroy' and form === 'void' match synergy, but the
    // code applies the 0.85 factor once (first branch hit)
    const base = Math.ceil(20 * 0.75); // 15
    const expected = Math.ceil(base * 0.85); // Math.ceil(12.75) = 13
    const costs = voidCalc.calculateCosts(spell, caster, context);
    const healthCost = costs.find((c: Record<string, unknown>) => c.type === 'health');
    expect(healthCost).toBeDefined();
    expect(healthCost.amount).toBe(expected);
  });

  it('calculates corruption cost = BASE(5) + 2 for destroy technique with manaCost 20', () => {
    // manaCost 20 <= 40, so no extra corruption from power; destroy adds 2
    const costs = voidCalc.calculateCosts(spell, caster, context);
    const corruptionCost = costs.find((c: Record<string, unknown>) => c.type === 'corruption');
    expect(corruptionCost).toBeDefined();
    expect(corruptionCost.amount).toBe(7); // 5 base + 2 for destroy
  });

  it('health cost is reduced to base*0.75 only (no synergy) for non-destroy, non-void spell', () => {
    const neutralSpell: ComposedSpell = {
      ...spell,
      technique: 'create',
      form: 'fire',
      manaCost: 20,
    };
    const costs = voidCalc.calculateCosts(neutralSpell, caster, context);
    const healthCost = costs.find((c: Record<string, unknown>) => c.type === 'health');
    expect(healthCost.amount).toBe(Math.ceil(20 * 0.75)); // 15, no synergy reduction
  });

  it('canAfford returns false when health pool current is at the minimum threshold (10% of max)', () => {
    // initializeResourcePools sets maximum = 100; threshold = 10
    caster.resourcePools.health.current = 10; // exactly at min (current <= minRequired)
    const costs = voidCalc.calculateCosts(spell, caster, context);
    const affordability = voidCalc.canAfford(costs, caster);
    expect(affordability.canAfford).toBe(false);
  });

  it('canAfford returns true when health is well above threshold', () => {
    caster.resourcePools.health.current = 100;
    const costs = voidCalc.calculateCosts(spell, caster, context);
    const affordability = voidCalc.canAfford(costs, caster);
    expect(affordability.canAfford).toBe(true);
  });

  it('group casting divides health cost by caster count', () => {
    const groupContext = makeContext({ isGroupCast: true, casterCount: 2 });
    const costs = voidCalc.calculateCosts(spell, caster, groupContext);
    const healthCost = costs.find((c: Record<string, unknown>) => c.type === 'health');
    // After group split (÷2) then synergy (×0.85)
    const afterGroup = Math.ceil(Math.ceil(20 * 0.75) / 2); // Math.ceil(7.5) = 8
    const expected = Math.ceil(afterGroup * 0.85); // Math.ceil(6.8) = 7
    expect(healthCost.amount).toBe(expected);
  });
});

// ============================================================================
// 3. BeliefCostCalculator tests
// ============================================================================

describe('BeliefCostCalculator', () => {
  let beliefCalc: any;
  let caster: MagicComponent;
  let context: CastingContext;
  let spell: ComposedSpell;

  beforeEach(() => {
    beliefCalc = costCalculatorRegistry.get('belief_magic');

    caster = makeCaster();
    beliefCalc.initializeResourcePools(caster);

    context = makeContext();

    spell = {
      id: 'test',
      name: 'Faith Pulse',
      technique: 'create',
      form: 'fire',
      source: 'arcane',
      manaCost: 20,
      castTime: 1,
      range: 10,
      effectId: 'faith_pulse',
    };
  });

  it('calculates belief cost = Math.ceil(20 * 0.5) = 10 for manaCost 20', () => {
    const costs = beliefCalc.calculateCosts(spell, caster, context);
    const beliefCost = costs.find((c: Record<string, unknown>) => c.type === 'belief');
    expect(beliefCost).toBeDefined();
    expect(beliefCost.amount).toBe(10);
  });

  it('group casting (casterCount=2) halves the belief cost to 5', () => {
    const groupContext = makeContext({ isGroupCast: true, casterCount: 2 });
    const costs = beliefCalc.calculateCosts(spell, caster, groupContext);
    const beliefCost = costs.find((c: Record<string, unknown>) => c.type === 'belief');
    expect(beliefCost.amount).toBe(5);
  });

  it('canAfford returns false when belief pool current = 0', () => {
    caster.resourcePools.belief.current = 0;
    const costs = beliefCalc.calculateCosts(spell, caster, context);
    const affordability = beliefCalc.canAfford(costs, caster);
    expect(affordability.canAfford).toBe(false);
  });

  it('canAfford returns true when belief pool is sufficiently full', () => {
    caster.resourcePools.belief.current = 100; // initializeResourcePools sets it to 100
    const costs = beliefCalc.calculateCosts(spell, caster, context);
    const affordability = beliefCalc.canAfford(costs, caster);
    expect(affordability.canAfford).toBe(true);
  });

  it('always accumulates attention cost on each cast', () => {
    const costs = beliefCalc.calculateCosts(spell, caster, context);
    const attentionCost = costs.find((c: Record<string, unknown>) => c.type === 'attention');
    expect(attentionCost).toBeDefined();
    expect(attentionCost.amount).toBeGreaterThan(0);
  });
});

// ============================================================================
// 4. CommerceCostCalculator tests
// ============================================================================

describe('CommerceCostCalculator', () => {
  let commerceCalc: any;
  let caster: MagicComponent;
  let context: CastingContext;

  beforeEach(() => {
    commerceCalc = costCalculatorRegistry.get('commerce_magic');
    caster = makeCaster();
    commerceCalc.initializeResourcePools(caster);
    context = makeContext();
  });

  it('calculates gold cost = 40 for manaCost 20 (below premium threshold)', () => {
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Trade Wind',
      technique: 'create',
      form: 'air',
      source: 'arcane',
      manaCost: 20,
      castTime: 1,
      range: 10,
      effectId: 'test',
    };
    const costs = commerceCalc.calculateCosts(spell, caster, context);
    const goldCost = costs.find((c: Record<string, unknown>) => c.type === 'gold');
    expect(goldCost).toBeDefined();
    expect(goldCost.amount).toBe(40); // 20 * 2
  });

  it('calculates gold cost = 150 for manaCost 50 (above premium threshold of 40)', () => {
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Market Surge',
      technique: 'enhance',
      form: 'mind',
      source: 'arcane',
      manaCost: 50,
      castTime: 5,
      range: 20,
      effectId: 'test',
    };
    const costs = commerceCalc.calculateCosts(spell, caster, context);
    const goldCost = costs.find((c: Record<string, unknown>) => c.type === 'gold');
    expect(goldCost).toBeDefined();
    expect(goldCost.amount).toBe(Math.ceil(50 * 2 * 1.5)); // 150
  });

  it('oath cost is always exactly 1 per cast', () => {
    const spells: ComposedSpell[] = [
      { id: 'a', name: 'Cheap', technique: 'perceive', form: 'fire', source: 'arcane', manaCost: 5, castTime: 1, range: 5, effectId: 'a' },
      { id: 'b', name: 'Expensive', technique: 'destroy', form: 'void', source: 'void', manaCost: 100, castTime: 10, range: 30, effectId: 'b' },
    ];
    for (const spell of spells) {
      const costs = commerceCalc.calculateCosts(spell, caster, context);
      const oathCost = costs.find((c: Record<string, unknown>) => c.type === 'oath');
      expect(oathCost).toBeDefined();
      expect(oathCost.amount).toBe(1);
    }
  });
});

// ============================================================================
// 5. ParadoxCostCalculator tests
// ============================================================================

describe('ParadoxCostCalculator', () => {
  let paradoxCalc: any;
  let caster: MagicComponent;
  let context: CastingContext;

  beforeEach(() => {
    paradoxCalc = costCalculatorRegistry.get('paradox_magic');
    caster = makeCaster();
    paradoxCalc.initializeResourcePools(caster);
    context = makeContext();
  });

  it('calculates sanity cost = Math.ceil(20 * 0.8) = 16 for a basic spell', () => {
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Paradox Flicker',
      technique: 'create',
      form: 'fire',
      source: 'arcane',
      manaCost: 20,
      castTime: 1,
      range: 10,
      effectId: 'test',
    };
    const costs = paradoxCalc.calculateCosts(spell, caster, context);
    const sanityCost = costs.find((c: Record<string, unknown>) => c.type === 'sanity');
    expect(sanityCost).toBeDefined();
    expect(sanityCost.amount).toBe(Math.ceil(20 * 0.8)); // 16
  });

  it('transform technique adds 50% to sanity cost', () => {
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Paradox Transform',
      technique: 'transform',
      form: 'fire',
      source: 'arcane',
      manaCost: 20,
      castTime: 3,
      range: 10,
      effectId: 'test',
    };
    const costs = paradoxCalc.calculateCosts(spell, caster, context);
    const sanityCost = costs.find((c: Record<string, unknown>) => c.type === 'sanity');
    const expected = Math.ceil(Math.ceil(20 * 0.8) * 1.5); // Math.ceil(24) = 24
    expect(sanityCost.amount).toBe(expected);
  });

  it('canAfford blocks casting when sanity pool current = 15 (below MIN_SANITY_TO_CAST = 20)', () => {
    caster.resourcePools.sanity.current = 15;
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Test',
      technique: 'create',
      form: 'fire',
      source: 'arcane',
      manaCost: 20,
      castTime: 1,
      range: 10,
      effectId: 'test',
    };
    const costs = paradoxCalc.calculateCosts(spell, caster, context);
    const affordability = paradoxCalc.canAfford(costs, caster);
    expect(affordability.canAfford).toBe(false);
  });

  it('canAfford returns true when sanity is well above threshold', () => {
    caster.resourcePools.sanity.current = 100;
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Test',
      technique: 'create',
      form: 'fire',
      source: 'arcane',
      manaCost: 10,
      castTime: 1,
      range: 10,
      effectId: 'test',
    };
    const costs = paradoxCalc.calculateCosts(spell, caster, context);
    const affordability = paradoxCalc.canAfford(costs, caster);
    expect(affordability.canAfford).toBe(true);
  });
});

// ============================================================================
// 6. ThresholdCostCalculator tests
// ============================================================================

describe('ThresholdCostCalculator', () => {
  let thresholdCalc: any;
  let caster: MagicComponent;

  beforeEach(() => {
    thresholdCalc = costCalculatorRegistry.get('threshold_magic');
    caster = makeCaster();
    thresholdCalc.initializeResourcePools(caster);
  });

  it('base mana cost equals spell.manaCost with no ambient power or bonuses', () => {
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Ward Door',
      technique: 'control',
      form: 'earth',
      source: 'arcane',
      manaCost: 30,
      castTime: 2,
      range: 5,
      effectId: 'test',
    };
    const context = makeContext({ ambientPower: 0, timeOfDay: 0.5 });
    const costs = thresholdCalc.calculateCosts(spell, caster, context);
    const manaCost = costs.find((c: Record<string, unknown>) => c.type === 'mana');
    expect(manaCost).toBeDefined();
    expect(manaCost.amount).toBe(30);
  });

  it('ambient power 0.8 reduces mana cost by ~30% (within max 50% reduction window)', () => {
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Boundary Ward',
      technique: 'control',
      form: 'earth',
      source: 'arcane',
      manaCost: 20,
      castTime: 2,
      range: 5,
      effectId: 'test',
    };
    // ambientPower = 0.8: excessPower = 0.3, ambientReduction = min(0.5, 0.3*0.5*2) = min(0.5, 0.3) = 0.3
    // cost = 20 * (1-0.3) = 14
    const context = makeContext({ ambientPower: 0.8, timeOfDay: 0.5 });
    const costs = thresholdCalc.calculateCosts(spell, caster, context);
    const manaCost = costs.find((c: Record<string, unknown>) => c.type === 'mana');
    expect(manaCost.amount).toBe(Math.ceil(20 * (1 - 0.3))); // 14
  });

  it('ambient power 1.0 gives maximum 50% reduction', () => {
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Threshold Touch',
      technique: 'perceive',
      form: 'earth',
      source: 'arcane',
      manaCost: 20,
      castTime: 1,
      range: 5,
      effectId: 'test',
    };
    // ambientPower = 1.0: excessPower = 0.5, ambientReduction = min(0.5, 0.5*0.5*2)=min(0.5,0.5)=0.5
    // then perceive: 0.5 * (1-0.3) = 0.35 factor? No: 20*(1-0.5)*(1-0.3) = 20*0.5*0.7 = 7
    const contextNoDawn = makeContext({ ambientPower: 1.0, timeOfDay: 0.5 }); // not dawn/dusk
    const costs = thresholdCalc.calculateCosts(spell, caster, contextNoDawn);
    const manaCost = costs.find((c: Record<string, unknown>) => c.type === 'mana');
    // perceive + ambient=1.0: cost = Math.ceil(20 * 0.5 * 0.7) = Math.ceil(7) = 7
    expect(manaCost.amount).toBe(7);
  });

  it('perceive technique gets 30% reduction on top of base cost', () => {
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Sense Threshold',
      technique: 'perceive',
      form: 'fire',
      source: 'arcane',
      manaCost: 20,
      castTime: 1,
      range: 10,
      effectId: 'test',
    };
    // No ambient, no dawn: 20 * (1-0.3) = 14
    const context = makeContext({ ambientPower: 0, timeOfDay: 0.5 });
    const costs = thresholdCalc.calculateCosts(spell, caster, context);
    const manaCost = costs.find((c: Record<string, unknown>) => c.type === 'mana');
    expect(manaCost.amount).toBe(Math.ceil(20 * 0.7)); // 14
  });

  it('dawn (timeOfDay=0.25) gives 25% additional reduction', () => {
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Dawn Ward',
      technique: 'control',
      form: 'fire',
      source: 'arcane',
      manaCost: 20,
      castTime: 2,
      range: 5,
      effectId: 'test',
    };
    // ambientPower=0 (no ambient), dawn: 20 * (1-0.25) = 15
    const context = makeContext({ ambientPower: 0, timeOfDay: 0.25 });
    const costs = thresholdCalc.calculateCosts(spell, caster, context);
    const manaCost = costs.find((c: Record<string, unknown>) => c.type === 'mana');
    expect(manaCost.amount).toBe(Math.ceil(20 * 0.75)); // 15
  });
});

// ============================================================================
// 7. LuckCostCalculator tests
// ============================================================================

describe('LuckCostCalculator', () => {
  let luckCalc: any;
  let caster: MagicComponent;
  let context: CastingContext;

  beforeEach(() => {
    luckCalc = costCalculatorRegistry.get('luck_magic');
    caster = makeCaster();
    luckCalc.initializeResourcePools(caster);
    context = makeContext();
  });

  it('enhance technique halves the luck cost compared to a neutral technique', () => {
    // Use 'control' (neutral technique — no luck reduction) as the baseline
    const baseSpell: ComposedSpell = {
      id: 'base',
      name: 'Basic Luck',
      technique: 'control',
      form: 'fire',
      source: 'arcane',
      manaCost: 20,
      castTime: 1,
      range: 5,
      effectId: 'base',
    };
    const enhanceSpell: ComposedSpell = {
      ...baseSpell,
      id: 'enhance',
      name: 'Fortune Boost',
      technique: 'enhance',
    };

    const baseCosts = luckCalc.calculateCosts(baseSpell, caster, context);
    const baseLuck = baseCosts.find((c: Record<string, unknown>) => c.type === 'luck');
    // base luck = Math.ceil(20 * 0.6) = 12

    const enhanceCosts = luckCalc.calculateCosts(enhanceSpell, caster, context);
    const enhanceLuck = enhanceCosts.find((c: Record<string, unknown>) => c.type === 'luck');
    // enhance luck = Math.ceil(12 * 0.5) = 6

    expect(enhanceLuck.amount).toBeLessThan(baseLuck.amount);
    expect(enhanceLuck.amount).toBe(Math.ceil(Math.ceil(20 * 0.6) * 0.5)); // 6
    expect(baseLuck.amount).toBe(Math.ceil(20 * 0.6)); // 12
  });

  it('destroy technique doubles the karma cost', () => {
    const createSpell: ComposedSpell = {
      id: 'create',
      name: 'Create Luck',
      technique: 'create',
      form: 'fire',
      source: 'arcane',
      manaCost: 20,
      castTime: 1,
      range: 5,
      effectId: 'create',
    };
    const destroySpell: ComposedSpell = {
      ...createSpell,
      id: 'destroy',
      name: 'Destroy Fortune',
      technique: 'destroy',
    };

    const createCosts = luckCalc.calculateCosts(createSpell, caster, context);
    const createKarma = createCosts.find((c: Record<string, unknown>) => c.type === 'karma');
    // base karma = Math.ceil(20 * 0.2) = 4

    const destroyCosts = luckCalc.calculateCosts(destroySpell, caster, context);
    const destroyKarma = destroyCosts.find((c: Record<string, unknown>) => c.type === 'karma');
    // destroy karma = Math.ceil(4 * 2) = 8

    expect(destroyKarma.amount).toBe(createKarma.amount * 2);
    expect(destroyKarma.amount).toBe(Math.ceil(Math.ceil(20 * 0.2) * 2)); // 8
  });

  it('emits a warning when karma pool is at 0', () => {
    caster.resourcePools.karma.current = 0;
    const spell: ComposedSpell = {
      id: 'test',
      name: 'Test',
      technique: 'create',
      form: 'fire',
      source: 'arcane',
      manaCost: 10,
      castTime: 1,
      range: 5,
      effectId: 'test',
    };
    const costs = luckCalc.calculateCosts(spell, caster, context);
    const result = luckCalc.canAfford(costs, caster);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain('knife');
  });
});

// ============================================================================
// 8. SkillGates tests
// ============================================================================

describe('SkillGates', () => {
  it('skill 0: create and perceive are unlocked', () => {
    expect(isTechniqueUnlocked('create', 0)).toBe(true);
    expect(isTechniqueUnlocked('perceive', 0)).toBe(true);
  });

  it('skill 0: destroy and protect are locked', () => {
    expect(isTechniqueUnlocked('destroy', 0)).toBe(false);
    expect(isTechniqueUnlocked('protect', 0)).toBe(false);
  });

  it('skill 4: destroy and protect are unlocked', () => {
    expect(isTechniqueUnlocked('destroy', 4)).toBe(true);
    expect(isTechniqueUnlocked('protect', 4)).toBe(true);
  });

  it('skill 5: all 8 techniques are unlocked', () => {
    const allTechniques = getUnlockedTechniques(5);
    expect(allTechniques).toContain('create');
    expect(allTechniques).toContain('perceive');
    expect(allTechniques).toContain('control');
    expect(allTechniques).toContain('transform');
    expect(allTechniques).toContain('destroy');
    expect(allTechniques).toContain('protect');
    expect(allTechniques).toContain('enhance');
    expect(allTechniques).toContain('summon');
    expect(allTechniques).toHaveLength(8);
  });

  it('skill 0: basic elemental forms (fire, water, air, earth) are unlocked', () => {
    expect(isFormUnlocked('fire', 0)).toBe(true);
    expect(isFormUnlocked('water', 0)).toBe(true);
    expect(isFormUnlocked('air', 0)).toBe(true);
    expect(isFormUnlocked('earth', 0)).toBe(true);
  });

  it('skill 0: void form is locked', () => {
    expect(isFormUnlocked('void', 0)).toBe(false);
  });

  it('skill 4: void form is unlocked', () => {
    expect(isFormUnlocked('void', 4)).toBe(true);
  });
});

// ============================================================================
// 9. MagicSourceRegistry tests
// ============================================================================

describe('MagicSourceRegistry', () => {
  beforeEach(() => {
    // Reset singleton so defaults are fresh
    MagicSourceRegistry.resetInstance();
  });

  it('arcane source has primaryCostType mana and freeAccess=true', () => {
    const arcane = getMagicSource('arcane');
    expect(arcane.primaryCostType).toBe('mana');
    expect(arcane.requirements.freeAccess).toBe(true);
  });

  it('void source has primaryCostType health and corruptionChance=0.1', () => {
    const void_ = getMagicSource('void');
    expect(void_.primaryCostType).toBe('health');
    expect(void_.corruptionChance).toBe(0.1);
  });

  it('divine source requires deity', () => {
    const divine = getMagicSource('divine');
    expect(divine.requirements.requiresDeity).toBe(true);
    expect(divine.requirements.freeAccess).toBe(false);
  });

  it('isMagicSourceAccessible("divine", false, 0) returns false (no deity)', () => {
    expect(isMagicSourceAccessible('divine', false, 0)).toBe(false);
  });

  it('isMagicSourceAccessible("divine", true, 0) returns true (has deity)', () => {
    expect(isMagicSourceAccessible('divine', true, 0)).toBe(true);
  });

  it('isMagicSourceAccessible("arcane", false, 0) returns true (free access)', () => {
    expect(isMagicSourceAccessible('arcane', false, 0)).toBe(true);
  });
});
