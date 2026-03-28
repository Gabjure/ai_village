/**
 * ExtinctionSurvivorSystem — Listens for species:extinct events and flags
 * surviving individuals with ExtinctionSurvivorData, disabling their reproduction.
 *
 * This is the deferred listener from the extinction vortex spec (MUL-4459).
 * When a species goes extinct, any living members become "living relics" —
 * they carry the extinct lineage for cross-game bridge (Folkfork) discovery.
 *
 * Priority: 855 (runs after ExtinctionVortexSystem at 850)
 *
 * Per CLAUDE.md:
 *   - NO silent fallbacks — throw on invalid data
 *   - Component types use lowercase_with_underscores
 *   - NEVER delete entities — mark as corrupted
 *   - Cache queries before loops
 */

import { BaseSystem } from '../ecs/SystemContext.js';
import type { SystemContext } from '../ecs/SystemContext.js';
import type { SystemId, ComponentType } from '../types.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { EventBus } from '../events/EventBus.js';
import type { WorldMutator } from '../ecs/World.js';
import type { EntityImpl } from '../ecs/Entity.js';
import { SpeciesComponent } from '../components/SpeciesComponent.js';
import { GeneticComponent } from '../components/GeneticComponent.js';
import type { ExtinctionMetrics } from '../components/ExtinctionVortexMonitorComponent.js';
import { createExtinctionSurvivorComponent } from '../components/ExtinctionVortexMonitorComponent.js';

interface SpeciesExtinctEvent {
  speciesId: string;
  finalMetrics: ExtinctionMetrics;
  survivorCount: number;
}

/**
 * Pending extinction events queued by the event listener for processing
 * in the next update cycle (maintains ECS tick-based mutation discipline).
 */
interface PendingExtinction {
  speciesId: string;
  finalMetrics: ExtinctionMetrics;
  survivorCount: number;
  receivedAt: number;
}

export class ExtinctionSurvivorSystem extends BaseSystem {
  public readonly id: SystemId = 'extinction_survivor_system';
  public readonly priority: number = 855;
  public readonly requiredComponents: ReadonlyArray<ComponentType> = [];

  private pendingExtinctions: PendingExtinction[] = [];

  protected onInitialize(_world: WorldMutator, eventBus: EventBus): void {
    eventBus.subscribe('species:extinct', (event: { data: SpeciesExtinctEvent }) => {
      const { speciesId, finalMetrics, survivorCount } = event.data;
      this.pendingExtinctions.push({
        speciesId,
        finalMetrics,
        survivorCount,
        receivedAt: Date.now(),
      });
    });
  }

  protected onUpdate(ctx: SystemContext): void {
    if (this.pendingExtinctions.length === 0) return;

    // Drain the queue — process all pending extinctions this tick
    const extinctions = this.pendingExtinctions.splice(0);

    for (const extinction of extinctions) {
      this.flagSurvivors(ctx, extinction);
    }
  }

  /**
   * Flag all living members of the extinct species as survivors:
   * 1. Add ExtinctionSurvivorComponent with full data
   * 2. Disable reproduction via SpeciesComponent.canReproduce = false
   * 3. Track lastSurvivorGeneration from GeneticComponent.generation
   */
  private flagSurvivors(ctx: SystemContext, extinction: PendingExtinction): void {
    const { speciesId, finalMetrics, survivorCount } = extinction;

    // Query all entities with Species + Genetic components (cache before loop)
    const speciesEntities = ctx.world.query()
      .with(CT.Species)
      .executeEntities() as EntityImpl[];

    // Filter to members of the extinct species
    const survivors = speciesEntities.filter(entity => {
      const speciesComp = entity.getComponent<SpeciesComponent>(CT.Species);
      return speciesComp?.speciesId === speciesId;
    });

    if (survivors.length === 0) return;

    // Find the highest generation among survivors for lineage tracking
    let maxGeneration = 0;
    for (const entity of survivors) {
      const genetic = entity.getComponent<GeneticComponent>(CT.Genetic);
      if (genetic) {
        maxGeneration = Math.max(maxGeneration, genetic.generation);
      }
    }

    const extinctionDate = new Date().toISOString();

    for (const entity of survivors) {
      // Skip if already flagged (idempotency guard)
      if (entity.getComponent(CT.ExtinctionSurvivor)) continue;

      // 1. Add extinction survivor component
      entity.addComponent(createExtinctionSurvivorComponent({
        extinctionSurvivor: true,
        extinctionDate,
        sourceGame: 'mvee',
        extinctSpeciesId: speciesId,
        finalMetrics,
        knownSurvivorCount: survivorCount,
        lastSurvivorGeneration: maxGeneration,
      }));

      // 2. Disable reproduction
      const speciesComp = entity.getComponent<SpeciesComponent>(CT.Species);
      if (!speciesComp) {
        throw new Error(
          `[extinction_survivor_system] Entity ${entity.id} matched species query but missing SpeciesComponent`
        );
      }
      speciesComp.canReproduce = false;
    }

    ctx.emit('species:survivors_flagged', {
      speciesId,
      survivorCount: survivors.length,
      lastSurvivorGeneration: maxGeneration,
    });
  }
}
