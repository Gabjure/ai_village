/**
 * ShipPowers - Registry of ship power unlocks
 *
 * Powers are unlocked over time during normal play. In dev mode,
 * all powers are unlocked immediately via `initShipPowerState(true)`.
 */

// ============================================================================
// ShipPower Enum
// ============================================================================

export enum ShipPower {
  // Scanner tiers
  SCANNER_BASIC = 'scanner_basic',
  SCANNER_BIO = 'scanner_bio',
  SCANNER_GENOME = 'scanner_genome',

  // Creature powers
  TEMPORAL_LENS = 'temporal_lens',
  LIFE_FORGE = 'life_forge',
  NUTRIENT_SYNTHESIZER = 'nutrient_synthesizer',
  MEMORY_CRYSTAL = 'memory_crystal',
  LEARNING_TERMINAL = 'learning_terminal',
  NEURAL_LATTICE = 'neural_lattice',
  RESONANCE_AMPLIFIER = 'resonance_amplifier',
  CREATOR_POD = 'creator_pod',
  ATMOSPHERE_ENGINE = 'atmosphere_engine',

  // Ship powers
  FOG_BYPASS = 'fog_bypass',
  TELEPORT = 'teleport',
}

// ============================================================================
// ScannerTier Enum (ascending order of capability)
// ============================================================================

export enum ScannerTier {
  BASIC = 'basic',
  BIO = 'bio',
  GENOME = 'genome',
}

// ============================================================================
// Internal scanner tier ordering
// ============================================================================

const SCANNER_TIER_ORDER: ScannerTier[] = [
  ScannerTier.BASIC,
  ScannerTier.BIO,
  ScannerTier.GENOME,
];

const SCANNER_TIER_TO_POWER: Record<ScannerTier, ShipPower> = {
  [ScannerTier.BASIC]: ShipPower.SCANNER_BASIC,
  [ScannerTier.BIO]: ShipPower.SCANNER_BIO,
  [ScannerTier.GENOME]: ShipPower.SCANNER_GENOME,
};

const ALL_POWERS: ShipPower[] = Object.values(ShipPower);

// ============================================================================
// ShipPowerState (singleton)
// ============================================================================

export class ShipPowerState {
  private unlockedPowers: Set<ShipPower>;

  constructor() {
    this.unlockedPowers = new Set<ShipPower>();
    this.unlockedPowers.add(ShipPower.SCANNER_BASIC);
  }

  unlock(power: ShipPower): void {
    this.unlockedPowers.add(power);
  }

  lock(power: ShipPower): void {
    this.unlockedPowers.delete(power);
  }

  isUnlocked(power: ShipPower): boolean {
    return this.unlockedPowers.has(power);
  }

  unlockAll(): void {
    for (const power of ALL_POWERS) {
      this.unlockedPowers.add(power);
    }
  }

  lockAll(): void {
    this.unlockedPowers.clear();
    this.unlockedPowers.add(ShipPower.SCANNER_BASIC);
  }

  getScannerTier(): ScannerTier {
    // Walk tiers from highest to lowest; return the highest unlocked one.
    for (let i = SCANNER_TIER_ORDER.length - 1; i >= 0; i--) {
      const tier = SCANNER_TIER_ORDER[i]!;
      if (this.unlockedPowers.has(SCANNER_TIER_TO_POWER[tier])) {
        return tier;
      }
    }
    // SCANNER_BASIC is always unlocked by default, so this should never be
    // reached under normal circumstances.
    throw new Error('No scanner tier is unlocked; at minimum SCANNER_BASIC must be unlocked.');
  }

  hasScannerTier(tier: ScannerTier): boolean {
    const currentIndex = SCANNER_TIER_ORDER.indexOf(this.getScannerTier());
    const requiredIndex = SCANNER_TIER_ORDER.indexOf(tier);
    return currentIndex >= requiredIndex;
  }
}

// ============================================================================
// Singleton management
// ============================================================================

let _instance: ShipPowerState | null = null;

export function getShipPowerState(): ShipPowerState {
  if (_instance === null) {
    throw new Error(
      'ShipPowerState has not been initialized. Call initShipPowerState() before getShipPowerState().'
    );
  }
  return _instance;
}

export function initShipPowerState(devMode?: boolean): ShipPowerState {
  _instance = new ShipPowerState();
  if (devMode === true) {
    _instance.unlockAll();
  }
  return _instance;
}
