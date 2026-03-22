/**
 * FarmingPersistence.test.ts
 *
 * Verifies that all farming-related components survive serialize → deserialize
 * round-trips with full data fidelity:
 *
 * 1. PlantComponent  - lifecycle, genetics, disease/pest state, private health fields
 * 2. SeedComponent   - genetics, dormancy, hybridization metadata
 * 3. PlantKnowledgeComponent - Map<string, PlantKnowledgeEntry>, Set<string>
 * 4. WildSeedBankComponent   - Map<string, WildSeedBankEntry[]>
 */

import { describe, it, expect } from 'vitest';
import {
  PlantComponent,
  SeedComponent,
  PlantKnowledgeComponent,
  WildSeedBankComponent,
} from '@ai-village/core';
import type {
  PlantGenetics,
  GeneticMutation,
  PlantComponentData,
  SeedComponentData,
} from '@ai-village/core';
import type { PlantDiseaseState, PlantPestState } from '@ai-village/core';
import type { WildSeedBankEntry } from '@ai-village/core';
import type { PlantKnowledgeEntry } from '@ai-village/core';
import { componentSerializerRegistry } from '../serializers/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_GENETICS: PlantGenetics = {
  growthRate: 1.0,
  yieldAmount: 1.0,
  diseaseResistance: 50,
  droughtTolerance: 50,
  coldTolerance: 50,
  flavorProfile: 50,
};

function roundTripPlant(component: PlantComponent): PlantComponent {
  const serialized = componentSerializerRegistry.serialize(component);
  return componentSerializerRegistry.deserialize<PlantComponent>(serialized);
}

function roundTripSeed(component: SeedComponent): SeedComponent {
  const serialized = componentSerializerRegistry.serialize(component);
  return componentSerializerRegistry.deserialize<SeedComponent>(serialized);
}

function roundTripPlantKnowledge(component: PlantKnowledgeComponent): PlantKnowledgeComponent {
  const serialized = componentSerializerRegistry.serialize(component);
  return componentSerializerRegistry.deserialize<PlantKnowledgeComponent>(serialized);
}

function roundTripWildSeedBank(component: WildSeedBankComponent): WildSeedBankComponent {
  const serialized = componentSerializerRegistry.serialize(component);
  return componentSerializerRegistry.deserialize<WildSeedBankComponent>(serialized);
}

// ---------------------------------------------------------------------------
// PlantComponent
// ---------------------------------------------------------------------------

describe('PlantComponent serialization round-trip', () => {
  it('basic round-trip with required fields only', () => {
    const data: PlantComponentData = {
      speciesId: 'wheat',
      position: { x: 10, y: 20 },
    };
    const original = new PlantComponent(data);
    const restored = roundTripPlant(original);

    expect(restored.speciesId).toBe('wheat');
    expect(restored.position).toEqual({ x: 10, y: 20 });
    expect(restored.type).toBe('plant');
    expect(restored.toJSON()).toEqual(original.toJSON());
  });

  it('full round-trip with all optional fields populated', () => {
    const genetics: PlantGenetics = {
      growthRate: 1.8,
      yieldAmount: 1.4,
      diseaseResistance: 72,
      droughtTolerance: 85,
      coldTolerance: 30,
      flavorProfile: 91,
      matureHeight: 4,
      mutations: [],
    };

    const data: PlantComponentData = {
      speciesId: 'apple_tree',
      position: { x: 42, y: 7 },
      stage: 'fruiting',
      stageProgress: 0.65,
      age: 120,
      generation: 3,
      health: 88,
      hydration: 72,
      nutrition: 60,
      genetics,
      flowerCount: 14,
      fruitCount: 6,
      seedsProduced: 24,
      seedsDropped: [{ x: 41, y: 7 }, { x: 43, y: 8 }],
      geneticQuality: 85,
      careQuality: 90,
      environmentMatch: 78,
      visualVariant: 3,
      currentSprite: 'apple_tree_fruiting_3',
      isIndoors: false,
      planted: true,
      harvestDestroysPlant: false,
      harvestResetStage: 'flowering',
      providesShade: true,
      shadeRadius: 3,
      diseases: [],
      pests: [],
    };

    const original = new PlantComponent(data);
    const restored = roundTripPlant(original);

    expect(restored.toJSON()).toEqual(original.toJSON());

    // Spot-check individual fields
    expect(restored.speciesId).toBe('apple_tree');
    expect(restored.position).toEqual({ x: 42, y: 7 });
    expect(restored.stage).toBe('fruiting');
    expect(restored.stageProgress).toBe(0.65);
    expect(restored.age).toBe(120);
    expect(restored.generation).toBe(3);
    expect(restored.health).toBe(88);
    expect(restored.hydration).toBe(72);
    expect(restored.nutrition).toBe(60);
    expect(restored.flowerCount).toBe(14);
    expect(restored.fruitCount).toBe(6);
    expect(restored.seedsProduced).toBe(24);
    expect(restored.seedsDropped).toEqual([{ x: 41, y: 7 }, { x: 43, y: 8 }]);
    expect(restored.geneticQuality).toBe(85);
    expect(restored.careQuality).toBe(90);
    expect(restored.environmentMatch).toBe(78);
    expect(restored.visualVariant).toBe(3);
    expect(restored.currentSprite).toBe('apple_tree_fruiting_3');
    expect(restored.isIndoors).toBe(false);
    expect(restored.planted).toBe(true);
    expect(restored.harvestDestroysPlant).toBe(false);
    expect(restored.harvestResetStage).toBe('flowering');
    expect(restored.providesShade).toBe(true);
    expect(restored.shadeRadius).toBe(3);
  });

  it('genetics with mutations survive round-trip', () => {
    const mutations: GeneticMutation[] = [
      { trait: 'growthRate', delta: 0.15, generation: 2 },
      { trait: 'flavorProfile', delta: -8, generation: 4 },
    ];

    const genetics: PlantGenetics = {
      growthRate: 1.15,
      yieldAmount: 0.9,
      diseaseResistance: 60,
      droughtTolerance: 45,
      coldTolerance: 55,
      flavorProfile: 42,
      mutations,
    };

    const original = new PlantComponent({
      speciesId: 'mutant_tomato',
      position: { x: 5, y: 5 },
      genetics,
    });

    const restored = roundTripPlant(original);

    expect(restored.genetics.growthRate).toBe(1.15);
    expect(restored.genetics.yieldAmount).toBe(0.9);
    expect(restored.genetics.mutations).toHaveLength(2);
    expect(restored.genetics.mutations![0]).toEqual({ trait: 'growthRate', delta: 0.15, generation: 2 });
    expect(restored.genetics.mutations![1]).toEqual({ trait: 'flavorProfile', delta: -8, generation: 4 });
  });

  it('disease and pest state survive round-trip', () => {
    const diseases: PlantDiseaseState[] = [
      {
        diseaseId: 'powdery_mildew_01',
        infectionDay: 42,
        severity: 'moderate',
        incubating: false,
        daysActive: 7,
        spreading: true,
        treated: false,
      },
      {
        diseaseId: 'rust_02',
        infectionDay: 55,
        severity: 'mild',
        incubating: true,
        daysActive: 1,
        spreading: false,
        treated: true,
        treatmentDay: 56,
      },
    ];

    const pests: PlantPestState[] = [
      {
        pestId: 'aphids_common',
        population: 150,
        arrivalDay: 38,
        daysPresent: 12,
        controlled: false,
      },
      {
        pestId: 'spider_mites',
        population: 40,
        arrivalDay: 50,
        daysPresent: 5,
        controlled: true,
        controlMethod: 'neem_oil',
      },
    ];

    const original = new PlantComponent({
      speciesId: 'sick_rose',
      position: { x: 1, y: 1 },
      diseases,
      pests,
    });

    const restored = roundTripPlant(original);

    expect(restored.diseases).toHaveLength(2);
    expect(restored.diseases[0]).toEqual(diseases[0]);
    expect(restored.diseases[1]).toEqual(diseases[1]);

    expect(restored.pests).toHaveLength(2);
    expect(restored.pests[0]).toEqual(pests[0]);
    expect(restored.pests[1]).toEqual(pests[1]);
  });
});

// ---------------------------------------------------------------------------
// SeedComponent
// ---------------------------------------------------------------------------

describe('SeedComponent serialization round-trip', () => {
  it('basic round-trip with required fields only', () => {
    const original = new SeedComponent({
      speciesId: 'carrot',
      genetics: { ...BASE_GENETICS },
      viability: 0.85,
    });

    const restored = roundTripSeed(original);

    expect(restored.speciesId).toBe('carrot');
    expect(restored.viability).toBe(0.85);
    expect(restored.type).toBe('seed');
    expect(restored.genetics).toEqual(original.genetics);
  });

  it('full round-trip with all optional fields populated', () => {
    const data: SeedComponentData = {
      speciesId: 'heirloom_tomato',
      genetics: {
        growthRate: 1.3,
        yieldAmount: 1.6,
        diseaseResistance: 80,
        droughtTolerance: 60,
        coldTolerance: 25,
        flavorProfile: 95,
      },
      viability: 0.92,
      vigor: 1.2,
      quality: 0.88,
      generation: 5,
      parentPlantIds: ['plant_abc123', 'plant_def456'],
      ageInDays: 14,
      dormant: false,
      dormancyRequirements: {
        requiresColdStratification: true,
        coldDaysRequired: 30,
        requiresLight: false,
        requiresScarification: false,
      },
      sourceType: 'cultivated',
      harvestMetadata: {
        fromPlantId: 'plant_abc123',
        byAgentId: 'agent_xyz789',
        timestamp: 99000,
      },
      isHybrid: false,
    };

    const original = new SeedComponent(data);
    const restored = roundTripSeed(original);

    // SeedComponent generates a fresh random `id` on construction, so the
    // deserialized instance will have a different id than the original.
    // Compare all meaningful fields individually instead of toJSON() equality.
    expect(restored.speciesId).toBe('heirloom_tomato');
    expect(restored.viability).toBe(0.92);
    expect(restored.vigor).toBe(1.2);
    expect(restored.quality).toBe(0.88);
    expect(restored.generation).toBe(5);
    expect(restored.parentPlantIds).toEqual(['plant_abc123', 'plant_def456']);
    expect(restored.ageInDays).toBe(14);
    expect(restored.dormant).toBe(false);
    expect(restored.dormancyRequirements).toEqual(data.dormancyRequirements);
    expect(restored.sourceType).toBe('cultivated');
    expect(restored.harvestMetadata).toEqual(data.harvestMetadata);
    expect(restored.isHybrid).toBe(false);
  });

  it('genetics with mutations survive round-trip', () => {
    const mutations: GeneticMutation[] = [
      { trait: 'droughtTolerance', delta: 20, generation: 3 },
    ];

    const genetics: PlantGenetics = {
      ...BASE_GENETICS,
      droughtTolerance: 70,
      mutations,
    };

    const original = new SeedComponent({
      speciesId: 'desert_wheat',
      genetics,
      viability: 0.75,
    });

    const restored = roundTripSeed(original);

    expect(restored.genetics.droughtTolerance).toBe(70);
    expect(restored.genetics.mutations).toHaveLength(1);
    expect(restored.genetics.mutations![0]).toEqual({ trait: 'droughtTolerance', delta: 20, generation: 3 });
  });

  it('hybrid seed fields survive round-trip', () => {
    const original = new SeedComponent({
      speciesId: 'hybrid_melon',
      genetics: { ...BASE_GENETICS, growthRate: 1.5, yieldAmount: 1.5 },
      viability: 0.7,
      isHybrid: true,
      hybridParentSpecies: ['watermelon', 'cantaloupe'],
    });

    const restored = roundTripSeed(original);

    expect(restored.isHybrid).toBe(true);
    expect(restored.hybridParentSpecies).toEqual(['watermelon', 'cantaloupe']);
  });
});

// ---------------------------------------------------------------------------
// PlantKnowledgeComponent
// ---------------------------------------------------------------------------

describe('PlantKnowledgeComponent serialization round-trip', () => {
  it('basic round-trip with empty knowledge', () => {
    const original = new PlantKnowledgeComponent({});
    const restored = roundTripPlantKnowledge(original);

    expect(restored.type).toBe('plant_knowledge');
    expect(restored.herbalistSkill).toBe(original.herbalistSkill);
    expect(restored.getAllKnowledge().size).toBe(0);
    expect(Array.from(restored.toJSON().encounteredPlants ?? [])).toHaveLength(0);
  });

  it('full round-trip with knowledge entries and encountered plants', () => {
    const entry: PlantKnowledgeEntry = {
      plantId: 'elderflower',
      knowsEdible: true,
      knowsToxic: false,
      medicinal: {
        knownTreats: ['fever', 'cold'],
        estimatedEffectiveness: 0.7,
        knownPreparations: ['tea', 'tincture'],
        knownSideEffects: [],
        knowsToxicity: false,
      },
      magical: 'unknown',
      crafting: {
        knownDyeColor: 'pale_yellow',
        knowsOil: true,
      },
      discoveryMethod: 'experimentation',
      discoveredAt: 1500,
      confidence: 'confident',
      usageCount: 4,
    };

    const original = new PlantKnowledgeComponent({
      knowledge: { elderflower: entry },
      encounteredPlants: ['nettle', 'dandelion'],
      herbalistSkill: 42,
    });

    const restored = roundTripPlantKnowledge(original);

    // Map field
    const knowledgeMap = restored.getAllKnowledge();
    expect(knowledgeMap.size).toBe(1);
    expect(knowledgeMap.has('elderflower')).toBe(true);

    const restoredEntry = knowledgeMap.get('elderflower')!;
    expect(restoredEntry.knowsEdible).toBe(true);
    expect(restoredEntry.knowsToxic).toBe(false);
    expect(restoredEntry.medicinal).toEqual(entry.medicinal);
    expect(restoredEntry.magical).toBe('unknown');
    expect(restoredEntry.crafting).toEqual(entry.crafting);
    expect(restoredEntry.discoveryMethod).toBe('experimentation');
    expect(restoredEntry.discoveredAt).toBe(1500);
    expect(restoredEntry.confidence).toBe('confident');
    expect(restoredEntry.usageCount).toBe(4);

    // Set field (stored as array in JSON, reconstructed as Set)
    expect(restored.hasEncountered('nettle')).toBe(true);
    expect(restored.hasEncountered('dandelion')).toBe(true);
    expect(restored.hasEncountered('unknown_plant')).toBe(false);

    // Scalar field
    expect(restored.herbalistSkill).toBe(42);
  });

  it('Map and Set fields survive round-trip with multiple entries', () => {
    const knowledgeRecord: Record<string, PlantKnowledgeEntry> = {
      nettle: {
        plantId: 'nettle',
        knowsEdible: true,
        knowsToxic: false,
        medicinal: { knownTreats: ['arthritis'], estimatedEffectiveness: 0.5 },
        magical: 'unknown',
        crafting: { knowsFiber: true },
        discoveryMethod: 'taught',
        discoveredAt: 200,
        taughtBy: 'agent_elder_01',
        confidence: 'likely',
        usageCount: 1,
      },
      nightshade: {
        plantId: 'nightshade',
        knowsEdible: false,
        knowsToxic: true,
        medicinal: 'unknown',
        magical: { knownMagicType: 'shadow', estimatedPotency: 0.8 },
        crafting: { knowsPoison: true },
        discoveryMethod: 'accident',
        discoveredAt: 750,
        confidence: 'certain',
        usageCount: 0,
        misconceptions: ['edible_when_ripe'],
      },
      chamomile: {
        plantId: 'chamomile',
        knowsEdible: true,
        knowsToxic: false,
        medicinal: { knownTreats: ['insomnia', 'anxiety'], estimatedEffectiveness: 0.65 },
        magical: 'unknown',
        crafting: { knownDyeColor: 'golden_yellow' },
        discoveryMethod: 'innate',
        discoveredAt: 0,
        confidence: 'certain',
        usageCount: 12,
      },
    };

    const original = new PlantKnowledgeComponent({
      knowledge: knowledgeRecord,
      encounteredPlants: ['yarrow', 'comfrey', 'valerian'],
      herbalistSkill: 78,
    });

    const restored = roundTripPlantKnowledge(original);

    const map = restored.getAllKnowledge();
    expect(map.size).toBe(3);
    expect(map.has('nettle')).toBe(true);
    expect(map.has('nightshade')).toBe(true);
    expect(map.has('chamomile')).toBe(true);

    // Verify misconceptions field
    expect(map.get('nightshade')!.misconceptions).toEqual(['edible_when_ripe']);

    // Verify encountered set
    expect(restored.hasEncountered('yarrow')).toBe(true);
    expect(restored.hasEncountered('comfrey')).toBe(true);
    expect(restored.hasEncountered('valerian')).toBe(true);

    expect(restored.herbalistSkill).toBe(78);
  });
});

// ---------------------------------------------------------------------------
// WildSeedBankComponent
// ---------------------------------------------------------------------------

describe('WildSeedBankComponent serialization round-trip', () => {
  it('basic round-trip with empty banks', () => {
    const original = new WildSeedBankComponent();
    const restored = roundTripWildSeedBank(original);

    expect(restored.type).toBe('wild_seed_bank');
    expect(restored.banks.size).toBe(0);
  });

  it('full round-trip with populated chunk banks', () => {
    const entry1: WildSeedBankEntry = {
      speciesId: 'wild_grass',
      position: { x: 10, y: 20 },
      viability: 0.9,
      ageInDays: 5,
      dormant: false,
    };

    const entry2: WildSeedBankEntry = {
      speciesId: 'thistle',
      position: { x: 11, y: 21 },
      viability: 0.6,
      ageInDays: 30,
      dormant: true,
    };

    const entry3: WildSeedBankEntry = {
      speciesId: 'clover',
      position: { x: 50, y: 50 },
      viability: 0.95,
      ageInDays: 2,
      dormant: false,
    };

    const banks = new Map<string, WildSeedBankEntry[]>([
      ['0,0', [entry1, entry2]],
      ['1,0', [entry3]],
    ]);

    const original = new WildSeedBankComponent(banks);
    const restored = roundTripWildSeedBank(original);

    expect(restored.banks.size).toBe(2);
    expect(restored.banks.has('0,0')).toBe(true);
    expect(restored.banks.has('1,0')).toBe(true);

    const chunk00 = restored.banks.get('0,0')!;
    expect(chunk00).toHaveLength(2);
    expect(chunk00[0]).toEqual(entry1);
    expect(chunk00[1]).toEqual(entry2);

    const chunk10 = restored.banks.get('1,0')!;
    expect(chunk10).toHaveLength(1);
    expect(chunk10[0]).toEqual(entry3);
  });

  it('Map field survives round-trip with multiple chunks', () => {
    const makeEntry = (speciesId: string, x: number, y: number): WildSeedBankEntry => ({
      speciesId,
      position: { x, y },
      viability: 0.8,
      ageInDays: 10,
      dormant: false,
    });

    const banks = new Map<string, WildSeedBankEntry[]>();
    for (let cx = 0; cx < 4; cx++) {
      const key = `${cx},0`;
      banks.set(key, [
        makeEntry(`species_${cx}_a`, cx * 16, 0),
        makeEntry(`species_${cx}_b`, cx * 16 + 8, 4),
      ]);
    }

    const original = new WildSeedBankComponent(banks);
    const restored = roundTripWildSeedBank(original);

    expect(restored.banks.size).toBe(4);

    for (let cx = 0; cx < 4; cx++) {
      const key = `${cx},0`;
      const entries = restored.banks.get(key)!;
      expect(entries).toHaveLength(2);
      expect(entries[0]!.speciesId).toBe(`species_${cx}_a`);
      expect(entries[1]!.speciesId).toBe(`species_${cx}_b`);
    }
  });
});
