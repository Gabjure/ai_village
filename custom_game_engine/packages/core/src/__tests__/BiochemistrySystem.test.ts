import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../ecs/index.js';
import type { EntityImpl } from '../ecs/Entity.js';
import { EventBusImpl } from '../events/EventBus.js';
import { BiochemistrySystem } from '../systems/BiochemistrySystem.js';
import { BiochemistryComponent } from '../components/BiochemistryComponent.js';
import { ComponentType as CT } from '../types/ComponentType.js';

describe('BiochemistrySystem', () => {
  let world: World;
  let system: BiochemistrySystem;
  let eventBus: EventBusImpl;

  beforeEach(async () => {
    eventBus = new EventBusImpl();
    world = new World(eventBus);

    system = new BiochemistrySystem();
    await system.initialize(world, eventBus);
  });

  function createAgentWithBiochem(overrides?: Partial<{
    oxytocin: number;
    serotonin: number;
    dopamine: number;
    cortisol: number;
    handInteractionScore: number;
    nurtureScore: number;
    epigeneticOxytocinBaseline: number;
    epigeneticCortisolBaseline: number;
  }>) {
    const entity = world.createEntity();
    const biochem = new BiochemistryComponent(overrides);
    (entity as EntityImpl).addComponent(biochem);
    return entity;
  }

  function getBiochem(entity: { id: string }) {
    const e = world.getEntity(entity.id);
    return e?.getComponent(CT.Biochemistry) as BiochemistryComponent | undefined;
  }

  function emitHandEvent(type: string, agentId: string) {
    eventBus.emit({
      type: type as any,
      source: 'test',
      data: { agentId },
    });
    eventBus.flush();
  }

  function runTicks(n: number) {
    const entities = world.query().with(CT.Biochemistry).executeEntities();
    for (let i = 0; i < n; i++) {
      system.update(world, entities, 1.0);
    }
  }

  describe('initialization', () => {
    it('should have correct system id and priority', () => {
      expect(system.id).toBe('biochemistry');
      expect(system.priority).toBe(46);
    });
  });

  describe('Hand interaction events', () => {
    it('should boost oxytocin on hand:speak', () => {
      const entity = createAgentWithBiochem({ oxytocin: 0.1 });

      emitHandEvent('hand:speak', entity.id);
      runTicks(1);

      const biochem = getBiochem(entity);
      expect(biochem!.oxytocin).toBeGreaterThan(0.1);
    });

    it('should boost oxytocin on hand:pet', () => {
      const entity = createAgentWithBiochem({ oxytocin: 0.1 });

      emitHandEvent('hand:pet', entity.id);
      runTicks(1);

      const biochem = getBiochem(entity);
      // Pet gives 1.5x oxytocin boost
      expect(biochem!.oxytocin).toBeGreaterThan(0.1 + 0.08);
    });

    it('should boost oxytocin on hand:carry', () => {
      const entity = createAgentWithBiochem({ oxytocin: 0.1 });

      emitHandEvent('hand:carry', entity.id);
      runTicks(1);

      const biochem = getBiochem(entity);
      expect(biochem!.oxytocin).toBeGreaterThan(0.1);
    });

    it('should boost cortisol on hand:slap (trauma)', () => {
      const entity = createAgentWithBiochem({ cortisol: 0.1 });

      emitHandEvent('hand:slap', entity.id);
      runTicks(1);

      const biochem = getBiochem(entity);
      expect(biochem!.cortisol).toBeGreaterThan(0.1 + 0.1);
    });

    it('should reduce oxytocin on hand:slap', () => {
      const entity = createAgentWithBiochem({ oxytocin: 0.5 });

      emitHandEvent('hand:slap', entity.id);
      runTicks(1);

      const biochem = getBiochem(entity);
      expect(biochem!.oxytocin).toBeLessThan(0.5);
    });

    it('should increment handInteractionScore on interactions', () => {
      const entity = createAgentWithBiochem({ handInteractionScore: 0 });

      emitHandEvent('hand:speak', entity.id);
      emitHandEvent('hand:pet', entity.id);
      runTicks(1);

      const biochem = getBiochem(entity);
      expect(biochem!.handInteractionScore).toBeGreaterThan(0);
    });
  });

  describe('chemical decay', () => {
    it('should decay chemicals toward baselines over time', () => {
      const entity = createAgentWithBiochem({
        oxytocin: 0.8,
        serotonin: 0.8,
        dopamine: 0.8,
        cortisol: 0.8,
      });

      runTicks(50);

      const biochem = getBiochem(entity);
      expect(biochem!.oxytocin).toBeLessThan(0.8);
      expect(biochem!.serotonin).toBeLessThan(0.8);
      expect(biochem!.dopamine).toBeLessThan(0.8);
      expect(biochem!.cortisol).toBeLessThan(0.8);
    });

    it('should not decay chemicals below zero', () => {
      const entity = createAgentWithBiochem({
        oxytocin: 0.001,
        serotonin: 0.001,
        dopamine: 0.001,
        cortisol: 0.001,
      });

      runTicks(100);

      const biochem = getBiochem(entity);
      expect(biochem!.oxytocin).toBeGreaterThanOrEqual(0);
      expect(biochem!.serotonin).toBeGreaterThanOrEqual(0);
      expect(biochem!.dopamine).toBeGreaterThanOrEqual(0);
      expect(biochem!.cortisol).toBeGreaterThanOrEqual(0);
    });

    it('should not let chemicals exceed 1.0', () => {
      const entity = createAgentWithBiochem({ oxytocin: 0.95 });

      // Spam interactions to try to push above 1.0
      for (let i = 0; i < 20; i++) {
        emitHandEvent('hand:pet', entity.id);
      }
      runTicks(1);

      const biochem = getBiochem(entity);
      expect(biochem!.oxytocin).toBeLessThanOrEqual(1.0);
    });

    it('should slowly decay handInteractionScore', () => {
      const entity = createAgentWithBiochem({ handInteractionScore: 0.5 });

      runTicks(100);

      const biochem = getBiochem(entity);
      expect(biochem!.handInteractionScore).toBeLessThan(0.5);
      expect(biochem!.handInteractionScore).toBeGreaterThan(0); // Very slow decay
    });
  });

  describe('nurture accumulation', () => {
    it('should accumulate nurtureScore when oxytocin high and cortisol low', () => {
      const entity = createAgentWithBiochem({
        oxytocin: 0.6,
        cortisol: 0.1,
        nurtureScore: 0,
      });

      // Keep boosting oxytocin to maintain high levels
      for (let i = 0; i < 10; i++) {
        emitHandEvent('hand:pet', entity.id);
        runTicks(1);
      }

      const biochem = getBiochem(entity);
      expect(biochem!.nurtureScore).toBeGreaterThan(0);
    });

    it('should not accumulate nurtureScore when cortisol is high', () => {
      const entity = createAgentWithBiochem({
        oxytocin: 0.6,
        cortisol: 0.5, // Above threshold
        nurtureScore: 0,
      });

      runTicks(10);

      const biochem = getBiochem(entity);
      expect(biochem!.nurtureScore).toBe(0);
    });

    it('should slowly decay nurtureScore when conditions not met', () => {
      const entity = createAgentWithBiochem({
        oxytocin: 0.1, // Below threshold
        cortisol: 0.5, // Above threshold
        nurtureScore: 0.5,
      });

      runTicks(50);

      const biochem = getBiochem(entity);
      expect(biochem!.nurtureScore).toBeLessThan(0.5);
    });
  });

  describe('epigenetic baselines', () => {
    it('should decay oxytocin toward epigenetic baseline', () => {
      const entity = createAgentWithBiochem({
        oxytocin: 0.0,
        epigeneticOxytocinBaseline: 0.3,
      });

      runTicks(50);

      const biochem = getBiochem(entity);
      // Oxytocin should rise toward the baseline
      expect(biochem!.oxytocin).toBeGreaterThan(0.0);
    });
  });
});

describe('BiochemistryComponent', () => {
  it('should create with defaults', () => {
    const biochem = new BiochemistryComponent();
    expect(biochem.oxytocin).toBe(0.1);
    expect(biochem.serotonin).toBe(0.3);
    expect(biochem.dopamine).toBe(0.2);
    expect(biochem.cortisol).toBe(0.1);
    expect(biochem.handInteractionScore).toBe(0);
    expect(biochem.nurtureScore).toBe(0);
    expect(biochem.type).toBe('biochemistry');
  });

  it('should create with custom values', () => {
    const biochem = new BiochemistryComponent({
      oxytocin: 0.5,
      cortisol: 0.3,
      nurtureScore: 0.2,
    });
    expect(biochem.oxytocin).toBe(0.5);
    expect(biochem.cortisol).toBe(0.3);
    expect(biochem.nurtureScore).toBe(0.2);
  });

  it('should inherit epigenetic oxytocin baseline as initial oxytocin', () => {
    const biochem = new BiochemistryComponent({
      epigeneticOxytocinBaseline: 0.2,
    });
    // When oxytocin not specified, defaults to epigenetic baseline
    expect(biochem.oxytocin).toBe(0.2);
    expect(biochem.epigeneticOxytocinBaseline).toBe(0.2);
  });
});
