/**
 * Serializer for PlantKnowledgeComponent - properly reconstructs instance with private Map/Set fields
 *
 * PlantKnowledgeComponent stores agent knowledge about plant properties in:
 * - _knowledge: Map<string, PlantKnowledgeEntry>
 * - _encounteredPlants: Set<string>
 *
 * The component provides toJSON/fromJSON methods that handle this correctly,
 * so we delegate to those rather than accessing private fields directly.
 */

import { BaseComponentSerializer } from '../ComponentSerializerRegistry.js';
import { PlantKnowledgeComponent, type PlantKnowledgeData } from '@ai-village/core';

export class PlantKnowledgeSerializer extends BaseComponentSerializer<PlantKnowledgeComponent> {
  constructor() {
    super('plant_knowledge', 1);
  }

  protected serializeData(component: PlantKnowledgeComponent): PlantKnowledgeData {
    return component.toJSON();
  }

  protected deserializeData(data: unknown): PlantKnowledgeComponent {
    return PlantKnowledgeComponent.fromJSON(data as PlantKnowledgeData);
  }

  validate(data: unknown): data is PlantKnowledgeComponent {
    if (typeof data !== 'object' || data === null) {
      throw new Error('PlantKnowledgeComponent data must be object');
    }
    return true;
  }
}
