/**
 * ChronoSalvageMissionComponent - Tracks chrono salvage ship missions
 *
 * Chrono salvage ships fetch items and entities from extinct or alternate
 * timelines (temporal archaeology).
 *
 * See: openspec/IMPLEMENTATION_ROADMAP.md Phase 6.2
 */

import type { Component } from '../ecs/Component.js';

/**
 * Retrieved item from another timeline
 */
export interface RetrievedItem {
  /** Item type or entity ID */
  itemId: string;
  /** Human-readable name */
  name: string;
  /** Source timeline branch ID */
  sourceBranchId: string;
  /** Tick in source timeline when retrieved */
  sourceTimeTick: number;
  /** Contamination level introduced (0-1) */
  contamination: number;
  /** Whether item is anchored to current timeline */
  anchored: boolean;
  /** Anchoring progress (0-100, 100 = fully anchored) */
  anchoringProgress: number;
  /** Tick when retrieved */
  retrievedTick: number;
}

/**
 * ChronoSalvageMissionComponent - Attached to chrono_salvage ships
 */
export interface ChronoSalvageMissionComponent extends Component {
  type: 'chrono_salvage_mission';

  /** Ship entity ID */
  shipId: string;

  /** Tick when mission started */
  startTick: number;

  /** Mission phase */
  phase: 'navigating' | 'searching' | 'retrieving' | 'anchoring' | 'returning' | 'complete';

  /** Progress through current phase (0-100) */
  progress: number;

  /** Target timeline branch ID */
  targetBranchId: string;

  /** Target item/entity specification */
  targetSpec: {
    /** Type of target (item, entity, technology) */
    type: 'item' | 'entity' | 'technology';
    /** Specific identifier or search criteria */
    criteria: string;
    /** Description for narrative */
    description: string;
  };

  /** Items/entities retrieved */
  retrievedItems: RetrievedItem[];

  /** Total contamination introduced to current timeline */
  totalContamination: number;

  /** Object anchoring capacity (how many items can be stabilized) */
  anchoringCapacity: number;

  /** Current anchoring slots used */
  anchoringSlotsUsed: number;

  /** Failed retrieval attempts */
  failedAttempts: number;

  /** Reason for last failure (if any) */
  lastFailureReason?: string;
}

/**
 * Create a chrono salvage mission
 */
export function createChronoSalvageMissionComponent(
  shipId: string,
  targetBranchId: string,
  targetSpec: ChronoSalvageMissionComponent['targetSpec'],
  anchoringCapacity: number,
  startTick: number
): ChronoSalvageMissionComponent {
  return {
    type: 'chrono_salvage_mission',
    version: 1,
    shipId,
    startTick,
    phase: 'navigating',
    progress: 0,
    targetBranchId,
    targetSpec,
    retrievedItems: [],
    totalContamination: 0,
    anchoringCapacity,
    anchoringSlotsUsed: 0,
    failedAttempts: 0,
  };
}

/**
 * Add a retrieved item to the mission
 */
export function addRetrievedItem(
  component: ChronoSalvageMissionComponent,
  item: RetrievedItem
): boolean {
  if (component.anchoringSlotsUsed >= component.anchoringCapacity) {
    return false; // Capacity full
  }

  component.retrievedItems.push(item);
  component.anchoringSlotsUsed++;
  component.totalContamination += item.contamination;
  return true;
}

/**
 * Update anchoring progress for all items
 */
export function updateAnchoringProgress(
  component: ChronoSalvageMissionComponent,
  progressDelta: number
): void {
  for (const item of component.retrievedItems) {
    if (!item.anchored) {
      item.anchoringProgress = Math.min(100, item.anchoringProgress + progressDelta);
      if (item.anchoringProgress >= 100) {
        item.anchored = true;
      }
    }
  }
}

/**
 * Check if all items are anchored
 */
export function allItemsAnchored(component: ChronoSalvageMissionComponent): boolean {
  return component.retrievedItems.every(item => item.anchored);
}

/**
 * Check if mission is complete
 */
export function isMissionComplete(component: ChronoSalvageMissionComponent): boolean {
  return component.phase === 'complete';
}
