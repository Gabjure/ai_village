/**
 * BiochemistrySystem - Manages neurotransmitter levels, Hand interaction tracking,
 * and nurture/trauma accumulation.
 *
 * Emergent effects:
 * - Hand interactions boost oxytocin (+0.08), serotonin (+0.05), dopamine (+0.03)
 * - Sustained high oxytocin + low cortisol accumulates nurtureScore
 * - nurtureScore boosts skill learning affinities (IQ accrual multiplier)
 * - handInteractionScore decays slowly (Norns forget if neglected)
 * - All behavioral effects emerge from biochemistry, no hardcoded milestones
 *
 * Priority: 46 (after NeedsSystem 15, before MoodSystem 48)
 */

import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import type { World } from '../ecs/World.js';
import type { EventBus } from '../events/EventBus.js';
import { EntityImpl } from '../ecs/Entity.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import { BiochemistryComponent } from '../components/BiochemistryComponent.js';
import type { SkillsComponent, SkillId } from '../components/SkillsComponent.js';
import type { PersonalityComponent } from '../components/PersonalityComponent.js';

// Chemical boost amounts per Hand interaction event
const HAND_OXYTOCIN_BOOST = 0.08;
const HAND_SEROTONIN_BOOST = 0.05;
const HAND_DOPAMINE_BOOST = 0.03;

// Trauma (slap) boosts cortisol, reduces oxytocin
const SLAP_CORTISOL_BOOST = 0.15;
const SLAP_OXYTOCIN_PENALTY = 0.05;

// Hand interaction score increment per event
const HAND_SCORE_INCREMENT = 0.02;

// Chemical decay rates per second (chemicals return to baseline)
const OXYTOCIN_DECAY = 0.002;
const SEROTONIN_DECAY = 0.001;
const DOPAMINE_DECAY = 0.003;
const CORTISOL_DECAY = 0.0015;
const HAND_SCORE_DECAY = 0.0003; // Very slow — Norns forget gradually

// Nurture accumulation: rate per second when conditions are met
// (high oxytocin > 0.3 AND low cortisol < 0.3)
const NURTURE_ACCUMULATION_RATE = 0.001;
const NURTURE_DECAY_RATE = 0.0002; // Slow decay when conditions not met

// Nurture thresholds
const OXYTOCIN_NURTURE_THRESHOLD = 0.3;
const CORTISOL_NURTURE_THRESHOLD = 0.3;

// IQ accrual multiplier: affinity boost = 1.0 + nurtureScore * this
const NURTURE_AFFINITY_MULTIPLIER = 0.5;

export class BiochemistrySystem extends BaseSystem {
  public readonly id = 'biochemistry' as const;
  public readonly priority = 46; // After NeedsSystem (15), before MoodSystem (48)
  public readonly requiredComponents = [CT.Biochemistry] as const;
  public readonly activationComponents = [CT.Biochemistry] as const;
  protected readonly throttleInterval = 20; // 1 second at 20 TPS

  public readonly dependsOn = ['needs'] as const;

  // Pending chemical boosts from Hand events (applied in update)
  private pendingBoosts = new Map<string, {
    oxytocin: number;
    serotonin: number;
    dopamine: number;
    cortisol: number;
    handScore: number;
  }>();

  // Track affinity update interval (less frequent than chemical updates)
  private lastAffinityUpdateTick = 0;
  private readonly AFFINITY_UPDATE_INTERVAL = 200; // Every 10 seconds

  protected override onInitialize(world: World, eventBus: EventBus): void {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Hand speaks to Norn — warm social interaction
    this.events.on('hand:speak', (data) => {
      this.queueChemicalBoost(data.agentId, {
        oxytocin: HAND_OXYTOCIN_BOOST,
        serotonin: HAND_SEROTONIN_BOOST,
        dopamine: HAND_DOPAMINE_BOOST,
        cortisol: 0,
        handScore: HAND_SCORE_INCREMENT,
      });
    });

    // Hand carries Norn — intimate contact
    this.events.on('hand:carry', (data) => {
      this.queueChemicalBoost(data.agentId, {
        oxytocin: HAND_OXYTOCIN_BOOST * 1.2,
        serotonin: HAND_SEROTONIN_BOOST,
        dopamine: HAND_DOPAMINE_BOOST * 0.5,
        cortisol: 0,
        handScore: HAND_SCORE_INCREMENT * 1.5,
      });
    });

    // Hand pets Norn — affectionate touch
    this.events.on('hand:pet', (data) => {
      this.queueChemicalBoost(data.agentId, {
        oxytocin: HAND_OXYTOCIN_BOOST * 1.5,
        serotonin: HAND_SEROTONIN_BOOST * 1.2,
        dopamine: HAND_DOPAMINE_BOOST,
        cortisol: -0.02, // Petting slightly reduces stress
        handScore: HAND_SCORE_INCREMENT,
      });
    });

    // Hand slaps Norn — trauma source
    this.events.on('hand:slap', (data) => {
      this.queueChemicalBoost(data.agentId, {
        oxytocin: -SLAP_OXYTOCIN_PENALTY,
        serotonin: -0.03,
        dopamine: -0.02,
        cortisol: SLAP_CORTISOL_BOOST,
        handScore: HAND_SCORE_INCREMENT * 0.5, // Still an interaction, but less positive
      });
    });

    // Conversations also boost oxytocin (social bonding)
    this.events.on('conversation:ended', (data) => {
      const quality = data.quality ?? 0.5;
      for (const agentId of data.participants) {
        this.queueChemicalBoost(agentId, {
          oxytocin: 0.02 * quality,
          serotonin: 0.01 * quality,
          dopamine: 0.01,
          cortisol: 0,
          handScore: 0,
        });
      }
    });
  }

  private queueChemicalBoost(
    agentId: string,
    boost: { oxytocin: number; serotonin: number; dopamine: number; cortisol: number; handScore: number }
  ): void {
    const existing = this.pendingBoosts.get(agentId);
    if (existing) {
      existing.oxytocin += boost.oxytocin;
      existing.serotonin += boost.serotonin;
      existing.dopamine += boost.dopamine;
      existing.cortisol += boost.cortisol;
      existing.handScore += boost.handScore;
    } else {
      this.pendingBoosts.set(agentId, { ...boost });
    }
  }

  protected onUpdate(ctx: SystemContext): void {
    const shouldUpdateAffinities =
      ctx.tick - this.lastAffinityUpdateTick >= this.AFFINITY_UPDATE_INTERVAL;

    for (const entity of ctx.activeEntities) {
      const impl = entity as EntityImpl;
      const biochem = impl.getComponent<BiochemistryComponent>(CT.Biochemistry);
      if (!biochem) continue;

      // Apply pending boosts from events
      const boost = this.pendingBoosts.get(entity.id);

      // Calculate new chemical levels
      let oxytocin = biochem.oxytocin;
      let serotonin = biochem.serotonin;
      let dopamine = biochem.dopamine;
      let cortisol = biochem.cortisol;
      let handScore = biochem.handInteractionScore;
      let nurtureScore = biochem.nurtureScore;

      // Apply boosts
      if (boost) {
        oxytocin += boost.oxytocin;
        serotonin += boost.serotonin;
        dopamine += boost.dopamine;
        cortisol += boost.cortisol;
        handScore += boost.handScore;
      }

      // Chemical decay toward epigenetic baselines
      const oxyBaseline = biochem.epigeneticOxytocinBaseline;
      const cortBaseline = biochem.epigeneticCortisolBaseline;

      oxytocin += (oxytocin > oxyBaseline ? -OXYTOCIN_DECAY : OXYTOCIN_DECAY * 0.5);
      serotonin += (serotonin > 0.2 ? -SEROTONIN_DECAY : SEROTONIN_DECAY * 0.5);
      dopamine += (dopamine > 0.1 ? -DOPAMINE_DECAY : DOPAMINE_DECAY * 0.5);
      cortisol += (cortisol > cortBaseline ? -CORTISOL_DECAY : CORTISOL_DECAY * 0.3);

      // Hand interaction score decays very slowly
      handScore = Math.max(0, handScore - HAND_SCORE_DECAY);

      // Nurture accumulation: sustained high oxytocin + low cortisol
      if (oxytocin > OXYTOCIN_NURTURE_THRESHOLD && cortisol < CORTISOL_NURTURE_THRESHOLD) {
        // Stronger accumulation when chemicals are further past thresholds
        const oxyStrength = (oxytocin - OXYTOCIN_NURTURE_THRESHOLD) / (1 - OXYTOCIN_NURTURE_THRESHOLD);
        const cortStrength = (CORTISOL_NURTURE_THRESHOLD - cortisol) / CORTISOL_NURTURE_THRESHOLD;
        nurtureScore += NURTURE_ACCUMULATION_RATE * oxyStrength * cortStrength;
      } else {
        // Slow decay when conditions aren't met
        nurtureScore = Math.max(0, nurtureScore - NURTURE_DECAY_RATE);
      }

      // Clamp all values to 0-1
      oxytocin = clamp01(oxytocin);
      serotonin = clamp01(serotonin);
      dopamine = clamp01(dopamine);
      cortisol = clamp01(cortisol);
      handScore = clamp01(handScore);
      nurtureScore = clamp01(nurtureScore);

      // Update component if anything changed
      if (
        oxytocin !== biochem.oxytocin ||
        serotonin !== biochem.serotonin ||
        dopamine !== biochem.dopamine ||
        cortisol !== biochem.cortisol ||
        handScore !== biochem.handInteractionScore ||
        nurtureScore !== biochem.nurtureScore
      ) {
        impl.updateComponent<BiochemistryComponent>(CT.Biochemistry, () =>
          new BiochemistryComponent({
            oxytocin,
            serotonin,
            dopamine,
            cortisol,
            handInteractionScore: handScore,
            nurtureScore,
            epigeneticOxytocinBaseline: biochem.epigeneticOxytocinBaseline,
            epigeneticCortisolBaseline: biochem.epigeneticCortisolBaseline,
          })
        );
      }

      // Update skill affinities based on nurture score (less frequently)
      if (shouldUpdateAffinities && nurtureScore > 0.01) {
        this.applyNurtureAffinityBoost(impl, nurtureScore);
      }
    }

    // Clear processed boosts
    this.pendingBoosts.clear();

    if (shouldUpdateAffinities) {
      this.lastAffinityUpdateTick = ctx.tick;
    }
  }

  /**
   * Apply nurture-based learning multiplier to skill affinities.
   * IQ accrual multiplier = 1.0 + nurtureScore * 0.5
   * This means a fully nurtured Norn learns 50% faster.
   */
  private applyNurtureAffinityBoost(entity: EntityImpl, nurtureScore: number): void {
    const skills = entity.getComponent<SkillsComponent>(CT.Skills);
    if (!skills) return;

    const personality = entity.getComponent<PersonalityComponent>(CT.Personality);
    if (!personality) return;

    // Calculate nurture multiplier
    const nurtureMultiplier = 1.0 + nurtureScore * NURTURE_AFFINITY_MULTIPLIER;

    // Check if affinities need updating
    let needsUpdate = false;
    const newAffinities = { ...skills.affinities };

    for (const skillId of Object.keys(newAffinities) as SkillId[]) {
      // Base affinity from personality (0.5-2.0)
      // We apply nurture multiplier on top, capped at 3.0
      const baseAffinity = skills.affinities[skillId];
      // Only boost if nurtureMultiplier would make a difference
      // We store the nurtured affinity but cap it
      const targetAffinity = Math.min(3.0, baseAffinity * nurtureMultiplier);

      if (Math.abs(targetAffinity - baseAffinity) > 0.001) {
        newAffinities[skillId] = targetAffinity;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      entity.updateComponent<SkillsComponent>(CT.Skills, (current) => ({
        ...current,
        affinities: newAffinities,
      }));
    }
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
