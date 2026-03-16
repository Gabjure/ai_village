import { describe, it, expect, beforeEach } from 'vitest';
import { GameSessionManager } from '../GameSessionManager.js';
import { CooldownCalculator, DEFAULT_RATE_LIMITS } from '../CooldownCalculator.js';

describe('GameSessionManager', () => {
  let manager: GameSessionManager;

  beforeEach(() => {
    manager = new GameSessionManager();
  });

  it('should register and track sessions', () => {
    manager.registerSession('session1');
    expect(manager.hasSession('session1')).toBe(true);
    expect(manager.getActiveSessionCount()).toBe(1);
  });

  it('should update heartbeat', async () => {
    manager.registerSession('session1');
    const session = manager.getSession('session1')!;
    const oldHeartbeat = session.lastHeartbeat;

    await new Promise(resolve => setTimeout(resolve, 10));
    manager.heartbeat('session1');
    const newHeartbeat = session.lastHeartbeat;
    expect(newHeartbeat).toBeGreaterThan(oldHeartbeat);
  });

  it('should record requests', () => {
    manager.registerSession('session1');
    manager.recordRequest('session1');
    manager.recordRequest('session1');

    const session = manager.getSession('session1')!;
    expect(session.requestCount).toBe(2);
    expect(session.lastRequestTime).toBeGreaterThan(0);
  });

  it('should cleanup stale sessions', (done) => {
    const shortTimeout = new GameSessionManager(100); // 100ms timeout
    shortTimeout.registerSession('session1');

    expect(shortTimeout.getActiveSessionCount()).toBe(1);

    setTimeout(() => {
      const count = shortTimeout.getActiveSessionCount();
      expect(count).toBe(0);
      done();
    }, 150);
  });

  it('should get stats', async () => {
    manager.registerSession('session1');
    manager.registerSession('session2');
    manager.recordRequest('session1');
    manager.recordRequest('session2');
    manager.recordRequest('session2');

    // Small delay to ensure connectedAt differs from now
    await new Promise(resolve => setTimeout(resolve, 5));

    const stats = manager.getStats();
    expect(stats.totalSessions).toBe(2);
    expect(stats.averageRequestsPerSession).toBe(1.5);
    expect(stats.oldestSessionAge).toBeGreaterThanOrEqual(0);
  });
});

describe('CooldownCalculator', () => {
  let sessionManager: GameSessionManager;
  let calculator: CooldownCalculator;

  beforeEach(() => {
    sessionManager = new GameSessionManager();
    calculator = new CooldownCalculator(sessionManager, DEFAULT_RATE_LIMITS);
  });

  it('should calculate cooldown based on active games', () => {
    // Per-session cooldowns are disabled - queue's maxConcurrent handles rate limiting.
    // Multiple agents in the same session should NOT wait for each other.
    sessionManager.registerSession('session1');
    const cooldown1 = calculator.calculateCooldown('groq');
    expect(cooldown1).toBe(0);

    sessionManager.registerSession('session2');
    sessionManager.registerSession('session3');
    sessionManager.registerSession('session4');
    const cooldown4 = calculator.calculateCooldown('groq');
    expect(cooldown4).toBe(0);
  });

  it('should return 0 cooldown for no games', () => {
    const cooldown = calculator.calculateCooldown('groq');
    expect(cooldown).toBe(0);
  });

  it('should calculate next allowed time', () => {
    sessionManager.registerSession('session1');
    sessionManager.recordRequest('session1');

    const nextAllowed = calculator.calculateNextAllowedTime('session1', 'groq');
    const cooldown = calculator.calculateCooldown('groq');

    const session = sessionManager.getSession('session1')!;
    const expected = session.lastRequestTime + cooldown;

    expect(nextAllowed).toBeGreaterThanOrEqual(expected - 100);
    expect(nextAllowed).toBeLessThanOrEqual(expected + 100);
  });

  it('should check if can request now', () => {
    sessionManager.registerSession('session1');

    // Can request immediately (no prior requests)
    expect(calculator.canRequestNow('session1', 'groq')).toBe(true);

    // Record request - cooldown is disabled so can still request immediately
    sessionManager.recordRequest('session1');

    // With disabled cooldowns, can always request immediately
    expect(calculator.canRequestNow('session1', 'groq')).toBe(true);
  });

  it('should get cooldown status', () => {
    sessionManager.registerSession('session1');
    sessionManager.recordRequest('session1');

    const status = calculator.getCooldownStatus('session1', 'groq');

    expect(status).toHaveProperty('canRequest');
    expect(status).toHaveProperty('waitMs');
    expect(status).toHaveProperty('nextAllowedAt');

    // Cooldowns are disabled - always can request
    expect(status.canRequest).toBe(true);
    expect(status.waitMs).toBe(0);
  });

  it('should support custom API key rate limits', () => {
    const customKeyHash = 'custom-key-123';

    calculator.setCustomRateLimit(customKeyHash, {
      requestsPerMinute: 60,
      burstSize: 10,
    });

    sessionManager.registerSession('session1');

    // Cooldowns are disabled - both return 0 regardless of rate limits
    const groqCooldown = calculator.calculateCooldown('groq');
    const customCooldown = calculator.calculateCooldown('groq', customKeyHash);

    expect(groqCooldown).toBe(0);
    expect(customCooldown).toBe(0);
  });
});
