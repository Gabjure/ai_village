/**
 * Unit tests for SaveLoadService.exportPostcard()
 *
 * Verifies postcard generation + upload with correct metadata structure.
 * MUL-3658: Phase 1a — Postcard export to multiverse server.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UniversePostcard } from '../../services/WorldSnapshotService.js';
import { multiverseCoordinator } from '../../multiverse/MultiverseCoordinator.js';

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn());
const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;

// The mock world reference — we'll use this in both spyOn and test calls
const MOCK_WORLD = { tick: 5000 };

const mockPostcard: UniversePostcard = {
  capturedAt: '2026-03-25T12:00:00.000Z',
  simulationTick: 5000,
  agentCount: 12,
  notableAgents: [
    { name: 'Elder Sage', species: 'norn', age: 4.2 },
  ],
  recentLegends: ['The founding of the first village'],
  dominantBiome: 'grassland',
  activeMagicParadigms: ['elemental', 'divine'],
  populationBySpecies: { norn: 8, ettin: 4 },
  worldAge: 3.5,
  epochTitle: 'The Age of Beginnings',
};

describe('SaveLoadService.exportPostcard', () => {
  let SaveLoadService: typeof import('../SaveLoadService.js').SaveLoadService;
  let WorldSnapshotService: typeof import('../../services/WorldSnapshotService.js').WorldSnapshotService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Spy on the coordinator to return our mock world
    vi.spyOn(multiverseCoordinator, 'getAllUniverses').mockReturnValue(
      new Map([
        ['universe:test-123', {
          world: MOCK_WORLD,
          config: { name: 'Test Universe' },
        }],
      ]) as never
    );

    const slModule = await import('../SaveLoadService.js');
    SaveLoadService = slModule.SaveLoadService;
    const wsModule = await import('../../services/WorldSnapshotService.js');
    WorldSnapshotService = wsModule.WorldSnapshotService;
  });

  it('throws if player ID is not set', async () => {
    const service = new SaveLoadService();
    const snapshotService = new WorldSnapshotService();
    vi.spyOn(snapshotService, 'captureSnapshot').mockReturnValue(mockPostcard);

    await expect(
      service.exportPostcard(MOCK_WORLD as never, snapshotService)
    ).rejects.toThrow('Player ID not set');
  });

  it('uploads postcard to server when server sync is enabled', async () => {
    const service = new SaveLoadService();
    const snapshotService = new WorldSnapshotService();
    vi.spyOn(snapshotService, 'captureSnapshot').mockReturnValue(mockPostcard);

    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          postcardId: 'pc_abc123',
          postcardUrl: 'https://play.multiversestudios.xyz/postcards/pc_abc123',
        }),
      });

    await service.enableServerSync('player-42');
    const result = await service.exportPostcard(MOCK_WORLD as never, snapshotService);

    expect(snapshotService.captureSnapshot).toHaveBeenCalledWith(MOCK_WORLD);
    expect(result.postcardId).toBe('pc_abc123');
    expect(result.postcardUrl).toBe('https://play.multiversestudios.xyz/postcards/pc_abc123');
    expect(result.postcard).toEqual(mockPostcard);
    expect(result.metadata.playerId).toBe('player-42');
    expect(result.metadata.universeId).toBe('universe:test-123');
    expect(result.metadata.universeName).toBe('Test Universe');
    expect(result.metadata.gameVersion).toBeDefined();
    expect(result.metadata.timestamp).toBeDefined();

    const uploadCall = mockFetch.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('/universes/postcards')
    );
    expect(uploadCall).toBeDefined();
    const uploadBody = JSON.parse(uploadCall![1].body);
    expect(uploadBody.postcard).toEqual(mockPostcard);
    expect(uploadBody.metadata.playerId).toBe('player-42');
    expect(uploadBody.metadata.universeId).toBe('universe:test-123');
    expect(uploadBody.metadata.gameVersion).toBeDefined();
  });

  it('falls back to local storage when server is unavailable', async () => {
    const service = new SaveLoadService();
    const snapshotService = new WorldSnapshotService();
    vi.spyOn(snapshotService, 'captureSnapshot').mockReturnValue(mockPostcard);

    mockFetch.mockResolvedValueOnce({ ok: false });
    await service.enableServerSync('player-42');

    const result = await service.exportPostcard(MOCK_WORLD as never, snapshotService);

    expect(result.postcardId).toMatch(/^postcard_/);
    expect(result.postcardUrl).toMatch(/^local:\/\//);
    expect(result.postcard).toEqual(mockPostcard);
    expect(result.metadata.playerId).toBe('player-42');
    expect(result.metadata.universeId).toBe('universe:test-123');
  });

  it('postcard payload is under 2KB', async () => {
    const service = new SaveLoadService();
    const snapshotService = new WorldSnapshotService();
    vi.spyOn(snapshotService, 'captureSnapshot').mockReturnValue(mockPostcard);

    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          postcardId: 'pc_xyz',
          postcardUrl: 'https://example.com/postcards/pc_xyz',
        }),
      });

    await service.enableServerSync('player-99');
    await service.exportPostcard(MOCK_WORLD as never, snapshotService);

    const uploadCall = mockFetch.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('/universes/postcards')
    );
    expect(uploadCall).toBeDefined();
    const body = JSON.parse(uploadCall![1].body);
    const payloadSize = new TextEncoder().encode(JSON.stringify(body)).length;
    expect(payloadSize).toBeLessThan(2048);
  });
});
