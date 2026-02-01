import type { TechUnlock } from '../components/NationComponent.js';

/**
 * Technology definition
 */
export interface TechnologyDefinition {
  id: string;
  name: string;
  era: 'ancient' | 'classical' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'space';
  prerequisites: string[];
  field: 'military' | 'economic' | 'cultural' | 'scientific';
  cost: number;
  unlocks: TechUnlock[];
  description: string;
}

/**
 * National Tech Tree
 * Technologies organized by era with prerequisites
 */
export const NATIONAL_TECH_TREE: Record<string, TechnologyDefinition> = {
  // === ANCIENT ERA ===
  writing: {
    id: 'writing',
    name: 'Writing',
    era: 'ancient',
    prerequisites: [],
    field: 'cultural',
    cost: 100,
    unlocks: [{ type: 'building', id: 'library', name: 'Library', description: 'Increases research output' }],
    description: 'The ability to record information enables bureaucracy and learning',
  },
  bronze_working: {
    id: 'bronze_working',
    name: 'Bronze Working',
    era: 'ancient',
    prerequisites: [],
    field: 'military',
    cost: 100,
    unlocks: [{ type: 'unit', id: 'bronze_infantry', name: 'Bronze Infantry', description: 'Basic armed soldiers' }],
    description: 'Metalworking for weapons and tools',
  },
  agriculture: {
    id: 'agriculture',
    name: 'Agriculture',
    era: 'ancient',
    prerequisites: [],
    field: 'economic',
    cost: 80,
    unlocks: [{ type: 'building', id: 'granary', name: 'Granary', description: 'Increases food storage' }],
    description: 'Organized farming increases food production',
  },
  pottery: {
    id: 'pottery',
    name: 'Pottery',
    era: 'ancient',
    prerequisites: [],
    field: 'economic',
    cost: 60,
    unlocks: [{ type: 'resource', id: 'pottery_goods', name: 'Pottery Goods', description: 'Tradeable goods' }],
    description: 'Clay vessels for storage and trade',
  },
  sailing: {
    id: 'sailing',
    name: 'Sailing',
    era: 'ancient',
    prerequisites: [],
    field: 'economic',
    cost: 120,
    unlocks: [{ type: 'unit', id: 'galley', name: 'Galley', description: 'Basic naval vessel' }],
    description: 'Enables water transportation and fishing',
  },

  // === CLASSICAL ERA ===
  currency: {
    id: 'currency',
    name: 'Currency',
    era: 'classical',
    prerequisites: ['writing', 'pottery'],
    field: 'economic',
    cost: 200,
    unlocks: [{ type: 'policy', id: 'monetary_policy', name: 'Monetary Policy', description: 'Control over currency' }],
    description: 'Standardized money enables complex trade',
  },
  iron_working: {
    id: 'iron_working',
    name: 'Iron Working',
    era: 'classical',
    prerequisites: ['bronze_working'],
    field: 'military',
    cost: 200,
    unlocks: [{ type: 'unit', id: 'iron_infantry', name: 'Iron Infantry', description: 'Superior armed soldiers' }],
    description: 'Stronger metal for weapons and armor',
  },
  mathematics: {
    id: 'mathematics',
    name: 'Mathematics',
    era: 'classical',
    prerequisites: ['writing'],
    field: 'scientific',
    cost: 180,
    unlocks: [{ type: 'building', id: 'academy', name: 'Academy', description: 'Trains scholars' }],
    description: 'Foundation for engineering and science',
  },
  construction: {
    id: 'construction',
    name: 'Construction',
    era: 'classical',
    prerequisites: ['mathematics'],
    field: 'economic',
    cost: 220,
    unlocks: [{ type: 'building', id: 'walls', name: 'City Walls', description: 'Defensive fortifications' }],
    description: 'Advanced building techniques',
  },
  horseback_riding: {
    id: 'horseback_riding',
    name: 'Horseback Riding',
    era: 'classical',
    prerequisites: ['agriculture'],
    field: 'military',
    cost: 160,
    unlocks: [{ type: 'unit', id: 'cavalry', name: 'Cavalry', description: 'Mounted warriors' }],
    description: 'Domestication and riding of horses',
  },

  // === MEDIEVAL ERA ===
  feudalism: {
    id: 'feudalism',
    name: 'Feudalism',
    era: 'medieval',
    prerequisites: ['currency', 'horseback_riding'],
    field: 'economic',
    cost: 400,
    unlocks: [{ type: 'policy', id: 'vassalage', name: 'Vassalage System', description: 'Noble hierarchy' }],
    description: 'Hierarchical land ownership system',
  },
  steel_working: {
    id: 'steel_working',
    name: 'Steel Working',
    era: 'medieval',
    prerequisites: ['iron_working'],
    field: 'military',
    cost: 400,
    unlocks: [{ type: 'unit', id: 'knights', name: 'Knights', description: 'Heavy armored cavalry' }],
    description: 'Advanced metalworking for superior weapons',
  },
  guilds: {
    id: 'guilds',
    name: 'Guilds',
    era: 'medieval',
    prerequisites: ['currency', 'construction'],
    field: 'economic',
    cost: 350,
    unlocks: [{ type: 'building', id: 'workshop', name: 'Workshop', description: 'Increases production' }],
    description: 'Organized craftsmen and trade associations',
  },
  theology: {
    id: 'theology',
    name: 'Theology',
    era: 'medieval',
    prerequisites: ['writing', 'mathematics'],
    field: 'cultural',
    cost: 320,
    unlocks: [{ type: 'building', id: 'temple', name: 'Temple', description: 'Religious center' }],
    description: 'Systematic study of religion',
  },
  castles: {
    id: 'castles',
    name: 'Castles',
    era: 'medieval',
    prerequisites: ['construction', 'feudalism'],
    field: 'military',
    cost: 450,
    unlocks: [{ type: 'building', id: 'castle', name: 'Castle', description: 'Powerful fortification' }],
    description: 'Advanced fortification techniques',
  },

  // === RENAISSANCE ERA ===
  banking: {
    id: 'banking',
    name: 'Banking',
    era: 'renaissance',
    prerequisites: ['guilds', 'currency'],
    field: 'economic',
    cost: 600,
    unlocks: [{ type: 'building', id: 'bank', name: 'Bank', description: 'Financial institution' }],
    description: 'Organized lending and finance',
  },
  gunpowder: {
    id: 'gunpowder',
    name: 'Gunpowder',
    era: 'renaissance',
    prerequisites: ['steel_working'],
    field: 'military',
    cost: 650,
    unlocks: [{ type: 'unit', id: 'musketeer', name: 'Musketeer', description: 'Gunpowder infantry' }],
    description: 'Explosive compound for warfare',
  },
  printing_press: {
    id: 'printing_press',
    name: 'Printing Press',
    era: 'renaissance',
    prerequisites: ['guilds', 'theology'],
    field: 'cultural',
    cost: 550,
    unlocks: [{ type: 'building', id: 'printing_house', name: 'Printing House', description: 'Mass produces books' }],
    description: 'Mass production of written materials',
  },
  astronomy: {
    id: 'astronomy',
    name: 'Astronomy',
    era: 'renaissance',
    prerequisites: ['mathematics'],
    field: 'scientific',
    cost: 500,
    unlocks: [{ type: 'building', id: 'observatory', name: 'Observatory', description: 'Studies celestial objects' }],
    description: 'Study of celestial bodies',
  },
  navigation: {
    id: 'navigation',
    name: 'Navigation',
    era: 'renaissance',
    prerequisites: ['sailing', 'astronomy'],
    field: 'economic',
    cost: 580,
    unlocks: [{ type: 'unit', id: 'caravel', name: 'Caravel', description: 'Ocean-going vessel' }],
    description: 'Advanced seafaring techniques',
  },

  // === INDUSTRIAL ERA ===
  industrialization: {
    id: 'industrialization',
    name: 'Industrialization',
    era: 'industrial',
    prerequisites: ['banking', 'guilds'],
    field: 'economic',
    cost: 1000,
    unlocks: [{ type: 'building', id: 'factory', name: 'Factory', description: 'Mass production facility' }],
    description: 'Machine-based manufacturing',
  },
  steam_power: {
    id: 'steam_power',
    name: 'Steam Power',
    era: 'industrial',
    prerequisites: ['industrialization'],
    field: 'scientific',
    cost: 900,
    unlocks: [{ type: 'unit', id: 'ironclad', name: 'Ironclad', description: 'Steam-powered warship' }],
    description: 'Harnessing steam for mechanical power',
  },
  rifling: {
    id: 'rifling',
    name: 'Rifling',
    era: 'industrial',
    prerequisites: ['gunpowder'],
    field: 'military',
    cost: 850,
    unlocks: [{ type: 'unit', id: 'rifleman', name: 'Rifleman', description: 'Accurate ranged soldier' }],
    description: 'Improved firearm accuracy',
  },
  electricity: {
    id: 'electricity',
    name: 'Electricity',
    era: 'industrial',
    prerequisites: ['steam_power'],
    field: 'scientific',
    cost: 1200,
    unlocks: [{ type: 'building', id: 'power_plant', name: 'Power Plant', description: 'Generates electricity' }],
    description: 'Harnessing electrical power',
  },
  railroad: {
    id: 'railroad',
    name: 'Railroad',
    era: 'industrial',
    prerequisites: ['steam_power', 'industrialization'],
    field: 'economic',
    cost: 1100,
    unlocks: [{ type: 'building', id: 'train_station', name: 'Train Station', description: 'Rail transport hub' }],
    description: 'Rail-based transportation network',
  },

  // === MODERN ERA ===
  combustion: {
    id: 'combustion',
    name: 'Combustion Engine',
    era: 'modern',
    prerequisites: ['electricity', 'industrialization'],
    field: 'scientific',
    cost: 1500,
    unlocks: [{ type: 'unit', id: 'tank', name: 'Tank', description: 'Armored fighting vehicle' }],
    description: 'Internal combustion engines',
  },
  flight: {
    id: 'flight',
    name: 'Flight',
    era: 'modern',
    prerequisites: ['combustion'],
    field: 'military',
    cost: 1600,
    unlocks: [{ type: 'unit', id: 'fighter', name: 'Fighter Aircraft', description: 'Air combat unit' }],
    description: 'Powered heavier-than-air flight',
  },
  radio: {
    id: 'radio',
    name: 'Radio',
    era: 'modern',
    prerequisites: ['electricity'],
    field: 'cultural',
    cost: 1400,
    unlocks: [{ type: 'building', id: 'broadcast_tower', name: 'Broadcast Tower', description: 'Mass communication' }],
    description: 'Wireless communication technology',
  },
  nuclear_fission: {
    id: 'nuclear_fission',
    name: 'Nuclear Fission',
    era: 'modern',
    prerequisites: ['electricity'],
    field: 'scientific',
    cost: 2000,
    unlocks: [{ type: 'building', id: 'nuclear_plant', name: 'Nuclear Plant', description: 'Nuclear power generation' }],
    description: 'Splitting atoms for energy',
  },
  computers: {
    id: 'computers',
    name: 'Computers',
    era: 'modern',
    prerequisites: ['electricity', 'radio'],
    field: 'scientific',
    cost: 1800,
    unlocks: [{ type: 'building', id: 'research_lab', name: 'Research Lab', description: 'Advanced research facility' }],
    description: 'Electronic computation',
  },

  // === SPACE ERA ===
  rocketry: {
    id: 'rocketry',
    name: 'Rocketry',
    era: 'space',
    prerequisites: ['combustion', 'nuclear_fission'],
    field: 'military',
    cost: 2500,
    unlocks: [{ type: 'unit', id: 'missile', name: 'Ballistic Missile', description: 'Long-range weapon' }],
    description: 'Rocket propulsion technology',
  },
  satellites: {
    id: 'satellites',
    name: 'Satellites',
    era: 'space',
    prerequisites: ['rocketry', 'computers'],
    field: 'scientific',
    cost: 2800,
    unlocks: [{ type: 'building', id: 'satellite_uplink', name: 'Satellite Uplink', description: 'Global communication' }],
    description: 'Orbital satellite technology',
  },
  fusion: {
    id: 'fusion',
    name: 'Fusion Power',
    era: 'space',
    prerequisites: ['nuclear_fission'],
    field: 'scientific',
    cost: 3500,
    unlocks: [{ type: 'building', id: 'fusion_reactor', name: 'Fusion Reactor', description: 'Clean unlimited energy' }],
    description: 'Harnessing fusion reactions for power',
  },
  ftl_drive: {
    id: 'ftl_drive',
    name: 'FTL Drive',
    era: 'space',
    prerequisites: ['fusion', 'satellites'],
    field: 'scientific',
    cost: 5000,
    unlocks: [{ type: 'unit', id: 'starship', name: 'Starship', description: 'Interstellar vessel' }],
    description: 'Faster-than-light travel technology',
  },
  quantum_computing: {
    id: 'quantum_computing',
    name: 'Quantum Computing',
    era: 'space',
    prerequisites: ['computers', 'fusion'],
    field: 'scientific',
    cost: 4000,
    unlocks: [{ type: 'ability', id: 'ai_governance', name: 'AI Governance', description: 'Automated administration' }],
    description: 'Quantum mechanical computation',
  },
};

/**
 * Get all technologies in an era
 */
export function getTechnologiesInEra(era: TechnologyDefinition['era']): TechnologyDefinition[] {
  return Object.values(NATIONAL_TECH_TREE).filter(tech => tech.era === era);
}

/**
 * Get era progression order
 */
export const ERA_ORDER: TechnologyDefinition['era'][] = [
  'ancient',
  'classical',
  'medieval',
  'renaissance',
  'industrial',
  'modern',
  'space',
];

/**
 * Check if prerequisites are met for a technology
 */
export function arePrerequisitesMet(
  techId: string,
  completedTechnologies: string[]
): boolean {
  const tech = NATIONAL_TECH_TREE[techId];
  if (!tech) return false;
  return tech.prerequisites.every(prereq => completedTechnologies.includes(prereq));
}

/**
 * Get available technologies (prerequisites met, not yet completed)
 */
export function getAvailableTechnologies(completedTechnologies: string[]): TechnologyDefinition[] {
  return Object.values(NATIONAL_TECH_TREE).filter(
    tech => !completedTechnologies.includes(tech.id) && arePrerequisitesMet(tech.id, completedTechnologies)
  );
}

/**
 * Calculate tech level from completed technologies (1-10)
 */
export function calculateTechLevel(completedTechnologies: string[]): number {
  if (completedTechnologies.length === 0) return 1;

  // Find highest era with completed techs
  let highestEraIndex = 0;
  for (const techId of completedTechnologies) {
    const tech = NATIONAL_TECH_TREE[techId];
    if (tech) {
      const eraIndex = ERA_ORDER.indexOf(tech.era);
      if (eraIndex > highestEraIndex) {
        highestEraIndex = eraIndex;
      }
    }
  }

  // Tech level is 1-2 per era (7 eras → levels 1-10)
  const baseLevel = Math.floor(highestEraIndex * 1.4) + 1;

  // Bonus for completing many techs
  const completionBonus = Math.floor(completedTechnologies.length / 10);

  return Math.min(10, baseLevel + completionBonus);
}
