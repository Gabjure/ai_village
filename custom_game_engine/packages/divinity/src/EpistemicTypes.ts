/**
 * EpistemicTypes - Core types for the Epistemic Discontinuities system
 *
 * Knowledge that has no causal path — the system knows something it never computed.
 * Higher-dimensional entities (gods, players) inject information via timeline selection,
 * not prediction or learning.
 */

// ============================================================================
// Injection Source
// ============================================================================

export type DivineMechanism =
  | 'omniscient_selection'    // God chose timeline where they know this
  | 'divine_revelation'       // God speaks directly to mind
  | 'timeline_bleeding'       // Knowledge leaks from other timelines
  | 'retrocausal_edit';       // God edits the past to create knowledge path

export type PlayerMechanism =
  | 'save_scum_memory'        // Player remembers deleted saves
  | 'meta_knowledge'          // Player knows game mechanics
  | 'strategic_selection'     // Player tried many paths, uses optimal one
  | 'wiki_knowledge';         // Player read external documentation

export type MultiverseMechanism =
  | 'quantum_selection'       // Selected from superposition of states
  | 'timeline_merge'          // Two timelines converged, knowledge from both
  | 'observer_collapse';      // Observation forced specific knowledge state

export type InjectionSource =
  | { readonly type: 'deity'; readonly deityId: string; readonly mechanism: DivineMechanism }
  | { readonly type: 'player'; readonly playerId: string; readonly mechanism: PlayerMechanism }
  | { readonly type: 'multiverse'; readonly timelines: readonly string[]; readonly mechanism: MultiverseMechanism }
  | { readonly type: 'prophecy'; readonly prophecyId: string }
  | { readonly type: 'fate'; readonly fateThread: string }
  | { readonly type: 'ancestral_memory'; readonly ancestorId: string };

// ============================================================================
// Knowledge Payload
// ============================================================================

export type KnowledgeType =
  // Factual knowledge
  | 'fact'
  | 'secret'
  | 'location'
  | 'identity'
  // Procedural knowledge
  | 'skill'
  | 'strategy'
  | 'recipe'
  // Predictive knowledge
  | 'future_event'
  | 'counterfactual'
  | 'optimal_path'
  // Meta knowledge
  | 'deleted_timeline_memory'
  | 'other_player_action'
  | 'game_mechanic'
  | 'narrative_role';

export type TruthValue =
  | 'true_in_all_timelines'
  | 'true_in_this_timeline'
  | 'true_in_source_timeline_only'
  | 'will_become_true'
  | 'false_but_believed'
  | 'indeterminate';

export interface KnowledgePayload {
  readonly type: KnowledgeType;
  /** Serializable knowledge content (string, object, etc.) */
  readonly content: string;
  /** How certain this knowledge is (0-1) */
  readonly confidence: number;
  /** Whether agents can verify this independently */
  readonly verifiable: boolean;
  readonly truthValue: TruthValue;
}

// ============================================================================
// Knowledge Phenomenology — how the injected knowledge feels to the recipient
// ============================================================================

export type ExperienceType =
  | 'sudden_knowing'      // "I just know it"
  | 'vision'              // Saw it in a dream/vision
  | 'voice'               // A voice told them
  | 'deja_vu'             // "I've seen this before"
  | 'intuition'           // "Gut feeling"
  | 'false_memory'        // "I remember learning this" (but didn't)
  | 'divine_whisper'      // God spoke to them
  | 'ancestral_echo';     // Ancestor's knowledge

export interface KnowledgePhenomenology {
  readonly experienceType: ExperienceType;
  /** How the agent subjectively "learned" this */
  readonly subjectiveOrigin: string;
  /** How certain do they feel (0-1) */
  readonly subjectiveCertainty: number;
  /** Whether they can explain how they know */
  readonly explainable: boolean;
  /** 0 = feels natural, 1 = feels wrong/alien */
  readonly alienness: number;
}

// ============================================================================
// Causality
// ============================================================================

export type CausalityStatus =
  | 'no_causal_path'         // Pure epistemic discontinuity
  | 'fabricated_causal_path' // False memory created to explain knowledge
  | 'partial_causal_path'    // Some legitimate basis exists
  | 'collapsed_causal_path'; // Path existed but timeline was changed

// ============================================================================
// Timeline Selection Context
// ============================================================================

export interface TimelineSelection {
  /** Timelines examined before selection */
  readonly timelinesConsidered: readonly string[];
  /** Timeline the knowledge was sourced from */
  readonly sourceTimeline: string;
  /** Selection criteria used */
  readonly selectionCriteria: string;
}

// ============================================================================
// Core Injection Record
// ============================================================================

export interface EpistemicInjection {
  readonly id: string;
  readonly source: InjectionSource;
  /** Entity ID receiving the knowledge */
  readonly targetEntityId: string;
  readonly knowledge: KnowledgePayload;
  readonly phenomenology: KnowledgePhenomenology;
  readonly causality: CausalityStatus;
  readonly selectionContext?: TimelineSelection;
  readonly injectionTimestamp: number;
  /** Status of the injection */
  readonly status: 'pending' | 'delivered' | 'detected' | 'undetected';
  /** ID of the EpisodicMemory created for this injection */
  readonly memoryId?: string;
}

// ============================================================================
// Injection Request (input to the system)
// ============================================================================

export interface EpistemicInjectionRequest {
  readonly source: InjectionSource;
  readonly targetEntityId: string;
  readonly knowledge: KnowledgePayload;
  readonly phenomenology: KnowledgePhenomenology;
  readonly causality: CausalityStatus;
  readonly selectionContext?: TimelineSelection;
}

// ============================================================================
// Detection Result
// ============================================================================

export interface InjectionDetectionResult {
  readonly injectionId: string;
  readonly detected: boolean;
  /** Agent's reaction if detected */
  readonly agentReaction?: 'confused' | 'disturbed' | 'accepting' | 'denying';
}
