/**
 * Discovery channel interface stubs for the Genetic Time Capsule system.
 * These define the contract for each discovery mechanic.
 * Implementation is deferred to future sprints.
 *
 * Reference: genetic-time-capsule-spec.md §3.2
 */

/** Channel 1: Archaeological Discovery (Exploration) */
export interface ArchaeologicalDiscovery {
  /** Find capsules by matching biomeOrigin to current biome */
  selectCapsuleForBiome(biomeId: string, excludePlayerIds: string[]): Promise<string | null>;
  /** Generate Fossil Site environmental description */
  generateFossilSiteDescription(capsuleId: string): Promise<string>;
}

/** Channel 2: Genetic Echo (Breeding) */
export interface GeneticEchoDiscovery {
  /** Check if offspring trait vector resembles an archived capsule (cosine similarity > 0.85) */
  findEchoMatch(traitVector: number[], excludePlayerIds: string[]): Promise<string | null>;
  /** Generate echo narrative for offspring info panel */
  generateEchoNarrative(capsuleId: string, offspringName: string): Promise<string>;
}

/** Channel 3: Divine Revelation */
export interface DivineRevelationDiscovery {
  /** Select capsule for god with relevant domain */
  selectCapsuleForDomain(domain: string, excludePlayerIds: string[]): Promise<string | null>;
  /** Generate reliquary myth text */
  generateReliquaryMyth(capsuleId: string, godName: string): Promise<string>;
}

/** Channel 4: Extinction Archaeology */
export interface ExtinctionArchaeologyDiscovery {
  /** Get capsules for a recently extinct species */
  getExtinctSpeciesCapsules(speciesId: string): Promise<string[]>;
  /** Generate Extinction Site description */
  generateExtinctionSiteDescription(speciesId: string, capsuleCount: number): Promise<string>;
  /** Stage capsule reveals across sessions (one per visit) */
  getNextStagedCapsule(speciesId: string, previouslyRevealed: string[]): Promise<string | null>;
}
