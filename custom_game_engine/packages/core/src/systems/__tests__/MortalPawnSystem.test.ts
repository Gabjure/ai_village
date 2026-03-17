import { describe, it, expect, beforeEach } from 'vitest';
import { MortalPawnSystem } from '../MortalPawnSystem.js';
import { World } from '../../ecs/World.js';
import { EntityImpl } from '../../ecs/Entity.js';
import { EventBusImpl } from '../../events/EventBus.js';

describe('MortalPawnSystem', () => {
  let system: MortalPawnSystem;
  let world: World;
  let eventBus: EventBusImpl;
  let playerEntity: EntityImpl;
  let agentEntity: EntityImpl;

  beforeEach(async () => {
    system = new MortalPawnSystem();
    eventBus = new EventBusImpl();
    world = new World(eventBus);
    await system.initialize(world, eventBus);

    playerEntity = world.createEntity() as EntityImpl;
    (playerEntity as EntityImpl).addComponent({
      type: 'player_control',
      version: 1,
      isPossessed: false,
      possessedAgentId: null,
      possessionStartTick: 0,
      beliefCostPerTick: 0.1,
      totalBeliefSpent: 0,
      inputMode: 'god',
      possessionMode: 'deity',
      lastInputTick: 0,
      movementCommand: null,
      pendingInteraction: null,
    });

    agentEntity = world.createEntity() as EntityImpl;
    (agentEntity as EntityImpl).addComponent({
      type: 'agent',
      version: 1,
      behavior: 'idle',
      behaviorState: {},
      name: 'TestAgent',
    });
    (agentEntity as EntityImpl).addComponent({
      type: 'needs',
      version: 1,
      health: 100,
      hunger: 50,
      energy: 50,
      social: 50,
      comfort: 50,
    });
    (agentEntity as EntityImpl).addComponent({
      type: 'identity',
      version: 1,
      name: 'TestAgent',
    });
  });

  describe('jackIn', () => {
    it('should succeed and set possession state correctly', () => {
      const result = system.jackIn(playerEntity, agentEntity, world);

      expect(result.success).toBe(true);

      const playerControl = playerEntity.getComponent<Record<string, unknown>>('player_control');
      expect(playerControl).toBeDefined();
      expect(playerControl!.isPossessed).toBe(true);
      expect(playerControl!.possessedAgentId).toBe(agentEntity.id);
      expect(playerControl!.possessionMode).toBe('mortal');
      expect(playerControl!.inputMode).toBe('possessed');

      const agent = agentEntity.getComponent<Record<string, unknown>>('agent');
      expect(agent).toBeDefined();
      expect(agent!.behavior).toBe('player_controlled');
    });

    it('should fail when player is already possessing another agent', () => {
      const playerControl = playerEntity.getComponent<Record<string, unknown>>('player_control');
      if (!playerControl) throw new Error('Missing player_control component');
      playerControl.isPossessed = true;
      playerControl.possessionMode = 'mortal';

      const result = system.jackIn(playerEntity, agentEntity, world);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Already possessing another agent');
    });

    it('should fail when target agent is dead', () => {
      const needs = agentEntity.getComponent<Record<string, unknown>>('needs');
      if (!needs) throw new Error('Missing needs component');
      needs.health = 0;

      const result = system.jackIn(playerEntity, agentEntity, world);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Cannot possess dead agent');
    });
  });

  describe('jackOut', () => {
    it('should restore agent and player state after jack-in', () => {
      system.jackIn(playerEntity, agentEntity, world);
      system.jackOut(playerEntity, world);

      const playerControl = playerEntity.getComponent<Record<string, unknown>>('player_control');
      expect(playerControl).toBeDefined();
      expect(playerControl!.isPossessed).toBe(false);
      expect(playerControl!.possessionMode).toBe('deity');
      expect(playerControl!.inputMode).toBe('god');

      const agent = agentEntity.getComponent<Record<string, unknown>>('agent');
      expect(agent).toBeDefined();
      expect(agent!.behavior).toBe('idle');
      expect(agent!.behaviorState).toEqual({});
    });
  });

  describe('onUpdate', () => {
    it('should force jack-out when possessed agent dies', () => {
      system.jackIn(playerEntity, agentEntity, world);

      // Kill the agent
      const needs = agentEntity.getComponent<Record<string, unknown>>('needs');
      if (!needs) throw new Error('Missing needs component');
      needs.health = 0;

      // Trigger system update
      system.update(world, [playerEntity, agentEntity], 0);

      const playerControl = playerEntity.getComponent<Record<string, unknown>>('player_control');
      expect(playerControl).toBeDefined();
      expect(playerControl!.isPossessed).toBe(false);
      expect(playerControl!.possessionMode).toBe('deity');
      expect(playerControl!.inputMode).toBe('god');
    });
  });

  describe('isInMortalMode', () => {
    it('should return false before jack-in', () => {
      expect(system.isInMortalMode(world)).toBe(false);
    });

    it('should return true after jack-in', () => {
      system.jackIn(playerEntity, agentEntity, world);
      expect(system.isInMortalMode(world)).toBe(true);
    });

    it('should return false after jack-out', () => {
      system.jackIn(playerEntity, agentEntity, world);
      system.jackOut(playerEntity, world);
      expect(system.isInMortalMode(world)).toBe(false);
    });
  });

  describe('getPossessedAgent', () => {
    it('should return null before jack-in', () => {
      expect(system.getPossessedAgent(world)).toBeNull();
    });

    it('should return the possessed agent entity after jack-in', () => {
      system.jackIn(playerEntity, agentEntity, world);
      const possessed = system.getPossessedAgent(world);
      expect(possessed).not.toBeNull();
      expect(possessed!.id).toBe(agentEntity.id);
    });

    it('should return null after jack-out', () => {
      system.jackIn(playerEntity, agentEntity, world);
      system.jackOut(playerEntity, world);
      expect(system.getPossessedAgent(world)).toBeNull();
    });
  });
});
