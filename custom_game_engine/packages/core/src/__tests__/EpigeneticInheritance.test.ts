import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../ecs/index.js';
import type { EntityImpl } from '../ecs/Entity.js';
import { EventBusImpl } from '../events/EventBus.js';
import { ReproductionSystem } from '../systems/ReproductionSystem.js';
import { BiochemistryComponent } from '../components/BiochemistryComponent.js';
import { SpeciesComponent } from '../components/SpeciesComponent.js';
import { GeneticComponent } from '../components/GeneticComponent.js';
import { ComponentType as CT } from '../types/ComponentType.js';

describe('Epigenetic Inheritance', () => {
  let world: World;
  let reproSystem: ReproductionSystem;
  let eventBus: EventBusImpl;

  beforeEach(async () => {
    eventBus = new EventBusImpl();
    world = new World(eventBus);
    reproSystem = new ReproductionSystem();
    await reproSystem.initialize(world, eventBus);
  });

  function createParent(overrides?: {
    biochem?: Partial<{
      oxytocin: number;
      cortisol: number;
      nurtureScore: number;
      epigeneticOxytocinBaseline: number;
      epigeneticCortisolBaseline: number;
    }>;
  }) {
    const entity = world.createEntity();
    const impl = entity as EntityImpl;

    impl.addComponent(new SpeciesComponent('human', 'Human', 'humanoid_standard'));
    impl.addComponent(new GeneticComponent({
      genome: [],
      mutationRate: 0.01,
      compatibleSpecies: ['human'],
      geneticHealth: 1.0,
      inbreedingCoefficient: 0,
      generation: 0,
    }));

    if (overrides?.biochem) {
      impl.addComponent(new BiochemistryComponent(overrides.biochem));
    }

    return entity;
  }

  it('should create offspring with epigenetic marks from nurtured parents', () => {
    const mother = createParent({
      biochem: { nurtureScore: 0.8, epigeneticOxytocinBaseline: 0.1 },
    });
    const father = createParent({
      biochem: { nurtureScore: 0.6, epigeneticOxytocinBaseline: 0.05 },
    });

    const offspring = reproSystem.createOffspring(mother, father, world);
    expect(offspring).not.toBeNull();

    const biochem = offspring!.getComponent(CT.Biochemistry) as BiochemistryComponent;
    expect(biochem).toBeDefined();
    // Offspring should have inherited some oxytocin baseline
    expect(biochem.epigeneticOxytocinBaseline).toBeGreaterThan(0);
    // Offspring should start with slightly inherited nurture score
    expect(biochem.nurtureScore).toBeGreaterThan(0);
  });

  it('should create offspring with higher cortisol baseline from traumatized parents', () => {
    const mother = createParent({
      biochem: { cortisol: 0.8, epigeneticCortisolBaseline: 0.2 },
    });
    const father = createParent({
      biochem: { cortisol: 0.7, epigeneticCortisolBaseline: 0.1 },
    });

    const offspring = reproSystem.createOffspring(mother, father, world);
    expect(offspring).not.toBeNull();

    const biochem = offspring!.getComponent(CT.Biochemistry) as BiochemistryComponent;
    expect(biochem).toBeDefined();
    // Offspring should have inherited some cortisol baseline (trauma)
    expect(biochem.epigeneticCortisolBaseline).toBeGreaterThan(0);
    expect(biochem.cortisol).toBeGreaterThan(0.1); // Above default
  });

  it('should create default biochemistry when parents have no biochemistry', () => {
    const mother = createParent(); // No biochem
    const father = createParent(); // No biochem

    const offspring = reproSystem.createOffspring(mother, father, world);
    expect(offspring).not.toBeNull();

    const biochem = offspring!.getComponent(CT.Biochemistry) as BiochemistryComponent;
    expect(biochem).toBeDefined();
    // Default values, no epigenetic marks
    expect(biochem.epigeneticOxytocinBaseline).toBe(0);
    expect(biochem.epigeneticCortisolBaseline).toBe(0);
  });

  it('should cap inherited baselines to prevent runaway inheritance', () => {
    // Parents with maxed-out scores
    const mother = createParent({
      biochem: {
        nurtureScore: 1.0,
        epigeneticOxytocinBaseline: 1.0,
        cortisol: 1.0,
        epigeneticCortisolBaseline: 1.0,
      },
    });
    const father = createParent({
      biochem: {
        nurtureScore: 1.0,
        epigeneticOxytocinBaseline: 1.0,
        cortisol: 1.0,
        epigeneticCortisolBaseline: 1.0,
      },
    });

    const offspring = reproSystem.createOffspring(mother, father, world);
    expect(offspring).not.toBeNull();

    const biochem = offspring!.getComponent(CT.Biochemistry) as BiochemistryComponent;
    // Baselines should be capped
    expect(biochem.epigeneticOxytocinBaseline).toBeLessThanOrEqual(0.5);
    expect(biochem.epigeneticCortisolBaseline).toBeLessThanOrEqual(0.5);
    expect(biochem.nurtureScore).toBeLessThanOrEqual(0.3);
  });

  it('should average epigenetic marks from both parents', () => {
    // One nurtured parent, one neglected
    const nurturedParent = createParent({
      biochem: { nurtureScore: 0.8, epigeneticOxytocinBaseline: 0.3 },
    });
    const neglectedParent = createParent({
      biochem: { nurtureScore: 0.0, epigeneticOxytocinBaseline: 0.0 },
    });

    const offspring = reproSystem.createOffspring(nurturedParent, neglectedParent, world);
    expect(offspring).not.toBeNull();

    const biochem = offspring!.getComponent(CT.Biochemistry) as BiochemistryComponent;
    // Should be averaged, not just from one parent
    // avgNurture = (0.8 + 0.0) / 2 = 0.4, then * 0.15 = 0.06
    expect(biochem.nurtureScore).toBeLessThan(0.1);
    expect(biochem.nurtureScore).toBeGreaterThan(0);
  });
});
