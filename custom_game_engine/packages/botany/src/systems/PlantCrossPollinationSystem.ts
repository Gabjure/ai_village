import type {
  SystemId,
  ComponentType,
  WorldMutator,
  PlantComponent,
  PlantSpecies,
  PlantCategory,
  EventBus,
} from '@ai-village/core';
import {
  BaseSystem,
  type SystemContext,
  ComponentType as CT,
  EntityImpl,
  canHybridizePlants,
  createHybridSeed,
} from '@ai-village/core';

/**
 * PlantCrossPollinationSystem drives autonomous cross-pollination between
 * compatible flowering plants of the same category but different species.
 *
 * Priority: 42 — after PlantSystem (40), before PlantDiseaseSystem (50)
 * Throttle: every 200 ticks (~10 seconds at 20 TPS) — pollination is slow
 *
 * @see PlantSystem (priority 40) — updates plant stage and flowerCount
 * @see PlantDiseaseSystem (priority 50) — runs after this system
 */

/** Squared pollination radius — 3 tiles. Avoids Math.sqrt in hot path. */
const POLLINATION_RADIUS_SQUARED = 3 * 3; // 9

/** Per-update probability that a compatible pair cross-pollinates */
const CROSS_POLLINATION_CHANCE = 0.15;

export class PlantCrossPollinationSystem extends BaseSystem {
  public readonly id: SystemId = 'plant_cross_pollination' as SystemId;
  public readonly priority: number = 42;
  public readonly requiredComponents: ReadonlyArray<ComponentType> = [CT.Plant, CT.Position];

  /** Every 200 ticks (~10 seconds at 20 TPS) */
  protected readonly throttleInterval = 200;

  /**
   * Tracks which plant pairs have already cross-pollinated during the
   * current flowering cycle. Keyed by `"${minId}:${maxId}"` (sorted).
   * Cleared when no plants are in flowering stage.
   */
  private readonly pollinatedPairsThisCycle: Set<string> = new Set();

  protected onInitialize(_world: WorldMutator, _eventBus: EventBus): void {
    // No event subscriptions needed — we poll plant components directly
  }

  protected onUpdate(ctx: SystemContext): void {
    const world = ctx.world;

    // PERFORMANCE: Cache the full plant query BEFORE the entity loop.
    // This ensures O(plants) query cost rather than O(flowering × plants).
    const allPlantEntities = world.query().with(CT.Plant).executeEntities();

    // Filter to only flowering plants with at least one flower
    const floweringPlants: Array<{ entity: EntityImpl; plant: PlantComponent }> = [];

    for (const entity of allPlantEntities) {
      const impl = entity as EntityImpl;
      const plant = impl.getComponent<PlantComponent>(CT.Plant);
      if (!plant) continue;
      if (plant.stage !== 'flowering') continue;
      if (plant.flowerCount <= 0) continue;
      floweringPlants.push({ entity: impl, plant });
    }

    // If no plants are currently flowering, clear the per-cycle tracking set
    if (floweringPlants.length === 0) {
      this.pollinatedPairsThisCycle.clear();
      return;
    }

    // Process each flowering plant as a potential pollen donor
    for (const { entity: entityA, plant: plantA } of floweringPlants) {
      const posA = plantA.position;

      for (const { entity: entityB, plant: plantB } of floweringPlants) {
        // Skip self
        if (entityA.id === entityB.id) continue;

        // Build a canonical pair key (sorted IDs so A:B === B:A)
        const pairKey = entityA.id < entityB.id
          ? `${entityA.id}:${entityB.id}`
          : `${entityB.id}:${entityA.id}`;

        // Skip pairs that already pollinated this flowering cycle
        if (this.pollinatedPairsThisCycle.has(pairKey)) continue;

        // PERFORMANCE: Check squared distance — no Math.sqrt in hot path
        const posB = plantB.position;
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > POLLINATION_RADIUS_SQUARED) continue;

        // Must be different species for hybridization to make sense
        if (plantA.speciesId === plantB.speciesId) continue;

        // Both plants must have genetics defined
        if (!plantA.genetics || !plantB.genetics) continue;

        // Resolve species category from the world species registry
        const categoryA = this.getSpeciesCategory(plantA.speciesId, world);
        const categoryB = this.getSpeciesCategory(plantB.speciesId, world);

        // Skip if we cannot determine category (registry unavailable)
        if (categoryA === null || categoryB === null) continue;

        // canHybridizePlants: only same-category plants can cross-breed
        if (!canHybridizePlants(categoryA, categoryB)) continue;

        // Probability gate — 15% chance per update cycle
        if (Math.random() >= CROSS_POLLINATION_CHANCE) continue;

        // Attempt hybridization via PlantGenetics
        const result = createHybridSeed(
          plantA,
          plantB,
          plantA.speciesId,
          plantB.speciesId,
          {
            parentEntityId1: entityA.id,
            parentEntityId2: entityB.id,
            gameTime: world.tick,
          }
        );

        if (!result.success) {
          // createHybridSeed returns success=false only when genetics are missing.
          // We verified genetics above, so this is unexpected.
          console.error(
            `[plant_cross_pollination] Hybridization failed unexpectedly for pair ${entityA.id}:${entityB.id} — reason: ${result.reason}`
          );
          continue;
        }

        // Mark pair as pollinated for this flowering cycle
        this.pollinatedPairsThisCycle.add(pairKey);

        // The hybrid seed is now "in the system" as a bonus seed on plantA
        plantA.seedsProduced += 1;

        // Emit cross-pollination discovery event
        const hybridSpeciesId = result.hybridName ?? `hybrid_${plantA.speciesId}_x_${plantB.speciesId}`;
        this.events.emit('plant:crossPollinated', {
          plantId: entityA.id,
          partnerId: entityB.id,
          hybridSpeciesId,
          hybridName: hybridSpeciesId,
        });
      }
    }
  }

  /**
   * Look up a species category from the world's plant species registry.
   *
   * The world may expose a species registry via a `plantSpeciesRegistry`
   * property. We use duck-typed access to avoid hard-coupling to a specific
   * world implementation or package boundary.
   *
   * Returns null if the registry is unavailable or the species is unknown.
   * PERFORMANCE: O(1) map lookup; no per-tick query.
   */
  private getSpeciesCategory(
    speciesId: string,
    world: WorldMutator
  ): PlantCategory | null {
    type WithRegistry = {
      plantSpeciesRegistry?: { get?: (id: string) => PlantSpecies | undefined };
    };
    const registry = (world as unknown as WithRegistry).plantSpeciesRegistry;
    if (!registry || typeof registry.get !== 'function') return null;

    const species = registry.get(speciesId);
    if (!species) return null;

    return species.category;
  }
}
