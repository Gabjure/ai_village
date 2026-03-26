/**
 * EpistemicInjectionSystem - Service for injecting knowledge into agents
 * without causal paths.
 *
 * Allows higher-dimensional entities (gods, players, fate) to grant agents
 * knowledge they could not have obtained through normal experience. The
 * knowledge is encoded as an EpisodicMemory with a subjective phenomenology
 * that masks the true source.
 *
 * Follows the service class pattern of VisionDeliverySystem (not an ECS System).
 */

import type { World } from '@ai-village/core';
import { ComponentType as CT } from '@ai-village/core';
import type { EpistemicInjection, EpistemicInjectionRequest, InjectionDetectionResult } from './EpistemicTypes.js';
import type { EpisodicMemoryComponent } from '@ai-village/core';

// ============================================================================
// EpistemicInjectionSystem
// ============================================================================

export class EpistemicInjectionSystem {
  private readonly world: World;
  private readonly injections: Map<string, EpistemicInjection> = new Map();
  private injectionIdCounter = 0;

  constructor(world: World) {
    this.world = world;
  }

  /**
   * Queue a knowledge injection for delivery.
   * Returns the injection ID.
   */
  queueInjection(request: EpistemicInjectionRequest): string {
    if (!request.targetEntityId) {
      throw new Error('[EpistemicInjectionSystem] queueInjection: targetEntityId is required');
    }
    if (!request.knowledge.content) {
      throw new Error('[EpistemicInjectionSystem] queueInjection: knowledge.content is required');
    }

    const id = `epistemic_${++this.injectionIdCounter}_${Date.now()}`;

    const injection: EpistemicInjection = {
      id,
      source: request.source,
      targetEntityId: request.targetEntityId,
      knowledge: request.knowledge,
      phenomenology: request.phenomenology,
      causality: request.causality,
      selectionContext: request.selectionContext,
      injectionTimestamp: this.world.tick,
      status: 'pending',
    };

    this.injections.set(id, injection);
    return id;
  }

  /**
   * Process all pending injections.
   * Should be called once per tick (or on-demand).
   * Returns detection results for all processed injections.
   */
  processInjections(): InjectionDetectionResult[] {
    const results: InjectionDetectionResult[] = [];

    for (const [_id, injection] of this.injections) {
      if (injection.status !== 'pending') continue;

      const result = this.deliverInjection(injection);
      if (result !== null) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Lookup an injection by ID.
   */
  getInjection(id: string): EpistemicInjection | undefined {
    return this.injections.get(id);
  }

  /**
   * Get all injections targeting a specific entity.
   */
  getInjectionsByTarget(entityId: string): EpistemicInjection[] {
    return Array.from(this.injections.values()).filter(
      (inj) => inj.targetEntityId === entityId
    );
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private deliverInjection(injection: EpistemicInjection): InjectionDetectionResult | null {
    const target = this.world.getEntity(injection.targetEntityId);
    if (!target) {
      console.warn(
        `[EpistemicInjectionSystem] Target entity not found: ${injection.targetEntityId} for injection ${injection.id}`
      );
      return null;
    }

    const episodicMemory = target.getComponent<EpisodicMemoryComponent>(CT.EpisodicMemory);
    if (!episodicMemory) {
      // Entity has no episodic memory — cannot inject knowledge
      return null;
    }

    // Build memory summary from phenomenology and knowledge content
    const summary = this.buildMemorySummary(injection);

    // Importance is weighted toward high confidence knowledge
    const importance = Math.min(1.0, 0.7 + 0.3 * injection.knowledge.confidence);

    // Form the episodic memory — this is the mechanism by which the agent "knows"
    const memory = episodicMemory.formMemory({
      eventType: 'epistemic_injection',
      summary,
      timestamp: this.world.tick,
      importance,
      surprise: injection.phenomenology.alienness,
      clarity: 1.0,
      consolidated: false,
      epistemicInjectionId: injection.id,
      injectionAlienness: injection.phenomenology.alienness,
    });

    // Determine if the agent notices something is wrong
    // detectionChance scales with alienness: max ~40% for fully alien knowledge
    const detectionChance = injection.phenomenology.alienness * 0.6;
    const detected = Math.random() < detectionChance;

    // Build updated injection with delivery status
    const updatedInjection: EpistemicInjection = {
      ...injection,
      status: detected ? 'detected' : 'undetected',
      memoryId: memory.id,
    };
    this.injections.set(injection.id, updatedInjection);

    // Emit the event for other systems to react
    this.world.eventBus.emit<'epistemic:knowledge_injected'>({
      type: 'epistemic:knowledge_injected',
      source: injection.targetEntityId,
      data: {
        injectionId: injection.id,
        targetEntityId: injection.targetEntityId,
        memoryId: memory.id,
        sourceType: injection.source.type,
        knowledgeType: injection.knowledge.type,
        detected,
        alienness: injection.phenomenology.alienness,
      },
    });

    const result: InjectionDetectionResult = {
      injectionId: injection.id,
      detected,
      agentReaction: detected ? this.pickAgentReaction(injection.phenomenology.alienness) : undefined,
    };

    return result;
  }

  private buildMemorySummary(injection: EpistemicInjection): string {
    const { experienceType, subjectiveOrigin } = injection.phenomenology;
    const content = injection.knowledge.content;

    switch (experienceType) {
      case 'sudden_knowing':
        return `I suddenly know: ${content}. ${subjectiveOrigin}`;
      case 'vision':
        return `In a vision I saw: ${content}. ${subjectiveOrigin}`;
      case 'voice':
        return `A voice told me: ${content}. ${subjectiveOrigin}`;
      case 'deja_vu':
        return `I have seen this before — ${content}. ${subjectiveOrigin}`;
      case 'intuition':
        return `I have a strong feeling: ${content}. ${subjectiveOrigin}`;
      case 'false_memory':
        return `I remember learning: ${content}. ${subjectiveOrigin}`;
      case 'divine_whisper':
        return `A divine whisper revealed: ${content}. ${subjectiveOrigin}`;
      case 'ancestral_echo':
        return `An echo from my ancestors: ${content}. ${subjectiveOrigin}`;
      default:
        return `${content}. ${subjectiveOrigin}`;
    }
  }

  private pickAgentReaction(
    alienness: number
  ): 'confused' | 'disturbed' | 'accepting' | 'denying' {
    if (alienness > 0.8) return 'disturbed';
    if (alienness > 0.5) return 'confused';
    if (alienness > 0.2) return 'accepting';
    return 'denying';
  }
}
