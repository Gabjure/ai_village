import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAICompatProvider, LLMAuthError } from '../OpenAICompatProvider';
import { FallbackProvider } from '../FallbackProvider';
import type { LLMProvider, LLMRequest, LLMResponse } from '../LLMProvider';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeOkResponse(content: string = 'idle') {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ thinking: 'ok', speaking: '', action: content }), tool_calls: [] } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    }),
  };
}

function make401Response(body: string = 'Invalid API key') {
  return {
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    text: async () => body,
  };
}

function make403Response(body: string = 'Forbidden') {
  return {
    ok: false,
    status: 403,
    statusText: 'Forbidden',
    text: async () => body,
  };
}

describe('LLMAuthError', () => {
  it('has correct properties', () => {
    const err = new LLMAuthError('groq', 401, 'Invalid API key');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(LLMAuthError);
    expect(err.name).toBe('LLMAuthError');
    expect(err.statusCode).toBe(401);
    expect(err.providerId).toBe('groq');
    expect(err.message).toContain('groq');
    expect(err.message).toContain('401');
  });
});

describe('OpenAICompatProvider - 401 auto-recovery', () => {
  let provider: OpenAICompatProvider;

  beforeEach(() => {
    provider = new OpenAICompatProvider('test-model', 'https://api.test.com/v1', 'bad-key');
    vi.clearAllMocks();
  });

  it('throws LLMAuthError on 401 response', async () => {
    // Provide multiple 401 responses to cover capability discovery + actual generate
    mockFetch.mockResolvedValue(make401Response());

    await expect(provider.generate({ prompt: 'test' }))
      .rejects
      .toThrow(LLMAuthError);

    mockFetch.mockReset();
  });

  it('throws LLMAuthError on 403 response', async () => {
    mockFetch.mockResolvedValue(make403Response());

    await expect(provider.generate({ prompt: 'test' }))
      .rejects
      .toThrow(LLMAuthError);

    mockFetch.mockReset();
  });

  it('includes provider ID and status in LLMAuthError', async () => {
    mockFetch.mockResolvedValue(make401Response('key expired'));

    try {
      await provider.generate({ prompt: 'test' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LLMAuthError);
      const authErr = err as LLMAuthError;
      expect(authErr.statusCode).toBe(401);
      expect(authErr.message).toContain('key expired');
    }

    mockFetch.mockReset();
  });

  it('does not throw LLMAuthError on 400 (tool calling fallback)', async () => {
    // 400 should fall through to text-based parsing, not auth error
    // Use mockResolvedValue for discovery calls, then override with specific sequence
    mockFetch
      .mockResolvedValueOnce(makeOkResponse()) // capability discovery
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'tool calling not supported',
      })
      // The generateWithoutTools retry
      .mockResolvedValueOnce(makeOkResponse());

    const response = await provider.generate({ prompt: 'test' });
    expect(response).toBeDefined();

    mockFetch.mockReset();
  });

  it('does not throw LLMAuthError on 500', async () => {
    // Use mockResolvedValue so it covers both capability discovery and generate calls
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'server error',
    });

    await expect(provider.generate({ prompt: 'test' }))
      .rejects
      .toThrow('API error: 500');

    mockFetch.mockReset();
  });
});

describe('FallbackProvider - 401 auto-recovery', () => {
  function makeMockProvider(id: string, shouldFail: boolean, authFail: boolean = false): LLMProvider {
    return {
      getProviderId: () => id,
      getModelName: () => 'test-model',
      isAvailable: async () => !shouldFail,
      getPricing: () => ({ providerId: id, providerName: id, inputCostPer1M: 0, outputCostPer1M: 0 }),
      generate: authFail
        ? vi.fn().mockRejectedValue(new LLMAuthError(id, 401, 'Invalid key'))
        : shouldFail
          ? vi.fn().mockRejectedValue(new Error('generic failure'))
          : vi.fn().mockResolvedValue({
              text: 'ok',
              inputTokens: 10,
              outputTokens: 5,
              costUSD: 0,
            } as LLMResponse),
    };
  }

  it('immediately disables provider on auth error and falls back to next', async () => {
    const badAuth = makeMockProvider('groq', false, true);
    const healthy = makeMockProvider('openrouter', false);

    const fallback = new FallbackProvider([badAuth, healthy], { logFallbacks: false });

    const response = await fallback.generate({ prompt: 'test' });
    expect(response.text).toBe('ok');

    // groq should have been called once, then immediately disabled
    expect(badAuth.generate).toHaveBeenCalledTimes(1);
    expect(healthy.generate).toHaveBeenCalledTimes(1);

    // groq should now be disabled in status
    const statuses = fallback.getProviderStatus();
    const groqStatus = statuses.find(s => s.providerId === 'groq');
    expect(groqStatus?.healthy).toBe(false);
  });

  it('disables auth-failed provider on first failure (not after maxConsecutiveFailures)', async () => {
    const badAuth = makeMockProvider('groq', false, true);
    const healthy = makeMockProvider('openrouter', false);

    const fallback = new FallbackProvider([badAuth, healthy], {
      maxConsecutiveFailures: 5, // Normally takes 5 failures — but auth should be instant
      logFallbacks: false,
    });

    await fallback.generate({ prompt: 'test' });

    // Second request should NOT retry groq — it should go straight to openrouter
    await fallback.generate({ prompt: 'test2' });

    expect(badAuth.generate).toHaveBeenCalledTimes(1); // Only the first attempt
    expect(healthy.generate).toHaveBeenCalledTimes(2); // Both requests
  });

  it('throws if all providers have auth errors', async () => {
    const bad1 = makeMockProvider('groq', false, true);
    const bad2 = makeMockProvider('openrouter', false, true);

    const fallback = new FallbackProvider([bad1, bad2], { logFallbacks: false });

    await expect(fallback.generate({ prompt: 'test' }))
      .rejects
      .toThrow('All LLM providers failed');
  });

  it('does not immediately disable on generic errors', async () => {
    const flaky = makeMockProvider('groq', true);
    const healthy = makeMockProvider('openrouter', false);

    const fallback = new FallbackProvider([flaky, healthy], {
      maxConsecutiveFailures: 3,
      logFallbacks: false,
    });

    await fallback.generate({ prompt: 'test' });

    // groq should still be considered healthy (only 1 failure, needs 3 to disable)
    const statuses = fallback.getProviderStatus();
    const groqStatus = statuses.find(s => s.providerId === 'groq');
    expect(groqStatus?.healthy).toBe(true);
    expect(groqStatus?.failureCount).toBe(1);
  });
});
