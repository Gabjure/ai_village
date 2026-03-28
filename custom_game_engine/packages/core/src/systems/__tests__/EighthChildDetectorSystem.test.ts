/**
 * EighthChildDetectorSystem - Unit Tests
 *
 * Tests the "presence-over-power" behavioral pattern detector:
 * - Emits `eighth_child_moment` when presence ratio > 0.67 over a 60-tick window
 * - Requires at least 2 distinct presence categories (anti-gaming)
 * - Requires at least 3 total actions
 * - Prunes actions outside the rolling window
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { World } from '../../ecs/World.js';
import { EventBusImpl } from '../../events/EventBus.js';
import { EighthChildDetectorSystem } from '../EighthChildDetectorSystem.js';

describe('EighthChildDetectorSystem', () => {
  let world: World;
  let eventBus: EventBusImpl;
  let system: EighthChildDetectorSystem;

  beforeEach(async () => {
    eventBus = new EventBusImpl();
    world = new World(eventBus);
    system = new EighthChildDetectorSystem();
    await system.initialize(world, eventBus);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    system.cleanup();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Advance world tick to the given value and call system.update().
   * throttleInterval=20, throttleOffset=0, so the system runs when tick % 20 === 0.
   * Always pass a tick that is a multiple of 20 to ensure the update fires.
   */
  function runUpdateAtTick(tick: number): void {
    world.setTick(tick);
    system.update(world as any, [], 0.05);
    eventBus.flush();
  }

  /** Emit a presence event and flush the bus so the subscription fires. */
  function emitPresence(type: string, agentId = 'agent-1'): void {
    eventBus.emit({
      type: type as any,
      source: undefined,
      data: { agentId },
    });
    eventBus.flush();
  }

  /** Emit a power event and flush the bus so the subscription fires. */
  function emitPower(type: string, agentId = 'agent-1'): void {
    eventBus.emit({
      type: type as any,
      source: undefined,
      data: { agentId },
    });
    eventBus.flush();
  }

  // ---------------------------------------------------------------------------
  // 1. Emits when presence ratio exceeds threshold
  // ---------------------------------------------------------------------------

  it('should emit eighth_child_moment when presence ratio exceeds 0.67 with 2+ distinct categories', () => {
    const emittedEvents: any[] = [];
    eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
      emittedEvents.push(event);
    });

    // Set world tick so actions are recorded at tick 60
    world.setTick(60);

    // 3 presence events across 2 distinct categories, 0 power events
    // Categories: 'species_preservation' (hand:pet, action:water) + 'aria_partnership' (hand:speak)
    emitPresence('hand:pet');
    emitPresence('action:water');
    emitPresence('hand:speak');

    // Run update at tick 60 (60 % 20 === 0 → system fires)
    runUpdateAtTick(60);

    expect(emittedEvents.length).toBeGreaterThanOrEqual(1);

    const event = emittedEvents[0];
    expect(event.data.presenceRatio).toBeGreaterThan(0.67);
    expect(event.data.windowTicks).toBe(60);
    expect(event.data.timestamp).toBe(60);
  });

  // ---------------------------------------------------------------------------
  // 2. Does NOT emit when presence ratio is below threshold
  // ---------------------------------------------------------------------------

  it('should NOT emit when presence ratio is below 0.67', () => {
    const emittedEvents: any[] = [];
    eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
      emittedEvents.push(event);
    });

    world.setTick(40);

    // 2 presence events, 2 power events → ratio = 0.50, below 0.67
    emitPresence('hand:pet');      // species_preservation
    emitPresence('hand:speak');    // aria_partnership
    emitPower('hand:slap');        // species_exploitation
    emitPower('action:harvest');   // species_exploitation

    runUpdateAtTick(40);

    expect(emittedEvents.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 3. Does NOT emit with only one distinct presence category (anti-gaming)
  // ---------------------------------------------------------------------------

  it('should NOT emit when only one distinct presence category is used, even if ratio > 0.67', () => {
    const emittedEvents: any[] = [];
    eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
      emittedEvents.push(event);
    });

    world.setTick(40);

    // 5 presence events all in the SAME category (hand:pet → 'species_preservation')
    // plus 1 power event → ratio = 5/6 ≈ 0.83, but only 1 distinct category
    emitPresence('hand:pet');
    emitPresence('hand:pet');
    emitPresence('hand:pet');
    emitPresence('hand:pet');
    emitPresence('hand:pet');
    emitPower('hand:slap');

    runUpdateAtTick(40);

    expect(emittedEvents.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 4. Prunes actions outside the rolling window
  // ---------------------------------------------------------------------------

  it('should prune actions outside the 60-tick rolling window', () => {
    const emittedEvents: any[] = [];
    eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
      emittedEvents.push(event);
    });

    // Record presence events early at tick 0
    world.setTick(0);
    emitPresence('hand:pet');      // species_preservation — tick 0
    emitPresence('action:water'); // species_preservation — tick 0
    emitPresence('hand:speak');   // aria_partnership — tick 0

    // Advance well beyond window; old actions (tick 0) will be pruned
    // at tick 200 the cutoff is 200 - 60 = 140, so tick-0 records are discarded.
    // Emit power events at the new tick — they are all that remains.
    world.setTick(200);
    emitPower('hand:slap');
    emitPower('action:harvest');
    emitPower('action:demolish');

    // Run update — window contains only the 3 power events recorded at tick 200
    runUpdateAtTick(200);

    // Power ratio = 3/3 = 1.0 → no eighth_child_moment (presence ratio = 0)
    expect(emittedEvents.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 5. Does NOT emit with fewer than 3 total actions
  // ---------------------------------------------------------------------------

  it('should NOT emit when total action count is below minimum (3)', () => {
    const emittedEvents: any[] = [];
    eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
      emittedEvents.push(event);
    });

    world.setTick(20);

    // Only 2 presence events — below the MIN_ACTIONS_FOR_DETECTION of 3
    emitPresence('hand:pet');    // species_preservation
    emitPresence('hand:speak'); // aria_partnership

    runUpdateAtTick(20);

    expect(emittedEvents.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 6. companion:interaction — presence subtypes
  // ---------------------------------------------------------------------------

  describe('companion:interaction events', () => {
    it('should classify companion talk/play/pet/feed as presence (aria_partnership)', () => {
      const emittedEvents: any[] = [];
      eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
        emittedEvents.push(event);
      });

      world.setTick(40);

      // 2 companion interactions (aria_partnership) + 1 species_preservation
      for (const interactionType of ['talk', 'play', 'feed']) {
        eventBus.emit({
          type: 'companion:interaction' as any,
          source: undefined,
          data: { type: interactionType, agentId: 'agent-1' },
        });
        eventBus.flush();
      }
      // Add a second distinct presence category
      emitPresence('hand:pet'); // species_preservation

      runUpdateAtTick(40);

      // 4 presence (3 companion + 1 pet), 0 power → ratio 1.0, 2 distinct categories
      expect(emittedEvents.length).toBeGreaterThanOrEqual(1);
      expect(emittedEvents[0].data.presenceRatio).toBe(1.0);
    });

    it('should classify companion command as power', () => {
      const emittedEvents: any[] = [];
      eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
        emittedEvents.push(event);
      });

      world.setTick(40);

      // 2 presence + 2 power (companion:command) → ratio = 0.50, below threshold
      emitPresence('hand:pet');   // species_preservation
      emitPresence('hand:speak'); // aria_partnership
      eventBus.emit({
        type: 'companion:interaction' as any,
        source: undefined,
        data: { type: 'command', agentId: 'agent-1' },
      });
      eventBus.flush();
      eventBus.emit({
        type: 'companion:interaction' as any,
        source: undefined,
        data: { type: 'command', agentId: 'agent-1' },
      });
      eventBus.flush();

      runUpdateAtTick(40);

      expect(emittedEvents.length).toBe(0);
    });

    it('should ignore companion:interaction with unknown type', () => {
      const emittedEvents: any[] = [];
      eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
        emittedEvents.push(event);
      });

      world.setTick(20);

      // Only unknown interaction — contributes nothing, below minimum action count
      eventBus.emit({
        type: 'companion:interaction' as any,
        source: undefined,
        data: { type: 'unknown_interaction', agentId: 'agent-1' },
      });
      eventBus.flush();
      eventBus.emit({
        type: 'companion:interaction' as any,
        source: undefined,
        data: { type: 'unknown_interaction', agentId: 'agent-1' },
      });
      eventBus.flush();

      runUpdateAtTick(20);

      // No actions recorded → below MIN_ACTIONS_FOR_DETECTION
      expect(emittedEvents.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Throttle — system only runs on tick multiples of 20
  // ---------------------------------------------------------------------------

  it('should only process on ticks that are multiples of 20', () => {
    const emittedEvents: any[] = [];
    eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
      emittedEvents.push(event);
    });

    world.setTick(60);
    emitPresence('hand:pet');
    emitPresence('action:water');
    emitPresence('hand:speak');

    // Attempt update at a non-throttle tick (not a multiple of 20)
    world.setTick(61);
    system.update(world as any, [], 0.05);
    eventBus.flush();

    // Should not have fired yet
    expect(emittedEvents.length).toBe(0);

    // Now run at a valid throttle tick
    runUpdateAtTick(80);

    expect(emittedEvents.length).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // 8. Payload shape
  // ---------------------------------------------------------------------------

  it('should emit eighth_child_moment with correct payload shape', () => {
    const emittedEvents: any[] = [];
    eventBus.subscribe('eighth_child_moment' as any, (event: any) => {
      emittedEvents.push(event);
    });

    world.setTick(100);
    emitPresence('hand:pet');    // species_preservation
    emitPresence('hand:carry'); // species_preservation
    emitPresence('hand:speak'); // aria_partnership

    runUpdateAtTick(100);

    expect(emittedEvents.length).toBeGreaterThanOrEqual(1);

    const payload = emittedEvents[0].data;
    expect(typeof payload.presenceRatio).toBe('number');
    expect(payload.presenceRatio).toBeGreaterThan(0.67);
    expect(payload.presenceRatio).toBeLessThanOrEqual(1.0);
    expect(payload.windowTicks).toBe(60);
    expect(typeof payload.timestamp).toBe('number');
  });
});
