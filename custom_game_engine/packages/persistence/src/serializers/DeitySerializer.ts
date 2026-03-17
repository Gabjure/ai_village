import { BaseComponentSerializer } from '../ComponentSerializerRegistry.js';
import type { DeityComponent, DeityIdentity, DeityBeliefState, AngelArmyState, AngelSpeciesDefinition } from '@ai-village/core';
import { DeityComponent as DeityComponentClass } from '@ai-village/core';

interface SerializedDeityIdentity {
  primaryName: string;
  epithets: string[];
  domain?: DeityIdentity['domain'];
  secondaryDomains: DeityIdentity['secondaryDomains'];
  perceivedPersonality: DeityIdentity['perceivedPersonality'];
  perceivedAlignment: DeityIdentity['perceivedAlignment'];
  describedForm?: string;
  symbols: string[];
  colors: string[];
  sacredAnimals: string[];
  traitConfidenceEntries: Array<[string, number]>;
}

interface SerializedDeity {
  identity: SerializedDeityIdentity;
  belief: DeityBeliefState;
  believersArray: string[];
  sacredSitesArray: string[];
  prayerQueue: DeityComponent['prayerQueue'];
  sentVisions: DeityComponent['sentVisions'];
  totalAnsweredPrayers: number;
  myths: DeityComponent['myths'];
  controller: 'player' | 'ai' | 'dormant';
  emergenceTick?: number;
  angelSpecies?: AngelSpeciesDefinition;
  angelArmy: AngelArmyState;
}

export class DeitySerializer extends BaseComponentSerializer<DeityComponent> {
  constructor() {
    super('deity', 1);
  }

  protected serializeData(component: DeityComponent): SerializedDeity {
    const traitConfidenceEntries: Array<[string, number]> =
      component.identity.traitConfidence instanceof Map
        ? Array.from(component.identity.traitConfidence.entries())
        : [];

    return {
      identity: {
        primaryName: component.identity.primaryName,
        epithets: component.identity.epithets,
        domain: component.identity.domain,
        secondaryDomains: component.identity.secondaryDomains,
        perceivedPersonality: component.identity.perceivedPersonality,
        perceivedAlignment: component.identity.perceivedAlignment,
        describedForm: component.identity.describedForm,
        symbols: component.identity.symbols,
        colors: component.identity.colors,
        sacredAnimals: component.identity.sacredAnimals,
        traitConfidenceEntries,
      },
      belief: component.belief,
      believersArray: Array.from(component.believers),
      sacredSitesArray: Array.from(component.sacredSites),
      prayerQueue: component.prayerQueue,
      sentVisions: component.sentVisions,
      totalAnsweredPrayers: component.totalAnsweredPrayers,
      myths: component.myths,
      controller: component.controller,
      emergenceTick: component.emergenceTick,
      angelSpecies: component.angelSpecies,
      angelArmy: component.angelArmy,
    };
  }

  protected deserializeData(data: unknown): DeityComponent {
    const serialized = data as SerializedDeity;

    const component = new DeityComponentClass(
      serialized.identity.primaryName,
      serialized.controller
    );

    component.identity = {
      primaryName: serialized.identity.primaryName,
      epithets: serialized.identity.epithets,
      domain: serialized.identity.domain,
      secondaryDomains: serialized.identity.secondaryDomains,
      perceivedPersonality: serialized.identity.perceivedPersonality,
      perceivedAlignment: serialized.identity.perceivedAlignment,
      describedForm: serialized.identity.describedForm,
      symbols: serialized.identity.symbols,
      colors: serialized.identity.colors,
      sacredAnimals: serialized.identity.sacredAnimals,
      traitConfidence: new Map(serialized.identity.traitConfidenceEntries),
    };

    component.belief = serialized.belief;
    component.believers = new Set(serialized.believersArray);
    component.sacredSites = new Set(serialized.sacredSitesArray);
    component.prayerQueue = serialized.prayerQueue;
    component.sentVisions = serialized.sentVisions;
    component.totalAnsweredPrayers = serialized.totalAnsweredPrayers;
    component.myths = serialized.myths;
    component.emergenceTick = serialized.emergenceTick;
    component.angelSpecies = serialized.angelSpecies;
    component.angelArmy = serialized.angelArmy;

    return component;
  }

  validate(data: unknown): data is DeityComponent {
    if (typeof data !== 'object' || data === null) {
      throw new Error('DeityComponent data must be object');
    }
    const obj = data as Record<string, unknown>;
    if (typeof obj.identity !== 'object' || obj.identity === null) {
      throw new Error('DeityComponent must have identity object');
    }
    if (!Array.isArray(obj.believersArray)) {
      throw new Error('DeityComponent must have believersArray array');
    }
    if (!Array.isArray(obj.sacredSitesArray)) {
      throw new Error('DeityComponent must have sacredSitesArray array');
    }
    const identity = obj.identity as Record<string, unknown>;
    if (!Array.isArray(identity.traitConfidenceEntries)) {
      throw new Error('DeityComponent identity must have traitConfidenceEntries array');
    }
    return true;
  }
}
