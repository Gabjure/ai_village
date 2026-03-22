import type { Camera } from './Camera.js';

export interface FloatingText {
  text: string;
  worldX: number;
  worldY: number;
  color: string;
  startTime: number;
  duration: number;
  active: boolean; // For object pooling
  driftX: number;  // Horizontal drift in pixels for organic rise effect
}

/**
 * Renders floating text (like "+10 Wood") that fades and floats upward.
 * Uses object pooling to minimize GC pressure.
 * Used for visual feedback when gathering resources, completing tasks, etc.
 */
export class FloatingTextRenderer {
  private texts: FloatingText[] = [];
  private pool: FloatingText[] = []; // Object pool for reuse

  // Pre-set font and alignment once, then just restore the specific properties we change
  private static readonly FONT = 'bold 14px monospace';
  private static readonly RISE_DISTANCE = 30; // pixels

  /**
   * Acquire a floating text from pool or create new one.
   */
  private acquireText(): FloatingText {
    if (this.pool.length > 0) {
      const ft = this.pool.pop()!;
      ft.active = true;
      return ft;
    }
    return {
      text: '',
      worldX: 0,
      worldY: 0,
      color: '',
      startTime: 0,
      duration: 0,
      active: true,
      driftX: 0,
    };
  }

  /**
   * Return a floating text to the pool.
   */
  private releaseText(ft: FloatingText): void {
    ft.active = false;
    this.pool.push(ft);
  }

  /**
   * Add a new floating text at the given world position.
   */
  add(text: string, worldX: number, worldY: number, color: string = '#FFFFFF', duration: number = 2000): void {
    const ft = this.acquireText();
    ft.text = text;
    ft.worldX = worldX;
    ft.worldY = worldY;
    ft.color = color;
    ft.startTime = Date.now();
    ft.duration = duration;
    // Small random horizontal drift (±10px) so simultaneous popups don't stack identically
    ft.driftX = (Math.random() - 0.5) * 20;
    this.texts.push(ft);
  }

  /**
   * Render all active floating texts.
   * Uses in-place removal to avoid array allocations.
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera, currentTime: number): void {
    if (this.texts.length === 0) return;

    // Cache frequently accessed values
    const cameraX = camera.x;
    const cameraY = camera.y;
    const zoom = camera.zoom;
    const halfWidth = ctx.canvas.width / 2;
    const halfHeight = ctx.canvas.height / 2;

    // Set up text rendering properties once
    ctx.save();
    ctx.font = FloatingTextRenderer.FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // In-place removal with forward iteration
    let writeIndex = 0;
    for (let i = 0; i < this.texts.length; i++) {
      const ft = this.texts[i]!;
      const elapsed = currentTime - ft.startTime;

      if (elapsed >= ft.duration) {
        // Return to pool instead of discarding
        this.releaseText(ft);
        continue;
      }

      // Keep this text - move to writeIndex if needed
      if (writeIndex !== i) {
        this.texts[writeIndex] = ft;
      }
      writeIndex++;

      const progress = elapsed / ft.duration; // 0 to 1

      // Calculate screen position
      const screenX = (ft.worldX - cameraX) * zoom + halfWidth;
      const screenY = (ft.worldY - cameraY) * zoom + halfHeight;

      // Float upward and drift sideways over time (ease-out for natural deceleration)
      const ease = 1 - (1 - progress) * (1 - progress);
      const offsetY = -ease * FloatingTextRenderer.RISE_DISTANCE;
      const offsetX = ft.driftX * ease;

      // Pop-in scale: 1.4 → 1.0 during first 15%, then hold at 1.0
      const POP_IN_END = 0.15;
      const scale = progress < POP_IN_END
        ? 1.4 - 0.4 * (progress / POP_IN_END)
        : 1.0;

      // Hold full opacity during pop-in, then fade out
      ctx.globalAlpha = progress < POP_IN_END ? 1 : 1 - (progress - POP_IN_END) / (1 - POP_IN_END);
      ctx.fillStyle = ft.color;

      const drawX = screenX + offsetX;
      const drawY = screenY + offsetY;

      if (scale !== 1.0) {
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.scale(scale, scale);
        ctx.fillText(ft.text, 0, 0);
        ctx.restore();
        // Restore shadow settings cleared by ctx.save/restore
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
      } else {
        ctx.fillText(ft.text, drawX, drawY);
      }
    }

    ctx.restore();

    // Truncate array to remove dead texts
    this.texts.length = writeIndex;
  }

  /**
   * Clear all floating texts and return them to pool.
   */
  clear(): void {
    for (const ft of this.texts) {
      this.releaseText(ft);
    }
    this.texts.length = 0;
  }

  /**
   * Get the number of active floating texts.
   */
  getActiveCount(): number {
    return this.texts.length;
  }
}
