import type { BiochemistryComponent } from '../components/BiochemistryComponent.js';
import {
  getCultureAffinityScore,
  getSynchronizedParticipationScore,
  type GeneticComponent,
} from '../components/GeneticComponent.js';
import type { AlienCapabilityId } from '../components/CapabilityProfileComponent.js';

export interface AlienCapabilityEvaluationContext {
  genetics: GeneticComponent;
  biochemistry: BiochemistryComponent;
}

export interface AlienCapabilityEvaluation {
  capabilityId: AlienCapabilityId;
  score: number;
  geneticScore: number;
  biochemicalScore: number;
  unlockThreshold: number;
  unlocked: boolean;
}

export interface AlienCapabilityDefinition {
  id: AlienCapabilityId;
  unlockThreshold: number;
  evaluate: (context: AlienCapabilityEvaluationContext) => Omit<AlienCapabilityEvaluation, 'capabilityId' | 'unlockThreshold' | 'unlocked'>;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

function evaluateCapability(
  definition: AlienCapabilityDefinition,
  context: AlienCapabilityEvaluationContext
): AlienCapabilityEvaluation {
  const evaluated = definition.evaluate(context);
  const score = clamp01(evaluated.score);
  return {
    capabilityId: definition.id,
    score,
    geneticScore: clamp01(evaluated.geneticScore),
    biochemicalScore: clamp01(evaluated.biochemicalScore),
    unlockThreshold: definition.unlockThreshold,
    unlocked: score >= definition.unlockThreshold,
  };
}

function getAffinityVector(genetics: GeneticComponent): {
  socialAffinity: number;
  culturalAffinity: number;
  collectiveAffinity: number;
  traditionAffinity: number;
} {
  const affinity = genetics.socialCulturalAffinityVector;
  return {
    socialAffinity: affinity?.socialAffinity ?? 0.5,
    culturalAffinity: affinity?.culturalAffinity ?? 0.5,
    collectiveAffinity: affinity?.collectiveAffinity ?? 0.5,
    traditionAffinity: affinity?.traditionAffinity ?? 0.5,
  };
}

const ALIEN_CAPABILITY_DEFINITIONS: AlienCapabilityDefinition[] = [
  {
    id: 'collaborative_composition',
    unlockThreshold: 0.62,
    evaluate: ({ genetics, biochemistry }) => {
      const cultureAffinity = getCultureAffinityScore(genetics);
      const synchronizedParticipation = getSynchronizedParticipationScore(genetics);
      const geneticScore = clamp01((cultureAffinity * 0.55) + (synchronizedParticipation * 0.45));
      const biochemicalScore = clamp01(
        (biochemistry.oxytocin * 0.45) +
        (biochemistry.serotonin * 0.3) +
        (biochemistry.nurtureScore * 0.25)
      );
      return {
        score: (geneticScore * 0.6) + (biochemicalScore * 0.4),
        geneticScore,
        biochemicalScore,
      };
    },
  },
  {
    id: 'trance_states',
    unlockThreshold: 0.6,
    evaluate: ({ genetics, biochemistry }) => {
      const affinity = getAffinityVector(genetics);
      const geneticScore = clamp01(
        (affinity.traditionAffinity * 0.45) +
        (affinity.culturalAffinity * 0.3) +
        (affinity.collectiveAffinity * 0.25)
      );
      const biochemicalScore = clamp01(
        (biochemistry.dopamine * 0.4) +
        (biochemistry.serotonin * 0.3) +
        ((1 - biochemistry.cortisol) * 0.2) +
        (biochemistry.handInteractionScore * 0.1)
      );
      return {
        score: (geneticScore * 0.55) + (biochemicalScore * 0.45),
        geneticScore,
        biochemicalScore,
      };
    },
  },
  {
    id: 'predatory_pack_coordination',
    unlockThreshold: 0.58,
    evaluate: ({ genetics, biochemistry }) => {
      const affinity = getAffinityVector(genetics);
      const synchronizedParticipation = getSynchronizedParticipationScore(genetics);
      const geneticScore = clamp01(
        (synchronizedParticipation * 0.6) +
        (affinity.collectiveAffinity * 0.4)
      );
      const biochemicalScore = clamp01(
        (biochemistry.dopamine * 0.45) +
        ((1 - biochemistry.cortisol) * 0.35) +
        (biochemistry.oxytocin * 0.2)
      );
      return {
        score: (geneticScore * 0.6) + (biochemicalScore * 0.4),
        geneticScore,
        biochemicalScore,
      };
    },
  },
  {
    id: 'symbolic_ritualization',
    unlockThreshold: 0.64,
    evaluate: ({ genetics, biochemistry }) => {
      const affinity = getAffinityVector(genetics);
      const cultureAffinity = getCultureAffinityScore(genetics);
      const geneticScore = clamp01(
        (cultureAffinity * 0.5) +
        (affinity.traditionAffinity * 0.3) +
        (affinity.culturalAffinity * 0.2)
      );
      const biochemicalScore = clamp01(
        (biochemistry.serotonin * 0.35) +
        (biochemistry.oxytocin * 0.35) +
        (biochemistry.nurtureScore * 0.3)
      );
      return {
        score: (geneticScore * 0.65) + (biochemicalScore * 0.35),
        geneticScore,
        biochemicalScore,
      };
    },
  },
];

export function getAlienCapabilityRegistry(): ReadonlyArray<AlienCapabilityDefinition> {
  return ALIEN_CAPABILITY_DEFINITIONS;
}

export function evaluateAlienCapabilities(
  context: AlienCapabilityEvaluationContext
): AlienCapabilityEvaluation[] {
  return ALIEN_CAPABILITY_DEFINITIONS.map((definition) => evaluateCapability(definition, context));
}
