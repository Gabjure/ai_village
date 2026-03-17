import { BaseComponentSerializer } from '../ComponentSerializerRegistry.js';
import { SocialMemoryComponent, type SocialMemory } from '@ai-village/core';

interface SerializedSocialMemory {
  socialMemoriesEntries: Array<[string, SocialMemory]>;
}

export class SocialMemorySerializer extends BaseComponentSerializer<SocialMemoryComponent> {
  constructor() {
    super('social_memory', 1);
  }

  protected serializeData(component: SocialMemoryComponent): SerializedSocialMemory {
    const componentAny = component as unknown as {
      _socialMemories: Map<string, SocialMemory>;
    };

    return {
      socialMemoriesEntries: Array.from(componentAny._socialMemories.entries()),
    };
  }

  protected deserializeData(data: unknown): SocialMemoryComponent {
    const serialized = data as SerializedSocialMemory;

    const component = new SocialMemoryComponent();

    const componentAny = component as unknown as {
      _socialMemories: Map<string, SocialMemory>;
    };

    if (serialized.socialMemoriesEntries && Array.isArray(serialized.socialMemoriesEntries)) {
      componentAny._socialMemories = new Map(serialized.socialMemoriesEntries);
    }

    return component;
  }

  validate(data: unknown): data is SocialMemoryComponent {
    if (typeof data !== 'object' || data === null) {
      throw new Error('SocialMemoryComponent data must be object');
    }
    const d = data as Record<string, unknown>;
    if (!Array.isArray(d.socialMemoriesEntries)) {
      throw new Error('SocialMemoryComponent data must have socialMemoriesEntries array');
    }
    return true;
  }
}
