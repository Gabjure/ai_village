/**
 * Unit tests for PortableMyth, PortableDeity, and PortableRitual exporters.
 *
 * Tests export logic with mock ECS data, validating that output
 * conforms to the cross-game JSON schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  computeCanonicity,
  meetsExportThreshold,
  mapMythCategory,
  mapMythStatus,
  mapPersonality,
  exportMyth,
  exportEligibleMyths,
} from '../MythExporter.js';
import { exportDeity, exportDeityWithLineage } from '../DeityExporter.js';
import { exportRitual, exportRituals } from '../RitualExporter.js';
import { DeityComponent } from '../../components/DeityComponent.js';
import type { Myth, MythologyComponent } from '../../components/MythComponent.js';
import type { RitualData } from '../../systems/RitualSystem.js';

// ============================================================================
// Test fixtures
// ============================================================================

function createMockMyth(overrides: Partial<Myth> = {}): Myth {
  return {
    id: 'myth-001',
    title: 'The Song of the First Dawn',
    fullText: 'In the beginning, the unnamed one hummed a note that shattered silence...',
    summary: 'A creation myth about the first deity humming the world into existence.',
    originalEvent: 'First sunrise after universe fork',
    originalWitness: 'agent-42',
    currentVersion: 3,
    knownBy: Array.from({ length: 30 }, (_, i) => `agent-${i}`),
    writtenIn: ['holy-text-1'],
    carvedAt: ['temple-1'],
    traitImplications: [
      { trait: 'benevolence', direction: 'positive', strength: 0.8, extractedFrom: 'hummed a note' },
      { trait: 'mysteriousness', direction: 'positive', strength: 0.6, extractedFrom: 'shattered silence' },
    ],
    domainRelevance: new Map([['creation' as any, 0.9], ['wisdom' as any, 0.5]]),
    creationTime: 5000,
    lastToldTime: 15000,
    tellingCount: 45,
    status: 'canonical',
    contestedBy: [],
    deityId: 'deity-entity-1',
    ...overrides,
  };
}

function createMockDeity(): DeityComponent {
  const deity = new DeityComponent('Velathri the Whisperer');
  deity.identity.domain = 'wisdom';
  deity.identity.secondaryDomains = ['mystery', 'dreams'];
  deity.identity.epithets = ['The Whisperer', 'Voice of Dawn'];
  deity.identity.perceivedPersonality = {
    benevolence: 0.6,       // -1 to 1 scale
    interventionism: -0.2,
    wrathfulness: 0.3,      // 0 to 1 scale
    mysteriousness: 0.8,
    generosity: 0.7,
    consistency: 0.4,
  };
  deity.identity.perceivedAlignment = 'benevolent';
  deity.believers = new Set(['agent-1', 'agent-2', 'agent-3']);
  deity.myths = [
    { id: 'myth-001', title: 'Song of Dawn', category: 'origin', content: '...', believerCount: 30, variants: 2, createdAt: 5000 },
    { id: 'myth-002', title: 'The Warning', category: 'moral', content: '...', believerCount: 10, variants: 1, createdAt: 8000 },
  ];
  return deity;
}

function createMockMythology(): MythologyComponent {
  return {
    type: 'mythology',
    version: 1,
    myths: [],
    canonicalMyths: ['myth-001', 'myth-003'],
    foundingMyths: ['myth-001'],
    totalMythsCreated: 5,
  };
}

function createMockRitual(overrides: Partial<RitualData> = {}): RitualData {
  return {
    id: 'ritual-001',
    name: 'Dawn Prayer',
    deityId: 'deity-entity-1',
    type: 'daily_prayer',
    beliefGenerated: 15,
    requiredParticipants: 3,
    duration: 100,
    lastPerformed: 14000,
    ...overrides,
  };
}

// ============================================================================
// MythExporter tests
// ============================================================================

describe('MythExporter', () => {
  describe('computeCanonicity', () => {
    it('returns 0.9 for canonical myths', () => {
      const myth = createMockMyth({ status: 'canonical' });
      const score = computeCanonicity(myth);
      expect(score).toBeGreaterThanOrEqual(0.9);
    });

    it('returns lower scores for oral myths', () => {
      const myth = createMockMyth({ status: 'oral', knownBy: [] });
      const score = computeCanonicity(myth);
      expect(score).toBeCloseTo(0.2, 1);
    });

    it('returns 0.05 for heretical myths', () => {
      const myth = createMockMyth({ status: 'heretical', knownBy: [] });
      const score = computeCanonicity(myth);
      expect(score).toBeCloseTo(0.05, 1);
    });

    it('adds spread bonus for widely-known myths', () => {
      const narrow = createMockMyth({ status: 'recorded', knownBy: ['a'] });
      const wide = createMockMyth({ status: 'recorded', knownBy: Array.from({ length: 50 }, (_, i) => `a-${i}`) });
      expect(computeCanonicity(wide)).toBeGreaterThan(computeCanonicity(narrow));
    });

    it('caps canonicity at 1.0', () => {
      const myth = createMockMyth({ status: 'canonical', knownBy: Array.from({ length: 1000 }, (_, i) => `a-${i}`) });
      expect(computeCanonicity(myth)).toBeLessThanOrEqual(1);
    });
  });

  describe('meetsExportThreshold', () => {
    it('returns true for canonical myth with 30+ believers', () => {
      const myth = createMockMyth({ status: 'canonical' });
      expect(meetsExportThreshold(myth)).toBe(true);
    });

    it('returns false for oral myth even with many believers', () => {
      const myth = createMockMyth({ status: 'oral' });
      expect(meetsExportThreshold(myth)).toBe(false);
    });

    it('returns false for canonical myth with too few believers', () => {
      const myth = createMockMyth({ status: 'canonical', knownBy: ['a', 'b'] });
      expect(meetsExportThreshold(myth)).toBe(false);
    });
  });

  describe('mapMythCategory', () => {
    it('maps creation to creation', () => {
      expect(mapMythCategory('creation')).toBe('creation');
    });

    it('maps divine_conflict to divine_war', () => {
      expect(mapMythCategory('divine_conflict')).toBe('divine_war');
    });

    it('maps end_times to apocalypse', () => {
      expect(mapMythCategory('end_times')).toBe('apocalypse');
    });

    it('throws on unmapped categories', () => {
      expect(() => mapMythCategory('completely_unknown_category')).toThrow('Unmapped MythCategory: completely_unknown_category');
    });

    it('maps parable to covenant', () => {
      expect(mapMythCategory('parable')).toBe('covenant');
    });

    it('maps weather_miracle to transformation', () => {
      expect(mapMythCategory('weather_miracle')).toBe('transformation');
    });
  });

  describe('mapMythStatus', () => {
    it('passes through canonical status unchanged', () => {
      expect(mapMythStatus('canonical')).toBe('canonical');
    });

    it('maps forgotten to apocryphal', () => {
      expect(mapMythStatus('forgotten' as any)).toBe('apocryphal');
    });

    it('passes through all standard statuses', () => {
      expect(mapMythStatus('oral')).toBe('oral');
      expect(mapMythStatus('recorded')).toBe('recorded');
      expect(mapMythStatus('disputed')).toBe('disputed');
      expect(mapMythStatus('apocryphal')).toBe('apocryphal');
      expect(mapMythStatus('heretical')).toBe('heretical');
    });
  });

  describe('mapPersonality', () => {
    it('maps -1..1 benevolence to 0..1', () => {
      const result = mapPersonality({
        benevolence: -1, interventionism: 0, wrathfulness: 0,
        mysteriousness: 0, generosity: 0, consistency: 0,
      });
      expect(result.benevolence).toBeCloseTo(0);
    });

    it('maps 1.0 benevolence to 1.0', () => {
      const result = mapPersonality({
        benevolence: 1, interventionism: 0, wrathfulness: 0.5,
        mysteriousness: 0.5, generosity: 0.5, consistency: 0.5,
      });
      expect(result.benevolence).toBeCloseTo(1);
    });

    it('passes through 0-1 range fields unchanged', () => {
      const result = mapPersonality({
        benevolence: 0, interventionism: 0, wrathfulness: 0.7,
        mysteriousness: 0.3, generosity: 0.9, consistency: 0.1,
      });
      expect(result.wrathfulness).toBeCloseTo(0.7);
      expect(result.mysteriousness).toBeCloseTo(0.3);
      expect(result.generosity).toBeCloseTo(0.9);
      expect(result.consistency).toBeCloseTo(0.1);
    });
  });

  describe('exportMyth', () => {
    it('exports a valid PortableMyth from MVEE Myth', () => {
      const myth = createMockMyth();
      const deity = createMockDeity();
      const result = exportMyth(myth, deity);

      expect(result.mythId).toBe('myth-001');
      expect(result.sourceGame).toBe('mvee');
      expect(result.title).toBe('The Song of the First Dawn');
      expect(result.version).toBe(3);
      expect(result.tellingCount).toBe(45);
      expect(result.believerCount).toBe(30);
      expect(result.status).toBe('canonical');
      expect(result.canonicityScore).toBeGreaterThan(0.7);
      expect(result.exportedAt).toBeTruthy();
    });

    it('includes deity domains', () => {
      const myth = createMockMyth();
      const deity = createMockDeity();
      const result = exportMyth(myth, deity);

      expect(result.deityDomains).toContain('wisdom');
      expect(result.deityDomains).toContain('mystery');
      expect(result.deityDomains).toContain('dreams');
    });

    it('maps deity personality from -1..1 to 0..1', () => {
      const myth = createMockMyth();
      const deity = createMockDeity();
      const result = exportMyth(myth, deity);

      expect(result.deityPersonality).toBeDefined();
      // benevolence: 0.6 → (0.6 + 1) / 2 = 0.8
      expect(result.deityPersonality!.benevolence).toBeCloseTo(0.8);
      // interventionism: -0.2 → (-0.2 + 1) / 2 = 0.4
      expect(result.deityPersonality!.interventionism).toBeCloseTo(0.4);
    });

    it('extracts motifs from traitImplications', () => {
      const myth = createMockMyth();
      const deity = createMockDeity();
      const result = exportMyth(myth, deity);

      expect(result.motifs).toContain('benevolence:positive');
      expect(result.motifs).toContain('mysteriousness:positive');
    });

    it('includes originalEvent when present', () => {
      const myth = createMockMyth();
      const deity = createMockDeity();
      const result = exportMyth(myth, deity);

      expect(result.originalEvent).toBeDefined();
      expect(result.originalEvent!.description).toBe('First sunrise after universe fork');
      expect(result.originalEvent!.gameTimestamp).toBe(5000);
    });

    it('throws on missing id', () => {
      const myth = createMockMyth({ id: '' });
      const deity = createMockDeity();
      expect(() => exportMyth(myth, deity)).toThrow('missing id');
    });

    it('throws on missing title', () => {
      const myth = createMockMyth({ title: '' });
      const deity = createMockDeity();
      expect(() => exportMyth(myth, deity)).toThrow('missing title');
    });
  });

  describe('exportEligibleMyths', () => {
    it('only exports myths meeting the threshold', () => {
      const eligible = createMockMyth({ id: 'myth-a', status: 'canonical' });
      const ineligible = createMockMyth({ id: 'myth-b', status: 'oral', knownBy: ['a'] });
      const deity = createMockDeity();

      const results = exportEligibleMyths([eligible, ineligible], deity);
      expect(results).toHaveLength(1);
      expect(results[0]!.mythId).toBe('myth-a');
    });

    it('returns empty array when no myths meet threshold', () => {
      const myth = createMockMyth({ status: 'oral', knownBy: [] });
      const deity = createMockDeity();
      expect(exportEligibleMyths([myth], deity)).toHaveLength(0);
    });
  });
});

// ============================================================================
// DeityExporter tests
// ============================================================================

describe('DeityExporter', () => {
  describe('exportDeity', () => {
    it('exports a valid PortableDeity', () => {
      const deity = createMockDeity();
      const mythology = createMockMythology();
      const result = exportDeity(deity, mythology, 'deity-uuid-1');

      expect(result.deityId).toBe('deity-uuid-1');
      expect(result.sourceGame).toBe('mvee');
      expect(result.primaryName).toBe('Velathri the Whisperer');
      expect(result.domain).toBe('wisdom');
      expect(result.secondaryDomains).toEqual(['mystery', 'dreams']);
      expect(result.epithets).toEqual(['The Whisperer', 'Voice of Dawn']);
      expect(result.alignment).toBe('benevolent');
      expect(result.believerCount).toBe(3);
      expect(result.mythCount).toBe(2);
      expect(result.exportedAt).toBeTruthy();
    });

    it('includes canonical myth IDs from mythology component', () => {
      const deity = createMockDeity();
      const mythology = createMockMythology();
      const result = exportDeity(deity, mythology);

      expect(result.canonicalMythIds).toEqual(['myth-001', 'myth-003']);
    });

    it('returns empty canonicalMythIds when no mythology', () => {
      const deity = createMockDeity();
      const result = exportDeity(deity);
      expect(result.canonicalMythIds).toEqual([]);
    });

    it('maps personality from -1..1 to 0..1', () => {
      const deity = createMockDeity();
      const result = exportDeity(deity);

      expect(result.personality.benevolence).toBeCloseTo(0.8);
      expect(result.personality.interventionism).toBeCloseTo(0.4);
      expect(result.personality.wrathfulness).toBeCloseTo(0.3);
    });

    it('falls back domain to mystery when undefined', () => {
      const deity = createMockDeity();
      deity.identity.domain = undefined;
      const result = exportDeity(deity);
      expect(result.domain).toBe('mystery');
    });

    it('uses primaryName as deityId when no entityId provided', () => {
      const deity = createMockDeity();
      const result = exportDeity(deity);
      expect(result.deityId).toBe('Velathri the Whisperer');
    });

    it('throws on missing primaryName', () => {
      const deity = createMockDeity();
      deity.identity.primaryName = '';
      expect(() => exportDeity(deity)).toThrow('missing primaryName');
    });
  });

  describe('exportDeityWithLineage', () => {
    it('includes schism lineage', () => {
      const deity = createMockDeity();
      const result = exportDeityWithLineage(deity, undefined, 'deity-uuid-1', {
        parentDeityId: 'parent-deity-uuid',
        schismCause: 'Doctrinal dispute over the nature of dreams',
      });

      expect(result.parentDeityId).toBe('parent-deity-uuid');
      expect(result.schismCause).toBe('Doctrinal dispute over the nature of dreams');
    });

    it('includes syncretism lineage', () => {
      const deity = createMockDeity();
      const result = exportDeityWithLineage(deity, undefined, 'deity-uuid-1', {
        mergedFromIds: ['deity-a', 'deity-b'],
      });

      expect(result.mergedFromIds).toEqual(['deity-a', 'deity-b']);
    });
  });
});

// ============================================================================
// RitualExporter tests
// ============================================================================

describe('RitualExporter', () => {
  describe('exportRitual', () => {
    it('exports a valid PortableRitual', () => {
      const ritual = createMockRitual();
      const result = exportRitual(ritual, 'A daily morning prayer to greet the dawn');

      expect(result.ritualId).toBe('ritual-001');
      expect(result.sourceGame).toBe('mvee');
      expect(result.name).toBe('Dawn Prayer');
      expect(result.ritualType).toBe('worship');
      expect(result.frequency).toBe('daily');
      expect(result.associatedDeityId).toBe('deity-entity-1');
      expect(result.description).toBe('A daily morning prayer to greet the dawn');
      expect(result.beliefGenerated).toBe(15);
      expect(result.status).toBe('active');
      expect(result.version).toBe(1);
      expect(result.exportedAt).toBeTruthy();
    });

    it('maps sacrifice type correctly', () => {
      const ritual = createMockRitual({ type: 'sacrifice' });
      const result = exportRitual(ritual, 'An offering to the gods');
      expect(result.ritualType).toBe('sacrifice');
      expect(result.frequency).toBe('weekly');
    });

    it('maps pilgrimage type correctly', () => {
      const ritual = createMockRitual({ type: 'pilgrimage' });
      const result = exportRitual(ritual, 'Sacred journey');
      expect(result.ritualType).toBe('pilgrimage');
      expect(result.frequency).toBe('annual');
    });

    it('maps seasonal_festival correctly', () => {
      const ritual = createMockRitual({ type: 'seasonal_festival' });
      const result = exportRitual(ritual, 'Harvest celebration');
      expect(result.ritualType).toBe('festival');
      expect(result.frequency).toBe('seasonal');
    });

    it('includes participant requirements', () => {
      const ritual = createMockRitual({ requiredParticipants: 5 });
      const result = exportRitual(ritual, 'Group ceremony');
      expect(result.participantRequirements.minimumParticipants).toBe(5);
    });

    it('accepts custom status', () => {
      const ritual = createMockRitual();
      const result = exportRitual(ritual, 'Fading practice', 'declining');
      expect(result.status).toBe('declining');
    });

    it('throws on missing id', () => {
      const ritual = createMockRitual({ id: '' });
      expect(() => exportRitual(ritual, 'desc')).toThrow('missing id');
    });

    it('throws on missing name', () => {
      const ritual = createMockRitual({ name: '' });
      expect(() => exportRitual(ritual, 'desc')).toThrow('missing name');
    });
  });

  describe('exportRituals', () => {
    it('exports all rituals with descriptions', () => {
      const rituals = [
        createMockRitual({ id: 'r1', name: 'Dawn Prayer', deityId: 'deity-1' }),
        createMockRitual({ id: 'r2', name: 'Sunset Offering', type: 'sacrifice', deityId: 'deity-1' }),
      ];
      const descriptions = new Map([
        ['r1', 'Morning prayer to the dawn'],
        ['r2', 'Evening sacrifice of grain'],
      ]);

      const results = exportRituals(rituals, descriptions);
      expect(results).toHaveLength(2);
      expect(results[0]!.name).toBe('Dawn Prayer');
      expect(results[1]!.name).toBe('Sunset Offering');
    });

    it('filters by deityId when provided', () => {
      const rituals = [
        createMockRitual({ id: 'r1', deityId: 'deity-1' }),
        createMockRitual({ id: 'r2', deityId: 'deity-2' }),
      ];

      const results = exportRituals(rituals, new Map(), 'deity-1');
      expect(results).toHaveLength(1);
      expect(results[0]!.ritualId).toBe('r1');
    });

    it('uses generated description when none provided', () => {
      const rituals = [createMockRitual({ id: 'r1', type: 'daily_prayer' })];
      const results = exportRituals(rituals, new Map());
      expect(results[0]!.description).toContain('daily prayer');
    });
  });
});
