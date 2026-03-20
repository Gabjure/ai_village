/**
 * CivilizationChronicleService
 *
 * Persists civilization milestone entries through save/load by storing them
 * on a dedicated ECS entity with a CivilizationChronicleComponent.
 *
 * Usage:
 *   civilizationChronicleService.connectEventBus(world);  // once at startup
 *   const entries = civilizationChronicleService.getEntries(world);
 */

import type { Component } from '../ecs/Component.js';
import type { World } from '../ecs/World.js';
import type { Entity } from '../ecs/Entity.js';
import { EntityImpl, createEntityId } from '../ecs/Entity.js';
import { ComponentType as CT } from '../types/ComponentType.js';

// ============================================================================
// Types
// ============================================================================

export interface ChronicleEntry {
  type: string;
  agentName?: string;
  summary: string;
  tick: number;
  timestamp: number;
}

export interface CivilizationChronicleComponent extends Component {
  readonly type: 'civilization_chronicle';
  entries: ChronicleEntry[];
  maxEntries: number;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_ENTRIES = 200;

const MILESTONE_SUMMARIES: Record<string, string> = {
  'first_local_trade':           'The first trade between agents was completed.',
  'first_inter_village_trade':   'Villages established their first inter-settlement trade route.',
  'first_temporal_trade':        'A trade was made with the past — crossing timelines.',
  'first_cross_universe_trade':  'Commerce reached across the boundary between universes.',
  'first_cross_multiverse_trade':'Trade now spans the multiverse itself.',
  'first_agent_death_witnessed': 'The first death was witnessed. Life is fleeting.',
  'first_building_completed':    'The first structure was raised — civilization takes root.',
  'first_research_completed':    'Knowledge was won through research. A new age begins.',
  'first_magic_learned':         'An agent touched the arcane for the first time.',
  'first_spaceship_launched':    'A vessel was launched beyond the sky.',
  'angel_bond_formed':           'A deep bond formed between player and angel.',
  'post_temporal_multiversal':   'Post-temporal multiversal status achieved — angel bifurcation unlocked.',
  'the_revelation':              'The populated multiverse was revealed.',
};

// ============================================================================
// Factory
// ============================================================================

export function createCivilizationChronicleComponent(): CivilizationChronicleComponent {
  return {
    type: 'civilization_chronicle',
    version: 1,
    entries: [],
    maxEntries: MAX_ENTRIES,
  };
}

// ============================================================================
// CivilizationChronicleService
// ============================================================================

export class CivilizationChronicleService {
  private chronicleEntityId: string | null = null;

  /**
   * Finds or creates the singleton chronicle entity in the world.
   */
  getOrCreateEntity(world: World): Entity {
    // Try cached ID first
    if (this.chronicleEntityId !== null) {
      const cached = world.getEntity(this.chronicleEntityId);
      if (cached !== undefined) {
        return cached;
      }
      // Cached ID is stale (e.g. after load) — fall through to query
      this.chronicleEntityId = null;
    }

    // Query for an existing chronicle entity
    const existing = world.query().with(CT.CivilizationChronicle).executeEntities();
    if (existing.length > 0) {
      const entity = existing[0]!;
      this.chronicleEntityId = entity.id;
      return entity;
    }

    // Create a new one
    const entity = new EntityImpl(createEntityId(), world.tick);
    entity.addComponent(createCivilizationChronicleComponent());
    world.addEntity(entity);
    this.chronicleEntityId = entity.id;
    return entity;
  }

  /**
   * Appends an entry to the chronicle, trimming to maxEntries.
   */
  addEntry(world: World, entry: ChronicleEntry): void {
    const entity = this.getOrCreateEntity(world);
    const comp = entity.getComponent<CivilizationChronicleComponent>(CT.CivilizationChronicle);
    if (comp === undefined) {
      throw new Error('[CivilizationChronicleService] Chronicle entity is missing CivilizationChronicleComponent');
    }
    comp.entries.unshift(entry);
    if (comp.entries.length > comp.maxEntries) {
      comp.entries.length = comp.maxEntries;
    }
  }

  /**
   * Returns chronicle entries in reverse chronological order (newest first).
   */
  getEntries(world: World): ReadonlyArray<ChronicleEntry> {
    const entity = this.getOrCreateEntity(world);
    const comp = entity.getComponent<CivilizationChronicleComponent>(CT.CivilizationChronicle);
    if (comp === undefined) {
      throw new Error('[CivilizationChronicleService] Chronicle entity is missing CivilizationChronicleComponent');
    }
    // entries are stored newest-first (unshift on add), so return as-is
    return comp.entries;
  }

  /**
   * Subscribes to civilization:* and milestone:achieved EventBus events and
   * records them as ChronicleEntries. Call once at game startup.
   */
  connectEventBus(world: World): void {
    const eventBus = world.eventBus;

    eventBus.subscribe('civilization:biome_discovered', (event: any) => {
      const d = event.data ?? {};
      this.addEntry(world, {
        type: 'civilization:biome_discovered',
        agentName: d.agentName,
        summary: d.summary ?? '',
        tick: d.tick ?? 0,
        timestamp: Date.now(),
      });
    });

    eventBus.subscribe('civilization:biome_settled', (event: any) => {
      const d = event.data ?? {};
      this.addEntry(world, {
        type: 'civilization:biome_settled',
        agentName: d.agentName,
        summary: d.summary ?? '',
        tick: d.tick ?? 0,
        timestamp: Date.now(),
      });
    });

    eventBus.subscribe('civilization:biome_explored', (event: any) => {
      const d = event.data ?? {};
      this.addEntry(world, {
        type: 'civilization:biome_explored',
        summary: d.summary ?? '',
        tick: d.tick ?? 0,
        timestamp: Date.now(),
      });
    });

    eventBus.subscribe('civilization:terrain_transformed', (event: any) => {
      const d = event.data ?? {};
      this.addEntry(world, {
        type: 'civilization:terrain_transformed',
        summary: d.summary ?? '',
        tick: d.tick ?? 0,
        timestamp: Date.now(),
      });
    });

    eventBus.subscribe('civilization:resource_extracted', (event: any) => {
      const d = event.data ?? {};
      this.addEntry(world, {
        type: 'civilization:resource_extracted',
        agentName: d.agentName,
        summary: d.summary ?? '',
        tick: d.tick ?? 0,
        timestamp: Date.now(),
      });
    });

    // Agent/social milestones from MilestoneSystem
    eventBus.subscribe('milestone:achieved', (event: any) => {
      const d = event.data ?? {};
      const milestoneId: string = d.milestoneId ?? '';
      const summary = MILESTONE_SUMMARIES[milestoneId] ?? `Milestone achieved: ${milestoneId.replace(/_/g, ' ')}`;
      this.addEntry(world, {
        type: `milestone:${milestoneId}`,
        summary,
        tick: d.tick ?? 0,
        timestamp: Date.now(),
      });
    });
  }
}

export const civilizationChronicleService = new CivilizationChronicleService();
