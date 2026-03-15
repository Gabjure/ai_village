/**
 * Registration of all paradigm cost calculators
 *
 * Call registerAllCostCalculators() at startup to register all
 * built-in paradigm calculators with the global registry.
 */

import { costCalculatorRegistry } from '../CostCalculatorRegistry.js';
// Core paradigms
import { AcademicCostCalculator } from './AcademicCostCalculator.js';
import { PactCostCalculator } from './PactCostCalculator.js';
import { NameCostCalculator } from './NameCostCalculator.js';
import { BreathCostCalculator } from './BreathCostCalculator.js';
import { DivineCostCalculator } from './DivineCostCalculator.js';
import { BloodCostCalculator } from './BloodCostCalculator.js';
import { EmotionalCostCalculator } from './EmotionalCostCalculator.js';
import { DivineCastingCalculator } from './DivineCastingCalculator.js';
// Animist paradigms
import { ShintoCostCalculator } from './ShintoCostCalculator.js';
import { DreamCostCalculator } from './DreamCostCalculator.js';
import { SongCostCalculator } from './SongCostCalculator.js';
import { RuneCostCalculator } from './RuneCostCalculator.js';
import { SympathyCostCalculator } from './SympathyCostCalculator.js';
import { AllomancyCostCalculator } from './AllomancyCostCalculator.js';
import { DaemonCostCalculator } from './DaemonCostCalculator.js';
// Dimensional/Void paradigms
import { VoidCostCalculator } from './VoidCostCalculator.js';
// Creative paradigms
import { BeliefCostCalculator } from './BeliefCostCalculator.js';
import { CommerceCostCalculator } from './CommerceCostCalculator.js';
import { DebtCostCalculator } from './DebtCostCalculator.js';
import { BureaucraticCostCalculator } from './BureaucraticCostCalculator.js';
import { GameCostCalculator } from './GameCostCalculator.js';
import { LuckCostCalculator } from './LuckCostCalculator.js';
import { EchoCostCalculator } from './EchoCostCalculator.js';
import { ParadoxCostCalculator } from './ParadoxCostCalculator.js';
import { ThresholdCostCalculator } from './ThresholdCostCalculator.js';

/**
 * Register all built-in cost calculators with the global registry.
 *
 * Call this once at application startup before using any magic systems.
 */
export function registerAllCostCalculators(): void {
  // Core paradigms
  costCalculatorRegistry.registerOrReplace(new AcademicCostCalculator());
  costCalculatorRegistry.registerOrReplace(new PactCostCalculator());
  costCalculatorRegistry.registerOrReplace(new NameCostCalculator());
  costCalculatorRegistry.registerOrReplace(new BreathCostCalculator());
  costCalculatorRegistry.registerOrReplace(new DivineCostCalculator());
  costCalculatorRegistry.registerOrReplace(new BloodCostCalculator());
  costCalculatorRegistry.registerOrReplace(new EmotionalCostCalculator());

  // Special calculators
  costCalculatorRegistry.registerOrReplace(new DivineCastingCalculator());

  // Animist paradigms
  costCalculatorRegistry.registerOrReplace(new ShintoCostCalculator());
  costCalculatorRegistry.registerOrReplace(new DreamCostCalculator());
  costCalculatorRegistry.registerOrReplace(new SongCostCalculator());
  costCalculatorRegistry.registerOrReplace(new RuneCostCalculator());
  costCalculatorRegistry.registerOrReplace(new SympathyCostCalculator());
  costCalculatorRegistry.registerOrReplace(new AllomancyCostCalculator());
  costCalculatorRegistry.registerOrReplace(new DaemonCostCalculator());

  // Dimensional/Void paradigms
  costCalculatorRegistry.registerOrReplace(new VoidCostCalculator());

  // Creative paradigms
  costCalculatorRegistry.registerOrReplace(new BeliefCostCalculator());
  costCalculatorRegistry.registerOrReplace(new CommerceCostCalculator());
  costCalculatorRegistry.registerOrReplace(new DebtCostCalculator());
  costCalculatorRegistry.registerOrReplace(new BureaucraticCostCalculator());
  costCalculatorRegistry.registerOrReplace(new GameCostCalculator());
  costCalculatorRegistry.registerOrReplace(new LuckCostCalculator());
  costCalculatorRegistry.registerOrReplace(new EchoCostCalculator());
  costCalculatorRegistry.registerOrReplace(new ParadoxCostCalculator());
  costCalculatorRegistry.registerOrReplace(new ThresholdCostCalculator());
}

/**
 * Get all registered paradigm IDs.
 */
export function getRegisteredParadigms(): string[] {
  return costCalculatorRegistry.getRegisteredParadigms();
}

/**
 * Check if all core paradigms are registered.
 */
export function verifyCoreParadigmsRegistered(): boolean {
  const coreParadigms = [
    'academic',
    'pact',
    'names',
    'breath',
    'divine',
    'blood',
    'emotional',
    'divine_casting',
  ];

  return coreParadigms.every(id => costCalculatorRegistry.has(id));
}

/**
 * Check if all animist paradigms are registered.
 */
export function verifyAnimistParadigmsRegistered(): boolean {
  const animistParadigms = [
    'shinto',
    'dream',
    'song',
    'rune',
    'sympathy',
    'allomancy',
    'daemon',
  ];

  return animistParadigms.every(id => costCalculatorRegistry.has(id));
}

/**
 * Check if all creative paradigms are registered.
 */
export function verifyCreativeParadigmsRegistered(): boolean {
  const creativeParadigms = [
    'void',
    'belief_magic',
    'commerce_magic',
    'debt_magic',
    'bureaucratic_magic',
    'game_magic',
    'luck_magic',
    'echo_magic',
    'paradox_magic',
    'threshold_magic',
  ];

  return creativeParadigms.every(id => costCalculatorRegistry.has(id));
}

/**
 * Check if all paradigms are registered.
 */
export function verifyAllParadigmsRegistered(): boolean {
  return verifyCoreParadigmsRegistered() && verifyAnimistParadigmsRegistered() && verifyCreativeParadigmsRegistered();
}
