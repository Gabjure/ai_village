import type {
  World,
  MarketStateComponent,
  ItemMarketStats,
} from '@ai-village/core';
import type { IWindowPanel } from './types/WindowTypes.js';

/**
 * UI Panel displaying economy and market information.
 * Shows village-wide economic stats, price trends, and market activity.
 * Toggle with 'E' key.
 */
export class EconomyPanel implements IWindowPanel {
  private visible: boolean = false;
  private panelWidth = 420;
  private panelHeight = 560;
  private padding = 14;
  private lineHeight = 16;

  getId(): string {
    return 'economy';
  }

  getTitle(): string {
    return 'Economy';
  }

  getDefaultWidth(): number {
    return 420;
  }

  getDefaultHeight(): number {
    return 560;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  toggle(): void {
    this.visible = !this.visible;
  }

  isVisible(): boolean {
    return this.visible;
  }

  render(ctx: CanvasRenderingContext2D, _x: number, _y: number, _width: number, _height: number, world?: any): void {
    if (!this.visible) return;

    if (!world || typeof world.query !== 'function') {
      console.warn('[EconomyPanel] World not available or missing query method');
      return;
    }

    const x = 0;
    const y = 0;
    const w = this.panelWidth;
    const h = this.panelHeight;
    const p = this.padding;

    // ── Background ──────────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, 'rgba(10, 14, 28, 0.97)');
    bg.addColorStop(1, 'rgba(5, 8, 18, 0.97)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    (ctx as any).roundRect(x, y, w, h, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(160, 120, 40, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    (ctx as any).roundRect(x, y, w, h, 8);
    ctx.stroke();

    // ── Header ───────────────────────────────────────────────────────────────
    const headerGrad = ctx.createLinearGradient(x, y, x, y + 36);
    headerGrad.addColorStop(0, 'rgba(60, 42, 10, 0.95)');
    headerGrad.addColorStop(1, 'rgba(30, 20, 5, 0.85)');
    ctx.fillStyle = headerGrad;
    ctx.beginPath();
    (ctx as any).roundRect(x, y, w, 36, [8, 8, 0, 0]);
    ctx.fill();

    // Gold accent line below header
    ctx.strokeStyle = 'rgba(200, 160, 50, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 36);
    ctx.lineTo(x + w - 4, y + 36);
    ctx.stroke();

    // Title
    ctx.shadowColor = 'rgba(220, 180, 60, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f0c84a';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('💰 Economy Dashboard', x + p, y + 23);
    ctx.shadowBlur = 0;

    // ── Market State Query ──────────────────────────────────────────────────
    const marketState = this.getMarketState(world);
    let currentY = y + 36 + 10;

    if (!marketState) {
      ctx.fillStyle = '#FF7777';
      ctx.font = '12px monospace';
      ctx.fillText('No market state available', x + p, currentY + 12);
      this.renderFooter(ctx, x, y, w, h, p);
      return;
    }

    // ── Section 1: Village Economy ──────────────────────────────────────────
    currentY = this.renderSectionHeader(ctx, x, currentY, w, p, '🏛 Village Economy', '#c8a030', 'rgba(40, 28, 6, 0.8)');

    // Currency pill
    currentY = this.renderCurrencyRow(ctx, x, currentY, w, p, marketState);

    // Volume bars
    currentY = this.renderVolumeBars(ctx, x, currentY, w, p, marketState);

    // Inflation indicator
    currentY = this.renderInflationBadge(ctx, x, currentY, p, marketState.inflationRate);

    currentY += 8;

    // ── Section 2: Market Activity ──────────────────────────────────────────
    currentY = this.renderSectionHeader(ctx, x, currentY, w, p, '📊 Market Activity', '#5ab0f0', 'rgba(8, 22, 44, 0.8)');

    const topItems = this.getTopTradedItems(marketState, 4);

    if (topItems.length === 0) {
      ctx.fillStyle = '#888888';
      ctx.font = '11px monospace';
      ctx.fillText('No market activity yet', x + p, currentY + 12);
      currentY += 24;
    } else {
      for (const stats of topItems) {
        if (currentY > y + h - 120) break;
        currentY = this.renderItemCard(ctx, x, currentY, w, p, stats);
      }
    }

    // ── Section 3: Supply & Demand ─────────────────────────────────────────
    if (currentY < y + h - 90 && topItems.length > 0) {
      currentY = this.renderSectionHeader(ctx, x, currentY, w, p, '📈 Supply & Demand', '#f0a040', 'rgba(40, 22, 6, 0.8)');
      for (const stats of topItems.slice(0, 3)) {
        if (currentY > y + h - 50) break;
        currentY = this.renderSupplyDemandBars(ctx, x, currentY, w, p, stats);
      }
    }

    this.renderFooter(ctx, x, y, w, h, p);
  }

  // ── Section header card ─────────────────────────────────────────────────
  private renderSectionHeader(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    p: number,
    title: string,
    accentColor: string,
    bgColor: string,
  ): number {
    // Background strip
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    (ctx as any).roundRect(x + p - 4, y, w - (p - 4) * 2, 22, 4);
    ctx.fill();

    // Left accent bar
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    (ctx as any).roundRect(x + p - 4, y, 3, 22, [2, 0, 0, 2]);
    ctx.fill();

    // Title
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(title, x + p + 4, y + 15);

    return y + 28;
  }

  // ── Currency pill ────────────────────────────────────────────────────────
  private renderCurrencyRow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    p: number,
    marketState: MarketStateComponent,
  ): number {
    ctx.font = '11px monospace';

    // Label
    ctx.fillStyle = '#a08030';
    ctx.fillText('In circulation', x + p, y + 12);

    // Pill badge
    const amount = marketState.totalCurrency.toFixed(0);
    const pillText = `⬡ ${amount}`;
    const pillW = ctx.measureText(pillText).width + 16;
    const pillX = x + w - p - pillW;
    const pillY = y + 2;

    const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
    pillGrad.addColorStop(0, 'rgba(180, 140, 30, 0.8)');
    pillGrad.addColorStop(1, 'rgba(120, 90, 20, 0.8)');
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    (ctx as any).roundRect(pillX, pillY, pillW, 16, 8);
    ctx.fill();

    ctx.fillStyle = '#ffe090';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(pillText, pillX + 8, pillY + 12);

    return y + 22;
  }

  // ── Volume mini-bars ────────────────────────────────────────────────────
  private renderVolumeBars(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    p: number,
    marketState: MarketStateComponent,
  ): number {
    const maxVol = Math.max(marketState.dailyTransactionVolume, marketState.weeklyTransactionVolume / 7, 1);
    const barMaxW = w - p * 2 - 90;

    const rows: Array<{ label: string; value: number; color: string }> = [
      { label: 'Daily vol', value: marketState.dailyTransactionVolume, color: '#5ad0a0' },
      { label: 'Weekly vol', value: marketState.weeklyTransactionVolume, color: '#4ab0e0' },
    ];

    for (const row of rows) {
      ctx.fillStyle = '#777788';
      ctx.font = '10px monospace';
      ctx.fillText(row.label, x + p, y + 11);

      // Track
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      (ctx as any).roundRect(x + p + 66, y + 2, barMaxW, 10, 5);
      ctx.fill();

      // Fill
      const fillW = Math.max(2, (row.value / maxVol) * barMaxW);
      const barGrad = ctx.createLinearGradient(x + p + 66, 0, x + p + 66 + barMaxW, 0);
      barGrad.addColorStop(0, row.color);
      barGrad.addColorStop(1, 'rgba(20, 40, 60, 0.6)');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      (ctx as any).roundRect(x + p + 66, y + 2, fillW, 10, 5);
      ctx.fill();

      // Value
      ctx.fillStyle = '#aaccbb';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(row.value.toFixed(0), x + w - p, y + 11);
      ctx.textAlign = 'left';

      y += 16;
    }

    return y + 4;
  }

  // ── Inflation badge ─────────────────────────────────────────────────────
  private renderInflationBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    p: number,
    rate: number,
  ): number {
    const percent = (rate * 100).toFixed(1);
    const sign = rate >= 0 ? '+' : '';
    const label = `Inflation: ${sign}${percent}%`;

    let bgColor: string;
    let textColor: string;
    if (rate > 0.1) {
      bgColor = 'rgba(180, 40, 40, 0.7)';
      textColor = '#ffaaaa';
    } else if (rate < -0.05) {
      bgColor = 'rgba(40, 60, 180, 0.7)';
      textColor = '#aabbff';
    } else {
      bgColor = 'rgba(30, 100, 50, 0.7)';
      textColor = '#88ffaa';
    }

    ctx.font = 'bold 10px monospace';
    const bw = ctx.measureText(label).width + 14;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    (ctx as any).roundRect(x + p, y, bw, 16, 8);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.fillText(label, x + p + 7, y + 11);

    return y + 22;
  }

  // ── Item card ───────────────────────────────────────────────────────────
  private renderItemCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    p: number,
    stats: ItemMarketStats,
  ): number {
    const cardH = 54;
    const cardX = x + p - 2;
    const cardW = w - (p - 2) * 2;

    // Card background
    const cardGrad = ctx.createLinearGradient(cardX, y, cardX + cardW, y);
    cardGrad.addColorStop(0, 'rgba(30, 36, 58, 0.8)');
    cardGrad.addColorStop(1, 'rgba(16, 20, 36, 0.6)');
    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    (ctx as any).roundRect(cardX, y, cardW, cardH, 5);
    ctx.fill();

    // Left accent
    const trend = this.getPriceTrend(stats);
    ctx.fillStyle = trend.accentColor;
    ctx.beginPath();
    (ctx as any).roundRect(cardX, y, 3, cardH, [3, 0, 0, 3]);
    ctx.fill();

    const innerX = cardX + 8;

    // Item name
    ctx.fillStyle = '#e8d080';
    ctx.font = 'bold 11px monospace';
    const nameMaxW = w - p * 2 - 110;
    let name = stats.itemId.replace(/_/g, ' ');
    while (ctx.measureText(name).width > nameMaxW && name.length > 4) {
      name = name.slice(0, -1);
    }
    if (name !== stats.itemId.replace(/_/g, ' ')) name += '…';
    ctx.fillText(name, innerX, y + 14);

    // Price badge (top right)
    const priceText = `${stats.averagePrice.toFixed(1)} ⬡`;
    ctx.font = 'bold 10px monospace';
    const pBadgeW = ctx.measureText(priceText).width + 12;
    const pBadgeX = cardX + cardW - pBadgeW - 4;
    ctx.fillStyle = 'rgba(80, 60, 10, 0.8)';
    ctx.beginPath();
    (ctx as any).roundRect(pBadgeX, y + 4, pBadgeW, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#ffd060';
    ctx.fillText(priceText, pBadgeX + 6, y + 14);

    // Trend indicator text
    ctx.fillStyle = trend.color;
    ctx.font = '10px monospace';
    ctx.fillText(trend.text, innerX, y + 28);

    // Sparkline from price history (right side, compact)
    this.renderSparkline(ctx, stats.priceHistory, cardX + cardW - 90, y + 20, 80, 26);

    // Supply bar (bottom)
    const supplyMaxEstimate = Math.max(stats.totalSupply, 100);
    const supplyFill = Math.min(1, stats.totalSupply / supplyMaxEstimate);
    const barY = y + cardH - 12;
    const barX = innerX;
    const barW = cardW - 20;

    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    (ctx as any).roundRect(barX, barY, barW, 6, 3);
    ctx.fill();

    const supplyGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    supplyGrad.addColorStop(0, '#30a868');
    supplyGrad.addColorStop(1, 'rgba(20, 60, 40, 0.4)');
    ctx.fillStyle = supplyGrad;
    ctx.beginPath();
    (ctx as any).roundRect(barX, barY, Math.max(4, supplyFill * barW), 6, 3);
    ctx.fill();

    ctx.fillStyle = '#668888';
    ctx.font = '9px monospace';
    ctx.fillText(`supply: ${stats.totalSupply}`, innerX, barY - 3);

    return y + cardH + 5;
  }

  // ── Sparkline ────────────────────────────────────────────────────────────
  private renderSparkline(
    ctx: CanvasRenderingContext2D,
    history: number[],
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    if (history.length < 2) return;

    const pts = history.slice(-12);
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const stepX = w / (pts.length - 1);

    // Clip to sparkline area
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Fill area under line
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    pts.forEach((v, i) => {
      const px = x + i * stepX;
      const py = y + h - ((v - min) / range) * h;
      if (i === 0) ctx.lineTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineTo(x + (pts.length - 1) * stepX, y + h);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(x, y, x, y + h);
    areaGrad.addColorStop(0, 'rgba(80, 180, 120, 0.3)');
    areaGrad.addColorStop(1, 'rgba(20, 60, 40, 0.05)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach((v, i) => {
      const px = x + i * stepX;
      const py = y + h - ((v - min) / range) * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = '#60c890';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // ── Supply & demand fill bars ────────────────────────────────────────────
  private renderSupplyDemandBars(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    p: number,
    stats: ItemMarketStats,
  ): number {
    const demandRatio = stats.recentSales / Math.max(stats.recentPurchases, 1);
    const supplyRatio = Math.min(1, stats.totalSupply / Math.max(stats.recentSales * 10, 1));

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ccaa66';
    let name = stats.itemId.replace(/_/g, ' ');
    if (name.length > 18) name = name.slice(0, 17) + '…';
    ctx.fillText(name, x + p, y + 11);
    y += 16;

    const barMaxW = w - p * 2 - 60;

    const demandFill = Math.min(1, demandRatio / 3);
    let demandColor: string;
    let demandLabel: string;
    if (demandRatio > 2) { demandColor = '#ff7070'; demandLabel = 'High ▲▲'; }
    else if (demandRatio > 1.2) { demandColor = '#ffaa60'; demandLabel = 'Rising ▲'; }
    else if (demandRatio > 0.8) { demandColor = '#70dd90'; demandLabel = 'Stable ━'; }
    else { demandColor = '#6699ff'; demandLabel = 'Low ▼'; }

    this.renderLabeledBar(ctx, x + p, y, barMaxW, 'Demand', demandFill, demandColor, demandLabel);
    y += 18;

    const supplyFill = supplyRatio;
    let supplyColor: string;
    let supplyLabel: string;
    if (supplyRatio > 0.8) { supplyColor = '#6699ff'; supplyLabel = 'Over ▼▼'; }
    else if (supplyRatio > 0.5) { supplyColor = '#60ddaa'; supplyLabel = 'Adequate ━'; }
    else { supplyColor = '#ffaa44'; supplyLabel = 'Low ▲'; }

    this.renderLabeledBar(ctx, x + p, y, barMaxW, 'Supply', supplyFill, supplyColor, supplyLabel);
    y += 22;

    return y;
  }

  private renderLabeledBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    maxW: number,
    label: string,
    fill: number,
    fillColor: string,
    labelRight: string,
  ): void {
    ctx.fillStyle = '#666677';
    ctx.font = '10px monospace';
    ctx.fillText(label, x, y + 9);

    const barX = x + 52;
    const barW = maxW - 52;

    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    (ctx as any).roundRect(barX, y, barW, 10, 5);
    ctx.fill();

    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGrad.addColorStop(0, fillColor);
    barGrad.addColorStop(1, 'rgba(20, 30, 50, 0.5)');
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    (ctx as any).roundRect(barX, y, Math.max(4, fill * barW), 10, 5);
    ctx.fill();

    ctx.fillStyle = '#aaa8bb';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(labelRight, x + maxW + 8, y + 9);
    ctx.textAlign = 'left';
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  private renderFooter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    p: number,
  ): void {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    (ctx as any).roundRect(x + p - 4, y + h - 20, w - (p - 4) * 2, 16, 4);
    ctx.fill();

    ctx.fillStyle = '#555566';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('E — close', x + w / 2, y + h - 7);
    ctx.textAlign = 'left';
  }

  // ── Gradient separator ───────────────────────────────────────────────────
  private renderSeparator(ctx: CanvasRenderingContext2D, panelX: number, y: number): void {
    const grad = ctx.createLinearGradient(panelX + this.padding, y, panelX + this.panelWidth - this.padding, y);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + this.padding, y);
    ctx.lineTo(panelX + this.panelWidth - this.padding, y);
    ctx.stroke();
  }

  // ── Data helpers ────────────────────────────────────────────────────────
  private getMarketState(world: World): MarketStateComponent | undefined {
    const entities = world.query().with('market_state').executeEntities();
    if (entities.length === 0) return undefined;
    const marketEntity = entities[0];
    if (!marketEntity) return undefined;
    return marketEntity.components.get('market_state') as MarketStateComponent | undefined;
  }

  private getTopTradedItems(marketState: MarketStateComponent, limit: number): ItemMarketStats[] {
    const items = Array.from(marketState.itemStats.values());
    items.sort((a: ItemMarketStats, b: ItemMarketStats) => {
      const activityA = a.recentSales + a.recentPurchases;
      const activityB = b.recentSales + b.recentPurchases;
      return activityB - activityA;
    });
    return items.slice(0, limit);
  }

  private getPriceTrend(stats: ItemMarketStats): { text: string; color: string; accentColor: string } {
    if (stats.priceHistory.length < 2) {
      return { text: 'Stable ━', color: '#888899', accentColor: '#446644' };
    }

    const recentCount = Math.min(5, stats.priceHistory.length);
    const recentPrices = stats.priceHistory.slice(-recentCount);
    const recentAvg = recentPrices.reduce((sum: number, p: number) => sum + p, 0) / recentCount;

    const olderCount = Math.min(5, stats.priceHistory.length - recentCount);
    if (olderCount < 2) {
      return { text: 'Stable ━', color: '#888899', accentColor: '#446644' };
    }

    const olderPrices = stats.priceHistory.slice(-(recentCount + olderCount), -recentCount);
    const olderAvg = olderPrices.reduce((sum: number, p: number) => sum + p, 0) / olderCount;
    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) return { text: 'Rising ▲▲', color: '#ff7070', accentColor: '#883030' };
    if (change > 0.05) return { text: 'Up ▲', color: '#ffaa60', accentColor: '#886030' };
    if (change > -0.05) return { text: 'Stable ━', color: '#70dd90', accentColor: '#306050' };
    if (change > -0.1) return { text: 'Down ▼', color: '#7099ff', accentColor: '#304488' };
    return { text: 'Falling ▼▼', color: '#6677ff', accentColor: '#303488' };
  }
}
