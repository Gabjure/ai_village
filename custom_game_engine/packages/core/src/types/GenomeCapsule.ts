/**
 * GenomeCapsule types
 *
 * Defines the `genome_capsule_v1` schema for the Genetic Time Capsule system.
 *
 * The `genome` field carries a GenomeMigrationV1 payload from
 * `@multiverse-studios/folkfork-bridge`. We type it as
 * `Record<string, unknown>` here so the core package stays schema-agnostic;
 * callers that need full type safety should cast to GenomeMigrationV1 after
 * validating with the bridge's validator.
 */

// ============================================================================
// Deposit primitives
// ============================================================================

export type DepositType =
  | 'player'
  | 'extinction_automatic'
  | 'system_migration';

export type DepositContext =
  | 'voluntary'
  | 'pre_extinction'
  | 'post_extinction'
  | 'lineage_milestone'
  | 'cross_game_transfer';

export type SpeciesStatus = 'extant' | 'endangered' | 'extinct';

// ============================================================================
// Capsule sub-objects
// ============================================================================

export interface CapsuleDepositor {
  depositType: DepositType;
  playerId?: string;
  playerDisplayName?: string;
  depositNarrative?: string;
}

export interface CapsuleProvenance {
  sourceGame: string;
  sourceGameVersion: string;
  depositContext: DepositContext;
  speciesStatus?: SpeciesStatus;
  populationMetrics?: {
    populationSize: number;
    dcc: number;
    fPopulation: number;
  };
  relatedExtinctionEvent?: string;
}

export interface GenomicIntegrity {
  /** SHA-256 of genome.core_traits (canonical JSON, sorted keys) */
  genomeChecksum: string;
  /** SHA-256 of entire capsule excluding this field */
  capsuleChecksum: string;
}

export interface DiscoveryHints {
  legendaryName?: string;
  eraTag?: string;
  biomeOrigin?: string;
  /** Top 3 most distinctive traits */
  traitSignature?: string[];
}

// ============================================================================
// Root capsule type
// ============================================================================

export interface GenomeCapsuleV1 {
  capsuleVersion: '1.0.0';
  capsuleId: string;
  /**
   * GenomeMigrationV1 payload from @multiverse-studios/folkfork-bridge.
   * Typed as Record<string, unknown> to avoid a hard schema dependency in core.
   */
  genome: Record<string, unknown>;
  depositor: CapsuleDepositor;
  provenance: CapsuleProvenance;
  genomicIntegrity: GenomicIntegrity;
  /** ISO-8601 timestamp */
  depositedAt: string;
  discoveryHints?: DiscoveryHints;
  withdrawn?: boolean;
}

// ============================================================================
// Archive index types
// ============================================================================

export interface SpeciesCatalogEntry {
  speciesId: string;
  capsuleCount: number;
  oldestDeposit: string;
  newestDeposit: string;
  speciesStatus: SpeciesStatus;
  extinctionDate?: string;
  archetypeDistribution: Record<string, number>;
}

export interface ArchiveIndex {
  archiveVersion: '1.0.0';
  lastUpdated: string;
  speciesCatalog: SpeciesCatalogEntry[];
  totalCapsules: number;
  totalSpecies: number;
  totalExtinctSpecies: number;
}

export interface SpeciesIndex {
  speciesId: string;
  lastUpdated: string;
  capsules: Array<{
    capsuleId: string;
    creatureId: string;
    creatureName: string;
    depositedAt: string;
    depositType: DepositType;
    withdrawn: boolean;
  }>;
}

// ============================================================================
// Attribution display (fade logic)
// ============================================================================

export type AttributionGeneration = 1 | 2 | 3;

export interface AttributionDisplay {
  text: string;
  generation: number;
  depositorVisible: boolean;
}
