import type { Component } from '../ecs/Component.js';

// ============================================================================
// Time Capsule Discovery Types
// ============================================================================

/**
 * Stages of capsule discovery (spec §3.3).
 *
 * trace            — environmental hint, legendary name, era tag
 * recognition      — narrative fragment, species identity, depositor attribution
 * revelation       — full creature description as lore text
 * revival_eligible — option to attempt revival
 */
export type DiscoveryStage = 'trace' | 'recognition' | 'revelation' | 'revival_eligible';

/**
 * Channels through which a capsule may be discovered (spec §3.2).
 *
 * archaeological         — biome exploration, Fossil Sites
 * genetic_echo           — breeding produces trait-similar offspring
 * divine_revelation      — gods with memory/death/nature/ancestry domains
 * extinction_archaeology — extinct species discovery sites
 */
export type DiscoveryChannel =
  | 'archaeological'
  | 'genetic_echo'
  | 'divine_revelation'
  | 'extinction_archaeology';

export interface TimeCapsuleDiscoveryData {
  capsuleId: string;
  discoveryStage: DiscoveryStage;
  discoveryChannel: DiscoveryChannel;
  discoveredAt: string;           // ISO-8601
  discoveredByPlayerId: string;
  legendaryName: string;
  eraTag?: string;
  biomeOrigin?: string;
  speciesId: string;
  isExtinctSpecies: boolean;
  revivalAttempted: boolean;
  revivalEntityId?: string;
}

/**
 * Tracks capsule discovery state on an entity.
 *
 * Per CLAUDE.md: NO SILENT FALLBACKS — all required fields must be present,
 * constructor throws on missing data.
 *
 * Reference: genetic-time-capsule-spec.md §3.2–§3.3
 */
export class TimeCapsuleDiscoveryComponent implements Component {
  public readonly type = 'time_capsule_discovery' as const;
  public readonly version = 1;

  public readonly capsuleId!: string;
  public readonly discoveryStage!: DiscoveryStage;
  public readonly discoveryChannel!: DiscoveryChannel;
  public readonly discoveredAt!: string;
  public readonly discoveredByPlayerId!: string;
  public readonly legendaryName!: string;
  public readonly eraTag!: string | undefined;
  public readonly biomeOrigin!: string | undefined;
  public readonly speciesId!: string;
  public readonly isExtinctSpecies!: boolean;
  public readonly revivalAttempted!: boolean;
  public readonly revivalEntityId!: string | undefined;

  constructor(data: TimeCapsuleDiscoveryData) {
    if (data.capsuleId === undefined || data.capsuleId === null) {
      throw new Error('TimeCapsuleDiscoveryComponent requires "capsuleId" field');
    }
    if (data.discoveryStage === undefined || data.discoveryStage === null) {
      throw new Error('TimeCapsuleDiscoveryComponent requires "discoveryStage" field');
    }
    if (data.discoveryChannel === undefined || data.discoveryChannel === null) {
      throw new Error('TimeCapsuleDiscoveryComponent requires "discoveryChannel" field');
    }
    if (data.discoveredAt === undefined || data.discoveredAt === null) {
      throw new Error('TimeCapsuleDiscoveryComponent requires "discoveredAt" field');
    }
    if (data.discoveredByPlayerId === undefined || data.discoveredByPlayerId === null) {
      throw new Error('TimeCapsuleDiscoveryComponent requires "discoveredByPlayerId" field');
    }
    if (data.legendaryName === undefined || data.legendaryName === null) {
      throw new Error('TimeCapsuleDiscoveryComponent requires "legendaryName" field');
    }
    if (data.speciesId === undefined || data.speciesId === null) {
      throw new Error('TimeCapsuleDiscoveryComponent requires "speciesId" field');
    }
    if (data.isExtinctSpecies === undefined || data.isExtinctSpecies === null) {
      throw new Error('TimeCapsuleDiscoveryComponent requires "isExtinctSpecies" field');
    }
    if (data.revivalAttempted === undefined || data.revivalAttempted === null) {
      throw new Error('TimeCapsuleDiscoveryComponent requires "revivalAttempted" field');
    }

    Object.assign(this, data);
  }
}

// ============================================================================
// Discovery Channel Interface Stubs (spec §3.2)
// ============================================================================
// These interfaces define the contract for each discovery channel's handler.
// Implementation is deferred to future sprint work (spec §7).

/** Result of a discovery channel evaluation */
export interface DiscoveryCandidate {
  capsuleId: string;
  legendaryName: string;
  eraTag?: string;
  biomeOrigin?: string;
  speciesId: string;
  isExtinctSpecies: boolean;
}

/**
 * Channel 1: Archaeological Discovery (Exploration)
 * Player explores a biome matching a capsule's biomeOrigin.
 * Fossil Sites surface fragments of archived lore.
 */
export interface ArchaeologicalDiscoveryChannel {
  /** Evaluate whether a biome contains discoverable capsules */
  evaluateBiome(biomeId: string, playerId: string): Promise<DiscoveryCandidate | null>;
}

/**
 * Channel 2: Genetic Echo (Breeding)
 * Breeding produces offspring with trait profile similar (cosine > 0.85)
 * to an archived capsule.
 */
export interface GeneticEchoDiscoveryChannel {
  /** Check if a newborn's traits echo an archived genome */
  evaluateOffspring(traitVector: number[], playerId: string): Promise<DiscoveryCandidate | null>;
}

/**
 * Channel 3: Divine Revelation (Divinity System)
 * Gods with memory/death/nature/ancestry domains reveal archived genomes
 * as Reliquary Myths.
 */
export interface DivineRevelationDiscoveryChannel {
  /** Generate a revelation for a ritual performed at a shrine */
  evaluateRitual(godDomains: string[], playerId: string): Promise<DiscoveryCandidate | null>;
}

/**
 * Channel 4: Extinction Archaeology (Extinct Species Only)
 * After extinction, Extinction Sites manifest in biomes where the
 * species would have naturally spawned.
 */
export interface ExtinctionArchaeologyDiscoveryChannel {
  /** Find capsules for a newly extinct species */
  evaluateExtinctionEvent(speciesId: string, biomeId: string): Promise<DiscoveryCandidate | null>;
}
