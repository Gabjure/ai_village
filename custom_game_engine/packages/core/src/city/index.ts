/**
 * City Management System
 *
 * Generalized city-level AI and strategic decision-making.
 */

// Note: CityFocus, CityStats, StrategicPriorities are already exported from
// components/CityDirectorComponent.js. We only export CityManager-specific types here.
export {
  CityManager,
  type CityReasoning,
  type CityDecision,
  type CityManagerConfig,
} from './CityManager.js';

// City spawning functions for dev tools and dashboard
export {
  spawnCity,
  getCityTemplates,
  type CityTemplate,
  type CitySpawnConfig,
  type SpawnedCityInfo,
} from './CitySpawner.js';
