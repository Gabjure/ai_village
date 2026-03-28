/**
 * Parses emotes from LLM speaking text.
 * Emotes are text wrapped in *asterisks* like *gurgle* or *looks around*.
 * Extracts them, classifies them, and returns clean speech without emotes.
 */

export type EmoteType = 'sound' | 'action' | 'expression';

export interface ParsedEmote {
  text: string;       // The emote text without asterisks
  type: EmoteType;    // Classification
  glyph: string;      // Emoji/glyph to display
}

export interface EmoteParseResult {
  cleanSpeech: string;       // Speaking text with emotes stripped
  emotes: ParsedEmote[];     // Extracted emotes
}

// Sound emotes — should eventually trigger audio
const SOUND_EMOTES = new Set([
  'gurgle', 'gurgling', 'gurgles',
  'whimper', 'whimpering', 'whimpers',
  'coo', 'cooing', 'coos',
  'growl', 'growling', 'growls',
  'squeal', 'squealing', 'squeals',
  'giggle', 'giggling', 'giggles',
  'laugh', 'laughing', 'laughs',
  'sigh', 'sighing', 'sighs',
  'hum', 'humming', 'hums',
  'babble', 'babbling', 'babbles',
  'sneeze', 'sneezing', 'sneezes',
  'hiccup', 'hiccupping', 'hiccups',
  'purr', 'purring', 'purrs',
  'chirp', 'chirping', 'chirps',
  'click', 'clicking', 'clicks',
  'cry', 'crying', 'cries',
  'sob', 'sobbing', 'sobs',
  'gasp', 'gasping', 'gasps',
  'grunt', 'grunting', 'grunts',
  'murmur', 'murmuring', 'murmurs',
  'yell', 'yelling', 'yells',
  'shriek', 'shrieking', 'shrieks',
  'chuckle', 'chuckling', 'chuckles',
  'snore', 'snoring', 'snores',
  'cough', 'coughing', 'coughs',
]);

// Action emotes — show floating glyph
const ACTION_KEYWORDS = [
  'look', 'tilt', 'reach', 'bounce', 'hide', 'wave', 'nod',
  'shake', 'point', 'walk', 'run', 'jump', 'crawl', 'stretch',
  'sit', 'stand', 'lean', 'turn', 'duck', 'peek', 'step',
  'stumble', 'dance', 'spin', 'roll', 'clap', 'grab', 'push',
  'pull', 'kick', 'stomp', 'poke', 'hug', 'pat', 'rub',
  'scratch', 'pick', 'drop', 'throw', 'catch',
];

// Expression emotes — brief expression glyph
const EXPRESSION_KEYWORDS = [
  'smile', 'frown', 'yawn', 'blink', 'wince', 'grin', 'pout',
  'blush', 'glare', 'stare', 'squint', 'scowl', 'smirk', 'beam',
  'grimace',
];

// Glyph mapping for emote types and specific emotes
const EMOTE_GLYPHS: Record<string, string> = {
  // Sound glyphs
  gurgle: '🫧', gurgles: '🫧', gurgling: '🫧',
  giggle: '😄', giggles: '😄', giggling: '😄',
  laugh: '😂', laughs: '😂', laughing: '😂',
  chuckle: '😄', chuckles: '😄', chuckling: '😄',
  cry: '😢', cries: '😢', crying: '😢',
  sob: '😭', sobs: '😭', sobbing: '😭',
  sigh: '😮‍💨', sighs: '😮‍💨', sighing: '😮‍💨',
  gasp: '😲', gasps: '😲', gasping: '😲',
  yell: '📢', yells: '📢', yelling: '📢',
  shriek: '😱', shrieks: '😱', shrieking: '😱',
  sneeze: '🤧', sneezes: '🤧', sneezing: '🤧',
  cough: '😷', coughs: '😷', coughing: '😷',
  hiccup: '🫢', hiccups: '🫢', hiccupping: '🫢',
  purr: '😺', purrs: '😺', purring: '😺',
  hum: '🎵', hums: '🎵', humming: '🎵',
  snore: '💤', snores: '💤', snoring: '💤',
  // Expression glyphs
  smile: '😊', smiles: '😊', smiling: '😊',
  frown: '😟', frowns: '😟', frowning: '😟',
  yawn: '🥱', yawns: '🥱', yawning: '🥱',
  grin: '😁', grins: '😁', grinning: '😁',
  blush: '😊', blushes: '😊', blushing: '😊',
  wince: '😣', winces: '😣', wincing: '😣',
  scowl: '😠', scowls: '😠', scowling: '😠',
  // Action glyphs
  wave: '👋', waves: '👋', waving: '👋',
  nod: '🙂', nods: '🙂', nodding: '🙂',
  hug: '🤗', hugs: '🤗', hugging: '🤗',
  dance: '💃', dances: '💃', dancing: '💃',
  clap: '👏', claps: '👏', clapping: '👏',
  point: '👉', points: '👉', pointing: '👉',
};

// Default glyphs per type
const DEFAULT_GLYPHS: Record<EmoteType, string> = {
  sound: '🎵',
  action: '✨',
  expression: '💭',
};

/**
 * Classify an emote string into sound/action/expression.
 */
function classifyEmote(emoteText: string): EmoteType {
  const lower = emoteText.toLowerCase().trim();

  // Check if it's a single-word sound emote
  if (SOUND_EMOTES.has(lower)) {
    return 'sound';
  }

  // Check if the first word is a sound (for phrases like "gurgling softly")
  const firstWord = lower.split(/\s+/)[0];
  if (firstWord && SOUND_EMOTES.has(firstWord)) {
    return 'sound';
  }

  // Check for expression keywords
  for (const keyword of EXPRESSION_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'expression';
    }
  }

  // Check for action keywords
  for (const keyword of ACTION_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'action';
    }
  }

  // Default: treat as action (most emotes describe physical actions)
  return 'action';
}

/**
 * Get the display glyph for an emote.
 */
function getEmoteGlyph(emoteText: string, emoteType: EmoteType): string {
  const lower = emoteText.toLowerCase().trim();
  const firstWord = lower.split(/\s+/)[0];

  // Try exact match first, then first word
  if (firstWord && EMOTE_GLYPHS[firstWord]) {
    return EMOTE_GLYPHS[firstWord];
  }

  // Try any word in the emote text
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (EMOTE_GLYPHS[word]) {
      return EMOTE_GLYPHS[word];
    }
  }

  return DEFAULT_GLYPHS[emoteType];
}

/**
 * Parse emotes from a speaking string.
 * Extracts *emote text* patterns, classifies them, and returns clean speech.
 *
 * Examples:
 *   "*gurgle* hello" → { cleanSpeech: "hello", emotes: [{ text: "gurgle", type: "sound", glyph: "🫧" }] }
 *   "*looks around* hi *waves*" → { cleanSpeech: "hi", emotes: [...] }
 *   "hello world" → { cleanSpeech: "hello world", emotes: [] }
 */
export function parseEmotes(speaking: string): EmoteParseResult {
  if (!speaking) {
    return { cleanSpeech: '', emotes: [] };
  }

  const emotes: ParsedEmote[] = [];
  // Match *emote text* patterns — non-greedy, allowing spaces inside
  const emoteRegex = /\*([^*]+)\*/g;

  let match: RegExpExecArray | null;
  while ((match = emoteRegex.exec(speaking)) !== null) {
    const rawEmoteText = match[1];
    if (!rawEmoteText) {
      continue;
    }
    const emoteText = rawEmoteText.trim();
    if (emoteText) {
      const type = classifyEmote(emoteText);
      emotes.push({
        text: emoteText,
        type,
        glyph: getEmoteGlyph(emoteText, type),
      });
    }
  }

  // Strip emotes from speech and clean up whitespace
  const cleanSpeech = speaking
    .replace(emoteRegex, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { cleanSpeech, emotes };
}
