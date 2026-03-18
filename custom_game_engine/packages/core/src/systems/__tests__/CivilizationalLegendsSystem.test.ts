/**
 * Unit tests for CivilizationalLegendsSystem
 *
 * Tests civilizational milestone tracking and LLM-powered legend generation:
 * - Elder death trigger (fires once per world)
 * - Population 50 trigger (fires once per world)
 * - Master skill trigger (fires once per world)
 * - Legend processing: EpisodicMemory storage, eldest agent importance, event emission
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMinimalWorld } from '../../__tests__/fixtures/worldFixtures.js';
import type { World } from '../../ecs/World.js';
import { EntityImpl, createEntityId } from '../../ecs/Entity.js';
import { CivilizationalLegendsSystem } from '../CivilizationalLegendsSystem.js';
import { createAgentComponent } from '../../components/AgentComponent.js';
import { NeedsComponent } from '../../components/NeedsComponent.js';
import { createIdentityComponent } from '../../components/IdentityComponent.js';
import { createEpisodicMemoryComponent } from '../../components/EpisodicMemoryComponent.js';
import { IntegrationTestHarness } from '../../__tests__/utils/IntegrationTestHarness.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestAgent(
  world: World,
  name: string,
  options?: {
    ageCategory?: string;
    birthTick?: number;
    health?: number;
  }
): EntityImpl {
  const entity = new EntityImpl(createEntityId(), 0);

  const agent = createAgentComponent();
  if (options?.ageCategory) {
    agent.ageCategory = options.ageCategory as any;
  }
  if (options?.birthTick !== undefined) {
    agent.birthTick = options.birthTick;
  }
  entity.addComponent(agent);
  entity.addComponent(
    new NeedsComponent(
      options?.health !== undefined ? { health: options.health } : undefined
    )
  );
  entity.addComponent(createIdentityComponent(name));
  entity.addComponent(createEpisodicMemoryComponent());
  world.addEntity(entity);
  return entity;
}

/**
 * Run system.update across 200 consecutive ticks so the throttle offset
 * (computed from system id hash) fires at least once.
 */
function runUpdateUntilFired(
  system: CivilizationalLegendsSystem,
  world: World,
  entities: EntityImpl[]
): void {
  for (let i = 0; i < 200; i++) {
    world.setTick(i);
    system.update(world, entities, 0.05);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CivilizationalLegendsSystem', () => {
  let harness: IntegrationTestHarness;
  let world: World;
  let mockLLMQueue: {
    requestDecision: ReturnType<typeof vi.fn>;
    getDecision: ReturnType<typeof vi.fn>;
  };
  let system: CivilizationalLegendsSystem;

  beforeEach(async () => {
    harness = createMinimalWorld();
    world = harness.world;

    mockLLMQueue = {
      requestDecision: vi.fn().mockResolvedValue('A legend text response'),
      getDecision: vi.fn().mockReturnValue(null),
    };

    system = new CivilizationalLegendsSystem(mockLLMQueue as any);
    await system.initialize(world, harness.eventBus);
  });

  // -------------------------------------------------------------------------
  // 1. Initialization
  // -------------------------------------------------------------------------

  describe('initialization', () => {
    it('has correct system id', () => {
      expect(system.id).toBe('civilizational-legends');
    });

    it('has correct priority', () => {
      expect(system.priority).toBe(855);
    });

    it('has no required components', () => {
      expect(system.requiredComponents).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Elder death trigger
  // -------------------------------------------------------------------------

  describe('elder death trigger', () => {
    it('calls requestDecision when an elder dies', () => {
      const entity = createTestAgent(world, 'Elder One', { ageCategory: 'elder' });

      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: entity.id, agentName: 'Elder One' },
        tick: world.tick,
      });
      harness.eventBus.flush();

      expect(mockLLMQueue.requestDecision).toHaveBeenCalledOnce();
      expect(mockLLMQueue.requestDecision).toHaveBeenCalledWith(
        'legend_elder_death',
        expect.stringContaining('Elder One')
      );
    });

    it('does not trigger for non-elder deaths', () => {
      const entity = createTestAgent(world, 'Young One', { ageCategory: 'adult' });

      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: entity.id, agentName: 'Young One' },
        tick: world.tick,
      });
      harness.eventBus.flush();

      expect(mockLLMQueue.requestDecision).not.toHaveBeenCalled();
    });

    it('fires only once — second elder death does not trigger again', () => {
      const elder1 = createTestAgent(world, 'First Elder', { ageCategory: 'elder' });
      const elder2 = createTestAgent(world, 'Second Elder', { ageCategory: 'elder' });

      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: elder1.id, agentName: 'First Elder' },
        tick: world.tick,
      });
      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: elder2.id, agentName: 'Second Elder' },
        tick: world.tick,
      });
      harness.eventBus.flush();

      expect(mockLLMQueue.requestDecision).toHaveBeenCalledOnce();
    });

    it('ignores death events with no agentId', () => {
      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentName: 'Unknown' },
        tick: world.tick,
      });
      harness.eventBus.flush();

      expect(mockLLMQueue.requestDecision).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Master skill trigger
  // -------------------------------------------------------------------------

  describe('master skill trigger', () => {
    it('calls requestDecision when an agent reaches skill level 5', () => {
      const entity = createTestAgent(world, 'Master Farmer');

      harness.eventBus.emit({
        type: 'skill:level_up',
        data: { agentId: entity.id, skillId: 'farming', oldLevel: 4, newLevel: 5 },
        tick: world.tick,
      });
      harness.eventBus.flush();

      expect(mockLLMQueue.requestDecision).toHaveBeenCalledOnce();
      expect(mockLLMQueue.requestDecision).toHaveBeenCalledWith(
        'legend_master_skill',
        expect.any(String)
      );
    });

    it('does not trigger for level-ups below 5', () => {
      const entity = createTestAgent(world, 'Apprentice');

      harness.eventBus.emit({
        type: 'skill:level_up',
        data: { agentId: entity.id, skillId: 'farming', oldLevel: 3, newLevel: 4 },
        tick: world.tick,
      });
      harness.eventBus.flush();

      expect(mockLLMQueue.requestDecision).not.toHaveBeenCalled();
    });

    it('fires only once — second master skill does not trigger again', () => {
      const agent1 = createTestAgent(world, 'First Master');
      const agent2 = createTestAgent(world, 'Second Master');

      harness.eventBus.emit({
        type: 'skill:level_up',
        data: { agentId: agent1.id, skillId: 'farming', oldLevel: 4, newLevel: 5 },
        tick: world.tick,
      });
      harness.eventBus.emit({
        type: 'skill:level_up',
        data: { agentId: agent2.id, skillId: 'building', oldLevel: 4, newLevel: 5 },
        tick: world.tick,
      });
      harness.eventBus.flush();

      expect(mockLLMQueue.requestDecision).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Population 50 trigger
  // -------------------------------------------------------------------------

  describe('population 50 trigger', () => {
    it('triggers when 50 living agents are present', () => {
      for (let i = 0; i < 50; i++) {
        createTestAgent(world, `Agent ${i}`, { health: 1.0 });
      }

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      expect(mockLLMQueue.requestDecision).toHaveBeenCalledWith(
        'legend_population_50',
        expect.any(String)
      );
    });

    it('does not trigger with only 49 living agents', () => {
      for (let i = 0; i < 49; i++) {
        createTestAgent(world, `Agent ${i}`, { health: 1.0 });
      }

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      expect(mockLLMQueue.requestDecision).not.toHaveBeenCalled();
    });

    it('dead agents (health=0) are not counted toward population 50', () => {
      // 49 living + 10 dead = still below threshold
      for (let i = 0; i < 49; i++) {
        createTestAgent(world, `Living ${i}`, { health: 1.0 });
      }
      for (let i = 0; i < 10; i++) {
        createTestAgent(world, `Dead ${i}`, { health: 0 });
      }

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      expect(mockLLMQueue.requestDecision).not.toHaveBeenCalled();
    });

    it('fires only once — population check does not re-trigger', () => {
      for (let i = 0; i < 50; i++) {
        createTestAgent(world, `Agent ${i}`, { health: 1.0 });
      }

      const entities = Array.from(world.entities.values()) as EntityImpl[];

      // Run update loop twice; legend should only be requested once
      runUpdateUntilFired(system, world, entities);
      runUpdateUntilFired(system, world, entities);

      const populationCalls = mockLLMQueue.requestDecision.mock.calls.filter(
        ([key]: [string]) => key === 'legend_population_50'
      );
      expect(populationCalls).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Legend processing (when LLM responds)
  // -------------------------------------------------------------------------

  describe('legend processing', () => {
    it('stores the legend in EpisodicMemory of all living agents when LLM responds', () => {
      const agent1 = createTestAgent(world, 'Agent Alpha', { health: 1.0, birthTick: 100 });
      const agent2 = createTestAgent(world, 'Agent Beta', { health: 1.0, birthTick: 200 });

      // Trigger elder death so a pending legend key exists
      const elder = createTestAgent(world, 'Ancient Elder', { ageCategory: 'elder', health: 1.0, birthTick: 50 });
      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: elder.id, agentName: 'Ancient Elder' },
        tick: world.tick,
      });
      harness.eventBus.flush();

      // Simulate LLM returning a response
      const legendText = 'When Ancient Elder breathed her last, the stars wept and the rivers sang.';
      mockLLMQueue.getDecision.mockImplementation((key: string) => {
        if (key === 'legend_elder_death') return legendText;
        return null;
      });

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      // Both living agents should have the legend in their memory
      const episodicMemory1 = (agent1 as any).components.get('episodic_memory');
      const episodicMemory2 = (agent2 as any).components.get('episodic_memory');

      expect(episodicMemory1).toBeDefined();
      expect(episodicMemory2).toBeDefined();

      const memories1 = episodicMemory1.episodicMemories as any[];
      const memories2 = episodicMemory2.episodicMemories as any[];

      const legend1 = memories1.find((m: any) => m.summary === legendText);
      const legend2 = memories2.find((m: any) => m.summary === legendText);

      expect(legend1).toBeDefined();
      expect(legend2).toBeDefined();
    });

    it('eldest agent (lowest birthTick) gets higher importance (0.95) and emotionalIntensity (0.9)', () => {
      // eldest agent has the lowest birthTick
      const eldestAgent = createTestAgent(world, 'Eldest One', { health: 1.0, birthTick: 10 });
      const youngerAgent = createTestAgent(world, 'Younger One', { health: 1.0, birthTick: 500 });

      const elder = createTestAgent(world, 'Dying Elder', { ageCategory: 'elder', health: 1.0, birthTick: 999 });
      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: elder.id, agentName: 'Dying Elder' },
        tick: world.tick,
      });
      harness.eventBus.flush();
      // Mark elder as dead so findEldestLivingAgent skips it
      const elderNeeds = (elder as any).components.get('needs');
      elderNeeds.health = 0;

      const legendText = 'The first to fall opened the door to memory eternal.';
      mockLLMQueue.getDecision.mockImplementation((key: string) => {
        if (key === 'legend_elder_death') return legendText;
        return null;
      });

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      const eldestMemory = (eldestAgent as any).components.get('episodic_memory');
      const youngerMemory = (youngerAgent as any).components.get('episodic_memory');

      const eldestLegend = (eldestMemory.episodicMemories as any[]).find(
        (m: any) => m.summary === legendText
      );
      const youngerLegend = (youngerMemory.episodicMemories as any[]).find(
        (m: any) => m.summary === legendText
      );

      expect(eldestLegend).toBeDefined();
      expect(youngerLegend).toBeDefined();

      // Eldest gets higher importance and emotionalIntensity
      expect(eldestLegend.importance).toBe(0.95);
      expect(eldestLegend.emotionalIntensity).toBe(0.9);

      expect(youngerLegend.importance).toBe(0.75);
      expect(youngerLegend.emotionalIntensity).toBe(0.6);
    });

    it('emits civilizational_legend:born event after processing', () => {
      createTestAgent(world, 'Survivor', { health: 1.0, birthTick: 100 });

      const elder = createTestAgent(world, 'Grand Elder', { ageCategory: 'elder', health: 1.0 });
      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: elder.id, agentName: 'Grand Elder' },
        tick: world.tick,
      });
      harness.eventBus.flush();

      const legendText = 'Grand Elder walked into the sunset and became part of the sky.';
      mockLLMQueue.getDecision.mockImplementation((key: string) => {
        if (key === 'legend_elder_death') return legendText;
        return null;
      });

      const emitSpy = vi.spyOn(harness.eventBus, 'emit');

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      const legendEvent = emitSpy.mock.calls.find(([e]: any) => e.type === 'civilizational_legend:born');
      expect(legendEvent).toBeDefined();

      const eventData = (legendEvent as any)[0].data;
      expect(eventData.triggerType).toBe('elder_death');
      expect(eventData.legendText).toBe(legendText);
    });

    it('emits notification:show event after processing', () => {
      createTestAgent(world, 'Villager', { health: 1.0 });

      const elder = createTestAgent(world, 'Noble Elder', { ageCategory: 'elder', health: 1.0 });
      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: elder.id, agentName: 'Noble Elder' },
        tick: world.tick,
      });
      harness.eventBus.flush();

      const legendText = 'Noble Elder rose to meet the dawn and never came back. She became the dawn.';
      mockLLMQueue.getDecision.mockImplementation((key: string) => {
        if (key === 'legend_elder_death') return legendText;
        return null;
      });

      const emitSpy = vi.spyOn(harness.eventBus, 'emit');

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      const notifEvent = emitSpy.mock.calls.find(([e]: any) => e.type === 'notification:show');
      expect(notifEvent).toBeDefined();

      const notifData = (notifEvent as any)[0].data;
      expect(notifData.message).toContain('A Legend Is Born');
      expect(notifData.type).toBe('success');
    });

    it('ignores empty LLM response — no memory is formed', () => {
      const agent = createTestAgent(world, 'Observer', { health: 1.0 });

      const elder = createTestAgent(world, 'Silent Elder', { ageCategory: 'elder', health: 1.0 });
      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: elder.id, agentName: 'Silent Elder' },
        tick: world.tick,
      });
      harness.eventBus.flush();

      // LLM returns empty/whitespace response
      mockLLMQueue.getDecision.mockImplementation((key: string) => {
        if (key === 'legend_elder_death') return '   ';
        return null;
      });

      const emitSpy = vi.spyOn(harness.eventBus, 'emit');

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      const legendEvent = emitSpy.mock.calls.find(([e]: any) => e.type === 'civilizational_legend:born');
      expect(legendEvent).toBeUndefined();

      const agentMemory = (agent as any).components.get('episodic_memory');
      expect(agentMemory.episodicMemories).toHaveLength(0);
    });

    it('removes pending legend from the map after processing', () => {
      createTestAgent(world, 'Witness', { health: 1.0 });

      const elder = createTestAgent(world, 'Last Elder', { ageCategory: 'elder', health: 1.0 });
      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: elder.id, agentName: 'Last Elder' },
        tick: world.tick,
      });
      harness.eventBus.flush();

      const legendText = 'Last Elder told no tales, but the tales told themselves.';
      let callCount = 0;
      mockLLMQueue.getDecision.mockImplementation((key: string) => {
        if (key === 'legend_elder_death') {
          // Return legend on first call, then null (simulating cleanup)
          if (callCount === 0) {
            callCount++;
            return legendText;
          }
          return legendText; // Keep returning so we can verify only one processing
        }
        return null;
      });

      const emitSpy = vi.spyOn(harness.eventBus, 'emit');

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      // Run again — legend should not be processed a second time
      mockLLMQueue.requestDecision.mockClear();
      emitSpy.mockClear();
      runUpdateUntilFired(system, world, entities);

      // No new legend:born event should have fired in the second pass
      const secondLegendEvents = emitSpy.mock.calls.filter(
        ([e]: any) => e.type === 'civilizational_legend:born'
      );
      expect(secondLegendEvents).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Integration: full flow
  // -------------------------------------------------------------------------

  describe('integration: full flow', () => {
    it('elder death → LLM responds → memory stored in all living agents + events emitted', () => {
      const living1 = createTestAgent(world, 'Villager Alder', { health: 1.0, birthTick: 200 });
      const living2 = createTestAgent(world, 'Villager Brook', { health: 1.0, birthTick: 300 });
      const deceased = createTestAgent(world, 'Dead Villager', { health: 0, birthTick: 400 });

      // The eldest living agent (will get importance 0.95)
      const eldestLiving = createTestAgent(world, 'Village Founder', { health: 1.0, birthTick: 50 });

      // Trigger the legend
      const dyingElder = createTestAgent(world, 'Grandmother Iris', { ageCategory: 'elder', health: 1.0 });
      harness.eventBus.emit({
        type: 'agent:death',
        data: { agentId: dyingElder.id, agentName: 'Grandmother Iris' },
        tick: world.tick,
      });
      harness.eventBus.flush();
      // Mark elder as dead after event fires so she's excluded from living agents
      const dyingElderNeeds = (dyingElder as any).components.get('needs');
      dyingElderNeeds.health = 0;

      expect(mockLLMQueue.requestDecision).toHaveBeenCalledWith(
        'legend_elder_death',
        expect.stringContaining('Grandmother Iris')
      );

      const legendText =
        'Grandmother Iris laid down her spindle and became a thread in the great tapestry above.';
      mockLLMQueue.getDecision.mockImplementation((key: string) => {
        if (key === 'legend_elder_death') return legendText;
        return null;
      });

      const emitSpy = vi.spyOn(harness.eventBus, 'emit');

      const entities = Array.from(world.entities.values()) as EntityImpl[];
      runUpdateUntilFired(system, world, entities);

      // All living agents should have the memory
      for (const agent of [living1, living2, eldestLiving]) {
        const memComp = (agent as any).components.get('episodic_memory');
        expect(memComp).toBeDefined();
        const foundLegend = (memComp.episodicMemories as any[]).find(
          (m: any) => m.summary === legendText
        );
        expect(foundLegend).toBeDefined();
      }

      // Dead agent should NOT have memory (health=0, excluded from living)
      const deadMemComp = (deceased as any).components.get('episodic_memory');
      const deadLegend = (deadMemComp.episodicMemories as any[]).find(
        (m: any) => m.summary === legendText
      );
      expect(deadLegend).toBeUndefined();

      // Eldest agent gets elevated importance
      const eldestMemComp = (eldestLiving as any).components.get('episodic_memory');
      const eldestLegend = (eldestMemComp.episodicMemories as any[]).find(
        (m: any) => m.summary === legendText
      );
      expect(eldestLegend?.importance).toBe(0.95);
      expect(eldestLegend?.emotionalIntensity).toBe(0.9);

      // Other living agents get standard importance
      const alder = (living1 as any).components.get('episodic_memory');
      const alderLegend = (alder.episodicMemories as any[]).find(
        (m: any) => m.summary === legendText
      );
      expect(alderLegend?.importance).toBe(0.75);
      expect(alderLegend?.emotionalIntensity).toBe(0.6);

      // Events were emitted
      const legendBornEvent = emitSpy.mock.calls.find(([e]: any) => e.type === 'civilizational_legend:born');
      expect(legendBornEvent).toBeDefined();

      const notifEvent = emitSpy.mock.calls.find(([e]: any) => e.type === 'notification:show');
      expect(notifEvent).toBeDefined();
    });
  });
});
