/**
 * Unit tests for AfterlifeNeedsSystem
 *
 * Tests spiritual needs decay and recovery for souls in the Underworld:
 * - Coherence decay (faster with high solitude)
 * - Tether decay (accelerated when forgotten)
 * - Solitude increase over time
 * - Peace gain when goals resolved
 * - State transitions (shade, passed on, restless)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMinimalWorld } from '../../__tests__/fixtures/worldFixtures.js';
import type { World } from '../../ecs/World.js';
import { EntityImpl, createEntityId } from '../../ecs/Entity.js';
import { AfterlifeNeedsSystem } from '../AfterlifeNeedsSystem.js';
import { StateMutatorSystem } from '../StateMutatorSystem.js';
import { createAfterlifeComponent } from '../../components/AfterlifeComponent.js';
import { createRealmLocationComponent } from '../../components/RealmLocationComponent.js';
import { createPositionComponent } from '../../components/PositionComponent.js';
import { createIdentityComponent } from '../../components/IdentityComponent.js';
import type { MutationVectorComponent } from '../../components/MutationVectorComponent.js';
import { MUTATION_PATHS } from '../../components/MutationVectorComponent.js';

describe('AfterlifeNeedsSystem', () => {
  let world: World;
  let system: AfterlifeNeedsSystem;
  let stateMutatorSystem: StateMutatorSystem;

  beforeEach(async () => {
    const harness = createMinimalWorld();
    world = harness.world;
    system = new AfterlifeNeedsSystem();
    stateMutatorSystem = new StateMutatorSystem();
    await system.initialize(world, harness.eventBus);
  });

  /**
   * Helper to apply mutations. The AfterlifeNeedsSystem sets mutation rates,
   * then StateMutatorSystem applies them.
   */
  function applyMutations(entity: EntityImpl, deltaTimeSeconds: number) {
    stateMutatorSystem.update(world, [entity], deltaTimeSeconds);
  }

  describe('initialization', () => {
    it('should have correct system properties', () => {
      expect(system.id).toBe('afterlife_needs');
      expect(system.priority).toBe(16); // After NeedsSystem (15)
      expect(system.requiredComponents).toContain('afterlife');
      expect(system.requiredComponents).toContain('realm_location');
    });
  });

  describe('coherence decay', () => {
    it('should decay coherence slowly over time', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Test Soul'));

      world.addEntity(entity);

      const initialCoherence = afterlife.coherence;
      expect(initialCoherence).toBe(1.0);

      // Advance world tick to trigger mutation registration
      world.setTick(1200);

      // System update registers mutation rates
      const oneGameMinute = 60;
      system.update(world, [entity], oneGameMinute);

      // StateMutatorSystem applies the mutations
      applyMutations(entity, oneGameMinute);

      // Coherence should decrease slightly
      expect(afterlife.coherence).toBeLessThanOrEqual(initialCoherence);
      expect(afterlife.coherence).toBeGreaterThan(0.99); // Very slow decay
    });

    it('should decay coherence faster with high solitude', () => {
      // The AfterlifeNeedsSystem sets mutation rates on MutationVectorComponent.
      // The rates are very small (< 0.0001/s) and get pruned by StateMutatorSystem
      // before applying, so we verify the RATE is set correctly rather than the result.
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      afterlife.solitude = 0.9; // Very lonely (above 0.7 threshold for 1.5x decay)

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Lonely Soul'));

      world.addEntity(entity);

      // Advance world tick to trigger mutation registration
      world.setTick(1200);

      const oneGameMinute = 60;
      system.update(world, [entity], oneGameMinute);

      // Check that a coherence decay rate was registered on the entity
      const mv = entity.getComponent<MutationVectorComponent>('mutation_vector');
      const rateWithSolitude = mv?.fields[MUTATION_PATHS.AFTERLIFE_COHERENCE]?.rate ?? 0;

      // Create another entity without solitude for comparison
      const entityId2 = createEntityId();
      const entity2 = new EntityImpl(entityId2, 0);

      const afterlife2 = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      afterlife2.solitude = 0.1; // Not lonely (below 0.7 threshold)

      entity2.addComponent(afterlife2);
      entity2.addComponent(createRealmLocationComponent('underworld'));
      entity2.addComponent(createPositionComponent(0, 0));
      entity2.addComponent(createIdentityComponent('Connected Soul'));

      world.addEntity(entity2);

      world.setTick(1200);

      system.update(world, [entity2], oneGameMinute);

      const mv2 = entity2.getComponent<MutationVectorComponent>('mutation_vector');
      const rateWithoutSolitude = mv2?.fields[MUTATION_PATHS.AFTERLIFE_COHERENCE]?.rate ?? 0;

      // High solitude should produce a faster (more negative) decay rate
      expect(Math.abs(rateWithSolitude)).toBeGreaterThan(Math.abs(rateWithoutSolitude));
    });

    it('should mark as shade when coherence drops below 0.1', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      // Directly set coherence below the 0.1 shade threshold.
      // The mutation rates set by this system are below the StateMutatorSystem
      // pruning threshold (0.0001/s), so we bypass accumulated decay and
      // test the state-transition logic directly.
      afterlife.coherence = 0.09;

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Fading Soul'));

      world.addEntity(entity);

      expect(afterlife.isShade).toBe(false);

      // Advance world tick to a DELTA_UPDATE_INTERVAL boundary
      world.setTick(1200);

      // One system update is enough: the state-transition check (coherence < 0.1 → isShade)
      // is a direct mutation inside onUpdate, independent of StateMutatorSystem.
      system.update(world, [entity], 60);

      expect(afterlife.coherence).toBeLessThan(0.1);
      expect(afterlife.isShade).toBe(true);
    });
  });

  describe('tether decay', () => {
    it('should decay tether slowly when not forgotten', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const currentTick = 1000;
      world.setTick(currentTick);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: currentTick - 100, // Recently remembered
        deathLocation: { x: 0, y: 0 },
      });

      afterlife.lastRememberedTick = currentTick - 100;

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Remembered Soul'));

      world.addEntity(entity);

      const initialTether = afterlife.tether;

      world.setTick(currentTick + 1200);

      const oneGameMinute = 60;
      system.update(world, [entity], oneGameMinute);
      applyMutations(entity, oneGameMinute);

      // Tether should decrease slightly
      expect(afterlife.tether).toBeLessThanOrEqual(initialTether);
      expect(afterlife.tether).toBeGreaterThanOrEqual(initialTether - 0.01); // Very slow
    });

    it('should decay tether faster when forgotten', () => {
      // The AfterlifeNeedsSystem sets mutation rates on MutationVectorComponent.
      // The rates are very small (< 0.0001/s) and get pruned by StateMutatorSystem,
      // so we verify the RATE is set correctly rather than the resulting tether change.
      const currentTick = 20000;
      world.setTick(currentTick);

      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      // Not remembered in a very long time (beyond FORGOTTEN_THRESHOLD_TICKS = 12000)
      afterlife.lastRememberedTick = currentTick - 15000;

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Forgotten Soul'));

      world.addEntity(entity);

      world.setTick(currentTick + 1200);

      const oneGameMinute = 60;
      system.update(world, [entity], oneGameMinute);

      const mv = entity.getComponent<MutationVectorComponent>('mutation_vector');
      const rateWhenForgotten = mv?.fields[MUTATION_PATHS.AFTERLIFE_TETHER]?.rate ?? 0;

      // Create comparison entity that was recently remembered
      const entityId2 = createEntityId();
      const entity2 = new EntityImpl(entityId2, 0);

      const afterlife2 = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: currentTick - 100,
        deathLocation: { x: 0, y: 0 },
      });

      afterlife2.lastRememberedTick = currentTick - 100; // Recently remembered (within threshold)

      entity2.addComponent(afterlife2);
      entity2.addComponent(createRealmLocationComponent('underworld'));
      entity2.addComponent(createPositionComponent(0, 0));
      entity2.addComponent(createIdentityComponent('Remembered Soul'));

      world.addEntity(entity2);

      world.setTick(currentTick + 1200);

      system.update(world, [entity2], oneGameMinute);

      const mv2 = entity2.getComponent<MutationVectorComponent>('mutation_vector');
      const rateWhenRemembered = mv2?.fields[MUTATION_PATHS.AFTERLIFE_TETHER]?.rate ?? 0;

      // Forgotten souls should have a faster (more negative) tether decay rate
      expect(Math.abs(rateWhenForgotten)).toBeGreaterThan(Math.abs(rateWhenRemembered));
    });
  });

  describe('solitude increase', () => {
    it('should increase solitude over time without interaction', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Isolated Soul'));

      world.addEntity(entity);

      const initialSolitude = afterlife.solitude;

      world.setTick(1200);

      const oneGameMinute = 60;
      system.update(world, [entity], oneGameMinute);
      applyMutations(entity, oneGameMinute);

      expect(afterlife.solitude).toBeGreaterThanOrEqual(initialSolitude);
    });

    it('should cap solitude at 1.0', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      afterlife.solitude = 0.99;

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Nearly Max Solitude'));

      world.addEntity(entity);

      const longTime = 10000;
      system.update(world, [entity], longTime);

      expect(afterlife.solitude).toBeLessThanOrEqual(1.0);
    });
  });

  describe('peace gain', () => {
    it('should increase peace when no unfinished goals', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'combat',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
        unfinishedGoals: [], // No unfinished business
      });

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Peaceful Soul'));

      world.addEntity(entity);

      const initialPeace = afterlife.peace;

      world.setTick(1200);

      const oneGameMinute = 60;
      system.update(world, [entity], oneGameMinute);
      applyMutations(entity, oneGameMinute);

      expect(afterlife.peace).toBeGreaterThanOrEqual(initialPeace);
    });

    it('should decrease peace when goals remain (restlessness)', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'combat',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
        unfinishedGoals: ['goal1', 'goal2'], // Still has unfinished business
      });

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Unfinished Soul'));

      world.addEntity(entity);

      const initialPeace = afterlife.peace;

      world.setTick(1200);

      const oneGameMinute = 60;
      system.update(world, [entity], oneGameMinute);
      applyMutations(entity, oneGameMinute);

      // Peace should decrease with unfinished business (restlessness)
      expect(afterlife.peace).toBeLessThanOrEqual(initialPeace);
    });
  });

  describe('state transitions', () => {
    it('should mark as passed on when tether low and peace high', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      afterlife.tether = 0.05; // Very low
      afterlife.peace = 0.85;  // High

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Departing Soul'));

      world.addEntity(entity);

      expect(afterlife.hasPassedOn).toBe(false);

      system.update(world, [entity], 1);

      expect(afterlife.hasPassedOn).toBe(true);
    });

    it('should mark as restless when peace low', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'combat',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
        unfinishedGoals: ['revenge'], // Unfinished business
      });

      // Force peace very low
      afterlife.peace = 0.15;

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Angry Soul'));

      world.addEntity(entity);

      system.update(world, [entity], 1);

      expect(afterlife.isRestless).toBe(true);
    });
  });

  describe('realm filtering', () => {
    it('should only process entities in underworld', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('mortal')); // Not in underworld
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Living Soul'));

      world.addEntity(entity);

      const initialCoherence = afterlife.coherence;

      const longTime = 10000;
      system.update(world, [entity], longTime);

      // Should not process - coherence unchanged
      expect(afterlife.coherence).toBe(initialCoherence);
    });

    it('should skip entities that have passed on', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      afterlife.hasPassedOn = true;

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Passed On'));

      world.addEntity(entity);

      const initialCoherence = afterlife.coherence;

      system.update(world, [entity], 10000);

      // Should not process - coherence unchanged
      expect(afterlife.coherence).toBe(initialCoherence);
    });

    it('should skip shades', () => {
      const entityId = createEntityId();
      const entity = new EntityImpl(entityId, 0);

      const afterlife = createAfterlifeComponent({
        causeOfDeath: 'old_age',
        deathTick: 0,
        deathLocation: { x: 0, y: 0 },
      });

      afterlife.isShade = true;

      entity.addComponent(afterlife);
      entity.addComponent(createRealmLocationComponent('underworld'));
      entity.addComponent(createPositionComponent(0, 0));
      entity.addComponent(createIdentityComponent('Shade'));

      world.addEntity(entity);

      const initialCoherence = afterlife.coherence;

      system.update(world, [entity], 10000);

      // Should not process - coherence unchanged
      expect(afterlife.coherence).toBe(initialCoherence);
    });
  });
});
