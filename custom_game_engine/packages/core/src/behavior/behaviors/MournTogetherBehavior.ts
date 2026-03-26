/**
 * MournTogetherBehavior - Grieving agents gather to share their sorrow
 *
 * When an agent is mourning (mood.mourning === true), they may initiate
 * or join a mourning gathering. Agents who knew the deceased gather near
 * the initiator, share memories, and comfort each other.
 *
 * Mechanics:
 * - Initiator calls out in grief, attracting other mourning/close agents
 * - Participants gather and share memories of the deceased
 * - Grief is reduced for all participants
 * - Relationships between participants are strengthened
 * - Social needs (socialContact, socialDepth, socialBelonging) are satisfied
 */

import type { BehaviorContext, BehaviorResult as ContextBehaviorResult } from '../BehaviorContext.js';
import type { AgentComponent } from '../../components/AgentComponent.js';
import type { MoodComponent } from '../../components/MoodComponent.js';
import type { RelationshipComponent } from '../../components/RelationshipComponent.js';
import type { NeedsComponent } from '../../components/NeedsComponent.js';
import { ComponentType as CT } from '../../types/ComponentType.js';
import type { EntityImpl } from '../../ecs/Entity.js';

const MOURN_CONFIG = {
  // Gathering
  GATHER_RADIUS: 20,
  MIN_PARTICIPANTS: 2,
  MAX_PARTICIPANTS: 8,
  GATHER_TIMEOUT: 150,

  // Duration
  BASE_DURATION: 300, // ~15 seconds
  PER_PARTICIPANT_BONUS: 40,

  // Grief reduction
  BASE_GRIEF_REDUCTION: 15,
  PER_PARTICIPANT_GRIEF_BONUS: 5,

  // Relationship improvement
  RELATIONSHIP_BOOST: 0.08,

  // Social need satisfaction
  SOCIAL_CONTACT_BOOST: 15,
  SOCIAL_DEPTH_BOOST: 20,
  SOCIAL_BELONGING_BOOST: 25,
};

type MournPhase = 'gathering' | 'mourning' | 'complete';

const MOURNING_CALLS = [
  'I cannot bear this grief alone...',
  'Come, let us remember them together.',
  'My heart is heavy. Will you grieve with me?',
  'We have lost someone dear to us all.',
];

const MOURNING_PHRASES = [
  'I will never forget them.',
  'They were so full of life...',
  'We were lucky to have known them.',
  'Their memory lives on in all of us.',
  'I miss them dearly.',
];

const COMFORT_PHRASES = [
  'We will get through this together.',
  'Take heart, friend. They would want us to carry on.',
  'I share your sorrow.',
  'You are not alone in this.',
];

/**
 * Modern mourn_together behavior using BehaviorContext.
 * @example registerBehaviorWithContext('mourn_together', mournTogetherBehaviorWithContext);
 */
export function mournTogetherBehaviorWithContext(ctx: BehaviorContext): ContextBehaviorResult | void {
  const phase = (ctx.getState<string>('phase')) ?? 'gathering';

  const mood = ctx.getComponent<MoodComponent>(CT.Mood);

  if (!mood || !mood.mourning) {
    return ctx.complete('not_mourning');
  }

  switch (phase) {
    case 'gathering':
      return handleGatheringPhase(ctx, mood);
    case 'mourning':
      return handleMourningPhase(ctx, mood);
    case 'complete':
      return ctx.complete('mourning_complete');
  }
}

function handleGatheringPhase(ctx: BehaviorContext, mood: MoodComponent): ContextBehaviorResult | void {
  ctx.stopMovement();

  if (!ctx.getState('gatherStarted')) {
    const call = MOURNING_CALLS[Math.floor(Math.random() * MOURNING_CALLS.length)]!;

    ctx.setThought(call);

    ctx.emit({
      type: 'mourn_together:call',
      data: {
        initiatorId: ctx.entity.id,
        location: { x: ctx.position.x, y: ctx.position.y },
        message: call,
        tick: ctx.tick,
      },
    });

    ctx.updateState({
      gatherStarted: ctx.tick,
      isInitiator: true,
      participants: [ctx.entity.id],
    });
    return;
  }

  const gatherStarted = ctx.getState<number>('gatherStarted')!;
  const elapsed = ctx.tick - gatherStarted;

  if (elapsed > MOURN_CONFIG.GATHER_TIMEOUT) {
    const participants = gatherMourners(ctx);

    if (participants.length < MOURN_CONFIG.MIN_PARTICIPANTS) {
      // Grieve alone - still get a small benefit
      ctx.setThought('I must bear this grief alone...');
      return ctx.complete('insufficient_mourners');
    }

    ctx.updateState({
      phase: 'mourning',
      participants: participants.map(p => p.id),
      mournStarted: ctx.tick,
    });

    for (const participant of participants) {
      if (participant.id !== ctx.entity.id) {
        ctx.emit({
          type: 'mourn_together:joined',
          data: {
            participantId: participant.id,
            initiatorId: ctx.entity.id,
            tick: ctx.tick,
          },
        });
      }
    }

    return;
  }

  if (elapsed % 80 === 0) {
    ctx.setThought('Waiting for others to come...');
  }
}

function handleMourningPhase(ctx: BehaviorContext, mood: MoodComponent): ContextBehaviorResult | void {
  ctx.stopMovement();

  const participants = ctx.getState<string[]>('participants') || [];
  const mournStarted = ctx.getState<number>('mournStarted')!;
  const duration = MOURN_CONFIG.BASE_DURATION +
    (participants.length * MOURN_CONFIG.PER_PARTICIPANT_BONUS);

  const elapsed = ctx.tick - mournStarted;

  // Periodic mourning utterances
  const lastUtterance = ctx.getState<number>('lastUtterance') ?? 0;
  if (ctx.tick - lastUtterance > 80) {
    const isInitiator = ctx.getState<boolean>('isInitiator');
    const phrases = isInitiator ? MOURNING_PHRASES : COMFORT_PHRASES;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)]!;

    ctx.setThought(phrase);
    ctx.updateState({ lastUtterance: ctx.tick });

    ctx.emit({
      type: 'agent:speak',
      data: {
        agentId: ctx.entity.id,
        text: phrase,
        category: 'prayer' as const,
        tick: ctx.tick,
      },
    });
  }

  if (elapsed >= duration) {
    return completeMourning(ctx, mood, participants);
  }
}

function completeMourning(
  ctx: BehaviorContext,
  mood: MoodComponent,
  participants: string[]
): ContextBehaviorResult {
  const griefReduction = MOURN_CONFIG.BASE_GRIEF_REDUCTION +
    (participants.length * MOURN_CONFIG.PER_PARTICIPANT_GRIEF_BONUS);

  // Reduce grief on this agent
  const currentGrief = mood.grief ?? 0;
  const newGrief = Math.max(0, currentGrief - griefReduction);

  ctx.updateComponent<MoodComponent>(CT.Mood, (current) => ({
    ...current,
    grief: newGrief,
    mourning: newGrief > 10, // Stop mourning when grief is low enough
    emotionalState: newGrief > 10 ? 'grieving' : 'melancholic',
    factors: {
      ...current.factors,
      social: Math.min(100, current.factors.social + 15),
    },
  }));

  // Satisfy social needs
  const needs = ctx.getComponent<NeedsComponent>(CT.Needs);
  if (needs) {
    ctx.updateComponent<NeedsComponent>(CT.Needs, (current) => {
      const updated = current.clone();
      updated.socialContact = Math.min(100, (updated.socialContact ?? 50) + MOURN_CONFIG.SOCIAL_CONTACT_BOOST);
      updated.socialDepth = Math.min(100, (updated.socialDepth ?? 50) + MOURN_CONFIG.SOCIAL_DEPTH_BOOST);
      updated.socialBelonging = Math.min(100, (updated.socialBelonging ?? 50) + MOURN_CONFIG.SOCIAL_BELONGING_BOOST);
      return updated;
    });
  }

  // Emit completion event
  ctx.emit({
    type: 'mourn_together:complete',
    data: {
      initiatorId: ctx.entity.id,
      participants,
      tick: ctx.tick,
      duration: MOURN_CONFIG.BASE_DURATION + (participants.length * MOURN_CONFIG.PER_PARTICIPANT_BONUS),
      griefReduced: griefReduction,
    },
  });

  // Improve relationships between all participants
  for (const participantId of participants) {
    for (const otherId of participants) {
      if (otherId === participantId) continue;

      ctx.emit({
        type: 'relationship:improved',
        data: {
          targetAgent: otherId,
          reason: 'shared_grief',
          amount: MOURN_CONFIG.RELATIONSHIP_BOOST,
        },
      });
    }
  }

  ctx.setThought('The grief feels lighter, shared among friends.');

  return ctx.complete('mourning_complete');
}

function gatherMourners(ctx: BehaviorContext): EntityImpl[] {
  const participants: EntityImpl[] = [ctx.entity];

  const nearbyAgents = ctx.getEntitiesInRadius(
    MOURN_CONFIG.GATHER_RADIUS,
    [CT.Agent, CT.Mood],
    { limit: MOURN_CONFIG.MAX_PARTICIPANTS }
  );

  for (const { entity: agent } of nearbyAgents) {
    if (agent.id === ctx.entity.id) continue;
    if (participants.length >= MOURN_CONFIG.MAX_PARTICIPANTS) break;

    const agentImpl = agent as EntityImpl;
    const agentComp = agentImpl.getComponent<AgentComponent>(CT.Agent);
    const agentMood = agentImpl.getComponent<MoodComponent>(CT.Mood);

    if (!agentComp || !agentMood) continue;

    // Skip agents busy with critical behaviors
    const busyBehaviors = ['flee', 'seek_food', 'seek_sleep', 'forced_sleep', 'initiate_combat'];
    if (busyBehaviors.includes(agentComp.behavior)) continue;

    // Prefer agents who are also mourning, but allow non-mourning friends
    const isMourning = agentMood.mourning === true;
    const isGrieving = agentMood.emotionalState === 'grieving';
    const isSad = agentMood.emotionalState === 'melancholic';

    // Check if they have a relationship with the initiator
    const relationships = agentImpl.getComponent<RelationshipComponent>(CT.Relationship);
    const hasRelationship = relationships?.relationships?.has(ctx.entity.id);

    // Must be mourning/grieving, sad, or have a relationship with the initiator
    if (!isMourning && !isGrieving && !isSad && !hasRelationship) continue;

    participants.push(agentImpl);
  }

  return participants;
}
