/**
 * Renders a parallax starfield on a Canvas2D context.
 * Creates the feeling of hurtling through space when the camera scrolls
 * above the ship's top boundary (world Y < shipTopWorldY).
 *
 * Three depth layers — far, mid, near — each with independent parallax
 * factors and drift driven by ship velocity.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StarData {
  /** Base world X position within virtual field [0, FIELD_WIDTH) */
  baseX: number;
  /** Base world Y position within virtual field [0, FIELD_HEIGHT) */
  baseY: number;
  /** Rendered radius in screen pixels */
  size: number;
  /** CSS color string (constant per star) */
  color: string;
}

interface Layer {
  stars: StarData[];
  /** Fraction of camera movement that this layer tracks */
  parallaxFactor: number;
  /** Use arc() for near layer, fillRect() for far/mid */
  useArc: boolean;
  /** Number of stars to populate */
  count: number;
}

// ---------------------------------------------------------------------------
// Constants — zero re-allocation during render
// ---------------------------------------------------------------------------

/** Width of the repeating virtual star field (world units) */
const FIELD_WIDTH = 10000;
/** Height of the repeating virtual star field (world units) */
const FIELD_HEIGHT = 5000;

const TWO_PI = Math.PI * 2;

// Layer definitions (counts, factor, draw mode)
const FAR_COUNT = 200;
const MID_COUNT = 80;
const NEAR_COUNT = 30;

const FAR_PARALLAX = 0.05;
const MID_PARALLAX = 0.15;
const NEAR_PARALLAX = 0.3;

// ---------------------------------------------------------------------------
// Deterministic seeded RNG — same algorithm used in ProceduralShapeRenderer
// ---------------------------------------------------------------------------

function makeRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ---------------------------------------------------------------------------
// Star colour helpers
// ---------------------------------------------------------------------------

function farColor(rng: () => number): string {
  // Dim white-blue tones
  const r = Math.floor(160 + rng() * 60);
  const g = Math.floor(160 + rng() * 60);
  const b = Math.floor(200 + rng() * 55);
  const a = (0.35 + rng() * 0.35).toFixed(2);
  return `rgba(${r},${g},${b},${a})`;
}

function midColor(rng: () => number): string {
  // White / pale yellow
  const warm = rng() < 0.4;
  if (warm) {
    const r = Math.floor(230 + rng() * 25);
    const g = Math.floor(210 + rng() * 30);
    const b = Math.floor(140 + rng() * 60);
    return `rgba(${r},${g},${b},${(0.65 + rng() * 0.25).toFixed(2)})`;
  }
  const v = Math.floor(220 + rng() * 35);
  return `rgba(${v},${v},${v},${(0.60 + rng() * 0.30).toFixed(2)})`;
}

function nearColor(rng: () => number): string {
  // Bright white, occasionally slightly blue-white
  const blueTint = rng() < 0.25;
  if (blueTint) {
    return `rgba(200,220,255,${(0.85 + rng() * 0.15).toFixed(2)})`;
  }
  return `rgba(255,255,255,${(0.88 + rng() * 0.12).toFixed(2)})`;
}

// ---------------------------------------------------------------------------
// Layer factory
// ---------------------------------------------------------------------------

function buildLayer(
  count: number,
  parallaxFactor: number,
  useArc: boolean,
  sizeMin: number,
  sizeMax: number,
  colorFn: (rng: () => number) => string,
  seed: number
): Layer {
  const rng = makeRng(seed);
  const stars: StarData[] = new Array(count);

  for (let i = 0; i < count; i++) {
    stars[i] = {
      baseX: rng() * FIELD_WIDTH,
      baseY: rng() * FIELD_HEIGHT,
      size: sizeMin + rng() * (sizeMax - sizeMin),
      color: colorFn(rng),
    };
  }

  return { stars, parallaxFactor, useArc, count };
}

// ---------------------------------------------------------------------------
// StarfieldRenderer
// ---------------------------------------------------------------------------

/**
 * Parallax starfield renderer for the space region above the ship deck.
 *
 * Usage:
 *   const sf = new StarfieldRenderer();
 *   // each frame:
 *   sf.update(vx, vy, deltaMs);
 *   sf.render(ctx, camera.x, camera.y, camera.zoom, w, h, shipTopWorldY);
 */
export class StarfieldRenderer {
  // Pre-generated layers
  private readonly layerFar: Layer;
  private readonly layerMid: Layer;
  private readonly layerNear: Layer;

  // Drift accumulator (in virtual field units)
  private driftX = 0;
  private driftY = 0;

  // Elapsed time in ms — used for near-star twinkle
  private timeMs = 0;

  constructor() {
    this.layerFar = buildLayer(
      FAR_COUNT,
      FAR_PARALLAX,
      false,
      0.5, 1.0,
      farColor,
      0xf7a1
    );
    this.layerMid = buildLayer(
      MID_COUNT,
      MID_PARALLAX,
      false,
      1.0, 2.0,
      midColor,
      0xb3c9
    );
    this.layerNear = buildLayer(
      NEAR_COUNT,
      NEAR_PARALLAX,
      true,
      2.0, 3.0,
      nearColor,
      0x4d82
    );
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  /**
   * Accumulates drift from ship velocity.
   * Stars move opposite to velocity direction (parallax scroll).
   *
   * @param velocityX  Ship velocity in world units / second, X axis
   * @param velocityY  Ship velocity in world units / second, Y axis
   * @param deltaMs    Time since last frame in milliseconds
   */
  update(velocityX: number, velocityY: number, deltaMs: number): void {
    const dt = deltaMs / 1000; // seconds
    // Stars drift opposite to ship velocity
    this.driftX -= velocityX * dt;
    this.driftY -= velocityY * dt;
    this.timeMs += deltaMs;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  /**
   * Draw the parallax starfield.
   * Only renders in the screen region corresponding to world Y < shipTopWorldY.
   *
   * @param ctx            Canvas 2D rendering context
   * @param cameraX        Camera world X
   * @param cameraY        Camera world Y
   * @param cameraZoom     Camera zoom factor
   * @param canvasWidth    Canvas width in pixels
   * @param canvasHeight   Canvas height in pixels
   * @param shipTopWorldY  World Y of the ship's top deck boundary
   */
  render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    cameraZoom: number,
    canvasWidth: number,
    canvasHeight: number,
    shipTopWorldY: number
  ): void {
    // Compute screen Y of the ship top boundary
    const halfW = canvasWidth / 2;
    const halfH = canvasHeight / 2;
    const shipTopScreenY = (shipTopWorldY - cameraY) * cameraZoom + halfH;

    // Space region is entirely below the canvas — nothing to draw
    if (shipTopScreenY <= 0) return;

    // Clip height is how many pixels of the canvas are "space"
    const clipHeight = Math.min(shipTopScreenY, canvasHeight);
    if (clipHeight <= 0) return;

    ctx.save();

    // Clip to the space portion of the canvas (top of canvas to ship top)
    ctx.beginPath();
    ctx.rect(0, 0, canvasWidth, clipHeight);
    ctx.clip();

    this.renderLayer(ctx, this.layerFar,  cameraX, cameraY, cameraZoom, canvasWidth, canvasHeight, halfW, halfH, clipHeight, false);
    this.renderLayer(ctx, this.layerMid,  cameraX, cameraY, cameraZoom, canvasWidth, canvasHeight, halfW, halfH, clipHeight, false);
    this.renderLayer(ctx, this.layerNear, cameraX, cameraY, cameraZoom, canvasWidth, canvasHeight, halfW, halfH, clipHeight, true);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private renderLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    cameraX: number,
    cameraY: number,
    zoom: number,
    canvasWidth: number,
    canvasHeight: number,
    halfW: number,
    halfH: number,
    clipHeight: number,
    isNear: boolean
  ): void {
    const { stars, parallaxFactor, useArc, count } = layer;

    // Parallax offset = camera contribution + accumulated drift
    const offsetX = cameraX * parallaxFactor + this.driftX;
    const offsetY = cameraY * parallaxFactor + this.driftY;

    // Time-based twinkle phase for near stars
    const twinklePhase = this.timeMs * 0.002; // cycles ~once per 3 s

    for (let i = 0; i < count; i++) {
      const star = stars[i]!;

      // Apply parallax offset with wrapping within the virtual field
      const wx = ((star.baseX - offsetX) % FIELD_WIDTH + FIELD_WIDTH) % FIELD_WIDTH;
      const wy = ((star.baseY - offsetY) % FIELD_HEIGHT + FIELD_HEIGHT) % FIELD_HEIGHT;

      // Project into screen space (field treated as centred at world origin)
      const screenX = (wx - FIELD_WIDTH * 0.5) * zoom + halfW;
      const screenY = (wy - FIELD_HEIGHT * 0.5) * zoom + halfH;

      // Off-screen horizontal cull
      const screenSize = star.size * zoom;
      if (screenX + screenSize < 0 || screenX - screenSize > canvasWidth) continue;

      // Vertical cull — must be inside the clip region
      if (screenY + screenSize < 0 || screenY - screenSize > clipHeight) continue;

      let alpha = 1.0;
      if (isNear) {
        // Gentle alpha oscillation for near stars (orbit / low velocity context)
        alpha = 0.75 + 0.25 * Math.sin(twinklePhase + i * 1.618);
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;

      if (useArc) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenSize, 0, TWO_PI);
        ctx.fill();
      } else {
        // fillRect is faster for tiny dots
        const d = Math.max(1, screenSize * 2);
        ctx.fillRect(screenX - screenSize, screenY - screenSize, d, d);
      }
    }

    // Restore globalAlpha after per-star modifications
    ctx.globalAlpha = 1.0;
  }
}
