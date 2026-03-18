/**
 * ParadigmEffectApplier - Handles paradigm-specific spell effects
 *
 * Paradigm effects are custom game-mechanical actions tied to a specific
 * magic paradigm. Each paradigm registers its own effect types and the
 * logic for applying them via the `paradigmEffectType` discriminant.
 *
 * Paradigm authors register handlers with `registerParadigmHandler()` during
 * paradigm initialization. If a paradigm effect is executed and no handler
 * has been registered for its `paradigmEffectType`, an error is thrown
 * (no silent fallbacks per codebase rules).
 */

import type { Entity } from '../../ecs/Entity.js';
import type { World } from '../../ecs/World.js';
import type {
  ParadigmEffect,
  EffectApplicationResult,
  ActiveEffect,
} from '../SpellEffect.js';
import type { EffectApplier, EffectContext } from '../SpellEffectExecutor.js';

// ============================================================================
// Paradigm Handler Interface
// ============================================================================

/**
 * Handler for a specific paradigm effect type.
 * Paradigm authors implement this to define custom effect mechanics.
 */
export interface ParadigmEffectHandler {
  /**
   * Apply the paradigm effect. Called once when the spell lands.
   */
  apply(
    effect: ParadigmEffect,
    caster: Entity,
    target: Entity,
    world: World,
    context: EffectContext
  ): EffectApplicationResult;

  /**
   * Process a game tick for a duration-based paradigm effect (optional).
   */
  tick?(
    activeEffect: ActiveEffect,
    effect: ParadigmEffect,
    target: Entity,
    world: World,
    context: EffectContext
  ): void;

  /**
   * Clean up when the effect expires or is dispelled (optional).
   */
  remove?(
    activeEffect: ActiveEffect,
    effect: ParadigmEffect,
    target: Entity,
    world: World
  ): void;
}

// ============================================================================
// ParadigmEffectApplier
// ============================================================================

/**
 * ParadigmEffectApplier implementation.
 *
 * Acts as a router: each `paradigmEffectType` maps to a registered
 * `ParadigmEffectHandler` that contains the actual mechanic logic.
 * Throws if no handler is registered for the requested type.
 */
export class ParadigmEffectApplier implements EffectApplier<ParadigmEffect> {
  readonly category = 'paradigm' as const;

  /** Handlers keyed by paradigmEffectType string */
  private handlers: Map<string, ParadigmEffectHandler> = new Map();

  /**
   * Register a handler for a paradigm effect type.
   * Throws if a handler is already registered for that type.
   */
  registerHandler(paradigmEffectType: string, handler: ParadigmEffectHandler): void {
    if (this.handlers.has(paradigmEffectType)) {
      throw new Error(
        `[ParadigmEffectApplier] Handler already registered for paradigm effect type '${paradigmEffectType}'`
      );
    }
    this.handlers.set(paradigmEffectType, handler);
  }

  /**
   * Check if a handler is registered for a paradigm effect type.
   */
  hasHandler(paradigmEffectType: string): boolean {
    return this.handlers.has(paradigmEffectType);
  }

  apply(
    effect: ParadigmEffect,
    caster: Entity,
    target: Entity,
    world: World,
    context: EffectContext
  ): EffectApplicationResult {
    const handler = this.handlers.get(effect.paradigmEffectType);
    if (!handler) {
      throw new Error(
        `[ParadigmEffectApplier] No handler registered for paradigm effect type '${effect.paradigmEffectType}' (paradigm: '${effect.paradigmId}', effect: '${effect.id}')`
      );
    }
    return handler.apply(effect, caster, target, world, context);
  }

  tick(
    activeEffect: ActiveEffect,
    effect: ParadigmEffect,
    target: Entity,
    world: World,
    context: EffectContext
  ): void {
    const handler = this.handlers.get(effect.paradigmEffectType);
    if (!handler) {
      throw new Error(
        `[ParadigmEffectApplier] No handler registered for paradigm effect type '${effect.paradigmEffectType}' during tick (paradigm: '${effect.paradigmId}', effect: '${effect.id}')`
      );
    }
    handler.tick?.(activeEffect, effect, target, world, context);
  }

  remove(
    activeEffect: ActiveEffect,
    effect: ParadigmEffect,
    target: Entity,
    world: World
  ): void {
    const handler = this.handlers.get(effect.paradigmEffectType);
    if (!handler) {
      throw new Error(
        `[ParadigmEffectApplier] No handler registered for paradigm effect type '${effect.paradigmEffectType}' during remove (paradigm: '${effect.paradigmId}', effect: '${effect.id}')`
      );
    }
    handler.remove?.(activeEffect, effect, target, world);
  }
}
