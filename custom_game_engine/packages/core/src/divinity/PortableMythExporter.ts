/**
 * PortableMyth Exporter
 *
 * Converts internal MVEE Myth objects into the cross-game PortableMyth format
 * for export via the Akashic Records lore bridge.
 */

import type { Myth, MythologyComponent } from '../components/MythComponent.js';
import type { DeityComponent } from '../components/DeityComponent.js';

// ============================================================================
// PortableMyth Types (from cross-game-lore-bridge-spec-v1)
// ============================================================================

export interface PortableMythMutation {
  fromVersion: number;
  toVersion: number;
  mutationType: string;
  description: string;
  sourceGame: string;
  timestamp: string;
}

export interface PortableMyth {
  // Identity
  mythId: string;
  sourceGame: 'mvee';
  sourceUniverseId?: string;
  version: number;

  // Content
  title: string;
  summary: string;
  fullText: string;
  category: string;

  // Cultural context
  deityDomains: string[];
  deityPersonality: Partial<{
    benevolence: number;
    interventionism: number;
    wrathfulness: number;
    mysteriousness: number;
    generosity: number;
    consistency: number;
  }>;
  speciesOrigin?: string;
  linguisticMarkers: string[];

  // Narrative elements
  motifs: string[];
  symbols: string[];
  temporalSetting: string;
  moral?: string;

  // Provenance
  originalEvent?: {
    type: string;
    description: string;
    gameTimestamp: number;
  };
  mutations: PortableMythMutation[];
  canonicityScore: number;
  status: string;

  // Metadata
  exportedAt: string;
  tellingCount: number;
  believerCount: number;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Compute canonicity score for a myth based on spread metrics.
 * Score ranges 0-1, based on: knownBy count, tellingCount, status, and age.
 */
export function computeCanonicityScore(myth: Myth): number {
  let score = 0;

  // Known by agents (up to 0.4 for 50+ knowers)
  score += Math.min(0.4, myth.knownBy.length / 125);

  // Telling count (up to 0.3 for 100+ tellings)
  score += Math.min(0.3, myth.tellingCount / 333);

  // Status bonus
  switch (myth.status) {
    case 'canonical': score += 0.2; break;
    case 'recorded': score += 0.1; break;
    case 'oral': score += 0.0; break;
    case 'disputed': score -= 0.1; break;
    case 'apocryphal': score -= 0.15; break;
    case 'heretical': score -= 0.2; break;
  }

  // Written records bonus (up to 0.1)
  score += Math.min(0.1, myth.writtenIn.length * 0.02);

  return Math.max(0, Math.min(1, score));
}

/**
 * Extract linguistic markers from myth text.
 * Identifies recurring phrases, deity name patterns, and cultural indicators.
 */
function extractLinguisticMarkers(myth: Myth): string[] {
  const markers: string[] = [];
  const text = myth.fullText.toLowerCase();

  // Divine language patterns
  if (text.includes('thus spoke') || text.includes('thus said')) markers.push('prophetic_voice');
  if (text.includes('in the beginning') || text.includes('before time')) markers.push('primordial_framing');
  if (text.includes('and lo') || text.includes('behold')) markers.push('archaic_register');
  if (text.includes('the faithful') || text.includes('the devoted')) markers.push('devotional_language');
  if (text.includes('wrath') || text.includes('fury') || text.includes('smite')) markers.push('wrathful_imagery');
  if (text.includes('mercy') || text.includes('compassion') || text.includes('blessing')) markers.push('merciful_imagery');
  if (text.includes('prophecy') || text.includes('foretold') || text.includes('foreseen')) markers.push('prophetic_content');

  return markers;
}

/**
 * Extract motifs from myth text.
 */
function extractMotifs(myth: Myth): string[] {
  const motifs: string[] = [];
  const text = myth.fullText.toLowerCase();

  if (text.includes('journey') || text.includes('traveled') || text.includes('quest')) motifs.push('journey');
  if (text.includes('sacrifice') || text.includes('gave up') || text.includes('offered')) motifs.push('sacrifice');
  if (text.includes('transform') || text.includes('became') || text.includes('changed into')) motifs.push('transformation');
  if (text.includes('battle') || text.includes('fought') || text.includes('war')) motifs.push('conflict');
  if (text.includes('heal') || text.includes('cured') || text.includes('restored')) motifs.push('healing');
  if (text.includes('creation') || text.includes('created') || text.includes('made the world')) motifs.push('creation');
  if (text.includes('death') || text.includes('died') || text.includes('perished')) motifs.push('death_and_rebirth');
  if (text.includes('trick') || text.includes('deceiv') || text.includes('cunning')) motifs.push('trickster');

  return motifs;
}

/**
 * Extract symbols from myth text.
 */
function extractSymbols(myth: Myth): string[] {
  const symbols: string[] = [];
  const text = myth.fullText.toLowerCase();

  if (text.includes('light') || text.includes('sun') || text.includes('dawn')) symbols.push('light');
  if (text.includes('dark') || text.includes('shadow') || text.includes('night')) symbols.push('darkness');
  if (text.includes('water') || text.includes('river') || text.includes('ocean')) symbols.push('water');
  if (text.includes('fire') || text.includes('flame') || text.includes('burn')) symbols.push('fire');
  if (text.includes('mountain') || text.includes('peak') || text.includes('summit')) symbols.push('mountain');
  if (text.includes('tree') || text.includes('forest') || text.includes('seed')) symbols.push('tree_of_life');
  if (text.includes('star') || text.includes('constellation') || text.includes('heaven')) symbols.push('celestial');

  return symbols;
}

/**
 * Infer temporal setting from myth content.
 */
function inferTemporalSetting(myth: Myth): string {
  const text = myth.fullText.toLowerCase();

  if (text.includes('in the beginning') || text.includes('before time') || text.includes('when the world was new')) return 'primordial';
  if (text.includes('long ago') || text.includes('in ancient times') || text.includes('our ancestors')) return 'mythic_past';
  if (text.includes('recently') || text.includes('just yesterday') || text.includes('not long ago')) return 'recent';
  if (text.includes('will come') || text.includes('shall be') || text.includes('one day')) return 'future';

  return 'mythic_past'; // Default
}

/**
 * Extract moral from myth text if present.
 */
function extractMoral(myth: Myth): string | undefined {
  const text = myth.fullText;

  // Look for explicit moral markers
  const moralPatterns = [
    /and so we learn that (.+?)[.!]/i,
    /this teaches us (.+?)[.!]/i,
    /from this we know that (.+?)[.!]/i,
    /thus we see (.+?)[.!]/i,
    /the lesson is (.+?)[.!]/i,
  ];

  for (const pattern of moralPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return undefined;
}

/**
 * Infer myth category from trait implications.
 */
function inferCategoryFromTraits(myth: Myth): string {
  const traits = myth.traitImplications;

  for (const t of traits) {
    if (t.trait === 'benevolence' && t.direction === 'positive') return 'blessing_tale';
    if (t.trait === 'wrathfulness' && t.direction === 'positive') return 'punishment_tale';
    if (t.trait === 'interventionism' && t.direction === 'positive') return 'answered_prayer';
    if (t.trait === 'compassion' && t.direction === 'positive') return 'healing_miracle';
    if (t.trait === 'courage') return 'champion_tale';
    if (t.trait === 'wisdom') return 'parable';
  }

  return 'nature_tale';
}

/**
 * Convert an internal MVEE Myth to the cross-game PortableMyth format.
 */
export function exportMyth(
  myth: Myth,
  deity?: DeityComponent,
  universeId?: string,
  mutations?: PortableMythMutation[]
): PortableMyth {
  // Extract deity personality traits from identity.perceivedPersonality
  const deityPersonality: PortableMyth['deityPersonality'] = {};
  if (deity !== undefined) {
    const p = deity.identity.perceivedPersonality;
    deityPersonality.benevolence = p.benevolence;
    deityPersonality.interventionism = p.interventionism;
    deityPersonality.wrathfulness = p.wrathfulness;
    deityPersonality.mysteriousness = p.mysteriousness;
    deityPersonality.generosity = p.generosity;
    deityPersonality.consistency = p.consistency;
  }

  // Extract deity domains from identity
  const deityDomains: string[] = [];
  if (deity !== undefined) {
    if (deity.identity.domain !== undefined) {
      deityDomains.push(deity.identity.domain);
    }
    for (const d of deity.identity.secondaryDomains) {
      deityDomains.push(d);
    }
  }

  // Determine category from trait implications
  const category = myth.traitImplications.length > 0
    ? inferCategoryFromTraits(myth)
    : 'miracle';

  return {
    mythId: myth.id,
    sourceGame: 'mvee',
    sourceUniverseId: universeId,
    version: myth.currentVersion,

    title: myth.title,
    summary: myth.summary,
    fullText: myth.fullText,
    category,

    deityDomains,
    deityPersonality,
    linguisticMarkers: extractLinguisticMarkers(myth),

    motifs: extractMotifs(myth),
    symbols: extractSymbols(myth),
    temporalSetting: inferTemporalSetting(myth),
    moral: extractMoral(myth),

    originalEvent: myth.originalEvent !== undefined ? {
      type: myth.originalEvent,
      description: `Event: ${myth.originalEvent}`,
      gameTimestamp: myth.creationTime,
    } : undefined,
    mutations: mutations ?? [],
    canonicityScore: computeCanonicityScore(myth),
    status: myth.status,

    exportedAt: new Date().toISOString(),
    tellingCount: myth.tellingCount,
    believerCount: myth.knownBy.length,
  };
}

/**
 * Get all myths eligible for cross-game export from a mythology component.
 * Export criteria: canonicityScore > 0.7 AND believerCount > 20
 */
export function getExportableMyths(
  mythology: MythologyComponent,
  deity?: DeityComponent,
  universeId?: string
): PortableMyth[] {
  const exportable: PortableMyth[] = [];

  for (const myth of mythology.myths) {
    const score = computeCanonicityScore(myth);
    if (score > 0.7 && myth.knownBy.length > 20) {
      exportable.push(exportMyth(myth, deity, universeId));
    }
  }

  return exportable;
}
