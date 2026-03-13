/**
 * TechnologyUnlockSerializer - Handles Map fields serialization
 * for TechnologyUnlockComponent.
 */

import { BaseComponentSerializer } from '../ComponentSerializerRegistry.js';
import type { VersionedComponent } from '../types.js';

type TechnologyEra = 'primitive' | 'agricultural' | 'industrial' | 'modern' | 'information';

interface BuildingUnlock {
  buildingType: string;
  unlockedTick: number;
  unlockedByCity?: string;
  era: TechnologyEra;
}

interface TechnologyUnlock {
  technologyId: string;
  name: string;
  unlockedTick: number;
  unlockedBy?: string;
  effect: string;
}

interface TechnologyUnlockComponent {
  type: 'technology_unlock';
  unlockedBuildings: Map<string, BuildingUnlock>;
  unlockedTechnologies: Map<string, TechnologyUnlock>;
  playerCityId: string | null;
  universityCollaborationEnabled: boolean;
  internetResearchBoostEnabled: boolean;
  globalResearchMultiplier: number;
}

interface SerializedTechnologyUnlock {
  unlockedBuildings: [string, BuildingUnlock][];
  unlockedTechnologies: [string, TechnologyUnlock][];
  playerCityId: string | null;
  universityCollaborationEnabled: boolean;
  internetResearchBoostEnabled: boolean;
  globalResearchMultiplier: number;
}

export class TechnologyUnlockSerializer extends BaseComponentSerializer<TechnologyUnlockComponent> {
  constructor() {
    super('technology_unlock', 1);
  }

  protected serializeData(component: TechnologyUnlockComponent): SerializedTechnologyUnlock {
    return {
      unlockedBuildings: Array.from(component.unlockedBuildings.entries()),
      unlockedTechnologies: Array.from(component.unlockedTechnologies.entries()),
      playerCityId: component.playerCityId,
      universityCollaborationEnabled: component.universityCollaborationEnabled,
      internetResearchBoostEnabled: component.internetResearchBoostEnabled,
      globalResearchMultiplier: component.globalResearchMultiplier,
    };
  }

  protected deserializeData(data: unknown): TechnologyUnlockComponent {
    const d = data as SerializedTechnologyUnlock;
    return {
      type: 'technology_unlock',
      unlockedBuildings: new Map(d.unlockedBuildings ?? []),
      unlockedTechnologies: new Map(d.unlockedTechnologies ?? []),
      playerCityId: d.playerCityId ?? null,
      universityCollaborationEnabled: d.universityCollaborationEnabled ?? false,
      internetResearchBoostEnabled: d.internetResearchBoostEnabled ?? false,
      globalResearchMultiplier: d.globalResearchMultiplier ?? 1.0,
    };
  }

  validate(data: unknown): data is TechnologyUnlockComponent {
    const d = data as SerializedTechnologyUnlock;
    if (!Array.isArray(d?.unlockedBuildings)) {
      throw new Error('[TechnologyUnlockSerializer] Missing or invalid unlockedBuildings array');
    }
    if (!Array.isArray(d?.unlockedTechnologies)) {
      throw new Error('[TechnologyUnlockSerializer] Missing or invalid unlockedTechnologies array');
    }
    return true;
  }

  deserialize(data: VersionedComponent): TechnologyUnlockComponent {
    return this.deserializeData(data.data);
  }
}
