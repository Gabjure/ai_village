import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use jsdom by default for most tests (React components need DOM)
    environment: 'jsdom',
    globals: true,
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.ts', // Exclude spec files (future work)
      '**/*.perf.test.ts', // Perf tests excluded from default run (use test:perf)
      '**/performance/*.test.ts', // Perf regression suite excluded (use test:perf)
      '**/RealLLM.integration.test.ts', // Hits real Groq/Cerebras APIs (non-deterministic, run manually)
    ],
    // Override to use node environment for specific tests that need file system
    environmentMatchGlobs: [
      // MetricsStorage tests need node environment for file system access
      ['packages/core/src/__tests__/MetricsStorage.test.ts', 'node'],
    ],
  },
  resolve: {
    alias: {
      '@village/core': path.resolve(__dirname, './packages/core/src'),
      '@ai-village/core': path.resolve(__dirname, './packages/core/src'),
      '@ai-village/agents': path.resolve(__dirname, './packages/agents/src'),
      '@ai-village/world': path.resolve(__dirname, './packages/world/src'),
      '@ai-village/renderer': path.resolve(__dirname, './packages/renderer/src'),
      '@ai-village/llm': path.resolve(__dirname, './packages/llm/src'),
      '@ai-village/magic': path.resolve(__dirname, './packages/magic/src'),
      '@ai-village/divinity': path.resolve(__dirname, './packages/divinity/src'),
      '@ai-village/reproduction': path.resolve(__dirname, './packages/reproduction/src'),
      '@ai-village/persistence': path.resolve(__dirname, './packages/persistence/src'),
      '@ai-village/botany': path.resolve(__dirname, './packages/botany/src'),
      '@ai-village/navigation': path.resolve(__dirname, './packages/navigation/src'),
      '@ai-village/building-designer': path.resolve(__dirname, './packages/building-designer/src'),
      '@ai-village/hierarchy-simulator': path.resolve(__dirname, './packages/hierarchy-simulator/src'),
      '@ai-village/metrics': path.resolve(__dirname, './packages/metrics/src'),
      '@ai-village/introspection': path.resolve(__dirname, './packages/introspection/src'),
      // metrics-dashboard internal alias
      '@': path.resolve(__dirname, './packages/metrics-dashboard/src'),
    },
  },
});
