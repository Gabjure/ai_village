/**
 * DiscoveryNamingSystem
 *
 * Detects world-first events (milestones, deity emergence, first death, etc.)
 * and prompts the player to name them. Names persist in save state and are
 * injected into NPC conversations via LLM prompt context.
 *
 * Priority 870: After MilestoneSystem (860), before metrics.
 */

import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import type { SystemId } from '../types.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { World } from '../ecs/World.js';
import type { Entity } from '../ecs/Entity.js';
import { EntityImpl, createEntityId } from '../ecs/Entity.js';
import {
  DiscoveryNamingComponent,
  createDiscoveryNamingComponent,
  type DiscoveryCategory,
} from '../components/DiscoveryNamingComponent.js';

export class DiscoveryNamingSystem extends BaseSystem {
  public readonly id: SystemId = 'discovery-naming';
  public readonly priority: number = 870;
  public readonly requiredComponents: ReadonlyArray<CT> = [];
  public readonly activationComponents = [CT.DiscoveryNaming] as const;
  protected readonly throttleInterval = 100; // Every 5 seconds

  private registryEntityId: string | null = null;

  /**
   * Get or create the singleton discovery naming entity.
   */
  private getOrCreateRegistry(world: World): { entity: Entity; component: DiscoveryNamingComponent } | null {
    // Check cache
    if (this.registryEntityId) {
      const existing = world.getEntity(this.registryEntityId);
      if (existing) {
        const comp = existing.getComponent(CT.DiscoveryNaming) as DiscoveryNamingComponent | undefined;
        if (comp) return { entity: existing, component: comp };
      }
      this.registryEntityId = null;
    }

    // Find existing
    const entities = world.query().with(CT.DiscoveryNaming).executeEntities();
    if (entities.length > 0) {
      this.registryEntityId = entities[0]!.id;
      const comp = entities[0]!.getComponent(CT.DiscoveryNaming) as DiscoveryNamingComponent | undefined;
      if (comp) return { entity: entities[0]!, component: comp };
    }

    // Create new
    const entity = new EntityImpl(createEntityId(), world.tick);
    entity.addComponent(createDiscoveryNamingComponent());
    world.addEntity(entity);
    this.registryEntityId = entity.id;

    const comp = entity.getComponent(CT.DiscoveryNaming) as DiscoveryNamingComponent;
    return { entity, component: comp };
  }

  /**
   * Get current game day from time entity.
   */
  private getDay(world: World): number {
    const timeEntities = world.query().with(CT.Time).executeEntities();
    if (timeEntities.length === 0) return 0;
    const time = timeEntities[0]!.getComponent(CT.Time) as { day?: number } | undefined;
    return time?.day ?? 0;
  }

  /**
   * Queue a discovery for naming if it hasn't been named or queued already.
   */
  private queueDiscovery(
    comp: DiscoveryNamingComponent,
    category: DiscoveryCategory,
    description: string,
    tick: number,
    day: number,
    entityIds: string[] = []
  ): void {
    if (comp.isNamed(category) || comp.isPending(category)) return;
    comp.queueForNaming(category, description, tick, day, entityIds);
  }

  /**
   * Initialize event listeners for world-first events.
   */
  protected onInitialize(world: World): void {
    // First building completed
    world.eventBus.on('building:completed', (event) => {
      const registry = this.getOrCreateRegistry(world);
      if (!registry) return;
      const tick = Number(world.tick);
      const day = this.getDay(world);
      this.queueDiscovery(
        registry.component,
        'first_building',
        'The first structure has been completed.',
        tick,
        day
      );
    });

    // First agent death
    world.eventBus.on('agent:death', (event) => {
      const registry = this.getOrCreateRegistry(world);
      if (!registry) return;
      const data = event.data as { agentName?: string; cause?: string } | undefined;
      const tick = Number(world.tick);
      const day = this.getDay(world);
      const name = data?.agentName ?? 'an agent';
      const cause = data?.cause ?? 'unknown causes';
      this.queueDiscovery(
        registry.component,
        'first_death',
        `${name} has perished from ${cause} — the first death in this world.`,
        tick,
        day
      );
    });

    // First magic learned
    world.eventBus.on('magic:spell_learned', (event) => {
      const registry = this.getOrCreateRegistry(world);
      if (!registry) return;
      const tick = Number(world.tick);
      const day = this.getDay(world);
      this.queueDiscovery(
        registry.component,
        'first_magic',
        'The first spell has been woven into the fabric of reality.',
        tick,
        day
      );
    });

    // First deity emergence
    world.eventBus.on('deity:emerged', (event) => {
      const registry = this.getOrCreateRegistry(world);
      if (!registry) return;
      const data = event.data as { deityName?: string } | undefined;
      const tick = Number(world.tick);
      const day = this.getDay(world);
      const deityName = data?.deityName ?? 'A divine being';
      this.queueDiscovery(
        registry.component,
        'first_deity',
        `${deityName} has emerged from the collective faith of the people.`,
        tick,
        day
      );
    });

    // First disaster
    world.eventBus.on('disaster:occurred', (event) => {
      const registry = this.getOrCreateRegistry(world);
      if (!registry) return;
      const data = event.data as { disasterType?: string } | undefined;
      const tick = Number(world.tick);
      const day = this.getDay(world);
      const type = data?.disasterType ?? 'A catastrophe';
      this.queueDiscovery(
        registry.component,
        'first_disaster',
        `${type} has struck — the first disaster to befall this world.`,
        tick,
        day
      );
    });

    // First civilizational legend
    world.eventBus.on('civilizational_legend:born', (event) => {
      const registry = this.getOrCreateRegistry(world);
      if (!registry) return;
      const data = event.data as { triggerType?: string; agentName?: string } | undefined;
      const tick = Number(world.tick);
      const day = this.getDay(world);
      const agentName = data?.agentName ?? 'the people';
      this.queueDiscovery(
        registry.component,
        'first_legend',
        `A legend has been born among ${agentName}'s people.`,
        tick,
        day
      );
    });

    // First consciousness awakened (uplift)
    world.eventBus.on('consciousness_awakened', (event) => {
      const registry = this.getOrCreateRegistry(world);
      if (!registry) return;
      const data = event.data as { entityName?: string; sourceSpecies?: string } | undefined;
      const tick = Number(world.tick);
      const day = this.getDay(world);
      const entityName = data?.entityName ?? 'A being';
      const species = data?.sourceSpecies ?? 'unknown origin';
      this.queueDiscovery(
        registry.component,
        'first_consciousness',
        `${entityName} of ${species} has awakened to full consciousness.`,
        tick,
        day
      );
    });

    // First settlement — triggered when milestone system awards first_building_completed
    // (the first building marks the birth of a settlement)
    world.eventBus.on('milestone:achieved', (event) => {
      const data = event.data as { milestoneId?: string } | undefined;
      if (data?.milestoneId !== 'first_building_completed') return;
      const registry = this.getOrCreateRegistry(world);
      if (!registry) return;
      const tick = Number(world.tick);
      const day = this.getDay(world);
      this.queueDiscovery(
        registry.component,
        'first_settlement',
        'The first structure rises — a settlement is born.',
        tick,
        day
      );
    });
  }

  /**
   * Periodic update — emits notification events for pending discoveries.
   */
  protected onUpdate(ctx: SystemContext): void {
    const registry = this.getOrCreateRegistry(ctx.world);
    if (!registry) return;

    // Check for pending discoveries that need player input
    const pending = registry.component.getNextPending();
    if (pending) {
      // Emit event for UI to show naming modal
      ctx.world.eventBus.emit({
        type: 'discovery:naming_prompt',
        data: {
          category: pending.category,
          description: pending.description,
          eventDay: pending.eventDay,
          entityIds: pending.entityIds,
        },
        source: 'discovery_naming_system',
      });
    }
  }
}
