/**
 * Tests for GriefResolutionSystem
 *
 * Verifies:
 * - Grief decays over time
 * - Mourning flag clears when grief is gone
 * - Non-critical behaviors are interrupted for mourning
 * - Critical behaviors are not interrupted
 * - Cooldown is respected between mourn attempts
 * - Emotional state transitions from grieving to melancholic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMinimalWorld } from '../../__tests__/fixtures/worldFixtures.js';
import type { World } from '../../ecs/World.js';
import { EntityImpl, createEntityId } from '../../ecs/Entity.js';
import { ComponentType as CT } from '../../types/ComponentType.js';
import type { MoodComponent } from '../../components/MoodComponent.js';
import { createMoodComponent } from '../../components/MoodComponent.js';
import type { AgentComponent } from '../../components/AgentComponent.js';
import { GriefResolutionSystem } from '../GriefResolutionSystem.js';
import type { EventBus } from '../../events/EventBus.js';

function createGrievingAgent(overrides: {
  grief?: number;
  mourning?: boolean;
  emotionalState?: string;
  behavior?: string;
}): EntityImpl {
  const entity = new EntityImpl(createEntityId(), 0);

  entity.addComponent({
    type: 'position' as any,
    version: 1,
    x: 50,
    y: 50,
  });

  entity.addComponent({
    type: 'movement' as any,
    version: 1,
    vx: 0,
    vy: 0,
    speed: 2,
    maxSpeed: 4,
  });

  const agent = {
    type: 'agent' as any,
    version: 1,
    name: 'Test Agent',
    behavior: (overrides.behavior ?? 'idle') as any,
    behaviorState: {},
    lastThought: '',
    tier: 'worker' as any,
    thinkInterval: 100,
    ticksSinceLastThink: 0,
    behaviorHistory: [],
  } as AgentComponent;
  entity.addComponent(agent);

  const mood = createMoodComponent(0);
  mood.grief = overrides.grief ?? 50;
  mood.mourning = overrides.mourning ?? true;
  mood.emotionalState = (overrides.emotionalState ?? 'grieving') as any;
  mood.factors.social = -20;
  mood.currentMood = -30;
  entity.addComponent(mood);

  return entity;
}

describe('GriefResolutionSystem', () => {
  let system: GriefResolutionSystem;
  let world: World;
  let eventBus: EventBus;

  beforeEach(async () => {
    const harness = createMinimalWorld();
    world = harness.world;
    eventBus = harness.eventBus;
    system = new GriefResolutionSystem();
    await system.initialize(world, eventBus);
  });

  it('should have correct priority and id', () => {
    expect(system.id).toBe('grief-resolution');
    expect(system.priority).toBe(115);
  });

  it('should decay grief over time', () => {
    const agent = createGrievingAgent({ grief: 50, mourning: true, behavior: 'idle' });
    world.addEntity(agent);

    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    world.setTick(200);
    system.update(world, [agent], 0.05);

    const mood = agent.getComponent<MoodComponent>(CT.Mood);
    expect(mood!.grief).toBe(48); // 50 - 2 decay
    expect(mood!.mourning).toBe(true);

    vi.spyOn(Math, 'random').mockRestore();
  });

  it('should clear mourning when grief reaches zero', () => {
    const agent = createGrievingAgent({ grief: 1, mourning: true, behavior: 'idle' });
    world.addEntity(agent);

    world.setTick(200);
    system.update(world, [agent], 0.05);

    const mood = agent.getComponent<MoodComponent>(CT.Mood);
    expect(mood!.grief).toBe(0);
    expect(mood!.mourning).toBe(false);
  });

  it('should clear mourning flag when grief is already zero', () => {
    const agent = createGrievingAgent({ grief: 0, mourning: true, behavior: 'idle' });
    world.addEntity(agent);

    world.setTick(200);
    system.update(world, [agent], 0.05);

    const mood = agent.getComponent<MoodComponent>(CT.Mood);
    expect(mood!.mourning).toBe(false);
    expect(mood!.grief).toBe(0);
  });

  it('should not interrupt critical behaviors', () => {
    const agent = createGrievingAgent({ grief: 80, mourning: true, behavior: 'flee' });
    world.addEntity(agent);

    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    world.setTick(200);
    system.update(world, [agent], 0.05);

    const agentComp = agent.getComponent<AgentComponent>(CT.Agent);
    expect(agentComp!.behavior).toBe('flee');

    vi.spyOn(Math, 'random').mockRestore();
  });

  it('should trigger mourn_together for high-grief idle agents', () => {
    const agent = createGrievingAgent({ grief: 80, mourning: true, behavior: 'wander' });
    world.addEntity(agent);

    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    world.setTick(200);
    system.update(world, [agent], 0.05);

    const agentComp = agent.getComponent<AgentComponent>(CT.Agent);
    expect(agentComp!.behavior).toBe('mourn_together');

    vi.spyOn(Math, 'random').mockRestore();
  });

  it('should respect mourn cooldown', () => {
    const agent = createGrievingAgent({ grief: 80, mourning: true, behavior: 'wander' });
    world.addEntity(agent);

    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    // First call triggers mourn at tick 200
    world.setTick(200);
    system.update(world, [agent], 0.05);
    expect(agent.getComponent<AgentComponent>(CT.Agent)!.behavior).toBe('mourn_together');

    // Reset behavior and grief
    agent.updateComponent<AgentComponent>(CT.Agent, (c: AgentComponent) => ({ ...c, behavior: 'wander' as any }));
    agent.updateComponent<MoodComponent>(CT.Mood, (c: MoodComponent) => ({ ...c, grief: 80, mourning: true }));

    // Second call at tick 400 (only 200 ticks later, cooldown is 400)
    world.setTick(400);
    system.update(world, [agent], 0.05);
    expect(agent.getComponent<AgentComponent>(CT.Agent)!.behavior).toBe('wander');

    vi.spyOn(Math, 'random').mockRestore();
  });

  it('should skip agents without grief', () => {
    const agent = createGrievingAgent({ grief: 0, mourning: false, emotionalState: 'content', behavior: 'idle' });
    world.addEntity(agent);

    world.setTick(200);
    system.update(world, [agent], 0.05);

    const agentComp = agent.getComponent<AgentComponent>(CT.Agent);
    expect(agentComp!.behavior).toBe('idle');
  });

  it('should transition emotional state from grieving to melancholic when grief fades', () => {
    const agent = createGrievingAgent({ grief: 11, mourning: true, emotionalState: 'grieving', behavior: 'idle' });
    world.addEntity(agent);

    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    world.setTick(200);
    system.update(world, [agent], 0.05);

    const mood = agent.getComponent<MoodComponent>(CT.Mood);
    // grief: 11 - 2 = 9, < 10 threshold, so mourning = false
    expect(mood!.grief).toBe(9);
    expect(mood!.mourning).toBe(false);
    expect(mood!.emotionalState).toBe('melancholic');

    vi.spyOn(Math, 'random').mockRestore();
  });
});
