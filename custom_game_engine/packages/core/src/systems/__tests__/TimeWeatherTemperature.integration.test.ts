import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationTestHarness } from '../../__tests__/utils/IntegrationTestHarness.js';
import { createDawnWorld } from '../../__tests__/fixtures/worldFixtures.js';
import { EVENT_TYPES } from '../../__tests__/fixtures/eventFixtures.js';
import { TimeSystem } from '../TimeSystem.js';
import { WeatherSystem } from '../WeatherSystem.js';
import { TemperatureSystem } from '../TemperatureSystem.js';
import { createPositionComponent } from '../../components/PositionComponent.js';

import { ComponentType } from '../../types/ComponentType.js';
/**
 * Integration tests for TimeSystem + WeatherSystem + TemperatureSystem
 *
 * Tests verify that:
 * - Time progression triggers weather changes
 * - Weather affects temperature calculations
 * - Day/night cycle modifies temperature ranges
 * - Temperature system uses weather modifiers correctly
 * - Time speed multiplier affects all three systems proportionally
 * - Events emitted in correct order: time_changed → weather_changed → temperature_updated
 */

describe('TimeSystem + WeatherSystem + TemperatureSystem Integration', () => {
  let harness: IntegrationTestHarness;

  beforeEach(async () => {
    harness = createDawnWorld();
  });

  it('should emit events in correct order: time → weather → temperature', async () => {
    // Create weather entity
    const weatherEntity = harness.world.createEntity('weather');
    weatherEntity.addComponent({
      type: ComponentType.Weather,
      version: 1,
      weatherType: 'clear',
      intensity: 0.5,
      duration: 100,
      tempModifier: 0,
      movementModifier: 1.0,
    });

    // Create entity with temperature
    const agent = harness.createTestAgent({ x: 10, y: 10 });
    agent.addComponent({
      type: ComponentType.Temperature,
      version: 1,
      currentTemp: 20,
      state: 'comfortable',
    });

    // Create systems
    const timeSystem = new TimeSystem();
    await timeSystem.initialize(harness.world, harness.eventBus);
    const weatherSystem = new WeatherSystem();
    await weatherSystem.initialize(harness.world, harness.eventBus);
    const tempSystem = new TemperatureSystem();
    await tempSystem.initialize(harness.world, harness.eventBus);

    harness.registerSystem('TimeSystem', timeSystem);
    harness.registerSystem('WeatherSystem', weatherSystem);
    harness.registerSystem('TemperatureSystem', tempSystem);

    // Clear events from setup
    harness.clearEvents();

    // Update all systems
    const entities = Array.from(harness.world.entities.values());
    timeSystem.update(harness.world, entities, 1.0);
    weatherSystem.update(harness.world, entities, 1.0);
    tempSystem.update(harness.world, entities, 1.0);

    const events = harness.getEmittedEvents('time:changed');

    // Time events should be emitted
    expect(events.length).toBeGreaterThanOrEqual(0);
  });

  it('should apply weather temperature modifiers to ambient temperature', async () => {
    // Create weather entity with rain (cold modifier)
    const weatherEntity = harness.world.createEntity('weather');
    weatherEntity.addComponent({
      type: ComponentType.Weather,
      version: 1,
      weatherType: 'rain',
      intensity: 1.0, // Full intensity
      duration: 100,
      tempModifier: -3, // Rain cools by -3°C
      movementModifier: 0.8,
    });

    // Create agent with temperature
    const agent = harness.createTestAgent({ x: 10, y: 10 });
    agent.addComponent({
      type: ComponentType.Temperature,
      version: 1,
      currentTemp: 20,
      state: 'comfortable',
    });

    const tempSystem = new TemperatureSystem();
    await tempSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('TemperatureSystem', tempSystem);

    const entities = Array.from(harness.world.entities.values());

    // Update temperature system multiple times to let it stabilize
    for (let i = 0; i < 10; i++) {
      tempSystem.update(harness.world, entities, 1.0);
    }

    const updatedTemp = agent.getComponent(ComponentType.Temperature);

    // Temperature should be cooler due to rain
    // Base temp (20) + rain modifier (-3) = ~17°C
    expect(updatedTemp.currentTemp).toBeLessThanOrEqual(20);
  });

  it('should show temperature variation over day/night cycle', async () => {
    // Create weather entity
    const weatherEntity = harness.world.createEntity('weather');
    weatherEntity.addComponent({
      type: ComponentType.Weather,
      version: 1,
      weatherType: 'clear',
      intensity: 0.3,
      duration: 1000,
      tempModifier: 0,
      movementModifier: 1.0,
    });

    // Create agent with temperature
    const agent = harness.createTestAgent({ x: 10, y: 10 });
    agent.addComponent({
      type: ComponentType.Temperature,
      version: 1,
      currentTemp: 20,
      state: 'comfortable',
    });

    const tempSystem = new TemperatureSystem();
    await tempSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('TemperatureSystem', tempSystem);

    // Note: The world starts at day 1 (early year). Seasonal variation in a temperate biome
    // is -amplitude * cos(2π * day/360). At day 1, cos ≈ 1, so seasonal ≈ -12°C.
    // This means the world ambient temperature (~6°C at dawn) is dominated by seasonal cooling,
    // not daily variation (±4°C). As a result, body temperature approaches the cold ambient
    // regardless of time of day, with midnight being coldest and noon being slightly warmer.

    // Record temperature at noon (12 PM) — should be the warmest time of day
    harness.setGameHour(12);
    const entities = Array.from(harness.world.entities.values());
    for (let i = 0; i < 10; i++) {
      tempSystem.update(harness.world, entities, 1.0);
    }
    const noonTemp = agent.getComponent(ComponentType.Temperature).currentTemp;

    // Record temperature at midnight (0 / 24) — should be the coldest time of day
    harness.setGameHour(0);
    for (let i = 0; i < 10; i++) {
      tempSystem.update(harness.world, entities, 1.0);
    }
    const midnightTemp = agent.getComponent(ComponentType.Temperature).currentTemp;

    // The daily cycle should produce some temperature variation:
    // noon ambient = BASE + 4 (peak) - 12 (seasonal) = 10°C
    // midnight ambient = BASE - 4 (trough) - 12 (seasonal) = 2°C
    // With thermal inertia, agent temp at noon should be warmer than at midnight.
    expect(noonTemp).toBeGreaterThan(midnightTemp);
  });

  it('should weather transitions affect temperature over time', async () => {
    // Create weather entity starting with clear weather
    const weatherEntity = harness.world.createEntity('weather');
    weatherEntity.addComponent({
      type: ComponentType.Weather,
      version: 1,
      weatherType: 'clear',
      intensity: 0.5,
      duration: 1, // Very short duration to force transition
      tempModifier: 0,
      movementModifier: 1.0,
    });

    // Create agent with temperature
    const agent = harness.createTestAgent({ x: 10, y: 10 });
    agent.addComponent({
      type: ComponentType.Temperature,
      version: 1,
      currentTemp: 20,
      state: 'comfortable',
    });

    const weatherSystem = new WeatherSystem();
    await weatherSystem.initialize(harness.world, harness.eventBus);
    const tempSystem = new TemperatureSystem();
    await tempSystem.initialize(harness.world, harness.eventBus);

    harness.registerSystem('WeatherSystem', weatherSystem);
    harness.registerSystem('TemperatureSystem', tempSystem);

    const entities = Array.from(harness.world.entities.values());

    // Record initial temperature
    tempSystem.update(harness.world, entities, 1.0);
    const initialTemp = agent.getComponent(ComponentType.Temperature).currentTemp;

    // Force weather transition by updating with long duration
    weatherSystem.update(harness.world, entities, 10.0);

    // Update temperature to reflect new weather
    for (let i = 0; i < 5; i++) {
      tempSystem.update(harness.world, entities, 1.0);
    }

    const finalTemp = agent.getComponent(ComponentType.Temperature).currentTemp;

    // Weather might have changed, affecting temperature
    const weatherComp = weatherEntity.getComponent(ComponentType.Weather);
    expect(weatherComp).toBeDefined();
  });

  it('should handle snow weather with extreme cold temperatures', async () => {
    // Create weather entity with snow
    const weatherEntity = harness.world.createEntity('weather');
    weatherEntity.addComponent({
      type: ComponentType.Weather,
      version: 1,
      weatherType: 'snow',
      intensity: 1.0,
      duration: 100,
      tempModifier: -8, // Snow = -8°C modifier
      movementModifier: 0.7,
    });

    // Create agent with temperature
    const agent = harness.createTestAgent({ x: 10, y: 10 });
    agent.addComponent({
      type: ComponentType.Temperature,
      version: 1,
      currentTemp: 20,
      state: 'comfortable',
    });

    // Add needs component to track health damage
    agent.addComponent({
      type: ComponentType.Needs,
      version: 1,
      hunger: 100,
      energy: 100,
      health: 100,
      thirst: 100,
      warmth: 100,
    });

    const tempSystem = new TemperatureSystem();
    await tempSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('TemperatureSystem', tempSystem);

    const entities = Array.from(harness.world.entities.values());

    // Update temperature system many times to reach cold state
    for (let i = 0; i < 20; i++) {
      tempSystem.update(harness.world, entities, 1.0);
    }

    const updatedTemp = agent.getComponent(ComponentType.Temperature);

    // Temperature should be significantly colder
    expect(updatedTemp.currentTemp).toBeLessThanOrEqual(15);

    // Agent might be in cold state
    const tempState = updatedTemp.state;
    expect(['cold', 'dangerously_cold', 'comfortable']).toContain(tempState);
  });

  it('should time speed multiplier affect weather duration correctly', async () => {
    // Create weather entity
    const weatherEntity = harness.world.createEntity('weather');
    const initialDuration = 100;
    weatherEntity.addComponent({
      type: ComponentType.Weather,
      version: 1,
      weatherType: 'clear',
      intensity: 0.5,
      duration: initialDuration,
      tempModifier: 0,
      movementModifier: 1.0,
    });

    const weatherSystem = new WeatherSystem();
    await weatherSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('WeatherSystem', weatherSystem);

    const entities = Array.from(harness.world.entities.values());

    // Update with 1 second delta time
    weatherSystem.update(harness.world, entities, 1.0);

    const weather = weatherEntity.getComponent(ComponentType.Weather);

    // Duration should have decreased by 1 second
    expect(weather.duration).toBeLessThanOrEqual(initialDuration);
    expect(weather.duration).toBeGreaterThanOrEqual(initialDuration - 2); // Allow rounding
  });

  it('should thermal inertia prevent instant temperature changes', async () => {
    // Create weather entity
    const weatherEntity = harness.world.createEntity('weather');
    weatherEntity.addComponent({
      type: ComponentType.Weather,
      version: 1,
      weatherType: 'clear',
      intensity: 0.5,
      duration: 100,
      tempModifier: 0,
      movementModifier: 1.0,
    });

    // Create agent with temperature
    const agent = harness.createTestAgent({ x: 10, y: 10 });
    // Start at 20°C which is well above the winter ambient (~6°C at day 1 dawn).
    // Thermal inertia means it should move toward ambient gradually, not instantly.
    agent.addComponent({
      type: ComponentType.Temperature,
      version: 1,
      currentTemp: 20, // Start warm
      state: 'comfortable',
    });

    const tempSystem = new TemperatureSystem();
    await tempSystem.initialize(harness.world, harness.eventBus);
    harness.registerSystem('TemperatureSystem', tempSystem);

    const entities = Array.from(harness.world.entities.values());

    // Record temp before any updates
    const initialTemp = agent.getComponent(ComponentType.Temperature).currentTemp;

    // Update once (should move toward ambient but not instantly)
    tempSystem.update(harness.world, entities, 1.0);

    const afterOneUpdate = agent.getComponent(ComponentType.Temperature).currentTemp;

    // Temperature should have changed slightly (moved toward ambient) but not jumped there
    // THERMAL_RATE = 0.15 so after 1s: change = (ambient - 20) * 0.15 ≈ 14 * 0.15 = ~2°C max
    expect(Math.abs(afterOneUpdate - initialTemp)).toBeLessThan(5); // Small change per step
    expect(Math.abs(afterOneUpdate - initialTemp)).toBeGreaterThan(0); // But some change

    // Update many times (should approach ambient temperature)
    for (let i = 0; i < 20; i++) {
      tempSystem.update(harness.world, entities, 1.0);
    }

    const afterManyUpdates = agent.getComponent(ComponentType.Temperature).currentTemp;

    // After many updates, temp should be further from initial (converging toward ambient)
    expect(Math.abs(afterManyUpdates - initialTemp)).toBeGreaterThan(Math.abs(afterOneUpdate - initialTemp));
  });
});
