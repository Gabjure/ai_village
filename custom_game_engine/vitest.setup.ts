import { beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import {
  globalRecipeRegistry,
  initializeDefaultRecipes,
  itemRegistry,
  registerDefaultItems,
  registerDefaultSeeds,
} from '@ai-village/core';

// Polyfill ResizeObserver for jsdom (used by charting libraries)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill localStorage if the environment doesn't provide a full Storage implementation
// (Node.js 25+ has a broken native localStorage that overrides jsdom's)
if (typeof localStorage === 'undefined' || typeof localStorage.clear !== 'function') {
  const store = new Map<string, string>();
  const storage = {
    getItem(key: string): string | null { return store.get(key) ?? null; },
    setItem(key: string, value: string): void { store.set(key, String(value)); },
    removeItem(key: string): void { store.delete(key); },
    clear(): void { store.clear(); },
    key(index: number): string | null {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    },
    get length(): number { return store.size; },
  };
  (globalThis as any).localStorage = storage;
}

// Initialize default items and recipes before each test
// This ensures tests have access to standard items like wood, stone, berry, etc.
beforeEach(() => {
  // Clear any existing recipes
  (globalRecipeRegistry as any).recipes.clear();

  // Clear any existing items and re-register defaults
  itemRegistry.clear();
  registerDefaultItems(itemRegistry);
  registerDefaultSeeds(itemRegistry);

  // Initialize default recipes
  initializeDefaultRecipes();
});
