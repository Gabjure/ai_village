import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import type { SystemId, ComponentType } from '../types.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { QuarantineStatusComponent, QuarantinePhase } from '../components/QuarantineStatusComponent.js';
import type { AnimalComponent } from '../components/AnimalComponent.js';

/**
 * QuarantineSystem manages quarantine progression for imported creatures.
 *
 * Quarantine Phases:
 * - arriving    (50 ticks): Initial acclimation period; transitions when timer expires
 * - adjusting   (200 ticks): Biome adjustment; transitions when timer expires AND biomeAdaptationScore > 0.3
 * - integrating (400 ticks): Full integration; transitions when biomeAdaptationScore > 0.7 AND stress < 30
 * - complete:   Permanent; entity is removed from quarantine processing
 *
 * Priority: 85 (Agent Core range — after basic movement, before cognition)
 */
export class QuarantineSystem extends BaseSystem {
  public readonly id: SystemId = 'quarantine_system';
  public readonly priority: number = 85;
  public readonly requiredComponents: ReadonlyArray<ComponentType> = [CT.QuarantineStatus, CT.Animal];
  public readonly activationComponents = ['quarantine_status'] as const;
  protected readonly throttleInterval = 20; // ticks

  protected onUpdate(ctx: SystemContext): void {
    for (const entity of ctx.activeEntities) {
      const comps = ctx.components(entity);
      const quarantine = comps.optional<QuarantineStatusComponent>(CT.QuarantineStatus);
      const animal = comps.optional<AnimalComponent>(CT.Animal);
      if (!quarantine || !animal) continue;
      if (quarantine.phase === 'complete') continue;

      // 1. Increment phase tick counter
      quarantine.currentPhaseTick += this.throttleInterval;

      // 2. Gradual biome acclimation
      quarantine.biomeAdaptationScore = Math.min(1, quarantine.biomeAdaptationScore + 0.002);

      // 3. Check phase transition conditions
      this.checkPhaseTransition(ctx, entity.id, quarantine, animal);

      // 4. Update release blockers and eligibility
      this.updateReleaseStatus(quarantine, animal);

      // 5. Quarantine calming effect: reduce stress and improve mood
      animal.stress = Math.max(0, animal.stress - 1);
      animal.mood = Math.min(100, animal.mood + 0.5);
    }
  }

  private checkPhaseTransition(
    ctx: SystemContext,
    entityId: string,
    quarantine: QuarantineStatusComponent,
    animal: AnimalComponent,
  ): void {
    const phase = quarantine.phase;

    if (phase === 'arriving') {
      if (quarantine.currentPhaseTick >= 50) {
        this.transitionPhase(ctx, entityId, quarantine, 'adjusting');
      }
    } else if (phase === 'adjusting') {
      if (quarantine.currentPhaseTick >= 200 && quarantine.biomeAdaptationScore > 0.3) {
        this.transitionPhase(ctx, entityId, quarantine, 'integrating');
      }
    } else if (phase === 'integrating') {
      if (quarantine.biomeAdaptationScore > 0.7 && animal.stress < 30) {
        this.transitionPhase(ctx, entityId, quarantine, 'complete');
        ctx.emit('creature:quarantine_complete', {
          entityId,
          adaptationScore: quarantine.biomeAdaptationScore,
          totalTicks: quarantine.currentPhaseTick,
        }, entityId);
      }
    }
  }

  private transitionPhase(
    ctx: SystemContext,
    entityId: string,
    quarantine: QuarantineStatusComponent,
    newPhase: QuarantinePhase,
  ): void {
    const oldPhase = quarantine.phase;
    quarantine.phase = newPhase;
    quarantine.currentPhaseTick = 0;
    ctx.emit('creature:quarantine_phase_changed', {
      entityId,
      oldPhase,
      newPhase: quarantine.phase,
    }, entityId);
  }

  private updateReleaseStatus(
    quarantine: QuarantineStatusComponent,
    animal: AnimalComponent,
  ): void {
    const blockers: string[] = [];

    if (quarantine.biomeAdaptationScore < 0.7) {
      blockers.push('low_biome_adaptation');
    }
    if (animal.stress > 30) {
      blockers.push('high_stress');
    }

    quarantine.releaseBlockers = blockers;
    quarantine.releaseEligible = blockers.length === 0 && quarantine.phase === 'integrating';
  }
}
