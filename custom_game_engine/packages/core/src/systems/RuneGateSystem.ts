/**
 * RuneGateSystem - Manages rune comprehension learning through exposure
 *
 * Priority: 18 (before DoorSystem at 19)
 * Throttle: 20 ticks (1 second at 20 TPS)
 *
 * Responsibilities:
 * - Track when agents are near rune-locked doors
 * - Accumulate rune exposure for comprehension learning
 * - Emit events when comprehension thresholds are reached
 *
 * This system handles the "learning through exposure" mechanic. Teaching
 * and study-based learning are handled by their respective interaction
 * systems (social/research).
 *
 * Gate enforcement is handled in DoorSystem (for tile doors) and
 * PassageTraversalSystem (for passages).
 */

import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import type { SystemId, ComponentType } from '../types.js';
import { ComponentType as CT } from '../types/ComponentType.js';
import type { PositionComponent } from '../components/PositionComponent.js';
import type { RuneComprehensionComponent } from '../components/RuneComprehensionComponent.js';
import {
  createRuneComprehensionComponent,
  recordRuneExposure,
  isGateRune,
  COMPREHENSION_THRESHOLD,
} from '../components/RuneComprehensionComponent.js';
import type { World, ITile } from '../ecs/World.js';
import { EntityImpl } from '../ecs/Entity.js';

/** Distance at which agents absorb rune knowledge from nearby rune doors */
const RUNE_EXPOSURE_DISTANCE = 3.0;

interface WorldWithTiles extends World {
  getTileAt(x: number, y: number): ITile | undefined;
  getDoorLocations?(): ReadonlyArray<{ x: number; y: number }>;
}

export class RuneGateSystem extends BaseSystem {
  public readonly id: SystemId = 'rune_gate';
  public readonly priority: number = 18; // Before DoorSystem (19)
  public readonly requiredComponents: ReadonlyArray<ComponentType> = [CT.Position, CT.Agent];
  public readonly activationComponents = [CT.Agent] as const;
  protected readonly throttleInterval = 20; // 1 second

  protected onUpdate(ctx: SystemContext): void {
    const world = ctx.world;
    const worldWithTiles = world as WorldWithTiles;

    if (typeof worldWithTiles.getTileAt !== 'function') return;

    // Get rune-locked door locations
    const doorLocations = worldWithTiles.getDoorLocations?.() ?? [];
    if (doorLocations.length === 0) return;

    // Collect rune doors with their required runes
    const runeDoors: Array<{ x: number; y: number; rune: string }> = [];
    for (const loc of doorLocations) {
      const tile = worldWithTiles.getTileAt(loc.x, loc.y);
      if (tile?.door?.requiredRune && isGateRune(tile.door.requiredRune)) {
        runeDoors.push({ x: loc.x, y: loc.y, rune: tile.door.requiredRune });
      }
    }

    if (runeDoors.length === 0) return;

    const exposureDistanceSquared = RUNE_EXPOSURE_DISTANCE * RUNE_EXPOSURE_DISTANCE;

    // For each agent, check proximity to rune doors and accumulate exposure
    for (const entity of ctx.activeEntities) {
      const impl = entity as EntityImpl;
      const pos = impl.getComponent<PositionComponent>(CT.Position);
      if (!pos) continue;

      // Check each rune door for proximity
      for (const door of runeDoors) {
        const dx = (door.x + 0.5) - pos.x;
        const dy = (door.y + 0.5) - pos.y;
        const distSquared = dx * dx + dy * dy;

        if (distSquared > exposureDistanceSquared) continue;

        // Agent is near a rune door — accumulate exposure
        const agentImpl = entity as EntityImpl;
        const runeComp = agentImpl.getComponent<RuneComprehensionComponent>(CT.RuneComprehension);

        if (!runeComp) {
          // Agent has no rune comprehension component — add one
          agentImpl.addComponent(createRuneComprehensionComponent());
          continue; // Will start accumulating next tick
        }

        // Record exposure and check if threshold just crossed
        const previousLevel = runeComp.runes[door.rune as keyof typeof runeComp.runes]?.level ?? 0;
        const updated = recordRuneExposure(runeComp, door.rune as Parameters<typeof recordRuneExposure>[1], ctx.tick);
        const newLevel = updated.runes[door.rune as keyof typeof updated.runes]?.level ?? 0;

        const comps = ctx.components(entity);
        comps.update<RuneComprehensionComponent>(CT.RuneComprehension, () => updated);

        // Emit event when comprehension threshold is crossed
        if (previousLevel < COMPREHENSION_THRESHOLD && newLevel >= COMPREHENSION_THRESHOLD) {
          ctx.emit('rune:comprehended', {
            rune: door.rune,
            level: newLevel,
          }, entity.id);
        }
      }
    }
  }
}
