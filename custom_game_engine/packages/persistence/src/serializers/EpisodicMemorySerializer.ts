/**
 * Serializer for EpisodicMemoryComponent - properly reconstructs class instance
 */

import { BaseComponentSerializer } from '../ComponentSerializerRegistry.js';
import { EpisodicMemoryComponent, type EpisodicMemory } from '@ai-village/core';

interface SerializedEpisodicMemory {
  maxMemories: number;
  memories: EpisodicMemory[];
}

export class EpisodicMemorySerializer extends BaseComponentSerializer<EpisodicMemoryComponent> {
  constructor() {
    super('episodic_memory', 1);
  }

  protected serializeData(component: EpisodicMemoryComponent): SerializedEpisodicMemory {
    return {
      maxMemories: (component as { _maxMemories: number })._maxMemories ?? 1000,
      memories: [...component.episodicMemories],
    };
  }

  protected deserializeData(data: unknown): EpisodicMemoryComponent {
    const serialized = data as SerializedEpisodicMemory;

    // Validate required fields - throw on missing data per CLAUDE.md
    if (typeof serialized.maxMemories !== 'number') {
      throw new Error('EpisodicMemorySerializer: missing required field "maxMemories"');
    }
    if (!Array.isArray(serialized.memories)) {
      throw new Error('EpisodicMemorySerializer: missing required field "memories"');
    }

    // Create new component instance
    const component = new EpisodicMemoryComponent({
      maxMemories: serialized.maxMemories,
    });

    // Restore memories by accessing private field
    const componentAny = component as { _episodicMemories: EpisodicMemory[] };
    componentAny._episodicMemories = serialized.memories;

    return component;
  }

  validate(data: unknown): data is EpisodicMemoryComponent {
    if (typeof data !== 'object' || data === null) {
      throw new Error('EpisodicMemoryComponent data must be object');
    }
    return true;
  }
}
