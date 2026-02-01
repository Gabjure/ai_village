/**
 * Integration tests for WorldSerializer terrain serialization
 *
 * Tests the full save/load cycle for terrain data including:
 * - Chunk serialization through WorldSerializer
 * - TerrainSnapshot integration with UniverseSnapshot
 * - Round-trip data integrity
 * - Compression metadata preservation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorldSerializer } from '../WorldSerializer.js';
import { World } from '../../ecs/World.js';
import { EventBusImpl } from '../../events/EventBus.js';
import { ChunkManager } from '@ai-village/world';
import type { UniverseSnapshot } from '../types.js';

// Type helpers for testing
type EntityWithMethods = {
  addComponent?: (comp: unknown) => void;
  updateComponent?: (type: string, updater: (current: unknown) => unknown) => void;
  getComponent?: (type: string) => unknown;
  hasComponent?: (type: string) => boolean;
};
type WorldWithMethods = Record<string, unknown> & {
  getEntity?: (id: string) => unknown;
  addEntity?: (entity: unknown) => void;
  query?: unknown;
  getSystem?: (name: string) => unknown;
};

// Helper: Create test world with ChunkManager
function createTestWorld(): World {
  const eventBus = new EventBusImpl();
  const chunkManager = new ChunkManager(2); // loadRadius = 2
  const world = new World(eventBus, chunkManager);
  return world;
}

// Helper: Generate test terrain in chunks
function generateTestTerrain(chunkManager: ChunkManager, numChunks: number = 5) {
  for (let i = 0; i < numChunks; i++) {
    const chunk = chunkManager.getChunk(i, 0);

    // Mark as generated and fill with test data
    chunk.generated = true;

    // Create varied tile data to test different compression strategies
    for (let j = 0; j < chunk.tiles.length; j++) {
      const tile = chunk.tiles[j];
      if (!tile) continue;

      // Vary terrain based on chunk to test different compressions
      if (i === 0) {
        // Chunk 0: Uniform (will use RLE)
        (tile as Record<string, unknown>).terrain = 'grass';
        (tile as Record<string, unknown>).biome = 'plains';
      } else if (i === 1) {
        // Chunk 1: Mostly uniform (will use delta)
        (tile as Record<string, unknown>).terrain = j < 900 ? 'grass' : 'dirt';
        (tile as Record<string, unknown>).biome = 'plains';
      } else {
        // Other chunks: Varied (will use full)
        (tile as Record<string, unknown>).terrain = j % 2 === 0 ? 'grass' : 'dirt';
        (tile as Record<string, unknown>).biome = j % 3 === 0 ? 'plains' : 'forest';
        (tile as Record<string, unknown>).elevation = j % 5;
      }

      // Add some test data to verify preservation
      (tile as Record<string, unknown>).moisture = 50 + (j % 10);
      (tile as Record<string, unknown>).fertility = 60 + (i * 5);
    }
  }
}

describe('WorldSerializer terrain integration', () => {
  let serializer: WorldSerializer;

  beforeEach(() => {
    serializer = new WorldSerializer();
  });

  it('should serialize terrain when ChunkManager is present', async () => {
    // Setup: Create world with terrain
    const world = createTestWorld();
    const chunkManager = world.getChunkManager()!;
    generateTestTerrain(chunkManager, 3);

    // Act: Serialize world
    const snapshot = await serializer.serializeWorld(
      world,
      'test-universe-id',
      'Test Universe'
    );

    // Assert: Terrain data should be present
    expect(snapshot.worldState.terrain).not.toBeNull();
    expect(snapshot.worldState.terrain?.generatedChunkCount).toBe(3);
    expect(snapshot.worldState.terrain?.chunkIndex).toHaveLength(3);

    // Verify compression strategies were applied
    const chunks = snapshot.worldState.terrain?.chunks;
    expect(chunks).toBeDefined();
    expect(chunks!['0,0']).toBeDefined();
  });

  it('should serialize terrain as null when ChunkManager not set', async () => {
    // Setup: World without ChunkManager
    const eventBus = new EventBusImpl();
    const world = new World(eventBus); // No ChunkManager

    // Act: Serialize world
    const snapshot = await serializer.serializeWorld(
      world,
      'test-universe-id',
      'Test Universe'
    );

    // Assert: Terrain should be null
    expect(snapshot.worldState.terrain).toBeNull();
  });

  it('should restore terrain through full save/load cycle', async () => {
    // Setup: Create world with test terrain
    const sourceWorld = createTestWorld();
    const sourceChunkManager = sourceWorld.getChunkManager()!;
    generateTestTerrain(sourceChunkManager, 5);

    // Remember original data for comparison
    const originalChunk0 = sourceChunkManager.getChunk(0, 0);
    const originalTile0 = originalChunk0.tiles[0];
    const originalTerrain = (originalTile0 as Record<string, unknown>).terrain;
    const originalMoisture = (originalTile0 as Record<string, unknown>).moisture;

    // Act 1: Serialize
    const snapshot = await serializer.serializeWorld(
      sourceWorld,
      'test-universe-id',
      'Test Universe'
    );

    // Act 2: Deserialize into new world
    const targetWorld = createTestWorld();
    await serializer.deserializeWorld(snapshot, targetWorld);

    // Assert: Terrain should match original
    const targetChunkManager = targetWorld.getChunkManager()!;
    const restoredChunk0 = targetChunkManager.getChunk(0, 0);
    const restoredTile0 = restoredChunk0.tiles[0];

    expect(restoredChunk0.generated).toBe(true);
    expect((restoredTile0 as Record<string, unknown>).terrain).toBe(originalTerrain);
    expect((restoredTile0 as Record<string, unknown>).moisture).toBe(originalMoisture);
  });

  it('should preserve all tile properties through save/load', async () => {
    // Setup: Create chunk with specific tile data
    const world = createTestWorld();
    const chunkManager = world.getChunkManager()!;
    const chunk = chunkManager.getChunk(0, 0);
    chunk.generated = true;

    // Set specific values on first tile
    const tile = chunk.tiles[0] as unknown;
    tile.terrain = 'dirt';
    tile.biome = 'desert';
    tile.elevation = 5;
    tile.moisture = 25;
    tile.fertility = 75;
    tile.tilled = true;
    tile.plantability = 80;
    tile.fertilized = true;

    // Serialize and deserialize
    const snapshot = await serializer.serializeWorld(world, 'test-id', 'Test');
    const newWorld = createTestWorld();
    await serializer.deserializeWorld(snapshot, newWorld);

    // Assert: All properties preserved
    const restoredTile = newWorld.getChunkManager()!.getChunk(0, 0).tiles[0] as unknown;
    expect(restoredTile.terrain).toBe('dirt');
    expect(restoredTile.biome).toBe('desert');
    expect(restoredTile.elevation).toBe(5);
    expect(restoredTile.moisture).toBe(25);
    expect(restoredTile.fertility).toBe(75);
    expect(restoredTile.tilled).toBe(true);
    expect(restoredTile.plantability).toBe(80);
    expect(restoredTile.fertilized).toBe(true);
  });

  it('should preserve chunk count and indices', async () => {
    // Setup: Generate specific number of chunks
    const world = createTestWorld();
    const chunkManager = world.getChunkManager()!;
    generateTestTerrain(chunkManager, 7);

    // Serialize
    const snapshot = await serializer.serializeWorld(world, 'test-id', 'Test');

    // Assert: Metadata matches
    expect(snapshot.worldState.terrain?.generatedChunkCount).toBe(7);
    expect(snapshot.worldState.terrain?.chunkIndex).toHaveLength(7);

    // Verify each chunk is indexed correctly
    const indices = snapshot.worldState.terrain?.chunkIndex!;
    expect(indices.find(idx => idx.key === '0,0')).toBeDefined();
    expect(indices.find(idx => idx.key === '6,0')).toBeDefined();
  });

  it('should handle empty ChunkManager gracefully', async () => {
    // Setup: World with ChunkManager but no generated chunks
    const world = createTestWorld();

    // Act: Serialize
    const snapshot = await serializer.serializeWorld(world, 'test-id', 'Test');

    // Assert: Terrain data should exist but be empty
    expect(snapshot.worldState.terrain).not.toBeNull();
    expect(snapshot.worldState.terrain?.generatedChunkCount).toBe(0);
    expect(snapshot.worldState.terrain?.chunkIndex).toHaveLength(0);
  });

  it('should not interfere with entity serialization', async () => {
    // Setup: World with both terrain and entities
    const world = createTestWorld();
    const chunkManager = world.getChunkManager()!;
    generateTestTerrain(chunkManager, 2);

    // Add a test entity
    const entity = world.createEntity();

    // Serialize
    const snapshot = await serializer.serializeWorld(world, 'test-id', 'Test');

    // Assert: Both terrain and entities present
    expect(snapshot.worldState.terrain).not.toBeNull();
    expect(snapshot.entities.length).toBe(1);
    expect(snapshot.entities[0].id).toBe(entity.id);
  });

  it('should include terrain checksums in snapshot', async () => {
    // Setup
    const world = createTestWorld();
    const chunkManager = world.getChunkManager()!;
    generateTestTerrain(chunkManager, 3);

    // Serialize
    const snapshot = await serializer.serializeWorld(world, 'test-id', 'Test');

    // Assert: Checksums present
    expect(snapshot.worldState.terrain?.checksums).toBeDefined();
    expect(snapshot.worldState.terrain?.checksums.overall).toBeDefined();
    expect(snapshot.worldState.terrain?.checksums.perChunk).toBeDefined();
    expect(Object.keys(snapshot.worldState.terrain?.checksums.perChunk!)).toHaveLength(3);
  });
});
