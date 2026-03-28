import { ComponentBase } from '../ecs/Component.js';

export const ALIEN_CAPABILITY_IDS = [
  'collaborative_composition',
  'trance_states',
  'predatory_pack_coordination',
  'symbolic_ritualization',
] as const;

export type AlienCapabilityId = typeof ALIEN_CAPABILITY_IDS[number];

export interface CapabilityUnlockRecord {
  capabilityId: AlienCapabilityId;
  unlockedAtTick: number;
  score: number;
  geneticScore: number;
  biochemicalScore: number;
}

export interface CapabilityProfileData {
  activeCapabilities: AlienCapabilityId[];
  unlockedCapabilities: AlienCapabilityId[];
  scoreByCapability: Record<string, number>;
  unlockHistory: CapabilityUnlockRecord[];
  lastEvaluatedTick: number;
}

/**
 * Tracks dynamic capability unlocks inferred from genetics + biochemistry.
 * Unlocks are durable (historical), while activeCapabilities are per-tick.
 */
export class CapabilityProfileComponent extends ComponentBase {
  public readonly type = 'capability_profile';

  public activeCapabilities: AlienCapabilityId[];
  public unlockedCapabilities: AlienCapabilityId[];
  public scoreByCapability: Record<string, number>;
  public unlockHistory: CapabilityUnlockRecord[];
  public lastEvaluatedTick: number;

  constructor(data: Partial<CapabilityProfileData> = {}) {
    super();
    this.activeCapabilities = data.activeCapabilities ? [...data.activeCapabilities] : [];
    this.unlockedCapabilities = data.unlockedCapabilities ? [...data.unlockedCapabilities] : [];
    this.scoreByCapability = data.scoreByCapability ? { ...data.scoreByCapability } : {};
    this.unlockHistory = data.unlockHistory ? data.unlockHistory.map((entry) => ({ ...entry })) : [];
    this.lastEvaluatedTick = data.lastEvaluatedTick ?? 0;
  }
}

export function createCapabilityProfileComponent(
  data: Partial<CapabilityProfileData> = {}
): CapabilityProfileComponent {
  return new CapabilityProfileComponent(data);
}
