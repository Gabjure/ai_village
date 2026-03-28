/**
 * GeneticTimeCapsuleService
 *
 * Creates, checksums, and verifies genome capsules for the Genetic Time
 * Capsule system.  All archive I/O (writing capsule files to disk) is a
 * separate concern handled outside the browser runtime.
 *
 * Checksum strategy
 * -----------------
 *  genomeChecksum  — SHA-256 of genome.core_traits (or full genome if absent),
 *                    serialised as canonical JSON (all object keys sorted
 *                    recursively).
 *  capsuleChecksum — SHA-256 of the full capsule minus
 *                    genomicIntegrity.capsuleChecksum, also canonical JSON.
 *
 * Crypto
 * ------
 *  Uses Web Crypto API (globalThis.crypto.subtle) — available in all modern
 *  browsers and in Node ≥ 19 / the Vite dev-server environment.
 */

import type {
  GenomeCapsuleV1,
  CapsuleDepositor,
  CapsuleProvenance,
  DiscoveryHints,
  GenomicIntegrity,
  AttributionDisplay,
} from '../types/GenomeCapsule.js';

// ============================================================================
// Public params type
// ============================================================================

export interface CreateCapsuleParams {
  genome: Record<string, unknown>;
  depositor: CapsuleDepositor;
  provenance: CapsuleProvenance;
  discoveryHints?: DiscoveryHints;
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Recursively sorts all object keys and serialises to a deterministic JSON
 * string.  Arrays preserve their order; only plain-object keys are sorted.
 */
function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalJsonStringify(item));
    return '[' + items.join(',') + ']';
  }

  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const pairs = sortedKeys.map(
    (key) =>
      JSON.stringify(key) + ':' + canonicalJsonStringify(record[key]),
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * SHA-256 hex digest via Web Crypto API.
 * Throws if crypto.subtle is unavailable.
 */
async function sha256(data: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      '[GeneticTimeCapsuleService] Web Crypto API (crypto.subtle) is not available in this environment.',
    );
  }

  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await subtle.digest('SHA-256', encoded as Uint8Array<ArrayBuffer>);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// Legendary name generator
// ============================================================================

const LEGENDARY_ADJECTIVES: string[] = [
  'Violet', 'Silver', 'Amber', 'Crimson', 'Obsidian', 'Verdant', 'Azure',
  'Ivory', 'Scarlet', 'Golden', 'Ashen', 'Phantom', 'Luminous', 'Shadowed',
  'Whispering', 'Eternal', 'Frost', 'Iron', 'Storm', 'Silent', 'Hollow',
  'Radiant', 'Sunken', 'Ancient', 'Twilight', 'Ember', 'Crystal', 'Moss',
  'Bone', 'Glass',
];

const LEGENDARY_EPITHETS: string[] = [
  'Wanderer', 'Echo', 'Remnant', 'Sentinel', 'Whisper', 'Phantom', 'Herald',
  'Keeper', 'Pilgrim', 'Revenant', 'Drifter', 'Witness', 'Shade', 'Warden',
  'Seeker', 'Harbinger', 'Relic', 'Vestige', 'Oracle', 'Specter', 'Watcher',
  'Exile', 'Wayfarer', 'Vigil', 'Envoy', 'Mourner', 'Cipher', 'Anchor',
  'Scion', 'Ember',
];

const LEGENDARY_PLACES: string[] = [
  'Fungal Grotto', 'Ancient Wood', 'Sunken Vale', 'Crystal Hollow',
  'Ashen Field', 'Twilight Marsh', 'Bone Garden', 'Moss Cathedral',
  'Shattered Ridge', 'Ember Pool', 'Glass Tundra', 'Coral Spire',
  'Hollow Mountain', 'Thorn Labyrinth', 'Dust Basin', 'Frozen Dell',
  'Sky Root', 'Storm Reach', 'Iron Cavern', 'Amber Coast', 'Silent Mere',
  'Verdant Abyss', 'Crimson Shelf', 'Obsidian Stair', 'Pale Crossing',
  'Dusk Hollow', 'Veil Reach', 'Salt Wastes', 'Fern Court', 'Gale Cradle',
];

/**
 * Selects a word-list index from a 0–1 float, clamped to list length.
 */
function pickIndex(value: number, listLength: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return Math.floor(clamped * listLength) % listLength;
}

/**
 * Produces a simple numeric hash from a string, mapped to [0, 1).
 * Used as a fallback seed when trait values are unavailable.
 */
function stringToSeedValue(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

interface CoreTrait {
  trait_id: string;
  category: string;
  value: number;
  heritability: number;
}

function isCoreTraitArray(value: unknown): value is CoreTrait[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>)['value'] === 'number',
    )
  );
}

/**
 * Generates a deterministic legendary name from a genome.
 * Format: "The [Adjective] [Epithet] of the [Place]"
 *
 * Selection is seeded from trait values so the same genome always yields
 * the same name.  Falls back gracefully when genome fields are sparse.
 */
function generateLegendaryName(genome: Record<string, unknown>): string {
  const identity = genome['identity'];
  const speciesName =
    typeof identity === 'object' &&
    identity !== null &&
    typeof (identity as Record<string, unknown>)['species_name'] === 'string'
      ? ((identity as Record<string, unknown>)['species_name'] as string)
      : 'unknown';

  const traits = genome['core_traits'];
  const validTraits = isCoreTraitArray(traits) ? traits : [];

  const [trait0, trait1, trait2] = validTraits;
  const seed0 = trait0 !== undefined ? trait0.value : stringToSeedValue(speciesName);
  const seed1 = trait1 !== undefined ? trait1.value : stringToSeedValue(speciesName + '_epithet');
  const seed2 = trait2 !== undefined ? trait2.value : stringToSeedValue(speciesName + '_place');

  const adjective = LEGENDARY_ADJECTIVES[pickIndex(seed0, LEGENDARY_ADJECTIVES.length)];
  const epithet = LEGENDARY_EPITHETS[pickIndex(seed1, LEGENDARY_EPITHETS.length)];
  const place = LEGENDARY_PLACES[pickIndex(seed2, LEGENDARY_PLACES.length)];

  return `The ${adjective} ${epithet} of the ${place}`;
}

// ============================================================================
// Service
// ============================================================================

export const GeneticTimeCapsuleService = {

  // --------------------------------------------------------------------------
  // Exported helpers (exposed for testing / external use)
  // --------------------------------------------------------------------------

  canonicalJsonStringify,

  sha256,

  generateLegendaryName,

  // --------------------------------------------------------------------------
  // Checksum computation
  // --------------------------------------------------------------------------

  /**
   * Computes the genome checksum.
   * Uses `genome.core_traits` when present; falls back to the full genome.
   */
  async computeGenomeChecksum(
    genome: Record<string, unknown>,
  ): Promise<string> {
    const subject =
      'core_traits' in genome ? genome['core_traits'] : genome;
    return sha256(canonicalJsonStringify(subject));
  },

  /**
   * Computes the capsule checksum.
   * The input capsule must already have `genomicIntegrity.genomeChecksum` set;
   * `capsuleChecksum` is excluded from the hash.
   */
  async computeCapsuleChecksum(
    capsule: Omit<GenomeCapsuleV1, 'genomicIntegrity'> & {
      genomicIntegrity: { genomeChecksum: string };
    },
  ): Promise<string> {
    // Deep-clone via canonical stringify + parse so we can strip the field
    // without mutating the caller's object.
    const clone = JSON.parse(canonicalJsonStringify(capsule)) as Record<
      string,
      unknown
    >;

    // Remove capsuleChecksum from the integrity object before hashing
    const integrity = clone['genomicIntegrity'] as Record<string, unknown>;
    delete integrity['capsuleChecksum'];

    return sha256(canonicalJsonStringify(clone));
  },

  // --------------------------------------------------------------------------
  // Capsule creation
  // --------------------------------------------------------------------------

  /**
   * Creates a fully formed GenomeCapsuleV1 with both checksums computed.
   * Throws on any missing required fields.
   */
  async createCapsule(params: CreateCapsuleParams): Promise<GenomeCapsuleV1> {
    const { genome, depositor, provenance, discoveryHints } = params;

    if (!genome || typeof genome !== 'object' || Array.isArray(genome)) {
      throw new Error('[GeneticTimeCapsuleService] genome must be a plain object.');
    }
    if (!depositor.depositType) {
      throw new Error('[GeneticTimeCapsuleService] depositor.depositType is required.');
    }
    if (!provenance.sourceGame) {
      throw new Error('[GeneticTimeCapsuleService] provenance.sourceGame is required.');
    }
    if (!provenance.sourceGameVersion) {
      throw new Error('[GeneticTimeCapsuleService] provenance.sourceGameVersion is required.');
    }
    if (!provenance.depositContext) {
      throw new Error('[GeneticTimeCapsuleService] provenance.depositContext is required.');
    }

    const capsuleId = globalThis.crypto.randomUUID();
    const depositedAt = new Date().toISOString();
    const genomeChecksum = await GeneticTimeCapsuleService.computeGenomeChecksum(genome);

    // For extinction_automatic deposits, auto-generate a legendaryName if not provided.
    let resolvedDiscoveryHints = discoveryHints;
    if (depositor.depositType === 'extinction_automatic' && !discoveryHints?.legendaryName) {
      const legendaryName = generateLegendaryName(genome);
      resolvedDiscoveryHints = { ...discoveryHints, legendaryName };
    }

    // Build the capsule without capsuleChecksum first
    const partialCapsule: Omit<GenomeCapsuleV1, 'genomicIntegrity'> & {
      genomicIntegrity: { genomeChecksum: string };
    } = {
      capsuleVersion: '1.0.0',
      capsuleId,
      genome,
      depositor,
      provenance,
      genomicIntegrity: { genomeChecksum },
      depositedAt,
      ...(resolvedDiscoveryHints !== undefined ? { discoveryHints: resolvedDiscoveryHints } : {}),
    };

    const capsuleChecksum =
      await GeneticTimeCapsuleService.computeCapsuleChecksum(partialCapsule);

    const genomicIntegrity: GenomicIntegrity = {
      genomeChecksum,
      capsuleChecksum,
    };

    return {
      ...partialCapsule,
      genomicIntegrity,
    };
  },

  // --------------------------------------------------------------------------
  // Integrity verification
  // --------------------------------------------------------------------------

  /**
   * Recomputes both checksums and compares them against the stored values.
   * Returns a detailed result; never throws on mismatch.
   */
  async verifyCapsuleIntegrity(
    capsule: GenomeCapsuleV1,
  ): Promise<{ valid: boolean; genomeValid: boolean; capsuleValid: boolean }> {
    const expectedGenome =
      await GeneticTimeCapsuleService.computeGenomeChecksum(capsule.genome);
    const genomeValid =
      expectedGenome === capsule.genomicIntegrity.genomeChecksum;

    const partialCapsule: Omit<GenomeCapsuleV1, 'genomicIntegrity'> & {
      genomicIntegrity: { genomeChecksum: string };
    } = {
      capsuleVersion: capsule.capsuleVersion,
      capsuleId: capsule.capsuleId,
      genome: capsule.genome,
      depositor: capsule.depositor,
      provenance: capsule.provenance,
      genomicIntegrity: {
        genomeChecksum: capsule.genomicIntegrity.genomeChecksum,
      },
      depositedAt: capsule.depositedAt,
      ...(capsule.discoveryHints !== undefined
        ? { discoveryHints: capsule.discoveryHints }
        : {}),
      ...(capsule.withdrawn !== undefined
        ? { withdrawn: capsule.withdrawn }
        : {}),
    };

    const expectedCapsule =
      await GeneticTimeCapsuleService.computeCapsuleChecksum(partialCapsule);
    const capsuleValid =
      expectedCapsule === capsule.genomicIntegrity.capsuleChecksum;

    return {
      valid: genomeValid && capsuleValid,
      genomeValid,
      capsuleValid,
    };
  },

  // --------------------------------------------------------------------------
  // Attribution display
  // --------------------------------------------------------------------------

  /**
   * Returns the attribution text and visibility flags for a given depositor
   * and lineage generation depth.
   *
   * Generation rules
   * ----------------
   *  1 — "Genome archived by [name]"            depositorVisible: true
   *  2 — "Descended from an archived genome…"   depositorVisible: true
   *  3+ — "Carries the echo of an ancient…"     depositorVisible: false
   *
   * Deposit-type overrides (any generation)
   *  extinction_automatic — "Genome preserved at the moment of extinction"
   *  system_migration     — "Genome carried across the dimensional threshold"
   *
   * If withdrawn === true the generation-3+ text is always used.
   * Anonymous player deposits (no playerDisplayName) use "an unknown hand".
   */
  getAttributionText(
    depositor: CapsuleDepositor,
    generation: number,
    withdrawn?: boolean,
  ): AttributionDisplay {
    const ancientText = 'Carries the echo of an ancient lineage';

    if (withdrawn) {
      return { text: ancientText, generation, depositorVisible: false };
    }

    if (depositor.depositType === 'extinction_automatic') {
      return {
        text: 'Genome preserved at the moment of extinction',
        generation,
        depositorVisible: false,
      };
    }

    if (depositor.depositType === 'system_migration') {
      return {
        text: 'Genome carried across the dimensional threshold',
        generation,
        depositorVisible: false,
      };
    }

    if (generation >= 3) {
      return { text: ancientText, generation, depositorVisible: false };
    }

    const name = depositor.playerDisplayName ?? null;

    if (generation === 1) {
      const text = name
        ? `Genome archived by ${name}`
        : 'Genome archived by an unknown hand';
      return { text, generation, depositorVisible: name !== null };
    }

    // generation === 2
    const text = name
      ? `Descended from an archived genome (depositor: ${name})`
      : 'Descended from an archived genome (depositor: unknown)';
    return { text, generation, depositorVisible: name !== null };
  },
};
