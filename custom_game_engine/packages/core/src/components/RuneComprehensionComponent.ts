/**
 * RuneComprehensionComponent - Tracks which runes a creature understands
 *
 * Rune comprehension is the key that gates passage through rune-locked doors
 * and passages. Creatures learn runes through:
 * - Exposure: Spending time near inscribed runes
 * - Teaching: Being taught by a creature that already comprehends the rune
 * - Study: Researching rune knowledge in libraries/universities
 *
 * Comprehension is distinct from the rune skill tree — the skill tree teaches
 * HOW to carve runes, while comprehension tracks UNDERSTANDING of specific
 * rune categories. A creature can comprehend a rune without being able to
 * carve it, and vice versa.
 *
 * The 6 gate runes are drawn from existing rune categories:
 * protection, power, knowledge, binding, creation, destruction
 */

import type { Component, ComponentSchema } from '../ecs/Component.js';

/**
 * The 6 rune categories that can gate doors/passages.
 * These are a subset of the full rune categories in RuneSkillTree.
 */
export const GATE_RUNE_CATEGORIES = [
  'protection',
  'power',
  'knowledge',
  'binding',
  'creation',
  'destruction',
] as const;

export type GateRuneCategory = typeof GATE_RUNE_CATEGORIES[number];

/** Comprehension threshold required to traverse a rune-locked gate */
export const COMPREHENSION_THRESHOLD = 0.7;

/** Exposure ticks needed to gain full comprehension (at 20 TPS, ~5 minutes) */
const FULL_EXPOSURE_TICKS = 6000;

/** Comprehension gained per teaching event */
const TEACHING_COMPREHENSION_GAIN = 0.35;

/** Comprehension gained per study event */
const STUDY_COMPREHENSION_GAIN = 0.2;

/**
 * Per-rune learning state.
 */
export interface RuneLearningState {
  /** Comprehension level (0-1). >= COMPREHENSION_THRESHOLD to traverse gates */
  level: number;

  /** Cumulative exposure ticks near this rune */
  exposureTicks: number;

  /** Tick when creature first encountered this rune */
  firstExposure: number;

  /** How many times creature has been taught this rune */
  teachingCount: number;

  /** How many study sessions for this rune */
  studyCount: number;
}

/**
 * Component tracking rune comprehension for gate traversal.
 */
export interface RuneComprehensionComponent extends Component {
  type: 'rune_comprehension';

  /** Per-rune learning state */
  runes: Partial<Record<GateRuneCategory, RuneLearningState>>;
}

/**
 * Create a new rune comprehension component with no knowledge.
 */
export function createRuneComprehensionComponent(): RuneComprehensionComponent {
  return {
    type: 'rune_comprehension',
    version: 1,
    runes: {},
  };
}

/**
 * Get the comprehension level for a specific rune category.
 * Returns 0 if never encountered.
 */
export function getRuneComprehension(
  comp: RuneComprehensionComponent,
  rune: GateRuneCategory
): number {
  return comp.runes[rune]?.level ?? 0;
}

/**
 * Check if a creature has sufficient comprehension to traverse a rune-locked gate.
 *
 * This is the core gating function. Comprehension must meet the threshold —
 * model tier or skill level alone is not sufficient.
 *
 * @param comp - The creature's rune comprehension component
 * @param requiredRune - The rune category gating this door/passage
 * @returns Object with canTraverse boolean and optional failure reason
 */
export function canTraverseDoorGate(
  comp: RuneComprehensionComponent | undefined,
  requiredRune: GateRuneCategory
): { canTraverse: boolean; reason?: string } {
  if (!comp) {
    return {
      canTraverse: false,
      reason: `No rune comprehension — cannot understand ${requiredRune} rune`,
    };
  }

  const level = getRuneComprehension(comp, requiredRune);
  if (level < COMPREHENSION_THRESHOLD) {
    return {
      canTraverse: false,
      reason: `Insufficient ${requiredRune} rune comprehension: ${level.toFixed(2)} < ${COMPREHENSION_THRESHOLD.toFixed(2)}`,
    };
  }

  return { canTraverse: true };
}

/**
 * Record rune exposure — called each tick while creature is near a rune.
 * Comprehension grows with cumulative exposure.
 *
 * @returns Updated component (immutable)
 */
export function recordRuneExposure(
  comp: RuneComprehensionComponent,
  rune: GateRuneCategory,
  tick: number
): RuneComprehensionComponent {
  const existing = comp.runes[rune];
  const exposureTicks = (existing?.exposureTicks ?? 0) + 1;

  // Comprehension from exposure: asymptotic approach to 1.0
  const exposureComprehension = 1.0 - Math.exp(-exposureTicks / FULL_EXPOSURE_TICKS);

  // Total comprehension = max of exposure-based and event-based learning
  const eventComprehension = calculateEventComprehension(
    existing?.teachingCount ?? 0,
    existing?.studyCount ?? 0
  );

  const level = Math.min(1.0, Math.max(exposureComprehension, eventComprehension));

  const newState: RuneLearningState = {
    level,
    exposureTicks,
    firstExposure: existing?.firstExposure ?? tick,
    teachingCount: existing?.teachingCount ?? 0,
    studyCount: existing?.studyCount ?? 0,
  };

  return {
    ...comp,
    runes: {
      ...comp.runes,
      [rune]: newState,
    },
  };
}

/**
 * Record a teaching event — creature is taught a rune by another creature.
 *
 * @returns Updated component (immutable)
 */
export function recordRuneTeaching(
  comp: RuneComprehensionComponent,
  rune: GateRuneCategory,
  tick: number
): RuneComprehensionComponent {
  const existing = comp.runes[rune];
  const teachingCount = (existing?.teachingCount ?? 0) + 1;

  const eventComprehension = calculateEventComprehension(
    teachingCount,
    existing?.studyCount ?? 0
  );

  // Exposure comprehension stays as-is
  const exposureComprehension = existing
    ? 1.0 - Math.exp(-existing.exposureTicks / FULL_EXPOSURE_TICKS)
    : 0;

  const level = Math.min(1.0, Math.max(exposureComprehension, eventComprehension));

  const newState: RuneLearningState = {
    level,
    exposureTicks: existing?.exposureTicks ?? 0,
    firstExposure: existing?.firstExposure ?? tick,
    teachingCount,
    studyCount: existing?.studyCount ?? 0,
  };

  return {
    ...comp,
    runes: {
      ...comp.runes,
      [rune]: newState,
    },
  };
}

/**
 * Record a study event — creature studies rune knowledge.
 *
 * @returns Updated component (immutable)
 */
export function recordRuneStudy(
  comp: RuneComprehensionComponent,
  rune: GateRuneCategory,
  tick: number
): RuneComprehensionComponent {
  const existing = comp.runes[rune];
  const studyCount = (existing?.studyCount ?? 0) + 1;

  const eventComprehension = calculateEventComprehension(
    existing?.teachingCount ?? 0,
    studyCount
  );

  const exposureComprehension = existing
    ? 1.0 - Math.exp(-existing.exposureTicks / FULL_EXPOSURE_TICKS)
    : 0;

  const level = Math.min(1.0, Math.max(exposureComprehension, eventComprehension));

  const newState: RuneLearningState = {
    level,
    exposureTicks: existing?.exposureTicks ?? 0,
    firstExposure: existing?.firstExposure ?? tick,
    teachingCount: existing?.teachingCount ?? 0,
    studyCount,
  };

  return {
    ...comp,
    runes: {
      ...comp.runes,
      [rune]: newState,
    },
  };
}

/**
 * Calculate comprehension from teaching and study events.
 * Each teaching event adds TEACHING_COMPREHENSION_GAIN with diminishing returns.
 * Each study event adds STUDY_COMPREHENSION_GAIN with diminishing returns.
 */
function calculateEventComprehension(
  teachingCount: number,
  studyCount: number
): number {
  // Diminishing returns: each successive event contributes less
  let comprehension = 0;
  for (let i = 0; i < teachingCount; i++) {
    comprehension += TEACHING_COMPREHENSION_GAIN * Math.pow(0.7, i);
  }
  for (let i = 0; i < studyCount; i++) {
    comprehension += STUDY_COMPREHENSION_GAIN * Math.pow(0.7, i);
  }
  return Math.min(1.0, comprehension);
}

/**
 * Check if a rune category is a valid gate rune.
 */
export function isGateRune(rune: string): rune is GateRuneCategory {
  return (GATE_RUNE_CATEGORIES as readonly string[]).includes(rune);
}

// ============================================================================
// Schema
// ============================================================================

export const RuneComprehensionComponentSchema: ComponentSchema<RuneComprehensionComponent> = {
  type: 'rune_comprehension',
  version: 1,
  fields: [
    { name: 'runes', type: 'object', required: true },
  ],
  validate: (data: unknown): data is RuneComprehensionComponent => {
    if (typeof data !== 'object' || data === null) return false;
    if (!('type' in data) || data.type !== 'rune_comprehension') return false;
    if (!('runes' in data) || typeof data.runes !== 'object') return false;
    return true;
  },
  createDefault: () => createRuneComprehensionComponent(),
};
