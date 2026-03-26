import { describe, it, expect, beforeEach } from 'vitest';
import { DiscoveryNamingSystem } from '../DiscoveryNamingSystem.js';
import {
  DiscoveryNamingComponent,
  createDiscoveryNamingComponent,
  DISCOVERY_CATEGORY_LABELS,
  DISCOVERY_NAMING_PROMPTS,
  type DiscoveryCategory,
} from '../../components/DiscoveryNamingComponent.js';
import { World } from '../../ecs/World.js';
import { EntityImpl, createEntityId } from '../../ecs/Entity.js';
import { EventBusImpl } from '../../events/EventBus.js';

function createEntity(tick = 0): EntityImpl {
  return new EntityImpl(createEntityId(), tick);
}

describe('DiscoveryNamingComponent', () => {
  let comp: DiscoveryNamingComponent;

  beforeEach(() => {
    comp = createDiscoveryNamingComponent();
  });

  it('should have correct component type', () => {
    expect(comp.type).toBe('discovery_naming');
  });

  it('should start with no discoveries or pending', () => {
    expect(comp.getAllDiscoveries()).toHaveLength(0);
    expect(comp.getNextPending()).toBeNull();
  });

  describe('queueForNaming', () => {
    it('should queue a discovery for naming', () => {
      comp.queueForNaming('first_death', 'The first death.', 100, 5, ['entity1']);
      expect(comp.isPending('first_death')).toBe(true);
      expect(comp.isNamed('first_death')).toBe(false);
    });

    it('should not queue if already named', () => {
      comp.queueForNaming('first_death', 'The first death.', 100, 5);
      comp.nameDiscovery('first_death', 'The Silent Passing', 200);
      // Try to queue again — should be ignored
      comp.queueForNaming('first_death', 'Another death.', 300, 10);
      expect(comp.isPending('first_death')).toBe(false);
      expect(comp.isNamed('first_death')).toBe(true);
    });

    it('should not queue if already pending', () => {
      comp.queueForNaming('first_building', 'First building.', 100, 5);
      comp.queueForNaming('first_building', 'Another building.', 200, 10);
      const pending = comp.getNextPending();
      expect(pending?.description).toBe('First building.');
    });
  });

  describe('nameDiscovery', () => {
    it('should name a pending discovery and move it to named', () => {
      comp.queueForNaming('first_deity', 'A deity emerges.', 100, 5, ['deity1']);
      const result = comp.nameDiscovery('first_deity', 'The Radiant One', 200);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('The Radiant One');
      expect(result!.category).toBe('first_deity');
      expect(result!.description).toBe('A deity emerges.');
      expect(result!.eventTick).toBe(100);
      expect(result!.namedAtTick).toBe(200);
      expect(result!.eventDay).toBe(5);
      expect(result!.entityIds).toEqual(['deity1']);

      expect(comp.isNamed('first_deity')).toBe(true);
      expect(comp.isPending('first_deity')).toBe(false);
    });

    it('should return null if category is not pending', () => {
      const result = comp.nameDiscovery('first_magic', 'Test', 100);
      expect(result).toBeNull();
    });
  });

  describe('getAllDiscoveries', () => {
    it('should return all named discoveries', () => {
      comp.queueForNaming('first_death', 'First death.', 100, 5);
      comp.queueForNaming('first_building', 'First building.', 200, 10);
      comp.nameDiscovery('first_death', 'The Quiet End', 150);
      comp.nameDiscovery('first_building', 'Heartstone Hall', 250);

      const discoveries = comp.getAllDiscoveries();
      expect(discoveries).toHaveLength(2);
      expect(discoveries.map(d => d.name)).toContain('The Quiet End');
      expect(discoveries.map(d => d.name)).toContain('Heartstone Hall');
    });
  });

  describe('getDiscovery', () => {
    it('should return a specific named discovery', () => {
      comp.queueForNaming('first_disaster', 'Catastrophe.', 100, 5);
      comp.nameDiscovery('first_disaster', 'The Great Tremor', 200);

      const discovery = comp.getDiscovery('first_disaster');
      expect(discovery).toBeDefined();
      expect(discovery!.name).toBe('The Great Tremor');
    });

    it('should return undefined for unnamed category', () => {
      expect(comp.getDiscovery('first_magic')).toBeUndefined();
    });
  });

  describe('getNextPending', () => {
    it('should return the first pending discovery', () => {
      comp.queueForNaming('first_death', 'Death.', 100, 5);
      comp.queueForNaming('first_building', 'Building.', 200, 10);

      const next = comp.getNextPending();
      expect(next).not.toBeNull();
      expect(next!.category).toBe('first_death');
    });

    it('should return null when no pending', () => {
      expect(comp.getNextPending()).toBeNull();
    });
  });
});

describe('DiscoveryNamingSystem', () => {
  let system: DiscoveryNamingSystem;
  let world: World;
  let eventBus: EventBusImpl;

  beforeEach(() => {
    system = new DiscoveryNamingSystem();
    eventBus = new EventBusImpl();
    world = new World(eventBus);
    system.initialize(world, eventBus);
  });

  it('should have correct id and priority', () => {
    expect(system.id).toBe('discovery-naming');
    expect(system.priority).toBe(870);
  });

  it('should queue first_death on agent:death event', () => {
    // Emit agent:death event
    eventBus.emit({
      type: 'agent:death',
      data: { agentName: 'Alice', cause: 'starvation' },
      source: 'test',
    });
    eventBus.flush();

    // Find the discovery naming entity
    const entities = world.query().with('discovery_naming' as any).executeEntities();
    expect(entities.length).toBe(1);
    const comp = entities[0]!.getComponent('discovery_naming') as DiscoveryNamingComponent;
    expect(comp.isPending('first_death')).toBe(true);
  });

  it('should queue first_building on building:completed event', () => {
    eventBus.emit({
      type: 'building:completed',
      data: {},
      source: 'test',
    });
    eventBus.flush();

    const entities = world.query().with('discovery_naming' as any).executeEntities();
    expect(entities.length).toBe(1);
    const comp = entities[0]!.getComponent('discovery_naming') as DiscoveryNamingComponent;
    expect(comp.isPending('first_building')).toBe(true);
  });

  it('should not queue duplicate discoveries', () => {
    // Emit twice
    eventBus.emit({ type: 'building:completed', data: {}, source: 'test' });
    eventBus.flush();
    eventBus.emit({ type: 'building:completed', data: {}, source: 'test' });
    eventBus.flush();

    const entities = world.query().with('discovery_naming' as any).executeEntities();
    const comp = entities[0]!.getComponent('discovery_naming') as DiscoveryNamingComponent;
    // Should still only have one pending
    expect(comp.isPending('first_building')).toBe(true);
  });

  it('should queue first_magic on magic:spell_learned event', () => {
    eventBus.emit({
      type: 'magic:spell_learned',
      data: {},
      source: 'test',
    });
    eventBus.flush();

    const entities = world.query().with('discovery_naming' as any).executeEntities();
    const comp = entities[0]!.getComponent('discovery_naming') as DiscoveryNamingComponent;
    expect(comp.isPending('first_magic')).toBe(true);
  });

  it('should queue first_disaster on disaster:occurred event', () => {
    eventBus.emit({
      type: 'disaster:occurred',
      data: { disasterType: 'Earthquake', location: { x: 0, y: 0 }, severity: 5 },
      source: 'test',
    });
    eventBus.flush();

    const entities = world.query().with('discovery_naming' as any).executeEntities();
    const comp = entities[0]!.getComponent('discovery_naming') as DiscoveryNamingComponent;
    expect(comp.isPending('first_disaster')).toBe(true);
  });
});

describe('Discovery naming constants', () => {
  const categories: DiscoveryCategory[] = [
    'first_settlement', 'first_deity', 'first_death', 'first_building',
    'first_disaster', 'first_magic', 'first_legend', 'first_consciousness',
  ];

  it('should have labels for all categories', () => {
    for (const cat of categories) {
      expect(DISCOVERY_CATEGORY_LABELS[cat]).toBeDefined();
      expect(DISCOVERY_CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    }
  });

  it('should have naming prompts for all categories', () => {
    for (const cat of categories) {
      expect(DISCOVERY_NAMING_PROMPTS[cat]).toBeDefined();
      expect(DISCOVERY_NAMING_PROMPTS[cat].length).toBeGreaterThan(0);
    }
  });
});
