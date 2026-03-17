import { BaseComponentSerializer } from '../ComponentSerializerRegistry.js';
import type { ActiveBlessing, ActiveCurse, DivinePowerType } from '@ai-village/core';
import { DivineAbilityComponent, createDivineAbilityComponent } from '@ai-village/core';

interface SerializedDivineAbility {
  abilities: unknown[];
  activePowers: string[];
  totalPowersUsed: number;
  divineEnergyPool: number;
  maxDivineEnergy: number;
  energyRegenRate: number;
  activeBlessingsEntries: Array<[string, ActiveBlessing]>;
  activeCursesEntries: Array<[string, ActiveCurse]>;
  recentPowerUses: Array<{
    powerType: DivinePowerType;
    timestamp: number;
    beliefCost: number;
    targetId: string;
    result: 'success' | 'failure';
    failureReason?: string;
  }>;
  powerCooldownsEntries: Array<[DivinePowerType, number]>;
  lastPowerUseTick: number;
  powerSpecializationEntries: Array<[DivinePowerType, number]>;
}

export class DivineAbilitySerializer extends BaseComponentSerializer<DivineAbilityComponent> {
  constructor() {
    super('divine_ability', 1);
  }

  protected serializeData(component: DivineAbilityComponent): SerializedDivineAbility {
    return {
      abilities: component.abilities,
      activePowers: component.activePowers,
      totalPowersUsed: component.totalPowersUsed,
      divineEnergyPool: component.divineEnergyPool,
      maxDivineEnergy: component.maxDivineEnergy,
      energyRegenRate: component.energyRegenRate,
      activeBlessingsEntries: Array.from(component.activeBlessings.entries()),
      activeCursesEntries: Array.from(component.activeCurses.entries()),
      recentPowerUses: component.recentPowerUses,
      powerCooldownsEntries: Array.from(component.powerCooldowns.entries()),
      lastPowerUseTick: component.lastPowerUseTick,
      powerSpecializationEntries: Array.from(component.powerSpecialization.entries()),
    };
  }

  protected deserializeData(data: unknown): DivineAbilityComponent {
    const serialized = data as SerializedDivineAbility;

    const component = createDivineAbilityComponent([], serialized.maxDivineEnergy);
    if (Array.isArray(serialized.abilities)) {
      component.abilities = serialized.abilities as typeof component.abilities;
    }

    component.activePowers = serialized.activePowers;
    component.totalPowersUsed = serialized.totalPowersUsed;
    component.divineEnergyPool = serialized.divineEnergyPool;
    component.energyRegenRate = serialized.energyRegenRate;
    component.recentPowerUses = serialized.recentPowerUses;
    component.lastPowerUseTick = serialized.lastPowerUseTick;

    if (Array.isArray(serialized.activeBlessingsEntries)) {
      component.activeBlessings = new Map(serialized.activeBlessingsEntries);
    }
    if (Array.isArray(serialized.activeCursesEntries)) {
      component.activeCurses = new Map(serialized.activeCursesEntries);
    }
    if (Array.isArray(serialized.powerCooldownsEntries)) {
      component.powerCooldowns = new Map(serialized.powerCooldownsEntries);
    }
    if (Array.isArray(serialized.powerSpecializationEntries)) {
      component.powerSpecialization = new Map(serialized.powerSpecializationEntries);
    }

    return component;
  }

  validate(data: unknown): data is DivineAbilityComponent {
    if (typeof data !== 'object' || data === null) {
      throw new Error('DivineAbilityComponent data must be object');
    }
    const obj = data as Record<string, unknown>;
    if (!Array.isArray(obj.abilities)) {
      throw new Error('DivineAbilityComponent must have abilities array');
    }
    if (!Array.isArray(obj.activePowers)) {
      throw new Error('DivineAbilityComponent must have activePowers array');
    }
    if (typeof obj.totalPowersUsed !== 'number') {
      throw new Error('DivineAbilityComponent must have totalPowersUsed number');
    }
    if (typeof obj.divineEnergyPool !== 'number') {
      throw new Error('DivineAbilityComponent must have divineEnergyPool number');
    }
    if (typeof obj.maxDivineEnergy !== 'number') {
      throw new Error('DivineAbilityComponent must have maxDivineEnergy number');
    }
    if (typeof obj.energyRegenRate !== 'number') {
      throw new Error('DivineAbilityComponent must have energyRegenRate number');
    }
    if (!Array.isArray(obj.activeBlessingsEntries)) {
      throw new Error('DivineAbilityComponent must have activeBlessingsEntries array');
    }
    if (!Array.isArray(obj.activeCursesEntries)) {
      throw new Error('DivineAbilityComponent must have activeCursesEntries array');
    }
    if (!Array.isArray(obj.recentPowerUses)) {
      throw new Error('DivineAbilityComponent must have recentPowerUses array');
    }
    if (!Array.isArray(obj.powerCooldownsEntries)) {
      throw new Error('DivineAbilityComponent must have powerCooldownsEntries array');
    }
    if (typeof obj.lastPowerUseTick !== 'number') {
      throw new Error('DivineAbilityComponent must have lastPowerUseTick number');
    }
    if (!Array.isArray(obj.powerSpecializationEntries)) {
      throw new Error('DivineAbilityComponent must have powerSpecializationEntries array');
    }
    return true;
  }
}
