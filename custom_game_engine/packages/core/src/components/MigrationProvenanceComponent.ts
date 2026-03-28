import type { Component } from '../ecs/Component.js';

// ============================================================================
// Migration Provenance Types
// ============================================================================

export type MigrationType = 'folkfork_file' | 'federated' | 'time_capsule_revival' | 'extinction_refugee';
export type SourceGame = 'precursors' | 'mvee';

export interface MigrationHop {
  fromGame: string;
  toGame: string;
  crossedAt: string; // ISO-8601
  gdiAtCrossing: number;
  schemaVersionUsed: string;
}

export interface MigrationLossDeclaration {
  lossless: string[];
  lossy: Array<{
    traitId: string;
    reason: string;
    originalValue: number;
    transferredValue: number;
    informationLoss: number; // 0–1
  }>;
  discarded: Array<{
    traitId: string;
    category: string;
    reason: string;
  }>;
  synthesized: string[];
  narrative: string;
}

export interface MigrationProvenanceData {
  sourceGame: SourceGame;
  sourceCreatureId: string;
  sourcePlayerId: string | null;
  migrationType: MigrationType;
  importedAt: string; // ISO-8601
  schemaVersion: string;
  genomicIntegrityHash: string; // SHA-256
  geneticDistanceIndex: number;
  lossDeclaration: MigrationLossDeclaration;
  migrationChain: MigrationHop[];
  federatedIdentityHash: string | null;
  capsuleId: string | null;
  loreNotes: string[];
}

/**
 * Validates and creates a MigrationProvenanceComponent.
 * Per CLAUDE.md: NO SILENT FALLBACKS - all required fields must be present.
 * All fields are readonly; this component is immutable provenance record.
 */
export class MigrationProvenanceComponent implements Component {
  public readonly type = 'migration_provenance' as const;
  public readonly version = 1;

  public readonly sourceGame!: SourceGame;
  public readonly sourceCreatureId!: string;
  public readonly sourcePlayerId!: string | null;
  public readonly migrationType!: MigrationType;
  public readonly importedAt!: string;
  public readonly schemaVersion!: string;
  public readonly genomicIntegrityHash!: string;
  public readonly geneticDistanceIndex!: number;
  public readonly lossDeclaration!: MigrationLossDeclaration;
  public readonly migrationChain!: MigrationHop[];
  public readonly federatedIdentityHash!: string | null;
  public readonly capsuleId!: string | null;
  public readonly loreNotes!: string[];

  constructor(data: MigrationProvenanceData) {
    // Validate all required fields - NO FALLBACKS
    if (data.sourceGame === undefined || data.sourceGame === null) {
      throw new Error('MigrationProvenanceComponent requires "sourceGame" field');
    }
    if (data.sourceCreatureId === undefined || data.sourceCreatureId === null) {
      throw new Error('MigrationProvenanceComponent requires "sourceCreatureId" field');
    }
    if (!('sourcePlayerId' in data)) {
      throw new Error('MigrationProvenanceComponent requires "sourcePlayerId" field');
    }
    if (data.migrationType === undefined || data.migrationType === null) {
      throw new Error('MigrationProvenanceComponent requires "migrationType" field');
    }
    if (data.importedAt === undefined || data.importedAt === null) {
      throw new Error('MigrationProvenanceComponent requires "importedAt" field');
    }
    if (data.schemaVersion === undefined || data.schemaVersion === null) {
      throw new Error('MigrationProvenanceComponent requires "schemaVersion" field');
    }
    if (data.genomicIntegrityHash === undefined || data.genomicIntegrityHash === null) {
      throw new Error('MigrationProvenanceComponent requires "genomicIntegrityHash" field');
    }
    if (data.geneticDistanceIndex === undefined || data.geneticDistanceIndex === null) {
      throw new Error('MigrationProvenanceComponent requires "geneticDistanceIndex" field');
    }
    if (data.lossDeclaration === undefined || data.lossDeclaration === null) {
      throw new Error('MigrationProvenanceComponent requires "lossDeclaration" field');
    }
    if (data.migrationChain === undefined || data.migrationChain === null) {
      throw new Error('MigrationProvenanceComponent requires "migrationChain" field');
    }
    if (!('federatedIdentityHash' in data)) {
      throw new Error('MigrationProvenanceComponent requires "federatedIdentityHash" field');
    }
    if (!('capsuleId' in data)) {
      throw new Error('MigrationProvenanceComponent requires "capsuleId" field');
    }
    if (data.loreNotes === undefined || data.loreNotes === null) {
      throw new Error('MigrationProvenanceComponent requires "loreNotes" field');
    }

    // Use Object.assign to bypass readonly restriction for initialization
    Object.assign(this, data);
  }
}
