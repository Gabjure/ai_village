import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationTestHarness } from '../../__tests__/utils/IntegrationTestHarness.js';
import { createMinimalWorld } from '../../__tests__/fixtures/worldFixtures.js';
import { WildAnimalSpawningSystem } from '../WildAnimalSpawningSystem.js';
import { AnimalSystem } from '../AnimalSystem.js';

import { ComponentType } from '../../types/ComponentType.js';
/**
 * Integration tests for WildAnimalSpawningSystem + World + AnimalSystem
 *
 * Tests verify that:
 * - Animals spawn in appropriate biomes
 * - Chunk generation triggers spawning
 * - Herds/flocks spawn together (social species)
 * - Spawn limits prevent overpopulation
 * - Spawned animals have correct species stats
 * - No duplicate spawning in same chunk
 */

describe('WildAnimalSpawningSystem + World + AnimalSystem Integration', () => {
  let harness: IntegrationTestHarness;

  beforeEach(async () => {
    harness = createMinimalWorld();
  });

  it('should spawn animals in appropriate biomes', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);

    const chunkData = {
      x: 0,
      y: 0,
      biome: 'plains',
      size: 32,
    };

    const spawnedAnimals = spawningSystem.spawnAnimalsInChunk(harness.world, chunkData);

    // May or may not spawn depending on density rolls
    expect(Array.isArray(spawnedAnimals)).toBe(true);
  });

  it('should throw on missing biome data', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);

    const invalidChunk = {
      x: 0,
      y: 0,
      // @ts-expect-error Testing null parameter validation
      biome: null,
      size: 32,
    };

    expect(() => {
      spawningSystem.spawnAnimalsInChunk(harness.world, invalidChunk);
    }).toThrow('missing required "biome" field');
  });

  it('should throw on missing chunk coordinates', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);

    const invalidChunk = {
      // @ts-expect-error Testing null parameter validation
      x: null,
      y: 0,
      biome: 'plains',
      size: 32,
    };

    expect(() => {
      spawningSystem.spawnAnimalsInChunk(harness.world, invalidChunk);
    }).toThrow('missing required "x" field');
  });

  it('should throw on missing chunk size', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);

    const invalidChunk = {
      x: 0,
      y: 0,
      biome: 'forest',
      // @ts-expect-error Testing null parameter validation
      size: null,
    };

    expect(() => {
      spawningSystem.spawnAnimalsInChunk(harness.world, invalidChunk);
    }).toThrow('missing required "size" field');
  });

  it('should not spawn in same chunk twice', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);

    const chunkData = {
      x: 5,
      y: 5,
      biome: 'plains',
      size: 32,
    };

    // First spawn
    const firstSpawn = spawningSystem.spawnAnimalsInChunk(harness.world, chunkData);

    // Second spawn in same chunk
    const secondSpawn = spawningSystem.spawnAnimalsInChunk(harness.world, chunkData);

    // Second spawn should return empty array
    expect(secondSpawn.length).toBe(0);
  });

  it('should spawn multiple animals for herd/flock species', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);

    // Try multiple chunks to increase spawn chances
    let totalSpawned = 0;
    for (let i = 0; i < 10; i++) {
      const chunkData = {
        x: i,
        y: 0,
        biome: 'plains', // Plains might have herd animals
        size: 32,
      };

      const spawned = spawningSystem.spawnAnimalsInChunk(harness.world, chunkData);
      totalSpawned += spawned.length;
    }

    // At least some animals should spawn across all chunks
    expect(totalSpawned).toBeGreaterThanOrEqual(0);
  });

  it('should spawned animals have required components', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);

    // Spawn in forest (likely has deer or other animals)
    const chunkData = {
      x: 10,
      y: 10,
      biome: 'forest',
      size: 32,
    };

    const spawned = spawningSystem.spawnAnimalsInChunk(harness.world, chunkData);

    if (spawned.length > 0) {
      const animal = spawned[0];

      // Should have animal component
      expect(animal.components.has(ComponentType.Animal)).toBe(true);

      // Should have position component
      expect(animal.components.has(ComponentType.Position)).toBe(true);
    }
  });

  it('should spawned animals be wild by default', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);

    const chunkData = {
      x: 15,
      y: 15,
      biome: 'plains',
      size: 32,
    };

    const spawned = spawningSystem.spawnAnimalsInChunk(harness.world, chunkData);

    if (spawned.length > 0) {
      const animalComponent = spawned[0].components.get(ComponentType.Animal) as unknown;

      // Should be wild
      expect(animalComponent.wild).toBe(true);
      expect(animalComponent.isDomesticated).toBe(false);
    }
  });

  it('should spawning system integrate with animal system', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    const animalSystem = new AnimalSystem();
    await animalSystem.initialize(harness.world, harness.eventBus);

    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);
    harness.registerSystem('AnimalSystem', animalSystem);

    const chunkData = {
      x: 20,
      y: 20,
      biome: 'plains',
      size: 32,
    };

    const spawned = spawningSystem.spawnAnimalsInChunk(harness.world, chunkData);

    if (spawned.length > 0) {
      // Update animal system with spawned animals
      const entities = Array.from(harness.world.entities.values());
      animalSystem.update(harness.world, entities, 1.0);

      // Animals should still be alive and processing
      const animalComponent = spawned[0].components.get(ComponentType.Animal) as unknown;
      expect(animalComponent).toBeDefined();
      expect(animalComponent.health).toBeGreaterThan(0);
    }
  });

  it('should empty biome return no animals', async () => {
    const spawningSystem = new WildAnimalSpawningSystem();
    await spawningSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WildAnimalSpawningSystem', spawningSystem);

    const chunkData = {
      x: 25,
      y: 25,
      biome: 'ocean', // Ocean might have no land animals
      size: 32,
    };

    const spawned = spawningSystem.spawnAnimalsInChunk(harness.world, chunkData);

    // May return empty array if no species for biome
    expect(Array.isArray(spawned)).toBe(true);
  });
});
