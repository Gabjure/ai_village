/**
 * Test for LLM prayer domain inference in DeityEmergenceSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeityEmergenceSystem } from '../DeityEmergenceSystem.js';
import type { LLMDecisionQueue } from '../../decision/LLMDecisionProcessor.js';

// Type helpers for testing
type EntityWithMethods = {
  addComponent?: (comp: unknown) => void;
  updateComponent?: (type: string, updater: (current: unknown) => unknown) => void;
  getComponent?: (type: string) => unknown;
  hasComponent?: (type: string) => boolean;
};
type WorldWithMethods = Record<string, unknown> & {
  getEntity?: (id: string) => unknown;
  addEntity?: (entity: unknown) => void;
  query?: unknown;
  getSystem?: (name: string) => unknown;
};

describe('DeityEmergenceSystem - LLM Prayer Domain Inference', () => {
  let mockLLMQueue: LLMDecisionQueue;
  let system: DeityEmergenceSystem;

  beforeEach(() => {
    // Create mock LLM queue
    mockLLMQueue = {
      requestDecision: vi.fn().mockResolvedValue(''),
      getDecision: vi.fn().mockReturnValue(null),
      getQueueSize: vi.fn().mockReturnValue(0),
      getActiveCount: vi.fn().mockReturnValue(0),
      setMaxTokens: vi.fn(),
      getMaxTokens: vi.fn().mockReturnValue(4096),
    } as Partial<LLMDecisionQueue> as LLMDecisionQueue;

    system = new DeityEmergenceSystem({}, mockLLMQueue);
  });

  it('should use keyword matching as immediate fallback', () => {
    // Access private method via type assertion for testing
    const inferDomain = (system as Record<string, unknown>).inferDomainFromPrayer.bind(system);

    // Test keyword matching
    expect(inferDomain('Please bless our harvest and crops')).toBe('harvest');
    expect(inferDomain('Heal my sick child')).toBe('healing');
    expect(inferDomain('Protect us from danger')).toBe('protection');
    expect(inferDomain('Grant us wisdom and knowledge')).toBe('wisdom');
    expect(inferDomain('Help us in battle against our enemies')).toBe('war');
  });

  it('should request LLM inference when available', () => {
    // Access private method
    const inferDomain = (system as Record<string, unknown>).inferDomainFromPrayer.bind(system);

    const prayer = 'Please help my family survive this terrible winter';
    inferDomain(prayer);

    // Should have queued an LLM request
    expect(mockLLMQueue.requestDecision).toHaveBeenCalled();
    const callArgs = (mockLLMQueue.requestDecision as Record<string, unknown>).mock.calls[0];
    expect(callArgs[1]).toContain(prayer);
    expect(callArgs[1]).toContain('divine domain');
  });

  it('should cache LLM responses', () => {
    // Mock LLM response
    const mockResponse = JSON.stringify({
      domain: 'healing',
      confidence: 0.9,
      reasoning: 'Prayer requests healing for family member',
    });

    mockLLMQueue.getDecision = vi.fn().mockReturnValue(mockResponse);

    // Access private methods
    const processLLM = (system as Record<string, unknown>).processLLMDomainInferences.bind(system);
    const inferDomain = (system as Record<string, unknown>).inferDomainFromPrayer.bind(system);

    // First call - triggers LLM request
    const prayer = 'Please heal my father';
    inferDomain(prayer);

    // Simulate LLM response processing
    processLLM();

    // Second call - should use cache
    (mockLLMQueue.requestDecision as Record<string, unknown>).mockClear();
    const domain2 = inferDomain(prayer);

    // Should not make another LLM request (uses cache)
    expect(mockLLMQueue.requestDecision).not.toHaveBeenCalled();
  });

  it('should handle invalid LLM responses gracefully', () => {
    // Mock invalid JSON response
    mockLLMQueue.getDecision = vi.fn().mockReturnValue('invalid json');

    // Access private method
    const processLLM = (system as Record<string, unknown>).processLLMDomainInferences.bind(system);

    // Should not throw
    expect(() => processLLM()).not.toThrow();
  });

  it('should validate LLM domain responses', () => {
    // Mock response with invalid domain
    const mockResponse = JSON.stringify({
      domain: 'invalid_domain_name',
      confidence: 0.9,
    });

    mockLLMQueue.getDecision = vi.fn().mockReturnValue(mockResponse);

    // Access private method
    const processLLM = (system as Record<string, unknown>).processLLMDomainInferences.bind(system);

    // Should handle gracefully
    expect(() => processLLM()).not.toThrow();
  });

  it('should work without LLM queue (fallback only)', () => {
    const systemNoLLM = new DeityEmergenceSystem({});

    // Access private method
    const inferDomain = (systemNoLLM as Record<string, unknown>).inferDomainFromPrayer.bind(systemNoLLM);

    // Should still work with keyword matching
    expect(inferDomain('Please bless our harvest')).toBe('harvest');
  });

  it('should include all valid domains in prompt', () => {
    const inferDomain = (system as Record<string, unknown>).inferDomainFromPrayer.bind(system);

    inferDomain('Test prayer');

    const callArgs = (mockLLMQueue.requestDecision as Record<string, unknown>).mock.calls[0];
    const prompt = callArgs[1];

    // Check that prompt includes valid domains
    expect(prompt).toContain('harvest');
    expect(prompt).toContain('war');
    expect(prompt).toContain('wisdom');
    expect(prompt).toContain('healing');
    expect(prompt).toContain('death');
    expect(prompt).toContain('love');
    // And many others...
  });
});
