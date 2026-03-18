/**
 * WeatherEcologySystem - Cross-system weather feedback
 *
 * Bridges WeatherSystem output to plant and animal systems:
 * - Storm weather increases wild animal stress (drives shelter-seeking via flee state)
 * - Broadcasts ambient temperature from weather so PlantSystem can use accurate values
 * - Clears storm stress when weather normalizes
 *
 * Priority: 10 (after WeatherSystem 5, before AnimalSystem 15 and PlantSystem 20)
 * Throttle: 100 ticks (~5 seconds) — weather changes slowly
 *
 * @see WeatherSystem (priority 5) — produces WeatherComponent
 * @see AnimalSystem (priority 15) — reads animal.stress for state determination
 * @see PlantSystem (priority 20) — subscribes to ecology:weather_temperature
 */
import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import type { SystemId, ComponentType } from '../types.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { World } from '../ecs/World.js';
import type { EventBus } from '../events/EventBus.js';
import type { WeatherComponent } from '../components/WeatherComponent.js';
import { setMutationRate, clearMutationRate } from '../components/MutationVectorComponent.js';
import type { AnimalComponent } from '../components/AnimalComponent.js';
import { EntityImpl } from '../ecs/Entity.js';

/** Stress added per second to wild animals caught in a storm */
const STORM_STRESS_PER_SECOND = 3.0;

/** Base world temperature (°C) used when no TemperatureSystem data is available */
const BASE_WORLD_TEMP = 20;

/** Mutation source key for storm stress — used to clear it when storm ends */
const STORM_STRESS_SOURCE = 'weather_ecology_storm';

export class WeatherEcologySystem extends BaseSystem {
  public readonly id: SystemId = 'weather_ecology';
  public readonly priority: number = 10;
  public readonly requiredComponents: ReadonlyArray<ComponentType> = [];
  protected readonly throttleInterval = 100; // Every 5 seconds

  /** Cached weather entity ID to avoid per-tick queries */
  private weatherEntityId: string | null = null;

  /** Whether a storm was active on the last update (used to detect clearing) */
  private wasStorming = false;

  protected onInitialize(_world: World, _eventBus: EventBus): void {
    // No event subscriptions needed — we poll WeatherComponent directly
  }

  protected onUpdate(ctx: SystemContext): void {
    const weather = this.getWeather(ctx.world);

    // Broadcast ambient temperature for PlantSystem
    const ambientTemp = BASE_WORLD_TEMP + (weather?.tempModifier ?? 0);
    ctx.world.eventBus.emit({
      type: 'ecology:weather_temperature',
      source: 'weather_ecology',
      data: { temperature: ambientTemp },
    });

    const isStorming = weather !== null &&
      (weather.weatherType === 'storm') &&
      weather.intensity > 0.2;

    if (isStorming) {
      this.applyStormStress(ctx);
    } else if (this.wasStorming) {
      // Storm just cleared — remove storm stress from all wild animals
      this.clearStormStress(ctx);
    }

    this.wasStorming = isStorming;
  }

  /**
   * Apply storm stress mutation to all wild animals.
   * AnimalSystem.determineState() transitions to 'fleeing' at stress > 70,
   * which drives animals to seek cover (shelter-seeking behavior).
   */
  private applyStormStress(ctx: SystemContext): void {
    // Cache query before loop per CLAUDE.md performance guidelines
    const animalEntities = ctx.world
      .query()
      .with(CT.Animal)
      .executeEntities();

    for (const entity of animalEntities) {
      const impl = entity as EntityImpl;
      const animal = impl.getComponent<AnimalComponent>(CT.Animal);
      if (!animal || !animal.wild) continue;

      setMutationRate(entity, 'animal.stress', STORM_STRESS_PER_SECOND, {
        min: 0,
        max: 100,
        source: STORM_STRESS_SOURCE,
      });
    }
  }

  /**
   * Clear storm stress mutation from all wild animals when storm ends.
   */
  private clearStormStress(ctx: SystemContext): void {
    const animalEntities = ctx.world
      .query()
      .with(CT.Animal)
      .executeEntities();

    for (const entity of animalEntities) {
      const impl = entity as EntityImpl;
      const animal = impl.getComponent<AnimalComponent>(CT.Animal);
      if (!animal || !animal.wild) continue;

      clearMutationRate(entity, 'animal.stress');
    }
  }

  /**
   * Get the WeatherComponent from the singleton weather entity.
   * Caches the entity ID to avoid repeated queries.
   */
  private getWeather(world: World): WeatherComponent | null {
    if (this.weatherEntityId) {
      const entity = world.getEntity(this.weatherEntityId);
      if (entity) {
        const impl = entity as EntityImpl;
        return impl.getComponent<WeatherComponent>(CT.Weather) ?? null;
      }
      // Entity gone — reset cache
      this.weatherEntityId = null;
    }

    // Query for weather entity
    const weatherEntities = world.query().with(CT.Weather).executeEntities();
    if (weatherEntities.length === 0) return null;

    this.weatherEntityId = weatherEntities[0]!.id;
    const impl = weatherEntities[0] as EntityImpl;
    return impl.getComponent<WeatherComponent>(CT.Weather) ?? null;
  }
}
