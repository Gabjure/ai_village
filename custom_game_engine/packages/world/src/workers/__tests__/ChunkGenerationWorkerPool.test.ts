/**
 * Tests for ChunkGenerationWorkerPool
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChunkGenerationWorkerPool } from '../ChunkGenerationWorkerPool.js';

describe('ChunkGenerationWorkerPool', () => {
  let workerPool: ChunkGenerationWorkerPool | null = null;

  beforeEach(() => {
    // Skip if Workers not available (Node.js test environment)
    if (typeof Worker === 'undefined') {
      return;
    }

    workerPool = new ChunkGenerationWorkerPool(2, 'test-seed');
  });

  afterEach(() => {
    if (workerPool) {
      workerPool.terminate();
      workerPool = null;
    }
  });

  it.skipIf(typeof Worker === 'undefined')('should create worker pool', () => {
    if (!workerPool) throw new Error('Worker pool not initialized');
    const status = workerPool.getStatus();
    expect(status.numWorkers).toBe(2);
    expect(status.pendingRequests).toBe(0);
  });

  it.skipIf(typeof Worker === 'undefined')('should generate chunk in worker', async () => {
    if (!workerPool) throw new Error('Worker pool not initialized');
    const tiles = await workerPool.generateChunk(0, 0);
    expect(tiles).toBeDefined();
    expect(Array.isArray(tiles)).toBe(true);
    expect(tiles.length).toBeGreaterThan(0);
  });

  it.skipIf(typeof Worker === 'undefined')('should handle multiple concurrent requests', async () => {
    if (!workerPool) throw new Error('Worker pool not initialized');
    const promises = [
      workerPool.generateChunk(0, 0),
      workerPool.generateChunk(1, 0),
      workerPool.generateChunk(0, 1),
      workerPool.generateChunk(1, 1),
    ];

    const results = await Promise.all(promises);
    expect(results).toHaveLength(4);
    results.forEach((tiles) => {
      expect(tiles).toBeDefined();
      expect(Array.isArray(tiles)).toBe(true);
    });
  });

  it.skipIf(typeof Worker === 'undefined')('should terminate workers', () => {
    if (!workerPool) throw new Error('Worker pool not initialized');
    workerPool.terminate();
    const status = workerPool.getStatus();
    expect(status.numWorkers).toBe(0);
  });
});
