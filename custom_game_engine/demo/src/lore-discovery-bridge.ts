/**
 * Lore Discovery Bridge — MVEE
 *
 * Subscribes to `lore:discovery` ECS events emitted by LoreDiscoverySystem
 * and forwards them to the shared LoreDiscoveryEmitter for the Akashic
 * Records wiki.
 *
 * Import once during game boot after systems are registered.
 *
 * Uses dynamic import so the build doesn't break when @akashic-records
 * isn't installed yet (package is still in development).
 */

import type { EventBus } from '@ai-village/core';

declare global {
  interface Window {
    matrixAuth?: {
      accessToken: string;
      userId: string;
    };
  }
}

let emitter: any = null;
let unsubscribe: (() => void) | null = null;

/**
 * Initialize the lore discovery bridge. Call once after system registration.
 * Subscribes to `lore:discovery` ECS events and forwards them to the
 * LoreDiscoveryEmitter which handles batching, dedup, and POST to the API.
 *
 * No-ops gracefully if @akashic-records is not installed.
 */
export async function initLoreDiscoveryBridge(eventBus: EventBus): Promise<void> {
  if (emitter) {
    throw new Error('[LoreDiscoveryBridge] Already initialized — call destroyLoreDiscoveryBridge() first');
  }

  try {
    // The vendor module is UMD — Vite can't extract named ESM exports from it.
    // Grab the default/namespace and pull LoreDiscoveryEmitter from it.
    const mod: any = await import('@akashic-records/lib/lore-discovery-emitter.js');
    const LoreDiscoveryEmitter = mod.LoreDiscoveryEmitter ?? mod.default?.LoreDiscoveryEmitter ?? mod.default;
    if (typeof LoreDiscoveryEmitter !== 'function') return;
    emitter = new LoreDiscoveryEmitter({
      game: 'mvee',
      getAuthToken: () => window.matrixAuth?.accessToken ?? null,
      getUserId: () => window.matrixAuth?.userId ?? null,
    });

    unsubscribe = eventBus.on('lore:discovery' as any, (event: any) => {
      const { category, subject, aspect, detail } = event.data;
      emitter!.discover(category, subject, aspect, detail);
    });
  } catch {
    // @akashic-records not installed yet — bridge is a no-op
  }
}

/**
 * Tear down the bridge. Flushes remaining events and removes the subscription.
 */
export function destroyLoreDiscoveryBridge(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (emitter) {
    emitter.destroy();
    emitter = null;
  }
}
