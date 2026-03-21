/**
 * CivChronicleToastRenderer — parchment-style toast notifications for civilization milestones.
 *
 * Visual style: warm amber/parchment "chronicle scroll" aesthetic.
 * Position: bottom-left corner (distinct from patron spirit toasts top-right).
 *
 * Toasts auto-dismiss after ~4 seconds. Queue when one is already visible.
 * Deduplication: brief cooldown between same-type events.
 *
 * Task: MUL-2338 (Drive 2 — Civilization Chronicle UI)
 */

export interface CivChronicleToastPayload {
  type: string;      // event type key
  agentName?: string; // may be absent for some events
  summary: string;
}

interface ActiveToast extends CivChronicleToastPayload {
  startMs: number;
}

const TOAST_DURATION_MS = 4000;
const FADE_IN_MS = 300;
const FADE_OUT_MS = 600;
const COOLDOWN_MS = 2000;
const TOAST_W = 300;
const TOAST_H = 72;
const TOAST_MARGIN_LEFT = 12;
const TOAST_MARGIN_BOTTOM = 60;

const MILESTONE_ICONS: Record<string, string> = {
  'civilization:biome_discovered':    '🗺️',
  'civilization:biome_settled':       '🏗️',
  'civilization:biome_explored':      '🧭',
  'civilization:terrain_transformed': '🌍',
  'civilization:resource_extracted':  '⛏️',
  'milestone:first_local_trade':          '🤝',
  'milestone:first_inter_village_trade':  '🏘️',
  'milestone:first_temporal_trade':       '⏳',
  'milestone:first_cross_universe_trade': '🌌',
  'milestone:first_cross_multiverse_trade':'✨',
  'milestone:first_agent_death_witnessed':'💀',
  'milestone:first_building_completed':   '🏠',
  'milestone:first_research_completed':   '📚',
  'milestone:first_magic_learned':        '🔮',
  'milestone:first_spaceship_launched':   '🚀',
  'milestone:angel_bond_formed':          '👼',
  'milestone:post_temporal_multiversal':  '🌀',
  'milestone:the_revelation':             '👁️',
};

export class CivChronicleToastRenderer {
  private ctx: CanvasRenderingContext2D;
  private active: ActiveToast | null = null;
  private queue: CivChronicleToastPayload[] = [];
  private lastShownByType: Map<string, number> = new Map();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  show(payload: CivChronicleToastPayload): void {
    const now = performance.now();
    const lastShown = this.lastShownByType.get(payload.type) ?? 0;
    if (now - lastShown < COOLDOWN_MS) return;

    if (!this.active) {
      this.active = { ...payload, startMs: now };
      this.lastShownByType.set(payload.type, now);
    } else {
      // Deduplication: don't queue the same type twice
      if (!this.queue.some((q) => q.type === payload.type)) {
        this.queue.push(payload);
      }
    }
  }

  get isVisible(): boolean {
    return this.active !== null;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  render(canvasWidth: number, canvasHeight: number): void {
    if (!this.active) return;

    const now = performance.now();
    const elapsed = now - this.active.startMs;

    if (elapsed >= TOAST_DURATION_MS) {
      this.active = null;
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.active = { ...next, startMs: now };
        this.lastShownByType.set(next.type, now);
      }
      return;
    }

    // Compute opacity
    let alpha = 1;
    if (elapsed < FADE_IN_MS) {
      alpha = elapsed / FADE_IN_MS;
    } else if (elapsed > TOAST_DURATION_MS - FADE_OUT_MS) {
      alpha = (TOAST_DURATION_MS - elapsed) / FADE_OUT_MS;
    }

    const ctx = this.ctx;
    const tx = TOAST_MARGIN_LEFT;
    const ty = canvasHeight - TOAST_H - TOAST_MARGIN_BOTTOM;

    // Suppress unused param lint — canvasWidth is intentionally accepted for
    // symmetry with the render signature and future multi-column layouts.
    void canvasWidth;

    // Slide up on appear: ease-out over FADE_IN_MS
    const slideProgress = Math.min(1, elapsed / FADE_IN_MS);
    const slideEase = 1 - (1 - slideProgress) * (1 - slideProgress);
    const slideOffsetY = (1 - slideEase) * 10;
    const oty = ty + slideOffsetY;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Warm ambient glow behind the toast (mirrors patron spirit glow in amber)
    const grd = ctx.createRadialGradient(
      tx + TOAST_W / 2, oty + TOAST_H / 2, 0,
      tx + TOAST_W / 2, oty + TOAST_H / 2, TOAST_W * 0.75
    );
    grd.addColorStop(0, 'rgba(200, 140, 30, 0.30)');
    grd.addColorStop(1, 'rgba(120, 60, 0, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(tx - 20, oty - 20, TOAST_W + 40, TOAST_H + 40);

    // Background — dark parchment
    ctx.fillStyle = 'rgba(40, 30, 15, 0.90)';
    this._roundRect(ctx, tx, oty, TOAST_W, TOAST_H, 8);
    ctx.fill();

    // Border — amber chronicle
    ctx.strokeStyle = 'rgba(190, 150, 80, 0.75)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, tx, oty, TOAST_W, TOAST_H, 8);
    ctx.stroke();

    // Left accent bar
    ctx.fillStyle = 'rgba(210, 165, 75, 0.9)';
    this._roundRect(ctx, tx, oty + 8, 3, TOAST_H - 16, 2);
    ctx.fill();

    // Icon
    const icon = MILESTONE_ICONS[this.active.type] ?? '✦';
    ctx.font = '22px serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(230, 195, 130, 0.95)';
    ctx.fillText(icon, tx + 12, oty + TOAST_H / 2 + 8);

    // Label: agent name or milestone type (truncate to prevent overflow)
    const rawLabel = this.active.agentName ?? this.active.type.replace('civilization:', '').replace('milestone:', '').replace(/_/g, ' ');
    const label = rawLabel.length > 28 ? rawLabel.slice(0, 26) + '…' : rawLabel;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = 'rgba(230, 195, 130, 0.95)';
    ctx.fillText(label, tx + 44, oty + 20);

    // Summary (match PatronToastRenderer truncation: > 40 → slice to 38)
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(195, 165, 110, 0.88)';
    const summary = this.active.summary.length > 40
      ? this.active.summary.slice(0, 38) + '…'
      : this.active.summary;
    ctx.fillText(summary, tx + 44, oty + 36);

    // Progress drain bar — shows remaining display time
    const progressFraction = 1 - elapsed / TOAST_DURATION_MS;
    const barMaxW = TOAST_W - 16;
    const barW = barMaxW * progressFraction;
    const barY = oty + TOAST_H - 6;
    ctx.fillStyle = 'rgba(80, 55, 20, 0.6)';
    this._roundRect(ctx, tx + 8, barY, barMaxW, 2, 1);
    ctx.fill();
    ctx.fillStyle = 'rgba(210, 165, 75, 0.7)';
    if (barW > 1) {
      this._roundRect(ctx, tx + 8, barY, barW, 2, 1);
      ctx.fill();
    }

    // Footer label
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(140, 110, 60, 0.75)';
    ctx.textAlign = 'right';
    ctx.fillText('chronicle', tx + TOAST_W - 8, oty + TOAST_H - 10);
    ctx.textAlign = 'left';

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
