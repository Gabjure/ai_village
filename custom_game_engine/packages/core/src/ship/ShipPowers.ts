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
  // Scanner tiers (creature inspect gates)
  SCANNER_BASIC = 'scanner_basic',
  SCANNER_BIO = 'scanner_bio',
  SCANNER_GENOME = 'scanner_genome',

  // Creature interaction powers
  TEMPORAL_LENS = 'temporal_lens',           // age_control
  LIFE_FORGE = 'life_forge',                 // cloning
  NUTRIENT_SYNTHESIZER = 'nutrient_synthesizer', // chemical_inject
  MEMORY_CRYSTAL = 'memory_crystal',         // memory_edit
  LEARNING_TERMINAL = 'learning_terminal',   // teach
  NEURAL_LATTICE = 'neural_lattice',         // impulse
  RESONANCE_AMPLIFIER = 'resonance_amplifier', // sing_together
  CREATOR_POD = 'creator_pod',               // spawn/create
  ATMOSPHERE_ENGINE = 'atmosphere_engine',    // environment control
  TRACTOR_BEAM = 'tractor_beam',             // pickup_carry
  ENTROPY_REVERSAL = 'entropy_reversal',     // death_control

  // Camera / navigation
  FREE_CAMERA = 'free_camera',
  FOG_BYPASS = 'fog_bypass',
  GALACTIC_MAP = 'galactic_map',

  // Ship combat & structure
  DEFLECTOR_ARRAY = 'deflector_array',       // shields
  PARTICLE_CANNON = 'particle_cannon',       // lasers
  HULL_SEPARATOR = 'hull_separator',         // section_detach

  // FTL powers
  TELEPORT = 'teleport',                     // warp
  WORMHOLE_DRIVE = 'wormhole_drive',         // wormhole
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

  /** Return all currently unlocked powers as an array (for persistence). */
  getUnlockedPowers(): ShipPower[] {
    return Array.from(this.unlockedPowers);
  }

  /** Serialize to a plain object suitable for JSON persistence. */
  serialize(): { unlockedPowers: string[] } {
    return { unlockedPowers: Array.from(this.unlockedPowers) };
  }

  /** Restore state from a previously serialized object. */
  deserialize(data: { unlockedPowers: string[] }): void {
    this.unlockedPowers.clear();
    for (const value of data.unlockedPowers) {
      if (Object.values(ShipPower).includes(value as ShipPower)) {
        this.unlockedPowers.add(value as ShipPower);
      } else {
        console.warn(`[ShipPowerState] Ignoring unknown power during load: "${value}"`);
      }
    }
    // Ensure SCANNER_BASIC is always present
    if (!this.unlockedPowers.has(ShipPower.SCANNER_BASIC)) {
      console.warn('[ShipPowerState] SCANNER_BASIC was missing from save data — re-adding.');
      this.unlockedPowers.add(ShipPower.SCANNER_BASIC);
    }
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
