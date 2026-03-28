import type { Component } from '../ecs/Component.js';

// ============================================================================
// Quarantine Status Types
// ============================================================================

export type QuarantinePhase = 'arriving' | 'adjusting' | 'integrating' | 'complete';

const VALID_QUARANTINE_PHASES: ReadonlySet<QuarantinePhase> = new Set([
  'arriving',
  'adjusting',
  'integrating',
  'complete',
]);

export interface QuarantineStatusData {
  phase: QuarantinePhase;
  startTick: number;
  currentPhaseTick: number;
  biomeAdaptationScore: number; // 0–1
  observedBehaviors: string[];
  releaseEligible: boolean;
  releaseBlockers: string[];
}

export interface QuarantineStatusComponent extends Component {
  readonly type: 'quarantine_status';
  phase: QuarantinePhase;
  startTick: number;
  currentPhaseTick: number;
  biomeAdaptationScore: number;
  observedBehaviors: string[];
  releaseEligible: boolean;
  releaseBlockers: string[];
}

/**
 * Validates and creates a QuarantineStatusComponent.
 * Per CLAUDE.md: NO SILENT FALLBACKS - all required fields must be present.
 */
export class QuarantineStatusComponent implements Component {
  public readonly type = 'quarantine_status' as const;
  public readonly version = 1;

  public phase: QuarantinePhase;
  public startTick: number;
  public currentPhaseTick: number;
  public biomeAdaptationScore: number;
  public observedBehaviors: string[];
  public releaseEligible: boolean;
  public releaseBlockers: string[];

  constructor(data: QuarantineStatusData) {
    // Validate all required fields - NO FALLBACKS
    if (data.phase === undefined || data.phase === null) {
      throw new Error('QuarantineStatusComponent requires "phase" field');
    }
    if (!VALID_QUARANTINE_PHASES.has(data.phase)) {
      throw new Error(
        `QuarantineStatusComponent "phase" must be one of: ${[...VALID_QUARANTINE_PHASES].join(', ')}; got "${data.phase}"`,
      );
    }
    if (data.startTick === undefined || data.startTick === null) {
      throw new Error('QuarantineStatusComponent requires "startTick" field');
    }
    if (data.startTick < 0) {
      throw new Error(`QuarantineStatusComponent "startTick" must be >= 0; got ${data.startTick}`);
    }
    if (data.currentPhaseTick === undefined || data.currentPhaseTick === null) {
      throw new Error('QuarantineStatusComponent requires "currentPhaseTick" field');
    }
    if (data.biomeAdaptationScore === undefined || data.biomeAdaptationScore === null) {
      throw new Error('QuarantineStatusComponent requires "biomeAdaptationScore" field');
    }
    if (data.biomeAdaptationScore < 0 || data.biomeAdaptationScore > 1) {
      throw new Error(
        `QuarantineStatusComponent "biomeAdaptationScore" must be between 0 and 1; got ${data.biomeAdaptationScore}`,
      );
    }
    if (data.observedBehaviors === undefined || data.observedBehaviors === null) {
      throw new Error('QuarantineStatusComponent requires "observedBehaviors" field');
    }
    if (data.releaseEligible === undefined || data.releaseEligible === null) {
      throw new Error('QuarantineStatusComponent requires "releaseEligible" field');
    }
    if (data.releaseBlockers === undefined || data.releaseBlockers === null) {
      throw new Error('QuarantineStatusComponent requires "releaseBlockers" field');
    }

    // Assign all fields
    this.phase = data.phase;
    this.startTick = data.startTick;
    this.currentPhaseTick = data.currentPhaseTick;
    this.biomeAdaptationScore = data.biomeAdaptationScore;
    this.observedBehaviors = data.observedBehaviors;
    this.releaseEligible = data.releaseEligible;
    this.releaseBlockers = data.releaseBlockers;
  }
}

/**
 * Factory function: creates a new QuarantineStatusComponent in the 'arriving' phase
 * with sensible defaults for a freshly migrated creature.
 *
 * @param startTick - The world tick at which quarantine begins.
 */
export function createQuarantineStatus(startTick: number): QuarantineStatusComponent {
  return new QuarantineStatusComponent({
    phase: 'arriving',
    startTick,
    currentPhaseTick: startTick,
    biomeAdaptationScore: 0,
    observedBehaviors: [],
    releaseEligible: false,
    releaseBlockers: [],
  });
}

/**
 * Returns true if the creature is still in quarantine (phase !== 'complete').
 */
export function isQuarantined(component: QuarantineStatusComponent): boolean {
  return component.phase !== 'complete';
}
