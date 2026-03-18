import type { LLMProvider, LLMRequest, LLMResponse, ProviderPricing } from './LLMProvider.js';

/**
 * Lightweight LLM provider that routes requests through the same-origin
 * `/api/llm/chat` endpoint instead of calling LLM APIs directly from the
 * browser. API keys are injected server-side (Vite dev middleware or
 * production.ts), so no key is ever exposed to the client.
 */
export class SameOriginChatProxy implements LLMProvider {
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly pathPrefix: string;
  private readonly generateTimeout = 30000; // 30 seconds
  private readonly availabilityTimeout = 5000; // 5 seconds

  /**
   * @param model - LLM model name (e.g. 'qwen-3-32b')
   * @param baseUrl - Provider API base (e.g. 'https://api.cerebras.ai/v1')
   * @param pathPrefix - URL prefix for proxy endpoints (e.g. '/mvee' in production, '' in dev)
   */
  constructor(model: string, baseUrl: string, pathPrefix: string = '') {
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.pathPrefix = pathPrefix.replace(/\/$/, '');
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.generateTimeout);

    let data: any;
    try {
      const response = await fetch(`${this.pathPrefix}/api/llm/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: this.baseUrl,
          model: this.model,
          messages: [{ role: 'user', content: request.prompt }],
          max_tokens: request.maxTokens,
          temperature: request.temperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`/api/llm/chat responded with HTTP ${response.status}`);
      }

      data = await response.json();
    } finally {
      clearTimeout(timer);
    }

    const text: string = data.choices[0].message.content;
    const inputTokens: number = data.usage.prompt_tokens;
    const outputTokens: number = data.usage.completion_tokens;
    const pricing = this.getPricing();
    const costUSD =
      (inputTokens / 1_000_000) * pricing.inputCostPer1M +
      (outputTokens / 1_000_000) * pricing.outputCostPer1M;

    return {
      text,
      inputTokens,
      outputTokens,
      tokensUsed: inputTokens + outputTokens,
      costUSD,
    };
  }

  async isAvailable(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.availabilityTimeout);

    try {
      const url = `${this.pathPrefix}/api/llm/check-availability?baseUrl=${encodeURIComponent(this.baseUrl)}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return Boolean(data.available);
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  getModelName(): string {
    return this.model;
  }

  getProviderId(): string {
    return 'same-origin-proxy';
  }

  getPricing(): ProviderPricing {
    // Pricing is unknown because the server may route to any backend.
    // Return zeros so cost calculations don't crash.
    return {
      providerId: 'same-origin-proxy',
      providerName: 'Same-Origin Chat Proxy',
      inputCostPer1M: 0,
      outputCostPer1M: 0,
    };
  }
}
