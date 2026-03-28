import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import { evaluateAlienCapabilities } from '../capabilities/AlienCapabilityRegistry.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { GeneticComponent } from '../components/GeneticComponent.js';
import type { BiochemistryComponent } from '../components/BiochemistryComponent.js';
import {
  CapabilityProfileComponent,
  type AlienCapabilityId,
  type CapabilityUnlockRecord,
} from '../components/CapabilityProfileComponent.js';
import type { SpeciesComponent } from '../components/SpeciesComponent.js';

function arrayEquals<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function mapEquals(a: Record<string, number>, b: Record<string, number>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export class AlienCapabilityProfileSystem extends BaseSystem {
  public readonly id = 'alien_capability_profile';
  public readonly priority = 47; // After biochemistry (46), before mood (48)
  public readonly requiredComponents = [CT.Genetic, CT.Biochemistry] as const;
  public readonly activationComponents = [CT.Genetic, CT.Biochemistry] as const;

  protected onUpdate(ctx: SystemContext): void {
    for (const entity of ctx.activeEntities) {
      const genetics = entity.getComponent<GeneticComponent>(CT.Genetic);
      const biochemistry = entity.getComponent<BiochemistryComponent>(CT.Biochemistry);
      if (!genetics || !biochemistry) continue;

      const existingProfile = entity.getComponent<CapabilityProfileComponent>(CT.CapabilityProfile);
      const unlockedCapabilities = existingProfile ? [...existingProfile.unlockedCapabilities] : [];
      const unlockedSet = new Set<AlienCapabilityId>(unlockedCapabilities);
      const unlockHistory = existingProfile ? [...existingProfile.unlockHistory] : [];
      const scoreByCapability: Record<string, number> = {};
      const activeCapabilities: AlienCapabilityId[] = [];
      const speciesId =
        entity.getComponent<SpeciesComponent>(CT.Species)?.speciesId;

      const evaluations = evaluateAlienCapabilities({ genetics, biochemistry });

      for (const evaluation of evaluations) {
        scoreByCapability[evaluation.capabilityId] = evaluation.score;

        if (evaluation.unlocked) {
          activeCapabilities.push(evaluation.capabilityId);
        }

        if (evaluation.unlocked && !unlockedSet.has(evaluation.capabilityId)) {
          unlockedSet.add(evaluation.capabilityId);
          unlockedCapabilities.push(evaluation.capabilityId);

          const unlockRecord: CapabilityUnlockRecord = {
            capabilityId: evaluation.capabilityId,
            unlockedAtTick: ctx.tick,
            score: evaluation.score,
            geneticScore: evaluation.geneticScore,
            biochemicalScore: evaluation.biochemicalScore,
          };
          unlockHistory.push(unlockRecord);

          this.events.emit('capability:unlocked', {
            agentId: entity.id,
            capabilityId: evaluation.capabilityId,
            speciesId,
            score: evaluation.score,
            geneticScore: evaluation.geneticScore,
            biochemicalScore: evaluation.biochemicalScore,
            tick: ctx.tick,
          });
        }
      }

      const nextProfile = new CapabilityProfileComponent({
        activeCapabilities,
        unlockedCapabilities,
        scoreByCapability,
        unlockHistory,
        lastEvaluatedTick: ctx.tick,
      });

      if (!existingProfile) {
        entity.addComponent(nextProfile);
        continue;
      }

      const changed =
        !arrayEquals(existingProfile.activeCapabilities, activeCapabilities) ||
        !arrayEquals(existingProfile.unlockedCapabilities, unlockedCapabilities) ||
        !mapEquals(existingProfile.scoreByCapability, scoreByCapability) ||
        existingProfile.lastEvaluatedTick !== ctx.tick ||
        existingProfile.unlockHistory.length !== unlockHistory.length;

      if (changed) {
        entity.updateComponent(CT.CapabilityProfile, () => nextProfile);
      }
    }
  }
}
