import type { Component } from '../ecs/Component.js';

/**
 * Component for items that exist in the world (dropped, placed, or contained).
 */
export interface DroppedItemComponent extends Component {
  type: 'item';
  /** The item definition ID */
  itemType: string;
  /** Stack quantity */
  quantity: number;
  /** If this item is inside a container, the container entity ID */
  containedIn?: string;
}

export function createDroppedItemComponent(
  itemType: string,
  quantity: number,
  containedIn?: string
): DroppedItemComponent {
  return {
    type: 'item',
    version: 1,
    itemType,
    quantity,
    containedIn,
  };
}
