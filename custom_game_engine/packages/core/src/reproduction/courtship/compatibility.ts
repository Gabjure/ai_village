/**
 * Courtship Compatibility Calculations
 *
 * Functions to calculate compatibility between two agents for courtship purposes.
 */

import type { Entity } from '../../ecs/Entity';
import { EntityImpl } from '../../ecs/Entity';
import type { World } from '../../ecs/World';
import type { SexualityComponent } from '../SexualityComponent';
import type { RelationshipComponent } from '../../components/RelationshipComponent';
import type { PersonalityComponent } from '../../components/PersonalityComponent';
import type { StrategicPriorities } from '../../components/AgentComponent';
import type { GeneticComponent, MatePreferenceVector } from '../../components/GeneticComponent';
import { DEFAULT_MATE_PREFERENCE_VECTOR } from '../../components/GeneticComponent';
import type { BiochemistryComponent } from '../../components/BiochemistryComponent';

export interface CourtshipStrategyProfile {
  preferenceVector: MatePreferenceVector;
  geneticSimilarity: number;
  biochemicalAffinity: number;
  similarityBias: number;
  tabooSensitivity: number;
  fertilitySensitivity: number;
  gestationSensitivity: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0.5;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getGeneticComponent(entity: Entity): GeneticComponent | undefined {
  return (entity as EntityImpl).getComponent<GeneticComponent>('genetic');
}

function getBiochemistryComponent(entity: Entity): BiochemistryComponent | undefined {
  return (entity as EntityImpl).getComponent<BiochemistryComponent>('biochemistry');
}

function resolvePreferenceVector(entity: Entity): MatePreferenceVector {
  const genetics = getGeneticComponent(entity);
  return genetics?.matePreferenceVector ?? DEFAULT_MATE_PREFERENCE_VECTOR;
}

function compareGenomeExpression(genetics1: GeneticComponent, genetics2: GeneticComponent): number {
  if (genetics1.genome.length === 0 || genetics2.genome.length === 0) {
    return 0.5;
  }

  const sharedTraits = genetics1.genome
    .map(allele => allele.traitId)
    .filter((traitId, index, traits) => traits.indexOf(traitId) === index && genetics2.getAllele(traitId));

  if (sharedTraits.length === 0) {
    return 0.5;
  }

  let score = 0;
  for (const traitId of sharedTraits) {
    const expressed1 = genetics1.getExpressedTrait(traitId);
    const expressed2 = genetics2.getExpressedTrait(traitId);

    if (expressed1 === null || expressed2 === null) {
      score += 0.5;
      continue;
    }

    score += expressed1 === expressed2 ? 1 : 0.5;
  }

  return clamp01(score / sharedTraits.length);
}

function calculateBiochemicalAffinity(agent1: Entity, agent2: Entity): number {
  const biochem1 = getBiochemistryComponent(agent1);
  const biochem2 = getBiochemistryComponent(agent2);

  if (!biochem1 || !biochem2) {
    return 0.5;
  }

  const bonding = average([biochem1.oxytocin, biochem2.oxytocin]);
  const stability = average([biochem1.serotonin, biochem2.serotonin]);
  const reward = average([biochem1.dopamine, biochem2.dopamine]);
  const stress = average([biochem1.cortisol, biochem2.cortisol]);
  const nurture = average([biochem1.nurtureScore, biochem2.nurtureScore]);

  return clamp01(
    bonding * 0.28 +
    stability * 0.16 +
    reward * 0.10 +
    nurture * 0.26 +
    (1 - stress) * 0.20
  );
}

export function calculateCourtshipStrategyProfile(agent1: Entity, agent2: Entity): CourtshipStrategyProfile {
  const genetics1 = getGeneticComponent(agent1);
  const genetics2 = getGeneticComponent(agent2);
  const vector1 = resolvePreferenceVector(agent1);
  const vector2 = resolvePreferenceVector(agent2);
  const preferenceVector: MatePreferenceVector = {
    assortativePreference: average([vector1.assortativePreference, vector2.assortativePreference]),
    disassortativePreference: average([vector1.disassortativePreference, vector2.disassortativePreference]),
    biochemicalAffinity: average([vector1.biochemicalAffinity, vector2.biochemicalAffinity]),
    fertilitySensitivity: average([vector1.fertilitySensitivity, vector2.fertilitySensitivity]),
    gestationSensitivity: average([vector1.gestationSensitivity, vector2.gestationSensitivity]),
    tabooSensitivity: average([vector1.tabooSensitivity, vector2.tabooSensitivity]),
  };

  const geneticSimilarity = genetics1 && genetics2 ? compareGenomeExpression(genetics1, genetics2) : 0.5;
  const biochemicalAffinity = calculateBiochemicalAffinity(agent1, agent2);

  return {
    preferenceVector,
    geneticSimilarity,
    biochemicalAffinity,
    similarityBias: preferenceVector.assortativePreference - preferenceVector.disassortativePreference,
    tabooSensitivity: preferenceVector.tabooSensitivity,
    fertilitySensitivity: preferenceVector.fertilitySensitivity,
    gestationSensitivity: preferenceVector.gestationSensitivity,
  };
}

// ============================================================================
// Sexual Compatibility
// ============================================================================

export function calculateSexualCompatibility(agent1: Entity, agent2: Entity): number {
  const sex1 = (agent1 as EntityImpl).getComponent<SexualityComponent>('sexuality');
  const sex2 = (agent2 as EntityImpl).getComponent<SexualityComponent>('sexuality');

  if (!sex1 || !sex2) {
    throw new Error('Both agents must have SexualityComponent for compatibility calculation');
  }

  // Check if both are attracted to each other
  const agent1ToAgent2 = checkAttractionToTarget(sex1, agent2);
  const agent2ToAgent1 = checkAttractionToTarget(sex2, agent1);

  // Both must be attracted for compatibility
  if (!agent1ToAgent2 || !agent2ToAgent1) {
    return 0;
  }

  // Check relationship style compatibility
  const styleCompatibility = checkRelationshipStyleCompatibility(sex1, sex2);

  // Check if attraction conditions are met for both
  const conditions1Met = checkAttractionConditionsMet(sex1, agent1, agent2);
  const conditions2Met = checkAttractionConditionsMet(sex2, agent2, agent1);

  if (!conditions1Met || !conditions2Met) {
    return 0.3; // Potential but not active
  }

  return styleCompatibility;
}

function checkAttractionToTarget(_sexuality: SexualityComponent, _target: Entity): boolean {
  // For now, simplified check - assume attraction is possible
  // In full implementation, would check:
  // - Gender/sex compatibility with sexual_target/gender_target
  // - Morph compatibility
  // - Species-specific attraction rules
  return true;
}

function checkRelationshipStyleCompatibility(
  sex1: SexualityComponent,
  sex2: SexualityComponent
): number {
  const style1 = sex1.relationshipStyle;
  const style2 = sex2.relationshipStyle;

  // Simplified compatibility scoring
  if (style1 === style2) {
    return 1.0; // Same style = perfect match
  }

  // Monogamous + Polyamorous = challenging
  if (
    (style1 === 'monogamous' && style2 === 'polyamorous') ||
    (style1 === 'polyamorous' && style2 === 'monogamous')
  ) {
    return 0.4;
  }

  // Aromantic with romantic = incompatible
  if (style1 === 'aromantic' || style2 === 'aromantic') {
    return 0.2;
  }

  // Default: reasonably compatible
  return 0.7;
}

function checkAttractionConditionsMet(
  sexuality: SexualityComponent,
  _agent: Entity,
  _target: Entity
): boolean {
  // Check attraction conditions
  const condition = sexuality.attractionCondition;

  if (condition.type === 'never') {
    return false;
  }

  if (condition.type === 'always') {
    return true;
  }

  // For other conditions (familiar, emotional_bond, etc.)
  // Would check RelationshipComponent and other factors
  // Simplified for now: assume conditions are met
  return true;
}

// ============================================================================
// Personality Mesh
// ============================================================================

export function calculatePersonalityMesh(agent1: Entity, agent2: Entity): number {
  const personality1 = (agent1 as EntityImpl).getComponent<PersonalityComponent>('personality');
  const personality2 = (agent2 as EntityImpl).getComponent<PersonalityComponent>('personality');

  if (!personality1 || !personality2) {
    return 0.5; // Neutral when no personality data
  }

  // Calculate continuous factor scores (no hard thresholds)

  // 1. Extraversion complementarity - gaussian peak at moderate difference
  // Sweet spot at diff ~0.5, falls off at extremes
  const extraversionDiff = Math.abs(personality1.extraversion - personality2.extraversion);
  const extraversionScore = Math.exp(-Math.pow((extraversionDiff - 0.5) / 0.25, 2));

  // 2. Agreeableness - higher average is better
  const agreeablenessAvg = (personality1.agreeableness + personality2.agreeableness) / 2;
  const agreeablenessScore = agreeablenessAvg;

  // 3. Neuroticism conflict - penalty when both high
  const neuroticismPenalty = personality1.neuroticism * personality2.neuroticism;

  // 4. Creativity similarity - closer is better
  const creativityDiff = Math.abs(personality1.creativity - personality2.creativity);
  const creativityScore = 1 - creativityDiff;

  // 5. Spirituality similarity - closer is better
  const spiritualityDiff = Math.abs(personality1.spirituality - personality2.spirituality);
  const spiritualityScore = 1 - spiritualityDiff;

  // Weighted combination (centered around 0)
  const weightedSum =
    (extraversionScore - 0.5) * 1.2 +      // Complementarity bonus/penalty
    (agreeablenessScore - 0.5) * 1.5 +     // Agreeableness bonus/penalty
    (neuroticismPenalty - 0.5) * -1.2 +    // Neuroticism penalty (inverted)
    (creativityScore - 0.5) * 0.8 +        // Creativity similarity
    (spiritualityScore - 0.5) * 0.8;       // Spirituality similarity

  // Sigmoid to map to [0, 1] with smooth curve and diminishing returns
  // sigmoid(x) = 1 / (1 + e^(-k*x))
  // k=2 gives a moderate slope
  const sigmoid = 1 / (1 + Math.exp(-2 * weightedSum));

  return sigmoid;
}

// ============================================================================
// Shared Interests
// ============================================================================

export function calculateSharedInterests(agent1: Entity, agent2: Entity): number {
  // Type guard: check if entities have getComponent method
  if (!('getComponent' in agent1) || !('getComponent' in agent2)) {
    return 0.5;
  }

  const agent1Component = (agent1 as EntityImpl).getComponent('agent');
  const agent2Component = (agent2 as EntityImpl).getComponent('agent');

  // Type guard: check if agent components have priorities
  if (!agent1Component || typeof agent1Component !== 'object' || !('priorities' in agent1Component)) {
    return 0.5;
  }
  if (!agent2Component || typeof agent2Component !== 'object' || !('priorities' in agent2Component)) {
    return 0.5;
  }

  type AgentWithPriorities = { priorities: StrategicPriorities };
  const priorities1 = (agent1Component as AgentWithPriorities).priorities;
  const priorities2 = (agent2Component as AgentWithPriorities).priorities;

  let sharedCount = 0;
  const priorityKeys: Array<keyof StrategicPriorities> = [
    'gathering',
    'building',
    'farming',
    'social',
    'exploration',
    'magic',
  ];

  for (const key of priorityKeys) {
    const val1 = priorities1[key] || 0;
    const val2 = priorities2[key] || 0;

    // Both highly prioritize this activity
    if (val1 > 0.6 && val2 > 0.6) {
      sharedCount += 1;
    }
  }

  return sharedCount / priorityKeys.length;
}

// ============================================================================
// Relationship Strength
// ============================================================================

export function calculateRelationshipStrength(agent1: Entity, agent2: Entity): number {
  const relationship1 = (agent1 as EntityImpl).getComponent<RelationshipComponent>('relationship');

  if (!relationship1) {
    return 0;
  }

  const rel = relationship1.relationships.get(agent2.id);
  if (!rel) {
    return 0;
  }

  // Combine familiarity, affinity, trust
  const familiarityScore = rel.familiarity / 100;
  const affinityScore = Math.max(0, (rel.affinity + 100) / 200); // -100 to 100 -> 0 to 1
  const trustScore = rel.trust / 100;

  // Weight affinity highest
  return familiarityScore * 0.2 + affinityScore * 0.6 + trustScore * 0.2;
}

// ============================================================================
// Overall Compatibility
// ============================================================================

export function calculateCompatibility(agent1: Entity, agent2: Entity, _world: World): number {
  let score = 0;

  // 1. Sexual compatibility (30% weight)
  const sexualityScore = calculateSexualCompatibility(agent1, agent2);
  score += sexualityScore * 0.3;

  // If not sexually compatible, return 0
  if (sexualityScore === 0) {
    return 0;
  }

  // 2. Personality compatibility (25% weight)
  const personalityScore = calculatePersonalityMesh(agent1, agent2);
  score += personalityScore * 0.25;

  // 3. Mutual interests (20% weight)
  const interestsScore = calculateSharedInterests(agent1, agent2);
  score += interestsScore * 0.2;

  // 4. Existing relationship (15% weight)
  const relationshipScore = calculateRelationshipStrength(agent1, agent2);
  score += relationshipScore * 0.15;

  // 5. Social factors (10% weight)
  const socialScore = 0.5; // Placeholder - could include community approval, family, etc.
  score += socialScore * 0.1;

  const strategyProfile = calculateCourtshipStrategyProfile(agent1, agent2);
  const strategyModifier = 1 +
    (strategyProfile.geneticSimilarity - 0.5) * strategyProfile.similarityBias * 0.3 +
    (strategyProfile.biochemicalAffinity - 0.5) * (strategyProfile.preferenceVector.biochemicalAffinity - 0.5) * 0.3;

  // Normalize (max possible is 0.3 + 0.25 + 0.2 + 0.15 + 0.1 = 1.0)
  return clamp01(score * strategyModifier);
}

// ============================================================================
// Conception Probability
// ============================================================================

export function calculateConceptionProbability(agent1: Entity, agent2: Entity): number {
  let baseProbability = 0.3; // 30% base chance

  const genetics1 = getGeneticComponent(agent1);
  const genetics2 = getGeneticComponent(agent2);
  const biochem1 = getBiochemistryComponent(agent1);
  const biochem2 = getBiochemistryComponent(agent2);
  const strategyProfile = calculateCourtshipStrategyProfile(agent1, agent2);

  const fertilitySignal1 = biochem1
    ? clamp01(
      biochem1.oxytocin * 0.3 +
      biochem1.serotonin * 0.15 +
      biochem1.dopamine * 0.1 +
      biochem1.nurtureScore * 0.25 +
      (1 - biochem1.cortisol) * 0.2
    )
    : 0.5;
  const fertilitySignal2 = biochem2
    ? clamp01(
      biochem2.oxytocin * 0.3 +
      biochem2.serotonin * 0.15 +
      biochem2.dopamine * 0.1 +
      biochem2.nurtureScore * 0.25 +
      (1 - biochem2.cortisol) * 0.2
    )
    : 0.5;

  const fertilitySensitivity = strategyProfile.fertilitySensitivity;
  const fertilityModifier1 = 1 + (fertilitySignal1 - 0.5) * fertilitySensitivity * 0.8;
  const fertilityModifier2 = 1 + (fertilitySignal2 - 0.5) * fertilitySensitivity * 0.8;

  const chemistryAffinity = strategyProfile.biochemicalAffinity;
  const chemistryModifier = 1 + (chemistryAffinity - 0.5) * (strategyProfile.preferenceVector.biochemicalAffinity - 0.5) * 0.6;

  const geneticAffinity = genetics1 && genetics2 ? compareGenomeExpression(genetics1, genetics2) : 0.5;
  const geneticModifier = 1 + (geneticAffinity - 0.5) * strategyProfile.similarityBias * 0.6;

  // Bond strength
  const bondStrength = calculateBondStrength(agent1, agent2);

  // Health factors (placeholder - health tracked in BodyComponent or NeedsComponent)
  const healthModifier = 1.0; // Perfect health assumption for now

  // Magical/mystical factors (placeholder)
  const magicModifier = 1.0;

  const finalProbability =
    baseProbability *
    fertilityModifier1 *
    fertilityModifier2 *
    healthModifier *
    chemistryModifier *
    geneticModifier *
    (0.8 + bondStrength * 0.4) * // 0.8-1.2 multiplier
    magicModifier;

  return Math.max(0, Math.min(1, finalProbability));
}

export function calculateBondStrength(agent1: Entity, agent2: Entity): number {
  const relationshipScore = calculateRelationshipStrength(agent1, agent2);

  // Bond strength is based on relationship
  // Will increase over time with successful matings
  return relationshipScore;
}

export function attemptConception(agent1: Entity, agent2: Entity, world: World): { pregnantAgentId: string; otherParentId: string } | null {
  // Determine who can become pregnant
  const canAgent1BePregnant = canBecomePregnant(agent1);
  const canAgent2BePregnant = canBecomePregnant(agent2);

  if (!canAgent1BePregnant && !canAgent2BePregnant) {
    // Neither can become pregnant
    return null;
  }

  const probability = calculateConceptionProbability(agent1, agent2);

  if (Math.random() < probability) {
    // Determine who becomes pregnant
    let pregnantAgent: Entity;
    let otherParent: Entity;

    if (canAgent1BePregnant && canAgent2BePregnant) {
      // Both can become pregnant, choose randomly
      [pregnantAgent, otherParent] = Math.random() < 0.5 ? [agent1, agent2] : [agent2, agent1];
    } else {
      pregnantAgent = canAgent1BePregnant ? agent1 : agent2;
      otherParent = canAgent1BePregnant ? agent2 : agent1;
    }

    const strategyProfile = calculateCourtshipStrategyProfile(agent1, agent2);
    const fertilitySignal = calculateBiochemicalAffinity(agent1, agent2);

    // Emit conception event
    world.eventBus.emit({
      type: 'conception',
      source: pregnantAgent.id,
      data: {
        pregnantAgentId: pregnantAgent.id,
        otherParentId: otherParent.id,
        conceptionTick: world.tick,
        fertilityModifier: fertilitySignal,
        gestationModifier: 1 + (strategyProfile.gestationSensitivity - 0.5) * 0.2,
        geneticSimilarity: strategyProfile.geneticSimilarity,
        biochemicalAffinity: strategyProfile.biochemicalAffinity,
        matePreferenceVector: strategyProfile.preferenceVector,
      },
    });

    return {
      pregnantAgentId: pregnantAgent.id,
      otherParentId: otherParent.id,
    };
  }

  return null;
}

function canBecomePregnant(_agent: Entity): boolean {
  // Simplified check - in full implementation would check:
  // - Biological sex/reproductive capability
  // - Not already pregnant
  // - Age appropriate
  // - Species-specific rules

  // For now, return true as placeholder
  return true;
}
