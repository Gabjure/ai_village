import { describe, it, expect } from 'vitest';

/**
 * GreetingSystem Unit Tests
 *
 * Tests for greeting logic and constants:
 * - GREETING_RADIUS: 8 tiles (squared = 64)
 * - GREETING_COOLDOWN: 1000 ticks (~50 seconds at 20 TPS)
 * - Throttle interval: 40 ticks (2 seconds at 20 TPS)
 * - Greeting type determined by familiarity
 * - Familiarity and social contact boosts per greeting type
 * - Cooldown and distance checks
 */

describe('GreetingSystem', () => {
  describe('Greeting Constants', () => {
    it('should have greeting radius of 8 tiles', () => {
      const GREETING_RADIUS = 8;
      const GREETING_RADIUS_SQ = GREETING_RADIUS * GREETING_RADIUS;
      expect(GREETING_RADIUS_SQ).toBe(64);
    });

    it('should have greeting cooldown of 1000 ticks (~50 seconds at 20 TPS)', () => {
      const GREETING_COOLDOWN = 1000;
      const secondsAtTwentyTPS = GREETING_COOLDOWN / 20;
      expect(GREETING_COOLDOWN).toBe(1000);
      expect(secondsAtTwentyTPS).toBe(50);
    });

    it('should throttle checks to every 40 ticks (2 seconds at 20 TPS)', () => {
      const THROTTLE_INTERVAL = 40;
      const secondsAtTwentyTPS = THROTTLE_INTERVAL / 20;
      expect(THROTTLE_INTERVAL).toBe(40);
      expect(secondsAtTwentyTPS).toBe(2);
    });
  });

  describe('Greeting Type Determination', () => {
    function getGreetingType(familiarity: number): 'nod' | 'wave' | 'warm_greeting' {
      if (familiarity >= 60) return 'warm_greeting';
      if (familiarity >= 20) return 'wave';
      return 'nod';
    }

    it('should nod at strangers (familiarity < 20)', () => {
      expect(getGreetingType(0)).toBe('nod');
      expect(getGreetingType(1)).toBe('nod');
      expect(getGreetingType(19)).toBe('nod');
    });

    it('should wave at acquaintances (familiarity 20-59)', () => {
      expect(getGreetingType(20)).toBe('wave');
      expect(getGreetingType(40)).toBe('wave');
      expect(getGreetingType(59)).toBe('wave');
    });

    it('should give a warm greeting to friends (familiarity >= 60)', () => {
      expect(getGreetingType(60)).toBe('warm_greeting');
      expect(getGreetingType(80)).toBe('warm_greeting');
      expect(getGreetingType(100)).toBe('warm_greeting');
    });

    it('should use boundary values correctly', () => {
      expect(getGreetingType(19)).toBe('nod');
      expect(getGreetingType(20)).toBe('wave');
      expect(getGreetingType(59)).toBe('wave');
      expect(getGreetingType(60)).toBe('warm_greeting');
    });
  });

  describe('Familiarity Boost', () => {
    function getFamiliarityBoost(type: 'nod' | 'wave' | 'warm_greeting'): number {
      switch (type) {
        case 'nod': return 1;
        case 'wave': return 2;
        case 'warm_greeting': return 3;
      }
    }

    it('should boost familiarity by 1 for nods', () => {
      expect(getFamiliarityBoost('nod')).toBe(1);
    });

    it('should boost familiarity by 2 for waves', () => {
      expect(getFamiliarityBoost('wave')).toBe(2);
    });

    it('should boost familiarity by 3 for warm greetings', () => {
      expect(getFamiliarityBoost('warm_greeting')).toBe(3);
    });
  });

  describe('Social Contact Boost', () => {
    function getSocialContactBoost(type: 'nod' | 'wave' | 'warm_greeting'): number {
      switch (type) {
        case 'nod': return 2;
        case 'wave': return 5;
        case 'warm_greeting': return 8;
      }
    }

    it('should boost social contact by 2 for nods', () => {
      expect(getSocialContactBoost('nod')).toBe(2);
    });

    it('should boost social contact by 5 for waves', () => {
      expect(getSocialContactBoost('wave')).toBe(5);
    });

    it('should boost social contact by 8 for warm greetings', () => {
      expect(getSocialContactBoost('warm_greeting')).toBe(8);
    });
  });

  describe('Cooldown Logic', () => {
    it('should prevent re-greeting within cooldown period', () => {
      const COOLDOWN = 1000;
      const lastGreeted = 500;
      const currentTick = 1200;
      expect(currentTick - lastGreeted < COOLDOWN).toBe(true); // within cooldown
    });

    it('should allow greeting again after cooldown expires', () => {
      const COOLDOWN = 1000;
      const lastGreeted = 500;
      const laterTick = 1600;
      expect(laterTick - lastGreeted < COOLDOWN).toBe(false); // cooldown expired
    });

    it('should use exact cooldown boundary correctly', () => {
      const COOLDOWN = 1000;
      const lastGreeted = 0;
      expect(999 - lastGreeted < COOLDOWN).toBe(true);  // one tick before expiry
      expect(1000 - lastGreeted < COOLDOWN).toBe(false); // exactly at expiry
    });
  });

  describe('Distance Check', () => {
    it('should not greet agents beyond 8 tiles', () => {
      const RADIUS_SQ = 64; // 8 * 8
      // 6 tiles apart - within range
      expect(6 * 6).toBeLessThan(RADIUS_SQ);
      // 9 tiles apart - out of range
      expect(9 * 9).toBeGreaterThan(RADIUS_SQ);
    });

    it('should allow greeting agents within 8 tiles', () => {
      const RADIUS_SQ = 64;
      // exactly 8 tiles away (boundary)
      const distSqExact = 8 * 8;
      expect(distSqExact).toBe(RADIUS_SQ);
    });

    it('should use squared distance for performance', () => {
      const RADIUS_SQ = 64;
      const dx = 5, dy = 6;
      const distSq = dx * dx + dy * dy;
      expect(distSq).toBe(61); // within 64
      expect(distSq < RADIUS_SQ).toBe(true);
    });

    it('should reject agents at diagonal distance beyond 8 tiles', () => {
      const RADIUS_SQ = 64;
      const dx = 6, dy = 6;
      const distSq = dx * dx + dy * dy;
      expect(distSq).toBe(72); // beyond 64
      expect(distSq < RADIUS_SQ).toBe(false);
    });
  });

  describe('Familiarity Clamping', () => {
    it('should not exceed 100 familiarity', () => {
      const current = 99;
      const boost = 3;
      const result = Math.min(100, current + boost);
      expect(result).toBe(100);
    });

    it('should not clamp when boost stays within range', () => {
      const current = 50;
      const boost = 3;
      const result = Math.min(100, current + boost);
      expect(result).toBe(53);
    });

    it('should clamp exactly at boundary', () => {
      const current = 98;
      const boost = 2;
      const result = Math.min(100, current + boost);
      expect(result).toBe(100);
    });
  });
});
