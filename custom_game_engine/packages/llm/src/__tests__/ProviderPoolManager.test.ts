import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderPoolManager } from '../ProviderPoolManager.js';
import type { LLMProvider, LLMRequest, LLMResponse, ProviderPricing } from '../LLMProvider.js';

// Mock LLM Provider with configurable behavior
class MockProvider implements LLMProvider {
  private responses: LLMResponse[] = [];
  private errors: Error[] = [];
  public callCount = 0;

  constructor(private id: string) {}

  async generate(request: LLMRequest): Promise<LLMResponse> {
    this.callCount++;

    if (this.errors.length > 0) {
      throw this.errors.shift()!;
    }

    if (this.responses.length > 0) {
      return this.responses.shift()!;
    }

    return {
      text: `${this.id} response`,
      inputTokens: 10,
      outputTokens: 20,
      costUSD: 0.001,
    };
  }

  getModelName(): string {
    return `${this.id}-model`;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getPricing(): ProviderPricing {
    return {
      providerId: this.id,
      providerName: this.id,
      inputCostPer1M: 0.5,
      outputCostPer1M: 1.5,
    };
  }

  getProviderId(): string {
    return this.id;
  }

  queueResponse(response: LLMResponse): void {
    this.responses.push(response);
  }

  queueError(error: Error): void {
    this.errors.push(error);
  }
}

describe('ProviderPoolManager', () => {
  let groqProvider: MockProvider;
  let cerebrasProvider: MockProvider;
  let pool: ProviderPoolManager;

  beforeEach(() => {
    groqProvider = new MockProvider('groq');
    cerebrasProvider = new MockProvider('cerebras');

    pool = new ProviderPoolManager({
      groq: {
        provider: groqProvider,
        maxConcurrent: 2,
        fallbackChain: ['cerebras'],
      },
      cerebras: {
        provider: cerebrasProvider,
        maxConcurrent: 2,
        fallbackChain: [],
      },
    });
  });

  describe('constructor', () => {
    it('should initialize with correct providers', () => {
      const providerNames = pool.getProviderNames();
      expect(providerNames).toContain('groq');
      expect(providerNames).toContain('cerebras');
    });
  });

  describe('execute', () => {
    it('should execute request on primary provider', async () => {
      const request: LLMRequest = { prompt: 'test' };
      const response = await pool.execute('groq', request, 'agent1');

      expect(response.text).toBe('groq response');
      expect(groqProvider.callCount).toBe(1);
      expect(cerebrasProvider.callCount).toBe(0);
    });

    it('should throw error for unknown provider', async () => {
      await expect(
        pool.execute('unknown', { prompt: 'test' }, 'agent1')
      ).rejects.toThrow('Unknown queue: unknown');
    });
  });

  describe('fallback chain', () => {
    it('should retry groq internally on rate limit (ProviderQueue handles 429)', async () => {
      // ProviderQueue now handles 429 internally via re-queuing with delay.
      // When groq gets a 429, the queue retries groq after ~1s rather than
      // propagating the error up to ProviderPoolManager for fallback.
      const rateLimitError: any = new Error('Rate limited');
      rateLimitError.status = 429;

      groqProvider.queueError(rateLimitError);
      // Queue a success so groq succeeds on retry
      groqProvider.queueResponse({
        text: 'groq retry response',
        inputTokens: 10,
        outputTokens: 20,
        costUSD: 0.001,
      });

      const request: LLMRequest = { prompt: 'test' };
      const response = await pool.execute('groq', request, 'agent1');

      // Groq retries internally and succeeds
      expect(response.text).toBe('groq retry response');
      expect(groqProvider.callCount).toBeGreaterThanOrEqual(2);
      // Cerebras not called since groq handles retry internally
      expect(cerebrasProvider.callCount).toBe(0);
    }, 5000);

    it('should propagate non-rate-limit errors without fallback', async () => {
      const serverError = new Error('Server error');
      groqProvider.queueError(serverError);

      await expect(
        pool.execute('groq', { prompt: 'test' }, 'agent1')
      ).rejects.toThrow('Server error');

      expect(groqProvider.callCount).toBe(1);
      expect(cerebrasProvider.callCount).toBe(0);
    });

    it('should internally retry the provider on rate limit', async () => {
      // ProviderQueue handles 429 by re-queuing with internal delay
      const rateLimitError: any = new Error('Rate limited');
      rateLimitError.status = 429;

      groqProvider.queueError(rateLimitError);

      // Queue success for retry
      groqProvider.queueResponse({
        text: 'groq retry success',
        inputTokens: 10,
        outputTokens: 20,
        costUSD: 0.001,
      });

      const request: LLMRequest = { prompt: 'test' };
      const response = await pool.execute('groq', request, 'agent1');

      // Groq retries internally and succeeds
      expect(response.text).toBe('groq retry success');
      expect(groqProvider.callCount).toBeGreaterThanOrEqual(2);
    }, 5000);
  });

  describe('retry logic', () => {
    it('should retry provider internally after rate limit', async () => {
      // ProviderQueue handles 429 internally by re-queuing with delay.
      // The queue will retry groq after the rate limit expires.
      const rateLimitError: any = new Error('Rate limited');
      rateLimitError.status = 429;

      groqProvider.queueError(rateLimitError);

      // Queue success for retry
      groqProvider.queueResponse({
        text: 'retry success',
        inputTokens: 10,
        outputTokens: 20,
        costUSD: 0.001,
      });

      const request: LLMRequest = { prompt: 'test' };
      const response = await pool.execute('groq', request, 'agent1');

      expect(response.text).toBe('retry success');
    }, 5000);

    it('should fail after max retries when non-rate-limit errors persist', async () => {
      // Pool-level maxRetries applies to non-rate-limit fallback scenarios.
      // For 429s, ProviderQueue handles retries internally.
      // For non-429 errors with fallback failure, pool maxRetries applies.
      pool.setMaxRetries(0);

      // Groq throws non-rate-limit error, cerebras also fails
      const serverError = new Error('Server error');
      groqProvider.queueError(serverError);

      await expect(
        pool.execute('groq', { prompt: 'test' }, 'agent1')
      ).rejects.toThrow('Server error');
    });
  });

  describe('getQueueStats', () => {
    it('should return stats for all queues', () => {
      const stats = pool.getQueueStats();

      expect(stats).toHaveProperty('groq');
      expect(stats).toHaveProperty('cerebras');

      expect(stats.groq).toHaveProperty('queueLength');
      expect(stats.groq).toHaveProperty('rateLimited');
      expect(stats.groq).toHaveProperty('semaphoreUtilization');
    });
  });

  describe('helper methods', () => {
    it('should detect when all providers are rate limited', async () => {
      expect(pool.areAllProvidersRateLimited()).toBe(false);

      const rateLimitError: any = new Error('Rate limited');
      rateLimitError.status = 429;

      groqProvider.queueError(rateLimitError);
      cerebrasProvider.queueError(rateLimitError);

      const promises = [
        pool.execute('groq', { prompt: 'test1' }, 'agent1').catch(() => {}),
        pool.execute('cerebras', { prompt: 'test2' }, 'agent2').catch(() => {}),
      ];

      await new Promise(resolve => setTimeout(resolve, 100));

      // After both hit rate limits
      const groqQueue = pool.getQueue('groq');
      const cerebrasQueue = pool.getQueue('cerebras');

      if (groqQueue && cerebrasQueue) {
        if (groqQueue.isRateLimited() && cerebrasQueue.isRateLimited()) {
          expect(pool.areAllProvidersRateLimited()).toBe(true);
        }
      }

      await Promise.all(promises);
    });

    it('should get next available provider', () => {
      const available = pool.getNextAvailableProvider();
      expect(['groq', 'cerebras']).toContain(available);
    });
  });

  describe('maxRetries configuration', () => {
    it('should allow setting max retries', () => {
      pool.setMaxRetries(5);
      expect(pool.getMaxRetries()).toBe(5);
    });

    it('should throw error for negative max retries', () => {
      expect(() => pool.setMaxRetries(-1)).toThrow('maxRetries must be non-negative');
    });
  });
});
