import { BaseComponentSerializer } from '../ComponentSerializerRegistry.js';
import type { NeedsComponent, NeedsBodyPart } from '@ai-village/core';
import { NeedsComponent as NeedsComponentClass } from '@ai-village/core';

interface SerializedNeeds {
  hunger: number;
  energy: number;
  health: number;
  oxygen?: number;
  thirst: number;
  temperature: number;
  social: number;
  socialContact: number;
  socialDepth: number;
  socialBelonging: number;
  stimulation: number;
  hungerDecayRate: number;
  energyDecayRate: number;
  baseHungerDecayRate: number;
  baseEnergyDecayRate: number;
  ticksAtZeroHunger: number;
  starvationDayMemoriesIssuedArray: number[];
  bodyParts?: NeedsBodyPart[];
}

export class NeedsSerializer extends BaseComponentSerializer<NeedsComponent> {
  constructor() {
    super('needs', 1);
  }

  protected serializeData(component: NeedsComponent): SerializedNeeds {
    return {
      hunger: component.hunger,
      energy: component.energy,
      health: component.health,
      oxygen: component.oxygen,
      thirst: component.thirst,
      temperature: component.temperature,
      social: component.social,
      socialContact: component.socialContact,
      socialDepth: component.socialDepth,
      socialBelonging: component.socialBelonging,
      stimulation: component.stimulation,
      hungerDecayRate: component.hungerDecayRate,
      energyDecayRate: component.energyDecayRate,
      baseHungerDecayRate: component.baseHungerDecayRate,
      baseEnergyDecayRate: component.baseEnergyDecayRate,
      ticksAtZeroHunger: component.ticksAtZeroHunger,
      starvationDayMemoriesIssuedArray: Array.from(component.starvationDayMemoriesIssued),
      bodyParts: component.bodyParts,
    };
  }

  protected deserializeData(data: unknown): NeedsComponent {
    const serialized = data as SerializedNeeds;

    return new NeedsComponentClass({
      hunger: serialized.hunger,
      energy: serialized.energy,
      health: serialized.health,
      oxygen: serialized.oxygen,
      thirst: serialized.thirst,
      temperature: serialized.temperature,
      social: serialized.social,
      socialContact: serialized.socialContact,
      socialDepth: serialized.socialDepth,
      socialBelonging: serialized.socialBelonging,
      stimulation: serialized.stimulation,
      hungerDecayRate: serialized.hungerDecayRate,
      energyDecayRate: serialized.energyDecayRate,
      baseHungerDecayRate: serialized.baseHungerDecayRate,
      baseEnergyDecayRate: serialized.baseEnergyDecayRate,
      ticksAtZeroHunger: serialized.ticksAtZeroHunger,
      starvationDayMemoriesIssued: serialized.starvationDayMemoriesIssuedArray as unknown as Set<number>,
      bodyParts: serialized.bodyParts,
    });
  }

  validate(data: unknown): data is NeedsComponent {
    if (typeof data !== 'object' || data === null) {
      throw new Error('NeedsComponent data must be object');
    }
    const obj = data as Record<string, unknown>;
    if (!Array.isArray(obj.starvationDayMemoriesIssuedArray)) {
      throw new Error('NeedsComponent must have starvationDayMemoriesIssuedArray array');
    }
    return true;
  }
}
