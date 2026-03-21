/**
 * Tests for LoreExportCollector - the wiki data pipeline for the Leaky Game ARG.
 *
 * Tests the event→wiki-entry transformation logic for all 8 lore event types,
 * plus the public query API (getSnapshot, getCanonicalEntries, getRecentEntries, etc.).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LoreExportCollector, type WikiLoreEntry, type WikiLoreCategory } from '../LoreExportCollector.js';

// Access private methods for testing via casting
type CollectorInternals = {
  pendingEvents: Array<{ type: string; data: Record<string, unknown> }>;
  entries: Map<string, WikiLoreEntry>;
  processLoreEvent(type: string, data: Record<string, unknown>): void;
  queueEvent(type: string, data: unknown): void;
};

function createCollector(): LoreExportCollector & CollectorInternals {
  return new LoreExportCollector() as LoreExportCollector & CollectorInternals;
}

// --- Event payload factories ---

function mythCreatedPayload(overrides: Record<string, unknown> = {}) {
  return {
    mythId: 'myth-001',
    sourceGame: 'mvee',
    title: 'The Sundering of Aethon',
    summary: 'When the sky cracked open...',
    fullText: 'When the sky cracked open, the god Aethon wept starfire upon the mortal realm.',
    category: 'creation',
    deityDomains: ['fire', 'sky'],
    deityPersonality: { benevolence: 0.3, interventionism: 0.8, wrathfulness: 0.9, mysterousness: 0.5 },
    deityName: 'Aethon',
    believerCount: 12,
    tellingCount: 1,
    status: 'oral',
    canonicityScore: 0,
    timestamp: 1000,
    ...overrides,
  };
}

function mythCanonizedPayload(overrides: Record<string, unknown> = {}) {
  return {
    mythId: 'myth-001',
    sourceGame: 'mvee',
    title: 'Legend of Kira',
    heroName: 'Kira',
    achievement: 'slaying the void serpent',
    difficulty: 'legendary' as const,
    canonicityScore: 0.9,
    witnessCount: 7,
    timestamp: 2000,
    ...overrides,
  };
}

function schismPayload(overrides: Record<string, unknown> = {}) {
  return {
    sourceGame: 'mvee',
    schismId: 'schism-001',
    originalDeityName: 'Solara',
    originalDeityDomain: 'sun',
    newDeityName: 'Lunara',
    cause: 'theological_dispute',
    theologicalDifferences: ['nature of light', 'moon worship'],
    relationship: 'rivalrous',
    believersSplit: { remained: 8, joined: 5 },
    timestamp: 3000,
    ...overrides,
  };
}

function syncretismPayload(overrides: Record<string, unknown> = {}) {
  return {
    sourceGame: 'mvee',
    syncretismId: 'sync-001',
    deity1Name: 'Ignis',
    deity2Name: 'Aquara',
    mergedDeityName: 'Steamborn',
    sharedDomains: ['transformation'],
    mergedBelieverCount: 20,
    timestamp: 4000,
    ...overrides,
  };
}

function holyTextPayload(overrides: Record<string, unknown> = {}) {
  return {
    sourceGame: 'mvee',
    textId: 'text-001',
    title: 'The Codex of Flame',
    deityName: 'Aethon',
    deityDomain: 'fire',
    teachingsSummary: 'Burn bright; burn true; burn always',
    believerCount: 15,
    canonicity: 0.8,
    timestamp: 5000,
    ...overrides,
  };
}

function beliefEmergedPayload(overrides: Record<string, unknown> = {}) {
  return {
    sourceGame: 'mvee',
    deityId: 'deity-001',
    deityName: 'Verdantia',
    epithets: ['The Green Mother', 'She Who Grows'],
    domain: 'nature',
    beliefAmount: 42.5,
    believerCount: 6,
    currentBeliefTotal: 200,
    peakBeliefRate: 10.0,
    timestamp: 6000,
    ...overrides,
  };
}

function ritualPerformedPayload(overrides: Record<string, unknown> = {}) {
  return {
    sourceGame: 'mvee',
    ritualId: 'ritual-001',
    name: 'Dawn Blessing',
    deityId: 'deity-001',
    type: 'daily_prayer',
    beliefGenerated: 5.0,
    requiredParticipants: 3,
    duration: 600,
    timestamp: 7000,
    ...overrides,
  };
}

function narrativeSedimentPayload(overrides: Record<string, unknown> = {}) {
  return {
    sourceGame: 'nel',
    themes: { justice_vs_mercy: 0.8, order_vs_chaos: 0.3, individual_vs_collective: 0.5 },
    depositCount: 12,
    totalSessionCount: 45,
    mythCategoryBoosts: { creation: 0.1, hero: 0.2 },
    targetGame: 'mvee',
    timestamp: 8000,
    ...overrides,
  };
}

// --- Tests ---

describe('LoreExportCollector', () => {
  let collector: LoreExportCollector & CollectorInternals;

  beforeEach(() => {
    collector = createCollector();
  });

  describe('myth_created', () => {
    it('should create a myth wiki entry', () => {
      collector.processLoreEvent('myth_created', mythCreatedPayload());

      const entry = collector.entries.get('myth-myth-001');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('myth');
      expect(entry!.title).toBe('The Sundering of Aethon');
      expect(entry!.summary).toBe('When the sky cracked open...');
      expect(entry!.sourceGame).toBe('mvee');
      expect(entry!.details.deityName).toBe('Aethon');
      expect(entry!.details.deityDomains).toEqual(['fire', 'sky']);
      expect(entry!.canonicityScore).toBe(0);
      expect(entry!.createdAtTick).toBe(1000);
    });
  });

  describe('myth_canonized', () => {
    it('should update an existing myth entry', () => {
      collector.processLoreEvent('myth_created', mythCreatedPayload());
      collector.processLoreEvent('myth_canonized', mythCanonizedPayload());

      const entry = collector.entries.get('myth-myth-001');
      expect(entry).toBeDefined();
      expect(entry!.canonicityScore).toBe(0.9);
      expect(entry!.details.heroName).toBe('Kira');
      expect(entry!.details.achievement).toBe('slaying the void serpent');
      expect(entry!.updatedAtTick).toBe(2000);
    });

    it('should create a new entry if myth was not previously seen', () => {
      collector.processLoreEvent('myth_canonized', mythCanonizedPayload({ mythId: 'myth-new' }));

      const entry = collector.entries.get('myth-myth-new');
      expect(entry).toBeDefined();
      expect(entry!.title).toBe('Legend of Kira');
      expect(entry!.canonicityScore).toBe(0.9);
    });
  });

  describe('schism_occurred', () => {
    it('should create a schism wiki entry', () => {
      collector.processLoreEvent('schism_occurred', schismPayload());

      const entry = collector.entries.get('schism-schism-001');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('schism');
      expect(entry!.title).toContain('Solara');
      expect(entry!.title).toContain('Lunara');
      expect(entry!.summary).toContain('theological_dispute');
      expect(entry!.summary).toContain('5');
      expect(entry!.details.relationship).toBe('rivalrous');
      expect(entry!.canonicityScore).toBe(0.7);
    });
  });

  describe('syncretism_occurred', () => {
    it('should create a syncretism wiki entry', () => {
      collector.processLoreEvent('syncretism_occurred', syncretismPayload());

      const entry = collector.entries.get('syncretism-sync-001');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('syncretism');
      expect(entry!.title).toContain('Ignis');
      expect(entry!.title).toContain('Aquara');
      expect(entry!.details.mergedDeityName).toBe('Steamborn');
      expect(entry!.canonicityScore).toBe(0.6);
    });
  });

  describe('holy_text_written', () => {
    it('should create a holy text wiki entry', () => {
      collector.processLoreEvent('holy_text_written', holyTextPayload());

      const entry = collector.entries.get('text-text-001');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('holy_text');
      expect(entry!.title).toBe('The Codex of Flame');
      expect(entry!.summary).toContain('Aethon');
      expect(entry!.summary).toContain('fire');
      expect(entry!.details.teachingsSummary).toContain('Burn bright');
      expect(entry!.canonicityScore).toBe(0.8);
    });
  });

  describe('belief_emerged', () => {
    it('should create a belief wiki entry', () => {
      collector.processLoreEvent('belief_emerged', beliefEmergedPayload());

      const entry = collector.entries.get('belief-deity-001');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('belief');
      expect(entry!.title).toBe('Faith of Verdantia');
      expect(entry!.summary).toContain('6 believers');
      expect(entry!.details.epithets).toEqual(['The Green Mother', 'She Who Grows']);
      // Canonicity: min(1.0, 0.1 + 6 * 0.05) = 0.4
      expect(entry!.canonicityScore).toBeCloseTo(0.4);
    });

    it('should update existing belief entry with new data', () => {
      collector.processLoreEvent('belief_emerged', beliefEmergedPayload());
      collector.processLoreEvent('belief_emerged', beliefEmergedPayload({
        believerCount: 20,
        currentBeliefTotal: 500,
        timestamp: 7000,
      }));

      const entry = collector.entries.get('belief-deity-001');
      expect(entry!.details.believerCount).toBe(20);
      expect(entry!.details.currentBeliefTotal).toBe(500);
      expect(entry!.updatedAtTick).toBe(7000);
      // Canonicity: min(1.0, 0.1 + 20 * 0.05) = 1.0 (capped)
      expect(entry!.canonicityScore).toBe(1.0);
    });

    it('should handle single believer grammar', () => {
      collector.processLoreEvent('belief_emerged', beliefEmergedPayload({ believerCount: 1 }));

      const entry = collector.entries.get('belief-deity-001');
      expect(entry!.summary).toContain('1 believer.');
      expect(entry!.summary).not.toContain('believers');
    });
  });

  describe('ritual_performed', () => {
    it('should create a ritual wiki entry', () => {
      collector.processLoreEvent('ritual_performed', ritualPerformedPayload());

      const entry = collector.entries.get('ritual-ritual-001');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('ritual');
      expect(entry!.title).toBe('Dawn Blessing');
      expect(entry!.summary).toContain('daily_prayer');
      expect(entry!.details.beliefGenerated).toBe(5.0);
      expect(entry!.canonicityScore).toBe(0.3);
    });
  });

  describe('narrative_sediment_received', () => {
    it('should create a narrative sediment wiki entry', () => {
      collector.processLoreEvent('narrative_sediment_received', narrativeSedimentPayload());

      const entry = collector.entries.get('sediment-nel-aggregate');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('narrative_sediment');
      expect(entry!.sourceGame).toBe('nel');
      expect(entry!.summary).toContain('45 reader sessions');
      expect(entry!.summary).toContain('justice_vs_mercy'); // Dominant theme (0.8 farthest from 0.5)
      expect(entry!.details.depositCount).toBe(12);
      expect(entry!.canonicityScore).toBe(0.9);
    });

    it('should pick the theme farthest from 0.5 as dominant', () => {
      collector.processLoreEvent('narrative_sediment_received', narrativeSedimentPayload({
        themes: { justice_vs_mercy: 0.5, order_vs_chaos: 0.1 },
      }));

      const entry = collector.entries.get('sediment-nel-aggregate');
      // order_vs_chaos at 0.1 is 0.4 from 0.5; justice_vs_mercy at 0.5 is 0.0 from 0.5
      expect(entry!.summary).toContain('order_vs_chaos');
    });
  });

  describe('Public API', () => {
    beforeEach(() => {
      // Populate with diverse entries
      collector.processLoreEvent('myth_created', mythCreatedPayload());
      collector.processLoreEvent('myth_canonized', mythCanonizedPayload());
      collector.processLoreEvent('schism_occurred', schismPayload());
      collector.processLoreEvent('holy_text_written', holyTextPayload());
      collector.processLoreEvent('belief_emerged', beliefEmergedPayload());
      collector.processLoreEvent('ritual_performed', ritualPerformedPayload());
      collector.processLoreEvent('narrative_sediment_received', narrativeSedimentPayload());
    });

    it('getEntries() should return all entries', () => {
      const entries = collector.getEntries();
      expect(entries.size).toBe(6); // myth + schism + holy_text + belief + ritual + sediment (myth_canonized updates the myth)
    });

    it('getEntriesByCategory() should filter by category', () => {
      const myths = collector.getEntriesByCategory('myth');
      expect(myths).toHaveLength(1);
      expect(myths[0].category).toBe('myth');

      const schisms = collector.getEntriesByCategory('schism');
      expect(schisms).toHaveLength(1);
    });

    it('getSnapshot() should return full export with category counts', () => {
      const snapshot = collector.getSnapshot(10000);
      expect(snapshot.timestamp).toBe(10000);
      expect(snapshot.entryCount).toBe(6);
      expect(snapshot.categoryCounts.myth).toBe(1);
      expect(snapshot.categoryCounts.schism).toBe(1);
      expect(snapshot.categoryCounts.holy_text).toBe(1);
      expect(snapshot.categoryCounts.belief).toBe(1);
      expect(snapshot.categoryCounts.ritual).toBe(1);
      expect(snapshot.categoryCounts.narrative_sediment).toBe(1);
      expect(snapshot.categoryCounts.syncretism).toBe(0);
    });

    it('getCanonicalEntries() should return entries above threshold sorted by canonicity', () => {
      const canonical = collector.getCanonicalEntries(0.5);

      // Should include: sediment (0.9), myth (0.9 after canonization), holy_text (0.8), schism (0.7)
      // Should exclude: belief (0.4), ritual (0.3)
      expect(canonical.length).toBe(4);
      expect(canonical[0].canonicityScore).toBeGreaterThanOrEqual(canonical[1].canonicityScore);
    });

    it('getRecentEntries() should return entries sorted by updatedAtTick', () => {
      const recent = collector.getRecentEntries(3);
      expect(recent).toHaveLength(3);
      expect(recent[0].updatedAtTick).toBeGreaterThanOrEqual(recent[1].updatedAtTick);
      expect(recent[1].updatedAtTick).toBeGreaterThanOrEqual(recent[2].updatedAtTick);
    });

    it('getRecentEntries() should respect count limit', () => {
      const recent = collector.getRecentEntries(2);
      expect(recent).toHaveLength(2);
    });
  });

  describe('Event queue processing', () => {
    it('should queue and process events correctly', () => {
      collector.queueEvent('myth_created', mythCreatedPayload());
      collector.queueEvent('schism_occurred', schismPayload());

      expect(collector.pendingEvents).toHaveLength(2);
      expect(collector.entries.size).toBe(0); // Not yet processed

      // Simulate onUpdate
      for (const event of collector.pendingEvents) {
        collector.processLoreEvent(event.type, event.data);
      }
      collector.pendingEvents.length = 0;

      expect(collector.entries.size).toBe(2);
      expect(collector.pendingEvents).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle unknown event types gracefully', () => {
      // Should not throw
      expect(() => {
        collector.processLoreEvent('unknown_event', { sourceGame: 'mvee' });
      }).not.toThrow();
      expect(collector.entries.size).toBe(0);
    });

    it('should upsert ritual entries (same id replaces)', () => {
      collector.processLoreEvent('ritual_performed', ritualPerformedPayload());
      collector.processLoreEvent('ritual_performed', ritualPerformedPayload({ beliefGenerated: 10, timestamp: 9000 }));

      // Same ritual ID → replaced
      const entry = collector.entries.get('ritual-ritual-001');
      expect(entry!.details.beliefGenerated).toBe(10);
      expect(entry!.updatedAtTick).toBe(9000);
    });
  });
});
