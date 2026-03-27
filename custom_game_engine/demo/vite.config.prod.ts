/**
 * Vite config for Hetzner production deployment.
 *
 * Differences from dev vite.config.ts:
 * - base: '/mvee/' for path-based deployment (play.multiversestudios.xyz/mvee/)
 * - No dev-server-only plugins (orchestrator, LLM proxy, animation queue, cache control)
 * - Output to dist/
 * - Injects BUILD_VERSION and BUILD_COMMIT for version stamping
 * - Entry point: game.html (served as index.html by production server)
 *
 * Build: npm run build:prod (from custom_game_engine/)
 */

import { defineConfig } from 'vite';
import path from 'path';
import { execSync } from 'child_process';

// Version stamping
const commitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
})();

const buildTimestamp = new Date().toISOString();

export default defineConfig({
  base: '/mvee/',

  envDir: path.resolve(__dirname, '..'),

  define: {
    __BUILD_COMMIT__: JSON.stringify(commitHash),
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
    __BUILD_VERSION__: JSON.stringify(`0.1.0-${commitHash}`),
  },

  plugins: [],

  resolve: {
    alias: {
      '@ai-village/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@ai-village/botany': path.resolve(__dirname, '../packages/botany/src/index.ts'),
      '@ai-village/persistence': path.resolve(__dirname, '../packages/persistence/src/index.ts'),
      '@ai-village/metrics': path.resolve(__dirname, '../packages/metrics/src/index.ts'),
      '@ai-village/reproduction': path.resolve(__dirname, '../packages/reproduction/src/index.ts'),
      '@ai-village/divinity': path.resolve(__dirname, '../packages/divinity/src/index.ts'),
      '@ai-village/magic': path.resolve(__dirname, '../packages/magic/src/index.ts'),
      '@ai-village/world': path.resolve(__dirname, '../packages/world/src/index.ts'),
      '@ai-village/renderer': path.resolve(__dirname, '../packages/renderer/src/index.ts'),
      '@ai-village/llm': path.resolve(__dirname, '../packages/llm/src/index.ts'),
      '@ai-village/shared-worker': path.resolve(__dirname, '../packages/shared-worker/src/index.ts'),
      '@ai-village/agents': path.resolve(__dirname, '../packages/agents/src/index.ts'),
      '@ai-village/language': path.resolve(__dirname, '../packages/language/src/index.ts'),
      '@ai-village/introspection': path.resolve(__dirname, '../packages/introspection/src/index.ts'),
      '@akashic-records/lib': path.resolve(__dirname, '../vendor/akashic-records/lib'),
      'fs': path.resolve(__dirname, '../packages/llm/src/browser-stubs/fs.ts'),
      'path': path.resolve(__dirname, '../packages/llm/src/browser-stubs/path.ts'),
    },
  },

  worker: {
    format: 'es',
    plugins: () => [],
    rollupOptions: {
      external: ['@nicepkg/wllama'],
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: 'hidden', // Generate .map files for debugging but don't expose via sourceMappingURL
    target: ['chrome92', 'firefox79', 'safari15'],
    rollupOptions: {
      // Only externalize Node.js-native modules that can't run in the browser.
      // All browser packages (pixi.js, d3, chart.js, dexie) MUST be bundled —
      // there is no import map in game.html to resolve bare specifiers.
      external: (id: string) => {
        const externals = ['sharp', '@nicepkg/wllama'];
        return externals.some(pkg => id === pkg || id.startsWith(pkg + '/'));
      },
      input: {
        index: path.resolve(__dirname, 'game.html'),
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // Engine split into functional groups:
        // - engine-core: core + packages with circular deps (world, building-designer, hierarchy-simulator, types)
        // - engine-ai: LLM, introspection, language, agents — loaded after initial render
        // - engine-simulation: magic, divinity, botany, reproduction, environment, navigation
        // - engine-infra: persistence, shared-worker, metrics
        // - engine-renderer: rendering (already split — leaf node)
        // Vendor split by major library for parallel loading.
        manualChunks(id) {
          if (id.includes('browser-stubs/')) return 'vendor';

          if (id.includes('/packages/') && id.includes('/src/')) {
            // Renderer: leaf node — safe to split
            if (id.includes('/packages/renderer/')) return 'engine-renderer';

            // Core + packages with bidirectional deps on core — must stay together
            // core <-> world, core <-> building-designer, core <-> hierarchy-simulator
            if (id.includes('/packages/core/')) return 'engine-core';
            if (id.includes('/packages/world/')) return 'engine-core';
            if (id.includes('/packages/building-designer/')) return 'engine-core';
            if (id.includes('/packages/hierarchy-simulator/')) return 'engine-core';
            if (id.includes('/packages/types/')) return 'engine-core';

            // AI/LLM subsystem — loaded after initial render
            if (id.includes('/packages/llm/')) return 'engine-ai';
            if (id.includes('/packages/introspection/')) return 'engine-ai';
            if (id.includes('/packages/language/')) return 'engine-ai';
            if (id.includes('/packages/agents/')) return 'engine-ai';

            // Simulation subsystems — leaf dependencies on core
            if (id.includes('/packages/magic/')) return 'engine-simulation';
            if (id.includes('/packages/divinity/')) return 'engine-simulation';
            if (id.includes('/packages/botany/')) return 'engine-simulation';
            if (id.includes('/packages/reproduction/')) return 'engine-simulation';
            if (id.includes('/packages/environment/')) return 'engine-simulation';
            if (id.includes('/packages/navigation/')) return 'engine-simulation';

            // Infrastructure
            if (id.includes('/packages/persistence/')) return 'engine-infra';
            if (id.includes('/packages/shared-worker/')) return 'engine-infra';
            if (id.includes('/packages/metrics/')) return 'engine-infra';
            if (id.includes('/packages/metrics-dashboard/')) return 'engine-infra';

            // Catch-all for any new packages
            return 'engine-core';
          }

          // Vendor splitting
          if (id.includes('node_modules/three')) return 'vendor-three';
          if (id.includes('node_modules/pixi')) return 'vendor-pixi';
          if (id.includes('node_modules/d3')) return 'vendor-d3';
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/chartjs-')) return 'vendor-charts';
          if (id.includes('node_modules/dexie')) return 'vendor-dexie';
          if (id.includes('node_modules/')) return 'vendor';
        },
      },
    },
  },
});
