import type { Component } from '../ecs/Component.js';
import type { ItemCategory } from '../items/ItemDefinition.js';

/**
 * Component for entities that act as stationary containers in the world.
 * Containers hold items and can optionally preserve them (prevent decay).
 */
export interface ContainerComponent extends Component {
  type: 'container';
  /** The container item definition ID (e.g., 'stone_shelf', 'crystal_chest') */
  containerType: string;
  /** Maximum number of items this container can hold */
  capacity: number;
  /** Whether items inside are preserved (prevents decay) */
  preserves: boolean;
  /** Restricted item categories (if empty/undefined, accepts all) */
  acceptedCategories?: ItemCategory[];
  /** Entity IDs of items currently inside this container */
  storedItems: string[];
}

export function createContainerComponent(
  containerType: string,
  capacity: number,
  preserves: boolean,
  acceptedCategories?: ItemCategory[]
): ContainerComponent {
  return {
    type: 'container',
    version: 1,
    containerType,
    capacity,
    preserves,
    acceptedCategories,
    storedItems: [],
  };
}
