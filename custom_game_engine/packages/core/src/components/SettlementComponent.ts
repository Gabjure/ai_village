/**
 * SettlementComponent - Tracks which settlement an entity belongs to
 *
 * Settlements are player groups on a shared planet. Multiple settlements can
 * exist on the same planet, sharing the same biosphere (creatures, plants, sprites)
 * but having their own agents and resources.
 *
 * Hierarchy: Universe → Planet → Settlement
 */

import type { EntityId } from '../types.js';

/**
 * Settlement metadata stored in planet data
 */
export interface SettlementMetadata {
  /** Unique settlement ID */
  readonly id: string;

  /** Human-readable settlement name */
  readonly name: string;

  /** Player ID who created/owns this settlement */
  readonly ownerId: string;

  /** When the settlement was founded (game tick) */
  readonly foundedTick: number;

  /** When the settlement was created (real timestamp) */
  readonly createdAt: number;

  /** Optional description or backstory */
  readonly description?: string;

  /** Number of agents currently in this settlement */
  readonly agentCount: number;

  /** Location center on the map (for visualization) */
  readonly centerX?: number;
  readonly centerY?: number;

  /** Settlement color for UI differentiation */
  readonly color?: string;
}

/**
 * Component attached to entities that belong to a settlement
 */
export interface SettlementComponent {
  readonly type: 'settlement';
  readonly version: 1;

  /** The settlement this entity belongs to */
  readonly settlementId: string;

  /** Role within the settlement (founder, member, visitor) */
  readonly role: SettlementRole;

  /** Tick when the entity joined this settlement */
  readonly joinedTick: number;

  /** Previous settlement ID if this entity migrated */
  readonly previousSettlementId?: string;
}

export type SettlementRole = 'founder' | 'member' | 'visitor' | 'refugee';

/**
 * Create a new settlement component for an entity
 */
export function createSettlementComponent(
  settlementId: string,
  role: SettlementRole = 'member',
  currentTick: number = 0
): SettlementComponent {
  return {
    type: 'settlement',
    version: 1,
    settlementId,
    role,
    joinedTick: currentTick,
  };
}

/**
 * Create a founder component for the player starting a new settlement
 */
export function createFounderSettlementComponent(
  settlementId: string,
  currentTick: number = 0
): SettlementComponent {
  return createSettlementComponent(settlementId, 'founder', currentTick);
}

/**
 * Generate a unique settlement ID
 */
export function generateSettlementId(): string {
  return `settlement_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create default settlement metadata for a new settlement
 */
export function createSettlementMetadata(
  id: string,
  name: string,
  ownerId: string,
  currentTick: number = 0,
  options?: {
    description?: string;
    centerX?: number;
    centerY?: number;
    color?: string;
  }
): SettlementMetadata {
  return {
    id,
    name,
    ownerId,
    foundedTick: currentTick,
    createdAt: Date.now(),
    agentCount: 0,
    description: options?.description,
    centerX: options?.centerX ?? 0,
    centerY: options?.centerY ?? 0,
    color: options?.color ?? generateSettlementColor(),
  };
}

/**
 * Generate a distinguishable color for a settlement
 */
function generateSettlementColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Count agents by settlement ID from a list of entities
 */
export function countAgentsBySettlement(
  entities: ReadonlyArray<{ getComponent: (type: string) => unknown }>
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const entity of entities) {
    const settlement = entity.getComponent('settlement') as SettlementComponent | undefined;
    if (settlement) {
      const current = counts.get(settlement.settlementId) || 0;
      counts.set(settlement.settlementId, current + 1);
    }
  }

  return counts;
}

/**
 * Migrate an entity to a new settlement
 */
export function migrateToSettlement(
  component: SettlementComponent,
  newSettlementId: string,
  currentTick: number
): SettlementComponent {
  return {
    ...component,
    settlementId: newSettlementId,
    role: 'member',
    joinedTick: currentTick,
    previousSettlementId: component.settlementId,
  };
}
