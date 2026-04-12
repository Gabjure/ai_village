/**
 * Wisdom Goddess Sprite Registry
 *
 * Maps wisdom goddess names to their PixelLab sprite folders.
 * These are AI-generated character sprites with 8-directional views.
 *
 * The Goddess of Wisdom scrutinizes LLM-generated technologies and
 * magic effects before they enter the world.
 */

/** Wisdom goddess configuration */
export interface WisdomGoddessConfig {
  /** Internal name/ID */
  name: string;
  /** PixelLab sprite folder ID (in /assets/sprites/pixellab/wisdom-goddesses/) */
  spriteFolder: string;
  /** Cultural/thematic origin */
  origin: string;
  /** Description for flavor text */
  description: string;
  /** Personality traits affecting scrutiny style */
  scrutinyStyle: 'strict' | 'encouraging' | 'curious' | 'pragmatic';
  /** Whether this deity resents being called a "goddess" */
  resentsGoddessTitle?: boolean;
  /** Preferred title if they resent "goddess" */
  preferredTitle?: string;
}

/**
 * Registry of all available wisdom goddesses with their sprite assignments
 */
export const WISDOM_GODDESS_REGISTRY: WisdomGoddessConfig[] = [
  {
    name: 'The Archivist',
    spriteFolder: 'archivist-quill',
    origin: 'Invisible College / Thornhaven',
    description:
      'Ancient figure of unknown age, draped in layered catalogues of pressed vellum, fingers stained with ink that never dries. The quill behind its ear has been writing the same sentence for three centuries.',
    scrutinyStyle: 'strict',
  },
  {
    name: 'Weaver of Loomspire',
    spriteFolder: 'loomspire-weaver',
    origin: 'Loomspire tradition',
    description:
      'An entity whose form is woven from living thread — each strand a stored question, each knot an answered thing. When it moves, the threads rearrange. No two observers see the same pattern.',
    scrutinyStyle: 'encouraging',
  },
  {
    name: 'Draugrn Scribe',
    spriteFolder: 'draugrn-scribe',
    origin: 'Deep Underground archivists',
    description:
      'Pale beyond pale, eyes adapted for reading by mineral glow alone. Carries tablets of compressed stone rather than paper. Its silence is the silence of the deep earth — absolute, and full of things recorded.',
    scrutinyStyle: 'pragmatic',
  },
  {
    name: 'Quetzali Sage',
    spriteFolder: 'quetzali-sage',
    origin: 'Quetzali Teachers',
    description:
      'A presence that asks before it answers, and answers only with further questions. Its plumage shifts color with the temperature of an idea. Known to vanish mid-conversation to test whether the seeker will continue without it.',
    scrutinyStyle: 'curious',
  },
  {
    name: 'Anansi-Web Lorekeeper',
    spriteFolder: 'anansi-lorekeeper',
    origin: 'Anansi-Web knowledge network',
    description:
      'Distributed presence that speaks through any node in its web. What you address is only one thread; the rest are listening. Warm in the way that patient attention is warm — total, unhurried, already knowing the ending.',
    scrutinyStyle: 'encouraging',
  },
  {
    name: 'Draugrn Archivist',
    spriteFolder: 'draugrn-archivist',
    origin: 'Deep Underground archivists',
    description:
      'Senior keeper of the deep stacks, its memory organized by geological stratum. It does not forget — it files. When it rejects a submission, it returns it with the precise notation of what is missing and where the gap began.',
    scrutinyStyle: 'strict',
  },
];

/**
 * Get a wisdom goddess configuration by name
 */
export function getWisdomGoddessByName(name: string): WisdomGoddessConfig | undefined {
  return WISDOM_GODDESS_REGISTRY.find((goddess) => goddess.name === name);
}

/**
 * Get a wisdom goddess configuration by index (cycles through registry)
 */
export function getWisdomGoddessByIndex(index: number): WisdomGoddessConfig {
  const safeIndex = index % WISDOM_GODDESS_REGISTRY.length;
  return WISDOM_GODDESS_REGISTRY[safeIndex]!;
}

/**
 * Get a random wisdom goddess configuration
 */
export function getRandomWisdomGoddess(): WisdomGoddessConfig {
  const index = Math.floor(Math.random() * WISDOM_GODDESS_REGISTRY.length);
  return WISDOM_GODDESS_REGISTRY[index]!;
}

/**
 * Get all wisdom goddess names
 */
export function getAllWisdomGoddessNames(): string[] {
  return WISDOM_GODDESS_REGISTRY.map((goddess) => goddess.name);
}

/**
 * Get sprite folder path for a wisdom goddess
 */
export function getWisdomGoddessSpritePath(config: WisdomGoddessConfig): string {
  return `wisdom-goddesses/${config.spriteFolder}`;
}
