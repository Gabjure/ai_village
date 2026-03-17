import { BaseComponentSerializer } from '../ComponentSerializerRegistry.js';
import { BeliefComponent, type Belief, type BeliefType, type EvidenceType } from '@ai-village/core';

interface SerializedEvidenceRecord {
  readonly type: BeliefType;
  readonly subject: string;
  readonly evidenceType: EvidenceType;
  readonly tick: number;
  readonly positive: boolean;
}

interface SerializedBelief {
  beliefsEntries: Array<[string, Belief]>;
  evidenceRecordsEntries: Array<[string, SerializedEvidenceRecord[]]>;
}

export class BeliefSerializer extends BaseComponentSerializer<BeliefComponent> {
  constructor() {
    super('belief', 1);
  }

  protected serializeData(component: BeliefComponent): SerializedBelief {
    const componentAny = component as unknown as {
      _beliefs: Map<string, Belief>;
      _evidenceRecords: Map<string, SerializedEvidenceRecord[]>;
    };

    return {
      beliefsEntries: Array.from(componentAny._beliefs.entries()),
      evidenceRecordsEntries: Array.from(componentAny._evidenceRecords.entries()),
    };
  }

  protected deserializeData(data: unknown): BeliefComponent {
    const serialized = data as SerializedBelief;

    const component = new BeliefComponent();

    const componentAny = component as unknown as {
      _beliefs: Map<string, Belief>;
      _evidenceRecords: Map<string, SerializedEvidenceRecord[]>;
    };

    if (serialized.beliefsEntries && Array.isArray(serialized.beliefsEntries)) {
      componentAny._beliefs = new Map(serialized.beliefsEntries);
    }

    if (serialized.evidenceRecordsEntries && Array.isArray(serialized.evidenceRecordsEntries)) {
      componentAny._evidenceRecords = new Map(serialized.evidenceRecordsEntries);
    }

    return component;
  }

  validate(data: unknown): data is BeliefComponent {
    if (typeof data !== 'object' || data === null) {
      throw new Error('BeliefComponent data must be object');
    }
    const d = data as Record<string, unknown>;
    if (!Array.isArray(d.beliefsEntries)) {
      throw new Error('BeliefComponent data must have beliefsEntries array');
    }
    if (!Array.isArray(d.evidenceRecordsEntries)) {
      throw new Error('BeliefComponent data must have evidenceRecordsEntries array');
    }
    return true;
  }
}
