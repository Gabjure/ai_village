/**
 * Structure-of-Arrays (SoA) component storage for cache-efficient batch processing.
 *
 * Traditional Array-of-Structures (AoS) layout:
 * ```
 * positions = [
 *   { type: 'position', x: 1, y: 2, z: 0 },
 *   { type: 'position', x: 5, y: 7, z: 0 },
 *   ...
 * ]
 * ```
 *
 * SoA layout (this file):
 * ```
 * positions = {
 *   xs: [1, 5, ...],
 *   ys: [2, 7, ...],
 *   zs: [0, 0, ...],
 *   entityIds: ['id1', 'id2', ...]
 * }
 * ```
 *
 * Benefits:
 * - Better cache locality (sequential memory access)
 * - SIMD potential (process 4-8 elements at once)
 * - Smaller memory footprint (no object overhead)
 * - 1.5-2x speedup for batch operations
 *
 * Usage:
 * 1. SoASyncSystem keeps this in sync with component changes
 * 2. Systems can use getArrays() for batch processing
 * 3. Individual access via get/set for compatibility
 */

/**
 * Structure-of-Arrays storage for Position components.
 *
 * Stores position data in parallel typed arrays for cache-efficient batch processing.
 * Automatically grows capacity when needed (1.5x growth factor).
 */
export class PositionSoA {
  private xs: Float32Array;
  private ys: Float32Array;
  private zs: Float32Array;
  private chunkXs: Int32Array;
  private chunkYs: Int32Array;
  private entityIds: string[];
  private entityIndexMap: Map<string, number>;
  private capacity: number;
  private count: number = 0;

  constructor(initialCapacity: number = 1000) {
    this.capacity = initialCapacity;
    this.xs = new Float32Array(initialCapacity);
    this.ys = new Float32Array(initialCapacity);
    this.zs = new Float32Array(initialCapacity);
    this.chunkXs = new Int32Array(initialCapacity);
    this.chunkYs = new Int32Array(initialCapacity);
    this.entityIds = new Array(initialCapacity);
    this.entityIndexMap = new Map();
  }

  /**
   * Add a position component.
   * @returns Index where the position was stored
   */
  add(
    entityId: string,
    x: number,
    y: number,
    z: number = 0,
    chunkX: number,
    chunkY: number
  ): number {
    if (this.count >= this.capacity) {
      this.grow();
    }

    const index = this.count;
    this.xs[index] = x;
    this.ys[index] = y;
    this.zs[index] = z;
    this.chunkXs[index] = chunkX;
    this.chunkYs[index] = chunkY;
    this.entityIds[index] = entityId;
    this.entityIndexMap.set(entityId, index);
    this.count++;

    return index;
  }

  /**
   * Get position for entity.
   * @returns Position data or null if not found
   */
  get(
    entityId: string
  ): { x: number; y: number; z: number; chunkX: number; chunkY: number } | null {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return null;

    return {
      x: this.xs[index]!,
      y: this.ys[index]!,
      z: this.zs[index]!,
      chunkX: this.chunkXs[index]!,
      chunkY: this.chunkYs[index]!,
    };
  }

  /**
   * Update position for entity.
   * @returns true if updated, false if entity not found
   */
  set(
    entityId: string,
    x: number,
    y: number,
    z?: number,
    chunkX?: number,
    chunkY?: number
  ): boolean {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return false;

    this.xs[index] = x;
    this.ys[index] = y;
    if (z !== undefined) {
      this.zs[index] = z;
    }
    if (chunkX !== undefined) {
      this.chunkXs[index] = chunkX;
    }
    if (chunkY !== undefined) {
      this.chunkYs[index] = chunkY;
    }

    return true;
  }

  /**
   * Remove position for entity.
   * Uses swap-remove for O(1) deletion.
   * @returns true if removed, false if entity not found
   */
  remove(entityId: string): boolean {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return false;

    // Swap with last element (faster than shifting)
    const lastIndex = this.count - 1;
    if (index !== lastIndex) {
      this.xs[index] = this.xs[lastIndex]!;
      this.ys[index] = this.ys[lastIndex]!;
      this.zs[index] = this.zs[lastIndex]!;
      this.chunkXs[index] = this.chunkXs[lastIndex]!;
      this.chunkYs[index] = this.chunkYs[lastIndex]!;
      this.entityIds[index] = this.entityIds[lastIndex]!;
      this.entityIndexMap.set(this.entityIds[index]!, index);
    }

    this.entityIndexMap.delete(entityId);
    this.count--;

    return true;
  }

  /**
   * Get direct array access for batch operations.
   * WARNING: Arrays may contain uninitialized data beyond 'count'.
   * Always use 'count' to determine valid range.
   *
   * Example batch processing:
   * ```typescript
   * const arrays = soa.getArrays();
   * for (let i = 0; i < arrays.count; i++) {
   *   arrays.xs[i] += deltaX;
   *   arrays.ys[i] += deltaY;
   * }
   * ```
   */
  getArrays(): {
    xs: Float32Array;
    ys: Float32Array;
    zs: Float32Array;
    chunkXs: Int32Array;
    chunkYs: Int32Array;
    entityIds: string[];
    count: number;
  } {
    return {
      xs: this.xs,
      ys: this.ys,
      zs: this.zs,
      chunkXs: this.chunkXs,
      chunkYs: this.chunkYs,
      entityIds: this.entityIds,
      count: this.count,
    };
  }

  /**
   * Grow capacity by 1.5x.
   * Allocates new arrays and copies existing data.
   */
  private grow(): void {
    const newCapacity = Math.floor(this.capacity * 1.5);

    const newXs = new Float32Array(newCapacity);
    const newYs = new Float32Array(newCapacity);
    const newZs = new Float32Array(newCapacity);
    const newChunkXs = new Int32Array(newCapacity);
    const newChunkYs = new Int32Array(newCapacity);
    const newEntityIds = new Array(newCapacity);

    newXs.set(this.xs);
    newYs.set(this.ys);
    newZs.set(this.zs);
    newChunkXs.set(this.chunkXs);
    newChunkYs.set(this.chunkYs);
    for (let i = 0; i < this.count; i++) {
      newEntityIds[i] = this.entityIds[i];
    }

    this.xs = newXs;
    this.ys = newYs;
    this.zs = newZs;
    this.chunkXs = newChunkXs;
    this.chunkYs = newChunkYs;
    this.entityIds = newEntityIds;
    this.capacity = newCapacity;
  }

  /**
   * Get current number of stored positions.
   */
  size(): number {
    return this.count;
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.count = 0;
    this.entityIndexMap.clear();
  }

  /**
   * Check if entity has a position.
   */
  has(entityId: string): boolean {
    return this.entityIndexMap.has(entityId);
  }
}

/**
 * Structure-of-Arrays storage for Velocity components.
 *
 * Stores velocity data in parallel typed arrays for cache-efficient batch processing.
 * Automatically grows capacity when needed (1.5x growth factor).
 */
export class VelocitySoA {
  private vxs: Float32Array;
  private vys: Float32Array;
  private entityIds: string[];
  private entityIndexMap: Map<string, number>;
  private capacity: number;
  private count: number = 0;

  constructor(initialCapacity: number = 1000) {
    this.capacity = initialCapacity;
    this.vxs = new Float32Array(initialCapacity);
    this.vys = new Float32Array(initialCapacity);
    this.entityIds = new Array(initialCapacity);
    this.entityIndexMap = new Map();
  }

  /**
   * Add a velocity component.
   * @returns Index where the velocity was stored
   */
  add(entityId: string, vx: number, vy: number): number {
    if (this.count >= this.capacity) {
      this.grow();
    }

    const index = this.count;
    this.vxs[index] = vx;
    this.vys[index] = vy;
    this.entityIds[index] = entityId;
    this.entityIndexMap.set(entityId, index);
    this.count++;

    return index;
  }

  /**
   * Get velocity for entity.
   * @returns Velocity data or null if not found
   */
  get(entityId: string): { vx: number; vy: number } | null {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return null;

    return {
      vx: this.vxs[index]!,
      vy: this.vys[index]!,
    };
  }

  /**
   * Update velocity for entity.
   * @returns true if updated, false if entity not found
   */
  set(entityId: string, vx: number, vy: number): boolean {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return false;

    this.vxs[index] = vx;
    this.vys[index] = vy;

    return true;
  }

  /**
   * Remove velocity for entity.
   * Uses swap-remove for O(1) deletion.
   * @returns true if removed, false if entity not found
   */
  remove(entityId: string): boolean {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return false;

    // Swap with last element (faster than shifting)
    const lastIndex = this.count - 1;
    if (index !== lastIndex) {
      this.vxs[index] = this.vxs[lastIndex]!;
      this.vys[index] = this.vys[lastIndex]!;
      this.entityIds[index] = this.entityIds[lastIndex]!;
      this.entityIndexMap.set(this.entityIds[index]!, index);
    }

    this.entityIndexMap.delete(entityId);
    this.count--;

    return true;
  }

  /**
   * Get direct array access for batch operations.
   * WARNING: Arrays may contain uninitialized data beyond 'count'.
   * Always use 'count' to determine valid range.
   *
   * Example batch processing:
   * ```typescript
   * const arrays = soa.getArrays();
   * for (let i = 0; i < arrays.count; i++) {
   *   arrays.vxs[i] *= damping;
   *   arrays.vys[i] *= damping;
   * }
   * ```
   */
  getArrays(): {
    vxs: Float32Array;
    vys: Float32Array;
    entityIds: string[];
    count: number;
  } {
    return {
      vxs: this.vxs,
      vys: this.vys,
      entityIds: this.entityIds,
      count: this.count,
    };
  }

  /**
   * Grow capacity by 1.5x.
   * Allocates new arrays and copies existing data.
   */
  private grow(): void {
    const newCapacity = Math.floor(this.capacity * 1.5);

    const newVxs = new Float32Array(newCapacity);
    const newVys = new Float32Array(newCapacity);
    const newEntityIds = new Array(newCapacity);

    newVxs.set(this.vxs);
    newVys.set(this.vys);
    for (let i = 0; i < this.count; i++) {
      newEntityIds[i] = this.entityIds[i];
    }

    this.vxs = newVxs;
    this.vys = newVys;
    this.entityIds = newEntityIds;
    this.capacity = newCapacity;
  }

  /**
   * Get current number of stored velocities.
   */
  size(): number {
    return this.count;
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.count = 0;
    this.entityIndexMap.clear();
  }

  /**
   * Check if entity has a velocity.
   */
  has(entityId: string): boolean {
    return this.entityIndexMap.has(entityId);
  }
}

/**
 * Structure-of-Arrays storage for Needs components.
 *
 * Stores needs data in parallel typed arrays for cache-efficient batch processing.
 * Automatically grows capacity when needed (1.5x growth factor).
 */
export class NeedsSoA {
  private hunger: Float32Array;
  private energy: Float32Array;
  private health: Float32Array;
  private thirst: Float32Array;
  private social: Float32Array;
  private entityIds: string[];
  private entityIndexMap: Map<string, number>;
  private capacity: number;
  private count: number = 0;

  constructor(initialCapacity: number = 1000) {
    this.capacity = initialCapacity;
    this.hunger = new Float32Array(initialCapacity);
    this.energy = new Float32Array(initialCapacity);
    this.health = new Float32Array(initialCapacity);
    this.thirst = new Float32Array(initialCapacity);
    this.social = new Float32Array(initialCapacity);
    this.entityIds = new Array(initialCapacity);
    this.entityIndexMap = new Map();
  }

  /**
   * Add a needs component.
   * @returns Index where the needs was stored
   */
  add(
    entityId: string,
    hunger: number,
    energy: number,
    health: number,
    thirst: number,
    social: number
  ): number {
    if (this.count >= this.capacity) {
      this.grow();
    }

    const index = this.count;
    this.hunger[index] = hunger;
    this.energy[index] = energy;
    this.health[index] = health;
    this.thirst[index] = thirst;
    this.social[index] = social;
    this.entityIds[index] = entityId;
    this.entityIndexMap.set(entityId, index);
    this.count++;

    return index;
  }

  /**
   * Get needs for entity.
   * @returns Needs data or null if not found
   */
  get(entityId: string): {
    hunger: number;
    energy: number;
    health: number;
    thirst: number;
    social: number;
  } | null {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return null;

    return {
      hunger: this.hunger[index]!,
      energy: this.energy[index]!,
      health: this.health[index]!,
      thirst: this.thirst[index]!,
      social: this.social[index]!,
    };
  }

  /**
   * Update needs for entity.
   * @returns true if updated, false if entity not found
   */
  set(
    entityId: string,
    hunger: number,
    energy: number,
    health: number,
    thirst: number,
    social: number
  ): boolean {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return false;

    this.hunger[index] = hunger;
    this.energy[index] = energy;
    this.health[index] = health;
    this.thirst[index] = thirst;
    this.social[index] = social;

    return true;
  }

  /**
   * Remove needs for entity.
   * Uses swap-remove for O(1) deletion.
   * @returns true if removed, false if entity not found
   */
  remove(entityId: string): boolean {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return false;

    // Swap with last element (faster than shifting)
    const lastIndex = this.count - 1;
    if (index !== lastIndex) {
      this.hunger[index] = this.hunger[lastIndex]!;
      this.energy[index] = this.energy[lastIndex]!;
      this.health[index] = this.health[lastIndex]!;
      this.thirst[index] = this.thirst[lastIndex]!;
      this.social[index] = this.social[lastIndex]!;
      this.entityIds[index] = this.entityIds[lastIndex]!;
      this.entityIndexMap.set(this.entityIds[index]!, index);
    }

    this.entityIndexMap.delete(entityId);
    this.count--;

    return true;
  }

  /**
   * Get direct array access for batch operations.
   * WARNING: Arrays may contain uninitialized data beyond 'count'.
   * Always use 'count' to determine valid range.
   *
   * Example batch processing:
   * ```typescript
   * const arrays = soa.getArrays();
   * for (let i = 0; i < arrays.count; i++) {
   *   arrays.hunger[i] -= hungerDecay;
   *   arrays.energy[i] -= energyDecay;
   * }
   * ```
   */
  getArrays(): {
    hunger: Float32Array;
    energy: Float32Array;
    health: Float32Array;
    thirst: Float32Array;
    social: Float32Array;
    entityIds: string[];
    count: number;
  } {
    return {
      hunger: this.hunger,
      energy: this.energy,
      health: this.health,
      thirst: this.thirst,
      social: this.social,
      entityIds: this.entityIds,
      count: this.count,
    };
  }

  /**
   * Grow capacity by 1.5x.
   * Allocates new arrays and copies existing data.
   */
  private grow(): void {
    const newCapacity = Math.floor(this.capacity * 1.5);

    const newHunger = new Float32Array(newCapacity);
    const newEnergy = new Float32Array(newCapacity);
    const newHealth = new Float32Array(newCapacity);
    const newThirst = new Float32Array(newCapacity);
    const newSocial = new Float32Array(newCapacity);
    const newEntityIds = new Array(newCapacity);

    newHunger.set(this.hunger);
    newEnergy.set(this.energy);
    newHealth.set(this.health);
    newThirst.set(this.thirst);
    newSocial.set(this.social);
    for (let i = 0; i < this.count; i++) {
      newEntityIds[i] = this.entityIds[i];
    }

    this.hunger = newHunger;
    this.energy = newEnergy;
    this.health = newHealth;
    this.thirst = newThirst;
    this.social = newSocial;
    this.entityIds = newEntityIds;
    this.capacity = newCapacity;
  }

  /**
   * Get current number of stored needs.
   */
  size(): number {
    return this.count;
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.count = 0;
    this.entityIndexMap.clear();
  }

  /**
   * Check if entity has needs.
   */
  has(entityId: string): boolean {
    return this.entityIndexMap.has(entityId);
  }
}

/**
 * Structure-of-Arrays storage for Steering components.
 *
 * Stores steering data in parallel typed arrays for cache-efficient batch processing.
 * Automatically grows capacity when needed (1.5x growth factor).
 */
export class SteeringSoA {
  private targetXs: Float32Array;
  private targetYs: Float32Array;
  private maxSpeeds: Float32Array;
  private maxForces: Float32Array;
  private entityIds: string[];
  private entityIndexMap: Map<string, number>;
  private capacity: number;
  private count: number = 0;

  constructor(initialCapacity: number = 1000) {
    this.capacity = initialCapacity;
    this.targetXs = new Float32Array(initialCapacity);
    this.targetYs = new Float32Array(initialCapacity);
    this.maxSpeeds = new Float32Array(initialCapacity);
    this.maxForces = new Float32Array(initialCapacity);
    this.entityIds = new Array(initialCapacity);
    this.entityIndexMap = new Map();
  }

  /**
   * Add a steering component.
   * @returns Index where the steering was stored
   */
  add(
    entityId: string,
    targetX: number,
    targetY: number,
    maxSpeed: number,
    maxForce: number
  ): number {
    if (this.count >= this.capacity) {
      this.grow();
    }

    const index = this.count;
    this.targetXs[index] = targetX;
    this.targetYs[index] = targetY;
    this.maxSpeeds[index] = maxSpeed;
    this.maxForces[index] = maxForce;
    this.entityIds[index] = entityId;
    this.entityIndexMap.set(entityId, index);
    this.count++;

    return index;
  }

  /**
   * Get steering for entity.
   * @returns Steering data or null if not found
   */
  get(entityId: string): {
    targetX: number;
    targetY: number;
    maxSpeed: number;
    maxForce: number;
  } | null {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return null;

    return {
      targetX: this.targetXs[index]!,
      targetY: this.targetYs[index]!,
      maxSpeed: this.maxSpeeds[index]!,
      maxForce: this.maxForces[index]!,
    };
  }

  /**
   * Update steering for entity.
   * @returns true if updated, false if entity not found
   */
  set(
    entityId: string,
    targetX: number,
    targetY: number,
    maxSpeed: number,
    maxForce: number
  ): boolean {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return false;

    this.targetXs[index] = targetX;
    this.targetYs[index] = targetY;
    this.maxSpeeds[index] = maxSpeed;
    this.maxForces[index] = maxForce;

    return true;
  }

  /**
   * Remove steering for entity.
   * Uses swap-remove for O(1) deletion.
   * @returns true if removed, false if entity not found
   */
  remove(entityId: string): boolean {
    const index = this.entityIndexMap.get(entityId);
    if (index === undefined || index >= this.count) return false;

    // Swap with last element (faster than shifting)
    const lastIndex = this.count - 1;
    if (index !== lastIndex) {
      this.targetXs[index] = this.targetXs[lastIndex]!;
      this.targetYs[index] = this.targetYs[lastIndex]!;
      this.maxSpeeds[index] = this.maxSpeeds[lastIndex]!;
      this.maxForces[index] = this.maxForces[lastIndex]!;
      this.entityIds[index] = this.entityIds[lastIndex]!;
      this.entityIndexMap.set(this.entityIds[index]!, index);
    }

    this.entityIndexMap.delete(entityId);
    this.count--;

    return true;
  }

  /**
   * Get direct array access for batch operations.
   * WARNING: Arrays may contain uninitialized data beyond 'count'.
   * Always use 'count' to determine valid range.
   *
   * Example batch processing:
   * ```typescript
   * const arrays = soa.getArrays();
   * for (let i = 0; i < arrays.count; i++) {
   *   const dx = arrays.targetXs[i] - currentX;
   *   const dy = arrays.targetYs[i] - currentY;
   *   // Apply steering force...
   * }
   * ```
   */
  getArrays(): {
    targetXs: Float32Array;
    targetYs: Float32Array;
    maxSpeeds: Float32Array;
    maxForces: Float32Array;
    entityIds: string[];
    count: number;
  } {
    return {
      targetXs: this.targetXs,
      targetYs: this.targetYs,
      maxSpeeds: this.maxSpeeds,
      maxForces: this.maxForces,
      entityIds: this.entityIds,
      count: this.count,
    };
  }

  /**
   * Grow capacity by 1.5x.
   * Allocates new arrays and copies existing data.
   */
  private grow(): void {
    const newCapacity = Math.floor(this.capacity * 1.5);

    const newTargetXs = new Float32Array(newCapacity);
    const newTargetYs = new Float32Array(newCapacity);
    const newMaxSpeeds = new Float32Array(newCapacity);
    const newMaxForces = new Float32Array(newCapacity);
    const newEntityIds = new Array(newCapacity);

    newTargetXs.set(this.targetXs);
    newTargetYs.set(this.targetYs);
    newMaxSpeeds.set(this.maxSpeeds);
    newMaxForces.set(this.maxForces);
    for (let i = 0; i < this.count; i++) {
      newEntityIds[i] = this.entityIds[i];
    }

    this.targetXs = newTargetXs;
    this.targetYs = newTargetYs;
    this.maxSpeeds = newMaxSpeeds;
    this.maxForces = newMaxForces;
    this.entityIds = newEntityIds;
    this.capacity = newCapacity;
  }

  /**
   * Get current number of stored steering components.
   */
  size(): number {
    return this.count;
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.count = 0;
    this.entityIndexMap.clear();
  }

  /**
   * Check if entity has steering.
   */
  has(entityId: string): boolean {
    return this.entityIndexMap.has(entityId);
  }
}
