import { describe, it, expect } from 'vitest';
import { GeneticTimeCapsuleService } from '../GeneticTimeCapsuleService.js';
import type { CreateCapsuleParams } from '../GeneticTimeCapsuleService.js';
import type { CapsuleDepositor, GenomeCapsuleV1 } from '../../types/GenomeCapsule.js';

// ============================================================================
// Shared fixtures
// ============================================================================

const sampleGenome: Record<string, unknown> = {
  schema_version: '1.0.0',
  identity: {
    creature_id: 'c-001',
    name: 'Whisper',
    species_id: 'norn',
    species_name: 'Norn',
    generation: 3,
    lineage_id: 'lin-001',
    parent_ids: null,
  },
  core_traits: [
    {
      trait_id: 'size',
      category: 'morphological',
      value: 0.4,
      heritability: 0.8,
      variance_range: null,
      transfer_fidelity: 'lossless',
      source_game: 'mvee',
      notes: null,
    },
    {
      trait_id: 'temperament',
      category: 'behavioral',
      value: 0.7,
      heritability: 0.6,
      variance_range: null,
      transfer_fidelity: 'lossless',
      source_game: 'mvee',
      notes: null,
    },
  ],
  provenance: {
    source_game: 'mvee',
    source_game_version: '0.1.0',
    exported_at: '2026-03-14T20:00:00.000Z',
    exporter_version: '1.0.0',
    migration_history: [],
    folkfork_capsule_id: null,
    checksum: 'placeholder',
  },
};

const sampleDepositor: CapsuleDepositor = {
  depositType: 'player',
  playerId: 'p-123',
  playerDisplayName: 'Alice',
};

const sampleProvenance = {
  sourceGame: 'mvee',
  sourceGameVersion: '0.1.0',
  depositContext: 'voluntary' as const,
};

async function makeCapsule(overrides?: Partial<CreateCapsuleParams>): Promise<GenomeCapsuleV1> {
  return GeneticTimeCapsuleService.createCapsule({
    genome: sampleGenome,
    depositor: sampleDepositor,
    provenance: sampleProvenance,
    ...overrides,
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('canonicalJsonStringify', () => {
  const { canonicalJsonStringify } = GeneticTimeCapsuleService;

  it('sorts object keys alphabetically', () => {
    const result = canonicalJsonStringify({ z: 1, a: 2, m: 3 });
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it('handles nested objects recursively', () => {
    const result = canonicalJsonStringify({ b: { y: 1, x: 2 }, a: { d: 3, c: 4 } });
    expect(result).toBe('{"a":{"c":4,"d":3},"b":{"x":2,"y":1}}');
  });

  it('preserves array order', () => {
    const result = canonicalJsonStringify({ arr: [3, 1, 2] });
    expect(result).toBe('{"arr":[3,1,2]}');
  });

  it('handles null', () => {
    expect(canonicalJsonStringify(null)).toBe('null');
  });

  it('handles numbers', () => {
    expect(canonicalJsonStringify(42)).toBe('42');
  });

  it('handles strings', () => {
    expect(canonicalJsonStringify('hello')).toBe('"hello"');
  });

  it('handles booleans', () => {
    expect(canonicalJsonStringify(true)).toBe('true');
    expect(canonicalJsonStringify(false)).toBe('false');
  });

  it('handles empty objects', () => {
    expect(canonicalJsonStringify({})).toBe('{}');
  });

  it('handles empty arrays', () => {
    expect(canonicalJsonStringify([])).toBe('[]');
  });
});

describe('sha256', () => {
  it('returns consistent hash for same input', async () => {
    const h1 = await GeneticTimeCapsuleService.sha256('hello');
    const h2 = await GeneticTimeCapsuleService.sha256('hello');
    expect(h1).toBe(h2);
  });

  it('returns a 64-character hex string', async () => {
    const hash = await GeneticTimeCapsuleService.sha256('test input');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('different inputs produce different hashes', async () => {
    const h1 = await GeneticTimeCapsuleService.sha256('input-a');
    const h2 = await GeneticTimeCapsuleService.sha256('input-b');
    expect(h1).not.toBe(h2);
  });
});

describe('computeGenomeChecksum', () => {
  it('uses core_traits when present', async () => {
    const checksum = await GeneticTimeCapsuleService.computeGenomeChecksum(sampleGenome);
    const directChecksum = await GeneticTimeCapsuleService.sha256(
      GeneticTimeCapsuleService.canonicalJsonStringify(sampleGenome['core_traits']),
    );
    expect(checksum).toBe(directChecksum);
  });

  it('uses full genome when core_traits is absent', async () => {
    const genomeWithoutTraits: Record<string, unknown> = {
      schema_version: '1.0.0',
      identity: { creature_id: 'c-002' },
    };
    const checksum = await GeneticTimeCapsuleService.computeGenomeChecksum(genomeWithoutTraits);
    const directChecksum = await GeneticTimeCapsuleService.sha256(
      GeneticTimeCapsuleService.canonicalJsonStringify(genomeWithoutTraits),
    );
    expect(checksum).toBe(directChecksum);
  });

  it('same genome produces same checksum', async () => {
    const c1 = await GeneticTimeCapsuleService.computeGenomeChecksum(sampleGenome);
    const c2 = await GeneticTimeCapsuleService.computeGenomeChecksum(sampleGenome);
    expect(c1).toBe(c2);
  });
});

describe('createCapsule', () => {
  it('creates a valid capsule with all required fields', async () => {
    const capsule = await makeCapsule();
    expect(capsule).toBeDefined();
    expect(capsule.capsuleId).toBeDefined();
    expect(capsule.capsuleVersion).toBeDefined();
    expect(capsule.genome).toBeDefined();
    expect(capsule.depositor).toBeDefined();
    expect(capsule.provenance).toBeDefined();
    expect(capsule.genomicIntegrity).toBeDefined();
    expect(capsule.depositedAt).toBeDefined();
  });

  it('generates a UUID capsuleId', async () => {
    const capsule = await makeCapsule();
    expect(capsule.capsuleId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('sets capsuleVersion to "1.0.0"', async () => {
    const capsule = await makeCapsule();
    expect(capsule.capsuleVersion).toBe('1.0.0');
  });

  it('computes both checksums', async () => {
    const capsule = await makeCapsule();
    expect(capsule.genomicIntegrity.genomeChecksum).toMatch(/^[0-9a-f]{64}$/);
    expect(capsule.genomicIntegrity.capsuleChecksum).toMatch(/^[0-9a-f]{64}$/);
  });

  it('includes discoveryHints when provided', async () => {
    const hints = { legendaryName: 'The Silver Echo', eraTag: 'First Age' };
    const capsule = await makeCapsule({ discoveryHints: hints });
    expect(capsule.discoveryHints).toEqual(hints);
  });

  it('omits discoveryHints when not provided', async () => {
    const capsule = await makeCapsule();
    expect(capsule.discoveryHints).toBeUndefined();
  });

  it('throws on missing genome', async () => {
    await expect(
      GeneticTimeCapsuleService.createCapsule({
        genome: null as unknown as Record<string, unknown>,
        depositor: sampleDepositor,
        provenance: sampleProvenance,
      }),
    ).rejects.toThrow();
  });

  it('throws on missing depositor.depositType', async () => {
    const badDepositor = { ...sampleDepositor, depositType: undefined } as unknown as CapsuleDepositor;
    await expect(makeCapsule({ depositor: badDepositor })).rejects.toThrow(
      'depositor.depositType is required',
    );
  });

  it('throws on missing provenance.sourceGame', async () => {
    const badProvenance = { ...sampleProvenance, sourceGame: '' };
    await expect(makeCapsule({ provenance: badProvenance })).rejects.toThrow(
      'provenance.sourceGame is required',
    );
  });

  it('throws on missing provenance.sourceGameVersion', async () => {
    const badProvenance = { ...sampleProvenance, sourceGameVersion: '' };
    await expect(makeCapsule({ provenance: badProvenance })).rejects.toThrow(
      'provenance.sourceGameVersion is required',
    );
  });

  it('throws on missing provenance.depositContext', async () => {
    const badProvenance = { ...sampleProvenance, depositContext: '' } as unknown as typeof sampleProvenance;
    await expect(makeCapsule({ provenance: badProvenance })).rejects.toThrow(
      'provenance.depositContext is required',
    );
  });
});

describe('verifyCapsuleIntegrity', () => {
  it('returns valid=true for an untampered capsule', async () => {
    const capsule = await makeCapsule();
    const result = await GeneticTimeCapsuleService.verifyCapsuleIntegrity(capsule);
    expect(result.valid).toBe(true);
    expect(result.genomeValid).toBe(true);
    expect(result.capsuleValid).toBe(true);
  });

  it('detects genome tampering (genomeValid=false)', async () => {
    const capsule = await makeCapsule();
    // Tamper inside core_traits (the field the genome checksum actually hashes)
    const originalTraits = capsule.genome['core_traits'] as unknown[];
    const tamperedTraits = [...originalTraits, { trait_id: 'injected', value: 9999 }];
    const tampered: GenomeCapsuleV1 = {
      ...capsule,
      genome: { ...capsule.genome, core_traits: tamperedTraits },
    };
    const result = await GeneticTimeCapsuleService.verifyCapsuleIntegrity(tampered);
    expect(result.genomeValid).toBe(false);
    expect(result.valid).toBe(false);
  });

  it('detects capsule tampering (capsuleValid=false)', async () => {
    const capsule = await makeCapsule();
    // Modify the depositor without recomputing the checksum
    const tampered: GenomeCapsuleV1 = {
      ...capsule,
      depositor: { ...capsule.depositor, playerDisplayName: 'Hacker' },
    };
    const result = await GeneticTimeCapsuleService.verifyCapsuleIntegrity(tampered);
    expect(result.capsuleValid).toBe(false);
    expect(result.valid).toBe(false);
  });

  it('detects both genome and capsule tampering', async () => {
    const capsule = await makeCapsule();
    // Tamper core_traits to break genomeValid, tamper depositor to break capsuleValid
    const originalTraits = capsule.genome['core_traits'] as unknown[];
    const tamperedTraits = [...originalTraits, { trait_id: 'injected', value: 9999 }];
    const tampered: GenomeCapsuleV1 = {
      ...capsule,
      genome: { ...capsule.genome, core_traits: tamperedTraits },
      depositor: { ...capsule.depositor, playerDisplayName: 'Hacker' },
    };
    const result = await GeneticTimeCapsuleService.verifyCapsuleIntegrity(tampered);
    expect(result.genomeValid).toBe(false);
    expect(result.capsuleValid).toBe(false);
    expect(result.valid).toBe(false);
  });
});

describe('generateLegendaryName', () => {
  const extinctionDepositor: CapsuleDepositor = { depositType: 'extinction_automatic' };

  it('extinction_automatic capsule gets an auto-generated legendaryName', async () => {
    const capsule = await makeCapsule({ depositor: extinctionDepositor });
    expect(capsule.discoveryHints).toBeDefined();
    expect(capsule.discoveryHints?.legendaryName).toBeDefined();
    expect(typeof capsule.discoveryHints?.legendaryName).toBe('string');
  });

  it('auto-generated legendaryName follows "The [Adj] [Epithet] of the [Place]" format', async () => {
    const capsule = await makeCapsule({ depositor: extinctionDepositor });
    expect(capsule.discoveryHints?.legendaryName).toMatch(/^The \S.+ \S.+ of the \S.+$/);
  });

  it('existing legendaryName is NOT overwritten for extinction_automatic', async () => {
    const existingName = 'The Ancient Keeper of the Shattered Ridge';
    const capsule = await makeCapsule({
      depositor: extinctionDepositor,
      discoveryHints: { legendaryName: existingName },
    });
    expect(capsule.discoveryHints?.legendaryName).toBe(existingName);
  });

  it('existing discoveryHints fields are preserved when legendaryName is added', async () => {
    const capsule = await makeCapsule({
      depositor: extinctionDepositor,
      discoveryHints: { eraTag: 'Second Age', biomeOrigin: 'tundra' },
    });
    expect(capsule.discoveryHints?.legendaryName).toBeDefined();
    expect(capsule.discoveryHints?.eraTag).toBe('Second Age');
    expect(capsule.discoveryHints?.biomeOrigin).toBe('tundra');
  });

  it('non-extinction capsules do not get an auto-generated legendaryName', async () => {
    const playerCapsule = await makeCapsule({ depositor: sampleDepositor });
    expect(playerCapsule.discoveryHints).toBeUndefined();

    const migrationDepositor: CapsuleDepositor = { depositType: 'system_migration' };
    const migrationCapsule = await makeCapsule({ depositor: migrationDepositor });
    expect(migrationCapsule.discoveryHints).toBeUndefined();
  });

  it('generateLegendaryName is deterministic — same genome always produces same name', () => {
    const name1 = GeneticTimeCapsuleService.generateLegendaryName(sampleGenome);
    const name2 = GeneticTimeCapsuleService.generateLegendaryName(sampleGenome);
    expect(name1).toBe(name2);
  });

  it('generateLegendaryName returns different names for different genomes', () => {
    const genomeB: Record<string, unknown> = {
      ...sampleGenome,
      core_traits: [
        { trait_id: 'coloration', category: 'morphological', value: 0.9, heritability: 0.7 },
        { trait_id: 'speed', category: 'behavioral', value: 0.1, heritability: 0.5 },
        { trait_id: 'aggression', category: 'behavioral', value: 0.6, heritability: 0.4 },
      ],
    };
    const name1 = GeneticTimeCapsuleService.generateLegendaryName(sampleGenome);
    const name2 = GeneticTimeCapsuleService.generateLegendaryName(genomeB);
    expect(name1).not.toBe(name2);
  });

  it('generateLegendaryName falls back gracefully when genome fields are missing', () => {
    const sparseGenome: Record<string, unknown> = { schema_version: '1.0.0' };
    const name = GeneticTimeCapsuleService.generateLegendaryName(sparseGenome);
    expect(name).toMatch(/^The \S.+ \S.+ of the \S.+$/);
  });

  it('generateLegendaryName capsule integrity still passes for extinction_automatic', async () => {
    const capsule = await makeCapsule({ depositor: extinctionDepositor });
    const result = await GeneticTimeCapsuleService.verifyCapsuleIntegrity(capsule);
    expect(result.valid).toBe(true);
  });
});

describe('getAttributionText', () => {
  const named: CapsuleDepositor = { depositType: 'player', playerDisplayName: 'Alice' };
  const anonymous: CapsuleDepositor = { depositType: 'player' };

  it('generation 1 with named player: "Genome archived by [name]"', () => {
    const result = GeneticTimeCapsuleService.getAttributionText(named, 1);
    expect(result.text).toBe('Genome archived by Alice');
    expect(result.generation).toBe(1);
    expect(result.depositorVisible).toBe(true);
  });

  it('generation 1 anonymous: "Genome archived by an unknown hand"', () => {
    const result = GeneticTimeCapsuleService.getAttributionText(anonymous, 1);
    expect(result.text).toBe('Genome archived by an unknown hand');
    expect(result.depositorVisible).toBe(false);
  });

  it('generation 2 with name: includes depositor name', () => {
    const result = GeneticTimeCapsuleService.getAttributionText(named, 2);
    expect(result.text).toBe('Descended from an archived genome (depositor: Alice)');
    expect(result.generation).toBe(2);
    expect(result.depositorVisible).toBe(true);
  });

  it('generation 2 anonymous: includes "unknown"', () => {
    const result = GeneticTimeCapsuleService.getAttributionText(anonymous, 2);
    expect(result.text).toContain('unknown');
    expect(result.depositorVisible).toBe(false);
  });

  it('generation 3+: "Carries the echo of an ancient lineage", depositorVisible=false', () => {
    const result = GeneticTimeCapsuleService.getAttributionText(named, 3);
    expect(result.text).toBe('Carries the echo of an ancient lineage');
    expect(result.depositorVisible).toBe(false);
  });

  it('generation 5: same ancient lineage text as generation 3+', () => {
    const result = GeneticTimeCapsuleService.getAttributionText(named, 5);
    expect(result.text).toBe('Carries the echo of an ancient lineage');
    expect(result.depositorVisible).toBe(false);
    expect(result.generation).toBe(5);
  });

  it('extinction_automatic any generation: "Genome preserved at the moment of extinction"', () => {
    const depositor: CapsuleDepositor = { depositType: 'extinction_automatic' };
    const result = GeneticTimeCapsuleService.getAttributionText(depositor, 1);
    expect(result.text).toBe('Genome preserved at the moment of extinction');
    expect(result.depositorVisible).toBe(false);
  });

  it('extinction_automatic overrides even at generation 2', () => {
    const depositor: CapsuleDepositor = { depositType: 'extinction_automatic' };
    const result = GeneticTimeCapsuleService.getAttributionText(depositor, 2);
    expect(result.text).toBe('Genome preserved at the moment of extinction');
  });

  it('system_migration any generation: "Genome carried across the dimensional threshold"', () => {
    const depositor: CapsuleDepositor = { depositType: 'system_migration' };
    const result = GeneticTimeCapsuleService.getAttributionText(depositor, 1);
    expect(result.text).toBe('Genome carried across the dimensional threshold');
    expect(result.depositorVisible).toBe(false);
  });

  it('withdrawn=true overrides to ancient lineage text', () => {
    const result = GeneticTimeCapsuleService.getAttributionText(named, 1, true);
    expect(result.text).toBe('Carries the echo of an ancient lineage');
    expect(result.depositorVisible).toBe(false);
  });

  it('withdrawn=true overrides even extinction_automatic deposit type', () => {
    const depositor: CapsuleDepositor = { depositType: 'extinction_automatic' };
    const result = GeneticTimeCapsuleService.getAttributionText(depositor, 1, true);
    expect(result.text).toBe('Carries the echo of an ancient lineage');
    expect(result.depositorVisible).toBe(false);
  });
});
