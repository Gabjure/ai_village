/**
 * generate-sprite-manifest.ts
 *
 * Build-time script that scans the pixellab sprites directory and generates
 * a manifest JSON file. This replaces per-sprite HEAD requests at runtime
 * with a single manifest fetch — critical for mobile performance.
 *
 * Usage:
 *   npx tsx custom_game_engine/scripts/generate-sprite-manifest.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpriteEntry {
  size: number;
  directions: number;
  hasAnimations: boolean;
}

interface SpriteManifest {
  generatedAt: number;
  sprites: Record<string, SpriteEntry>;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PIXELLAB_DIR = path.join(REPO_ROOT, 'packages/renderer/assets/sprites/pixellab');
const OUTPUT_PATH = path.join(REPO_ROOT, 'packages/renderer/assets/sprites/sprite-manifest.json');

// ---------------------------------------------------------------------------
// Metadata parsers
// ---------------------------------------------------------------------------

/**
 * Extract sprite entry from a flat metadata.json (PixelLab-generated static sprites).
 *
 * Example flat format:
 *   { "id": "adder", "size": 48, "type": "static", ... }
 *
 * Example character format (with nested size object and directions):
 *   { "character": { "size": { "width": 48, "height": 48 }, "directions": 8, ... }, ... }
 */
function parseMetadataJson(filePath: string): Omit<SpriteEntry, 'hasAnimations'> | null {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }

  // Character format: { character: { size: { width, height }, directions } }
  if (data['character'] && typeof data['character'] === 'object') {
    const character = data['character'] as Record<string, unknown>;
    const sizeObj = character['size'];
    let size = 48; // default
    if (sizeObj && typeof sizeObj === 'object') {
      const so = sizeObj as Record<string, unknown>;
      if (typeof so['width'] === 'number') {
        size = so['width'];
      }
    } else if (typeof sizeObj === 'number') {
      size = sizeObj;
    }
    const directions = typeof character['directions'] === 'number' ? character['directions'] : 4;
    return { size, directions };
  }

  // Flat format: { size: 48, ... }
  const size = typeof data['size'] === 'number' ? data['size'] : 48;
  // Flat format rarely has directions; default to 4 for static sprites
  const directions = typeof data['directions'] === 'number' ? data['directions'] : 4;
  return { size, directions };
}

/**
 * Extract sprite entry from a sprite-set.json (soul/dynamic sprite format).
 *
 * Format:
 *   { config: { size: 16, directions: 1, animations: [] }, ... }
 */
function parseSpriteSetJson(filePath: string): Omit<SpriteEntry, 'hasAnimations'> | null {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (data['config'] && typeof data['config'] === 'object') {
    const config = data['config'] as Record<string, unknown>;
    const size = typeof config['size'] === 'number' ? config['size'] : 48;
    const directions = typeof config['directions'] === 'number' ? config['directions'] : 4;
    return { size, directions };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Animations check
// ---------------------------------------------------------------------------

/**
 * Returns true if the sprite folder has an animations/ subdirectory with at
 * least one frame directory inside it.
 */
function hasAnimationsDir(spriteDir: string): boolean {
  const animDir = path.join(spriteDir, 'animations');
  if (!fs.existsSync(animDir)) return false;
  try {
    const entries = fs.readdirSync(animDir, { withFileTypes: true });
    // At least one subdirectory (animation name) with content
    return entries.some(e => e.isDirectory());
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Directory scanner
// ---------------------------------------------------------------------------

/**
 * Recursively scan a directory for sprite folders.
 *
 * A sprite folder is any directory that contains metadata.json or
 * sprite-set.json directly (not further nested).
 *
 * Returns a map from sprite ID (relative path from PIXELLAB_DIR, using
 * forward slashes) to the sprite entry data.
 */
function scanDirectory(
  dir: string,
  baseDir: string,
  sprites: Record<string, SpriteEntry>,
  depth: number = 0,
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const hasMetadata = entries.some(e => e.isFile() && e.name === 'metadata.json');
  const hasSpriteSet = entries.some(e => e.isFile() && e.name === 'sprite-set.json');

  if (hasMetadata || hasSpriteSet) {
    // This is a sprite folder — parse it
    let parsed: Omit<SpriteEntry, 'hasAnimations'> | null = null;

    if (hasMetadata) {
      parsed = parseMetadataJson(path.join(dir, 'metadata.json'));
    }
    if (!parsed && hasSpriteSet) {
      parsed = parseSpriteSetJson(path.join(dir, 'sprite-set.json'));
    }

    if (parsed) {
      const relPath = path.relative(baseDir, dir).split(path.sep).join('/');
      sprites[relPath] = {
        ...parsed,
        hasAnimations: hasAnimationsDir(dir),
      };
    }
    // Don't recurse further — sprite folders don't nest sprite folders
    return;
  }

  // Not a sprite folder — recurse into subdirectories (up to depth 2)
  if (depth < 2) {
    for (const entry of entries) {
      if (entry.isDirectory()) {
        scanDirectory(path.join(dir, entry.name), baseDir, sprites, depth + 1);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  if (!fs.existsSync(PIXELLAB_DIR)) {
    throw new Error(`Pixellab sprites directory not found: ${PIXELLAB_DIR}`);
  }

  console.error(`[generate-sprite-manifest] Scanning: ${PIXELLAB_DIR}`);

  const sprites: Record<string, SpriteEntry> = {};

  // Scan each immediate subdirectory of PIXELLAB_DIR separately.
  // We never treat PIXELLAB_DIR itself as a sprite folder — it may have a
  // stray metadata.json at its root that would prematurely stop recursion.
  let topEntries: fs.Dirent[];
  try {
    topEntries = fs.readdirSync(PIXELLAB_DIR, { withFileTypes: true });
  } catch (e) {
    throw new Error(`Cannot read pixellab directory: ${e}`);
  }

  for (const entry of topEntries) {
    if (entry.isDirectory()) {
      scanDirectory(path.join(PIXELLAB_DIR, entry.name), PIXELLAB_DIR, sprites, 0);
    }
  }

  const manifest: SpriteManifest = {
    generatedAt: Date.now(),
    sprites,
  };

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  const count = Object.keys(sprites).length;
  console.error(`[generate-sprite-manifest] Done. ${count} sprites written to: ${OUTPUT_PATH}`);

  // Print summary to stdout for CI/build consumption
  console.log(JSON.stringify({ spriteCount: count, outputPath: OUTPUT_PATH }));
}

main();
