/**
 * ExtinctionVortexMonitorComponent — Tracks extinction vortex state per species.
 *
 * Attached to species-level entities to monitor genetic/behavioral diversity
 * and manage the 3-phase extinction detection flow.
 *
 * Per CLAUDE.md:
 *   - NO silent fallbacks — throw on invalid data
 *   - Component types use lowercase_with_underscores
 */

import type { Component } from '../ecs/Component.js';

/**
 * Extinction vortex phases:
 * - none:       No extinction concern
 * - warning:    Pre-extinction warning (D_cc < 0.01 OR F_population > 0.20)
 * - grace:      Extinction trigger met, grace period countdown (3 generation-ticks)
 * - extinct:    Species declared extinct
 */
export type ExtinctionVortexPhase = 'none' | 'warning' | 'grace' | 'extinct';

/**
 * Population-level metrics for extinction detection.
 */
export interface ExtinctionMetrics {
  /** Mean inbreeding coefficient across all living species members */
  fPopulation: number;
  /** Mean pairwise behavioral divergence (D_cc) across species */
  dccPopulation: number;
  /** Number of living members of this species */
  populationSize: number;
}

/**
 * Snapshot of a survivor's data at extinction time.
 */
export interface ExtinctionSurvivorData {
  /** This creature belongs to a species that went extinct in its source game */
  extinctionSurvivor: true;
  /** When the extinction occurred (ISO 8601) */
  extinctionDate: string;
  /** The source game where extinction happened */
  sourceGame: string;
  /** Species ID of the extinct species */
  extinctSpeciesId: string;
  /** Population metrics at time of extinction */
  finalMetrics: ExtinctionMetrics;
  /** Number of known survivors across all games */
  knownSurvivorCount: number;
  /** Generation number of the last known survivor, for lineage tracking */
  lastSurvivorGeneration: number;
}

/**
 * ExtinctionVortexMonitorComponent — per-species extinction vortex tracker.
 */
export interface ExtinctionVortexMonitorComponent extends Component {
  type: 'extinction_vortex_monitor';

  /** Species being monitored */
  speciesId: string;

  /** Current extinction vortex phase */
  phase: ExtinctionVortexPhase;

  /** Latest computed population metrics */
  metrics: ExtinctionMetrics;

  /** Grace period generation-ticks remaining (0-3, only meaningful in 'grace' phase) */
  graceTicksRemaining: number;

  /** Tick when warning phase was first entered */
  warningStartTick: number;

  /** Tick when grace phase was first entered (0 if not in grace) */
  graceStartTick: number;

  /** Tick of last metrics evaluation */
  lastEvaluationTick: number;
}

/**
 * ExtinctionSurvivorComponent — attached to individual entities that survived
 * their species' extinction event.
 */
export interface ExtinctionSurvivorComponent extends Component {
  type: 'extinction_survivor';
  survivorData: ExtinctionSurvivorData;
}

/**
 * Create an extinction survivor component for an entity.
 */
export function createExtinctionSurvivorComponent(data: ExtinctionSurvivorData): ExtinctionSurvivorComponent {
  return {
    type: 'extinction_survivor',
    version: 1,
    survivorData: data,
  };
}

/**
 * Create a default extinction vortex monitor for a species.
 */
export function createExtinctionVortexMonitor(speciesId: string): ExtinctionVortexMonitorComponent {
  if (!speciesId) {
    throw new Error('Cannot create extinction vortex monitor: missing speciesId');
  }
  return {
    type: 'extinction_vortex_monitor',
    version: 1,
    speciesId,
    phase: 'none',
    metrics: {
      fPopulation: 0,
      dccPopulation: 1,
      populationSize: 0,
    },
    graceTicksRemaining: 0,
    warningStartTick: 0,
    graceStartTick: 0,
    lastEvaluationTick: 0,
  };
}
