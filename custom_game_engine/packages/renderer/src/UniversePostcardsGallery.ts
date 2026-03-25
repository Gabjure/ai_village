/**
 * UniversePostcardsGallery - Share and browse postcards from across the multiverse
 *
 * Players can capture snapshots of their universe at any moment and share them
 * as postcards for others to browse. Each postcard is a window into another
 * dimension — the agents, the magic, the stories that unfolded there.
 *
 * Cosmic/contemplative aesthetic: dark, deep space, purple/blue palette.
 */

import type { UniversePostcard } from '@ai-village/core';
import { PostcardSharingService } from '@ai-village/core';

// ─── Re-export SharedPostcard for consumers ───────────────────────────────────

export interface SharedPostcard extends UniversePostcard {
  /** Unique identifier for this postcard */
  id: string;
  /** Player-chosen name for their universe */
  title: string;
  /** Player annotation (1-2 sentences) */
  description: string;
  /** Who shared this postcard */
  playerName: string;
  /** ISO 8601 timestamp of when it was shared */
  sharedAt: string;
}

// ─── Data layer ────────────────────────────────────────────────────────────────

export interface PostcardDataSource {
  listPostcards(): Promise<SharedPostcard[]>;
  sharePostcard(
    postcard: UniversePostcard,
    title: string,
    description: string,
  ): Promise<SharedPostcard>;
}

const LOCAL_STORAGE_KEY = 'mvee-shared-postcards';

export class LocalStoragePostcardSource implements PostcardDataSource {
  async listPostcards(): Promise<SharedPostcard[]> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as SharedPostcard[];
    } catch (err) {
      console.error('[PostcardGallery] Failed to read postcards from localStorage:', err);
      return [];
    }
  }

  async sharePostcard(
    postcard: UniversePostcard,
    title: string,
    description: string,
  ): Promise<SharedPostcard> {
    const shared: SharedPostcard = {
      ...postcard,
      id: crypto.randomUUID(),
      title,
      description,
      playerName: 'Anonymous Explorer',
      sharedAt: new Date().toISOString(),
    };

    const existing = await this.listPostcards();
    existing.unshift(shared);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      console.error('[PostcardGallery] Failed to persist postcard to localStorage:', err);
    }

    return shared;
  }
}

// ─── Server-backed postcard source ────────────────────────────────────────────

export class ServerPostcardSource implements PostcardDataSource {
  private service: PostcardSharingService;

  constructor(serverBaseUrl?: string) {
    this.service = new PostcardSharingService(serverBaseUrl);
  }

  async listPostcards(): Promise<SharedPostcard[]> {
    try {
      const postcards = await this.service.listSharedPostcards();
      return postcards.map((p) => ({
        ...p,
        id: (p as SharedPostcard).id ?? crypto.randomUUID(),
      })) as SharedPostcard[];
    } catch (err) {
      console.error('[PostcardGallery] Failed to list postcards from server:', err);
      return [];
    }
  }

  async sharePostcard(
    postcard: UniversePostcard,
    title: string,
    description: string,
  ): Promise<SharedPostcard> {
    const result = await this.service.sharePostcard(postcard, {
      playerName: 'Anonymous Explorer',
      title,
      description,
    });
    return {
      ...result,
      id: (result as SharedPostcard).id ?? crypto.randomUUID(),
    } as SharedPostcard;
  }
}

// ─── Sort options ──────────────────────────────────────────────────────────────

type SortMode = 'newest' | 'oldest' | 'most-agents' | 'world-age';

// ─── Gallery class ─────────────────────────────────────────────────────────────

export class UniversePostcardsGallery {
  private container: HTMLElement;
  private dataSource: PostcardDataSource;
  private onCapturePostcard: () => UniversePostcard;
  private getUniverseName?: () => string | undefined;

  private postcards: SharedPostcard[] = [];
  private sortMode: SortMode = 'newest';
  private shareModalEl: HTMLElement | null = null;
  private detailModalEl: HTMLElement | null = null;
  private stylesInjected: boolean = false;
  private biomeFilter: string | null = null;
  private epochFilter: string | null = null;
  private playerSearchQuery: string = '';

  // ESC key listener — stored so we can clean up on destroy
  private readonly escListener: (e: KeyboardEvent) => void;

  constructor(
    dataSource: PostcardDataSource,
    onCapturePostcard: () => UniversePostcard,
    getUniverseName?: () => string | undefined,
  ) {
    this.dataSource = dataSource;
    this.onCapturePostcard = onCapturePostcard;
    this.getUniverseName = getUniverseName;

    this.container = document.createElement('div');
    this.container.id = 'universe-postcards-gallery';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a1a2a 100%);
      display: none;
      flex-direction: column;
      z-index: 10003;
      font-family: monospace;
      color: #e0e0e0;
      overflow: hidden;
    `;

    this.escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (this.detailModalEl) {
          this.closeDetailModal();
        } else if (this.shareModalEl) {
          this.closeShareModal();
        } else {
          this.hide();
        }
      }
    };

    document.addEventListener('keydown', this.escListener);
    document.body.appendChild(this.container);
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  get isVisible(): boolean {
    return this.container.style.display === 'flex';
  }

  async show(): Promise<void> {
    this.injectStyles();
    this.container.style.display = 'flex';
    await this.loadAndRender();
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  destroy(): void {
    document.removeEventListener('keydown', this.escListener);
    this.container.remove();
  }

  // ─── Data ────────────────────────────────────────────────────────────────────

  private async loadAndRender(): Promise<void> {
    try {
      this.postcards = await this.dataSource.listPostcards();
    } catch (err) {
      console.error('[PostcardGallery] Failed to load postcards:', err);
      this.postcards = [];
    }
    this.render();
  }

  private getSortedPostcards(): SharedPostcard[] {
    let copy = [...this.postcards];

    // Apply filters
    if (this.playerSearchQuery) {
      const query = this.playerSearchQuery.toLowerCase();
      copy = copy.filter((p) => p.playerName.toLowerCase().includes(query));
    }
    if (this.biomeFilter !== null) {
      copy = copy.filter((p) => p.dominantBiome === this.biomeFilter);
    }
    if (this.epochFilter !== null) {
      copy = copy.filter((p) => p.epochTitle === this.epochFilter);
    }

    switch (this.sortMode) {
      case 'newest':
        return copy.sort((a, b) => b.sharedAt.localeCompare(a.sharedAt));
      case 'oldest':
        return copy.sort((a, b) => a.sharedAt.localeCompare(b.sharedAt));
      case 'most-agents':
        return copy.sort((a, b) => b.agentCount - a.agentCount);
      case 'world-age':
        return copy.sort((a, b) => b.worldAge - a.worldAge);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  private render(): void {
    this.container.innerHTML = '';
    this.container.appendChild(this.renderHeader());
    this.container.appendChild(this.renderSortBar());
    this.container.appendChild(this.renderScrollArea());
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 28px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    `;

    // Left: back button + title
    const left = document.createElement('div');
    left.style.cssText = 'display: flex; align-items: center; gap: 20px;';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 14px;
      font-family: monospace;
      background: transparent;
      color: #888;
      border: 1px solid #3a3a5a;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
    `;
    backBtn.onmouseenter = () => {
      backBtn.style.borderColor = '#667eea';
      backBtn.style.color = '#fff';
    };
    backBtn.onmouseleave = () => {
      backBtn.style.borderColor = '#3a3a5a';
      backBtn.style.color = '#888';
    };
    backBtn.onclick = () => this.hide();
    left.appendChild(backBtn);

    const titleEl = document.createElement('h1');
    titleEl.textContent = 'Universe Postcards';
    titleEl.style.cssText = `
      margin: 0;
      font-size: 28px;
      font-weight: normal;
      color: #fff;
      text-shadow: 0 0 20px rgba(100, 120, 255, 0.4);
      letter-spacing: 2px;
    `;
    left.appendChild(titleEl);

    header.appendChild(left);

    // Right: share button
    const shareBtn = document.createElement('button');
    shareBtn.textContent = '✦ Share My Universe';
    shareBtn.style.cssText = `
      padding: 13px 26px;
      font-size: 15px;
      font-family: monospace;
      background: linear-gradient(135deg, #9b59b6 0%, #667eea 100%);
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
    `;
    shareBtn.onmouseenter = () => {
      shareBtn.style.transform = 'scale(1.05)';
      shareBtn.style.boxShadow = '0 6px 25px rgba(155, 89, 182, 0.5)';
    };
    shareBtn.onmouseleave = () => {
      shareBtn.style.transform = 'scale(1)';
      shareBtn.style.boxShadow = '0 4px 15px rgba(155, 89, 182, 0.3)';
    };
    shareBtn.onclick = () => this.openShareModal();
    header.appendChild(shareBtn);

    return header;
  }

  private renderSortBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.style.cssText = `
      padding: 14px 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      flex-shrink: 0;
      background: rgba(0, 0, 0, 0.15);
    `;

    const sortLabel = document.createElement('span');
    sortLabel.textContent = 'Sort:';
    sortLabel.style.cssText = 'font-size: 12px; color: #555; margin-right: 4px;';
    bar.appendChild(sortLabel);

    const sorts: Array<{ mode: SortMode; label: string }> = [
      { mode: 'newest', label: 'Newest' },
      { mode: 'oldest', label: 'Oldest' },
      { mode: 'most-agents', label: 'Most Agents' },
      { mode: 'world-age', label: 'World Age' },
    ];

    for (const { mode, label } of sorts) {
      const btn = this.makeSortButton(mode, label);
      bar.appendChild(btn);
    }

    // Separator
    const sep = document.createElement('div');
    sep.style.cssText = 'width: 1px; height: 20px; background: rgba(255,255,255,0.08); margin: 0 6px;';
    bar.appendChild(sep);

    // Biome filter
    const uniqueBiomes = [...new Set(this.postcards.map((p) => p.dominantBiome).filter(Boolean))].sort();
    const biomeSelect = document.createElement('select');
    biomeSelect.style.cssText = `
      padding: 7px 12px;
      font-size: 12px;
      font-family: monospace;
      background: rgba(20, 20, 50, 0.8);
      color: #8fa8ff;
      border: 1px solid #2a2a4a;
      border-radius: 6px;
      cursor: pointer;
      outline: none;
    `;
    const biomeAll = document.createElement('option');
    biomeAll.value = '';
    biomeAll.textContent = 'All Biomes';
    biomeSelect.appendChild(biomeAll);
    for (const biome of uniqueBiomes) {
      const opt = document.createElement('option');
      opt.value = biome;
      opt.textContent = biome;
      if (this.biomeFilter === biome) opt.selected = true;
      biomeSelect.appendChild(opt);
    }
    biomeSelect.onchange = () => {
      this.biomeFilter = biomeSelect.value || null;
      this.render();
    };
    bar.appendChild(biomeSelect);

    // Epoch filter
    const uniqueEpochs = [...new Set(this.postcards.map((p) => p.epochTitle).filter((e): e is string => !!e))].sort();
    if (uniqueEpochs.length > 0) {
      const epochSelect = document.createElement('select');
      epochSelect.style.cssText = `
        padding: 7px 12px;
        font-size: 12px;
        font-family: monospace;
        background: rgba(20, 20, 50, 0.8);
        color: #8fa8ff;
        border: 1px solid #2a2a4a;
        border-radius: 6px;
        cursor: pointer;
        outline: none;
      `;
      const epochAll = document.createElement('option');
      epochAll.value = '';
      epochAll.textContent = 'All Epochs';
      epochSelect.appendChild(epochAll);
      for (const epoch of uniqueEpochs) {
        const opt = document.createElement('option');
        opt.value = epoch;
        opt.textContent = epoch;
        if (this.epochFilter === epoch) opt.selected = true;
        epochSelect.appendChild(opt);
      }
      epochSelect.onchange = () => {
        this.epochFilter = epochSelect.value || null;
        this.render();
      };
      bar.appendChild(epochSelect);
    }

    // Player search
    const playerSearch = document.createElement('input');
    playerSearch.type = 'text';
    playerSearch.placeholder = 'Search by player...';
    playerSearch.value = this.playerSearchQuery;
    playerSearch.style.cssText = `
      padding: 7px 12px;
      font-size: 12px;
      font-family: monospace;
      background: rgba(20, 20, 50, 0.8);
      color: #8fa8ff;
      border: 1px solid #2a2a4a;
      border-radius: 6px;
      outline: none;
      width: 160px;
    `;
    playerSearch.addEventListener('focus', () => {
      playerSearch.style.borderColor = 'rgba(100, 120, 255, 0.5)';
    });
    playerSearch.addEventListener('blur', () => {
      playerSearch.style.borderColor = '#2a2a4a';
    });
    playerSearch.addEventListener('input', () => {
      this.playerSearchQuery = playerSearch.value;
      this.render();
    });
    bar.appendChild(playerSearch);

    // Spacer
    const spacer = document.createElement('div');
    spacer.style.cssText = 'flex: 1;';
    bar.appendChild(spacer);

    // Count (show filtered vs total)
    const count = document.createElement('span');
    const filtered = this.getSortedPostcards().length;
    const total = this.postcards.length;
    count.textContent = filtered < total
      ? `${filtered} of ${total} postcard${total !== 1 ? 's' : ''}`
      : `${total} postcard${total !== 1 ? 's' : ''}`;
    count.style.cssText = 'font-size: 13px; color: #555;';
    bar.appendChild(count);

    return bar;
  }

  private makeSortButton(mode: SortMode, label: string): HTMLElement {
    const active = this.sortMode === mode;
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      padding: 7px 14px;
      font-size: 12px;
      font-family: monospace;
      background: ${active ? 'rgba(100, 120, 255, 0.2)' : 'transparent'};
      color: ${active ? '#8fa8ff' : '#666'};
      border: 1px solid ${active ? 'rgba(100, 120, 255, 0.5)' : '#2a2a4a'};
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    `;
    if (!active) {
      btn.onmouseenter = () => {
        btn.style.color = '#aaa';
        btn.style.borderColor = '#4a4a6a';
      };
      btn.onmouseleave = () => {
        btn.style.color = '#666';
        btn.style.borderColor = '#2a2a4a';
      };
    }
    btn.onclick = () => {
      this.sortMode = mode;
      this.render();
    };
    return btn;
  }

  private renderScrollArea(): HTMLElement {
    const scroll = document.createElement('div');
    scroll.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 32px 40px 48px 40px;
    `;

    const sorted = this.getSortedPostcards();

    if (sorted.length === 0) {
      scroll.appendChild(this.renderEmptyState());
      return scroll;
    }

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    `;

    sorted.forEach((postcard, index) => {
      grid.appendChild(this.renderCard(postcard, index));
    });

    scroll.appendChild(grid);
    return scroll;
  }

  private renderEmptyState(): HTMLElement {
    const empty = document.createElement('div');
    empty.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 20px;
      text-align: center;
      color: #555;
    `;

    const icon = document.createElement('div');
    icon.textContent = '✦';
    icon.style.cssText = `
      font-size: 72px;
      margin-bottom: 28px;
      opacity: 0.3;
      animation: postcardPulse 3s ease-in-out infinite;
      color: #8fa8ff;
    `;
    empty.appendChild(icon);

    const heading = document.createElement('div');
    heading.textContent = 'No postcards yet';
    heading.style.cssText = 'font-size: 20px; color: #777; margin-bottom: 12px;';
    empty.appendChild(heading);

    const sub = document.createElement('div');
    sub.textContent = 'Be the first to share your universe!';
    sub.style.cssText = 'font-size: 14px; color: #444;';
    empty.appendChild(sub);

    return empty;
  }

  // ─── Card ────────────────────────────────────────────────────────────────────

  private renderCard(postcard: SharedPostcard, index: number): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(15, 15, 35, 0.9);
      border: 1px solid rgba(100, 120, 255, 0.2);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
      animation: postcardFloatIn 0.35s ease-out ${Math.min(index * 0.04, 0.5)}s both;
    `;
    card.style.cursor = 'pointer';
    card.onclick = () => this.openDetailModal(postcard);
    card.onmouseenter = () => {
      card.style.borderColor = 'rgba(100, 120, 255, 0.5)';
      card.style.transform = 'translateY(-3px)';
      card.style.boxShadow = '0 8px 25px rgba(100, 120, 255, 0.15)';
    };
    card.onmouseleave = () => {
      card.style.borderColor = 'rgba(100, 120, 255, 0.2)';
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    };

    // 1. Title
    const titleEl = document.createElement('div');
    titleEl.textContent = postcard.title;
    titleEl.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: #fff;
      line-height: 1.3;
    `;
    card.appendChild(titleEl);

    // 2. Player + date row
    const metaRow = document.createElement('div');
    metaRow.textContent = `Shared by ${postcard.playerName} · ${this.relativeDate(postcard.sharedAt)}`;
    metaRow.style.cssText = 'font-size: 11px; color: #555; margin-top: -4px;';
    card.appendChild(metaRow);

    // 3. Epoch badge
    if (postcard.epochTitle) {
      const badge = document.createElement('span');
      badge.textContent = postcard.epochTitle;
      badge.style.cssText = `
        display: inline-block;
        padding: 4px 10px;
        font-size: 11px;
        background: linear-gradient(135deg, rgba(155, 89, 182, 0.4) 0%, rgba(102, 126, 234, 0.4) 100%);
        color: #d0c0f8;
        border: 1px solid rgba(155, 89, 182, 0.3);
        border-radius: 12px;
        align-self: flex-start;
      `;
      card.appendChild(badge);
    }

    // 4. Stats row
    const statsRow = document.createElement('div');
    statsRow.style.cssText = `
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #8888aa;
      padding: 10px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    `;
    statsRow.innerHTML = `
      <span>&#x1F465; ${postcard.agentCount} agents</span>
      <span>&#x1F30D; ${postcard.worldAge.toFixed(1)} yrs</span>
      <span>&#x1F3D4; ${postcard.dominantBiome}</span>
    `;
    card.appendChild(statsRow);

    // 5. Notable agents
    if (postcard.notableAgents.length > 0) {
      const agentsSection = document.createElement('div');

      const agentsHeading = document.createElement('div');
      agentsHeading.textContent = 'Notable Agents';
      agentsHeading.style.cssText = 'font-size: 11px; color: #556; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;';
      agentsSection.appendChild(agentsHeading);

      const agentList = document.createElement('div');
      agentList.style.cssText = 'display: flex; flex-direction: column; gap: 3px;';

      const toShow = postcard.notableAgents.slice(0, 3);
      for (const agent of toShow) {
        const agentEl = document.createElement('div');
        agentEl.style.cssText = 'font-size: 12px;';

        const name = document.createElement('span');
        name.textContent = `"${agent.name}"`;
        name.style.cssText = 'color: #c8a840;';
        agentEl.appendChild(name);

        const detail = document.createElement('span');
        detail.textContent = ` (${agent.species}, age ${agent.age.toFixed(0)})`;
        detail.style.cssText = 'color: #666;';
        agentEl.appendChild(detail);

        if (agent.legendStatus) {
          const legendBadge = document.createElement('span');
          legendBadge.textContent = ` ★`;
          legendBadge.style.cssText = 'color: #c8a840; font-size: 10px;';
          legendBadge.title = agent.legendStatus;
          agentEl.appendChild(legendBadge);
        }

        agentList.appendChild(agentEl);
      }

      agentsSection.appendChild(agentList);
      card.appendChild(agentsSection);
    }

    // 6. Magic paradigms
    if (postcard.activeMagicParadigms.length > 0) {
      const paradigmsRow = document.createElement('div');
      paradigmsRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px;';

      for (const paradigm of postcard.activeMagicParadigms) {
        const tag = document.createElement('span');
        tag.textContent = paradigm;
        tag.style.cssText = `
          padding: 3px 9px;
          font-size: 11px;
          background: rgba(147, 112, 219, 0.2);
          color: #b39ddb;
          border: 1px solid rgba(147, 112, 219, 0.3);
          border-radius: 12px;
        `;
        paradigmsRow.appendChild(tag);
      }

      card.appendChild(paradigmsRow);
    }

    // 7. Species breakdown bar
    const speciesEntries = Object.entries(postcard.populationBySpecies);
    if (speciesEntries.length > 1) {
      card.appendChild(this.renderSpeciesBar(postcard.populationBySpecies));
    }

    // 8. Description
    if (postcard.description && postcard.description.trim()) {
      const descEl = document.createElement('div');
      descEl.style.cssText = `
        font-size: 12px;
        color: #888;
        font-style: italic;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        line-height: 1.5;
      `;
      descEl.textContent = postcard.description;
      card.appendChild(descEl);
    }

    return card;
  }

  private renderSpeciesBar(populationBySpecies: Record<string, number>): HTMLElement {
    const wrapper = document.createElement('div');

    const total = Object.values(populationBySpecies).reduce((sum, n) => sum + n, 0);
    if (total === 0) return wrapper;

    // Horizontal bar
    const bar = document.createElement('div');
    bar.style.cssText = `
      display: flex;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      gap: 1px;
    `;

    const entries = Object.entries(populationBySpecies).sort((a, b) => b[1] - a[1]);

    for (const [species, count] of entries) {
      const pct = (count / total) * 100;
      const segment = document.createElement('div');
      segment.style.cssText = `
        height: 100%;
        width: ${pct}%;
        background: ${this.speciesColor(species)};
        border-radius: 2px;
        transition: opacity 0.2s;
      `;
      segment.title = `${species}: ${count}`;
      bar.appendChild(segment);
    }

    wrapper.appendChild(bar);

    // Legend
    const legend = document.createElement('div');
    legend.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;';

    for (const [species, count] of entries.slice(0, 5)) {
      const item = document.createElement('span');
      item.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 10px; color: #666;';

      const dot = document.createElement('span');
      dot.style.cssText = `
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${this.speciesColor(species)};
        flex-shrink: 0;
      `;
      item.appendChild(dot);

      const label = document.createElement('span');
      label.textContent = `${species} ${count}`;
      item.appendChild(label);

      legend.appendChild(item);
    }

    if (entries.length > 5) {
      const more = document.createElement('span');
      more.textContent = `+${entries.length - 5} more`;
      more.style.cssText = 'font-size: 10px; color: #444;';
      legend.appendChild(more);
    }

    wrapper.appendChild(legend);
    return wrapper;
  }

  // ─── Detail modal ────────────────────────────────────────────────────────────

  private openDetailModal(postcard: SharedPostcard): void {
    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.75);
      z-index: 10004;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(160deg, #0e0e28 0%, #141430 100%);
      border: 1px solid rgba(100, 120, 255, 0.3);
      border-radius: 16px;
      padding: 36px;
      width: 680px;
      max-width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(100, 120, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: monospace;
      color: #e0e0e0;
      box-sizing: border-box;
    `;

    // 1. Title
    const titleEl = document.createElement('h2');
    titleEl.textContent = postcard.title;
    titleEl.style.cssText = `
      margin: 0;
      font-size: 24px;
      font-weight: bold;
      color: #fff;
      text-shadow: 0 0 20px rgba(100, 120, 255, 0.4);
      line-height: 1.3;
    `;
    modal.appendChild(titleEl);

    // 2. Shared by + date
    const metaRow = document.createElement('div');
    metaRow.textContent = `Shared by ${postcard.playerName} · ${this.relativeDate(postcard.sharedAt)}`;
    metaRow.style.cssText = 'font-size: 13px; color: #666; margin-top: -8px;';
    modal.appendChild(metaRow);

    // 3. Epoch badge
    if (postcard.epochTitle) {
      const badge = document.createElement('span');
      badge.textContent = postcard.epochTitle;
      badge.style.cssText = `
        display: inline-block;
        padding: 5px 14px;
        font-size: 12px;
        background: linear-gradient(135deg, rgba(155, 89, 182, 0.4) 0%, rgba(102, 126, 234, 0.4) 100%);
        color: #d0c0f8;
        border: 1px solid rgba(155, 89, 182, 0.3);
        border-radius: 12px;
        align-self: flex-start;
      `;
      modal.appendChild(badge);
    }

    // 4. Full description (no line clamping)
    if (postcard.description && postcard.description.trim()) {
      const descEl = document.createElement('div');
      descEl.textContent = postcard.description;
      descEl.style.cssText = `
        font-size: 14px;
        color: #aaa;
        font-style: italic;
        line-height: 1.6;
        padding: 14px 16px;
        background: rgba(100, 120, 255, 0.05);
        border-left: 2px solid rgba(100, 120, 255, 0.3);
        border-radius: 0 6px 6px 0;
      `;
      modal.appendChild(descEl);
    }

    // 5. Stats grid (bigger)
    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    `;
    const statItems: Array<{ icon: string; label: string; value: string }> = [
      { icon: '👥', label: 'Agents', value: String(postcard.agentCount) },
      { icon: '🌍', label: 'World Age', value: `${postcard.worldAge.toFixed(1)} yrs` },
      { icon: '🏔', label: 'Dominant Biome', value: postcard.dominantBiome },
    ];
    for (const { icon, label, value } of statItems) {
      const cell = document.createElement('div');
      cell.style.cssText = `
        background: rgba(100, 120, 255, 0.07);
        border: 1px solid rgba(100, 120, 255, 0.15);
        border-radius: 10px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        text-align: center;
      `;
      const iconEl = document.createElement('div');
      iconEl.textContent = icon;
      iconEl.style.cssText = 'font-size: 22px;';
      cell.appendChild(iconEl);
      const valEl = document.createElement('div');
      valEl.textContent = value;
      valEl.style.cssText = 'font-size: 16px; color: #c0cfff; font-weight: bold;';
      cell.appendChild(valEl);
      const lblEl = document.createElement('div');
      lblEl.textContent = label;
      lblEl.style.cssText = 'font-size: 11px; color: #556; text-transform: uppercase; letter-spacing: 1px;';
      cell.appendChild(lblEl);
      statsGrid.appendChild(cell);
    }
    modal.appendChild(statsGrid);

    // 6. Notable agents (full details)
    if (postcard.notableAgents.length > 0) {
      const section = document.createElement('div');

      const heading = document.createElement('div');
      heading.textContent = 'Notable Agents';
      heading.style.cssText = 'font-size: 12px; color: #556; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;';
      section.appendChild(heading);

      const agentList = document.createElement('div');
      agentList.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

      for (const agent of postcard.notableAgents) {
        const agentEl = document.createElement('div');
        agentEl.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(200, 168, 64, 0.05);
          border: 1px solid rgba(200, 168, 64, 0.15);
          border-radius: 8px;
          font-size: 13px;
        `;

        const name = document.createElement('span');
        name.textContent = `"${agent.name}"`;
        name.style.cssText = 'color: #c8a840; font-weight: bold;';
        agentEl.appendChild(name);

        const detail = document.createElement('span');
        detail.textContent = `${agent.species}, age ${agent.age.toFixed(0)}`;
        detail.style.cssText = 'color: #777;';
        agentEl.appendChild(detail);

        if (agent.legendStatus) {
          const legendBadge = document.createElement('span');
          legendBadge.textContent = `★ ${agent.legendStatus}`;
          legendBadge.style.cssText = 'color: #c8a840; font-size: 11px; margin-left: auto;';
          agentEl.appendChild(legendBadge);
        }

        agentList.appendChild(agentEl);
      }

      section.appendChild(agentList);
      modal.appendChild(section);
    }

    // 7. Magic paradigms as tags
    if (postcard.activeMagicParadigms.length > 0) {
      const section = document.createElement('div');

      const heading = document.createElement('div');
      heading.textContent = 'Magic Paradigms';
      heading.style.cssText = 'font-size: 12px; color: #556; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;';
      section.appendChild(heading);

      const tagsRow = document.createElement('div');
      tagsRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';

      for (const paradigm of postcard.activeMagicParadigms) {
        const tag = document.createElement('span');
        tag.textContent = paradigm;
        tag.style.cssText = `
          padding: 5px 12px;
          font-size: 12px;
          background: rgba(147, 112, 219, 0.2);
          color: #b39ddb;
          border: 1px solid rgba(147, 112, 219, 0.3);
          border-radius: 12px;
        `;
        tagsRow.appendChild(tag);
      }

      section.appendChild(tagsRow);
      modal.appendChild(section);
    }

    // 8. Full species breakdown bar (wider)
    const speciesEntries = Object.entries(postcard.populationBySpecies);
    if (speciesEntries.length > 0) {
      const section = document.createElement('div');

      const heading = document.createElement('div');
      heading.textContent = 'Species Breakdown';
      heading.style.cssText = 'font-size: 12px; color: #556; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;';
      section.appendChild(heading);

      section.appendChild(this.renderSpeciesBar(postcard.populationBySpecies));
      modal.appendChild(section);
    }

    // 9. Recent legends list
    if (postcard.recentLegends && postcard.recentLegends.length > 0) {
      const section = document.createElement('div');

      const heading = document.createElement('div');
      heading.textContent = 'Recent Legends';
      heading.style.cssText = 'font-size: 12px; color: #556; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;';
      section.appendChild(heading);

      const legendList = document.createElement('ul');
      legendList.style.cssText = 'margin: 0; padding: 0 0 0 18px; display: flex; flex-direction: column; gap: 4px;';

      for (const legend of postcard.recentLegends) {
        const li = document.createElement('li');
        li.textContent = legend;
        li.style.cssText = 'font-size: 13px; color: #8888aa; line-height: 1.5;';
        legendList.appendChild(li);
      }

      section.appendChild(legendList);
      modal.appendChild(section);
    }

    // 10. Population breakdown table (species → count)
    if (speciesEntries.length > 0) {
      const section = document.createElement('div');

      const heading = document.createElement('div');
      heading.textContent = 'Population Table';
      heading.style.cssText = 'font-size: 12px; color: #556; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;';
      section.appendChild(heading);

      const table = document.createElement('div');
      table.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

      const sorted = [...speciesEntries].sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((sum, [, n]) => sum + n, 0);

      for (const [species, count] of sorted) {
        const row = document.createElement('div');
        row.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          font-size: 13px;
        `;

        const dot = document.createElement('span');
        dot.style.cssText = `
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${this.speciesColor(species)};
          flex-shrink: 0;
        `;
        row.appendChild(dot);

        const nameEl = document.createElement('span');
        nameEl.textContent = species;
        nameEl.style.cssText = 'color: #ccc; flex: 1;';
        row.appendChild(nameEl);

        const countEl = document.createElement('span');
        countEl.textContent = String(count);
        countEl.style.cssText = 'color: #8fa8ff; min-width: 40px; text-align: right;';
        row.appendChild(countEl);

        const pctEl = document.createElement('span');
        pctEl.textContent = `${((count / total) * 100).toFixed(1)}%`;
        pctEl.style.cssText = 'color: #555; min-width: 50px; text-align: right;';
        row.appendChild(pctEl);

        table.appendChild(row);
      }

      section.appendChild(table);
      modal.appendChild(section);
    }

    // 11. Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      padding: 11px 28px;
      font-size: 14px;
      font-family: monospace;
      background: transparent;
      color: #888;
      border: 1px solid #3a3a5a;
      border-radius: 8px;
      cursor: pointer;
      align-self: flex-end;
      transition: all 0.2s;
      margin-top: 4px;
    `;
    closeBtn.onmouseenter = () => { closeBtn.style.borderColor = '#667eea'; closeBtn.style.color = '#fff'; };
    closeBtn.onmouseleave = () => { closeBtn.style.borderColor = '#3a3a5a'; closeBtn.style.color = '#888'; };
    closeBtn.onclick = () => this.closeDetailModal();
    modal.appendChild(closeBtn);

    backdrop.appendChild(modal);

    // Close on backdrop click
    backdrop.onclick = (e) => {
      if (e.target === backdrop) this.closeDetailModal();
    };

    this.detailModalEl = backdrop;
    document.body.appendChild(backdrop);
  }

  private closeDetailModal(): void {
    if (this.detailModalEl) {
      this.detailModalEl.remove();
      this.detailModalEl = null;
    }
  }

  // ─── Share modal ─────────────────────────────────────────────────────────────

  private openShareModal(): void {
    let currentPostcard: UniversePostcard;
    try {
      currentPostcard = this.onCapturePostcard();
    } catch (err) {
      console.error('[PostcardGallery] Failed to capture postcard snapshot:', err);
      return;
    }

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10004;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(160deg, #0e0e28 0%, #141430 100%);
      border: 1px solid rgba(100, 120, 255, 0.3);
      border-radius: 16px;
      padding: 36px;
      width: 480px;
      max-width: 90vw;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(100, 120, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: monospace;
      color: #e0e0e0;
    `;

    // Modal title
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'Share Your Universe';
    modalTitle.style.cssText = `
      margin: 0;
      font-size: 22px;
      font-weight: normal;
      color: #fff;
      text-shadow: 0 0 15px rgba(100, 120, 255, 0.4);
    `;
    modal.appendChild(modalTitle);

    // Snapshot preview
    const preview = document.createElement('div');
    preview.style.cssText = `
      background: rgba(100, 120, 255, 0.06);
      border: 1px solid rgba(100, 120, 255, 0.15);
      border-radius: 8px;
      padding: 14px;
      font-size: 12px;
      color: #8888aa;
      display: flex;
      flex-direction: column;
      gap: 5px;
    `;

    const previewItems: Array<[string, string]> = [
      ['Agents', String(currentPostcard.agentCount)],
      ['Dominant Biome', currentPostcard.dominantBiome],
      ['World Age', `${currentPostcard.worldAge.toFixed(1)} years`],
    ];
    if (currentPostcard.epochTitle) {
      previewItems.unshift(['Epoch', currentPostcard.epochTitle]);
    }

    for (const [label, value] of previewItems) {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between;';
      row.innerHTML = `<span style="color:#555;">${label}</span><span style="color:#9999cc;">${value}</span>`;
      preview.appendChild(row);
    }

    modal.appendChild(preview);

    // Title input
    const titleLabel = document.createElement('label');
    titleLabel.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    const titleLabelText = document.createElement('span');
    titleLabelText.textContent = 'Universe Title *';
    titleLabelText.style.cssText = 'font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 1px;';
    titleLabel.appendChild(titleLabelText);

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = 'Name your universe...';
    titleInput.maxLength = 50;
    titleInput.style.cssText = `
      padding: 11px 14px;
      font-size: 14px;
      font-family: monospace;
      background: rgba(20, 20, 50, 0.8);
      border: 1px solid #3a3a5a;
      border-radius: 8px;
      color: #fff;
      outline: none;
      transition: border-color 0.2s;
    `;
    titleInput.onfocus = () => { titleInput.style.borderColor = '#667eea'; };
    titleInput.onblur = () => { titleInput.style.borderColor = '#3a3a5a'; };

    // Pre-populate with universe name if available
    const universeName = this.getUniverseName?.();
    if (universeName) {
      titleInput.value = universeName.slice(0, 50);
    }

    titleLabel.appendChild(titleInput);
    modal.appendChild(titleLabel);

    // Description textarea
    const descLabel = document.createElement('label');
    descLabel.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    const descHeader = document.createElement('div');
    descHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

    const descLabelText = document.createElement('span');
    descLabelText.textContent = 'Description (optional)';
    descLabelText.style.cssText = 'font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 1px;';
    descHeader.appendChild(descLabelText);

    const charCounter = document.createElement('span');
    charCounter.textContent = '0 / 200';
    charCounter.style.cssText = 'font-size: 11px; color: #444;';
    descHeader.appendChild(charCounter);

    descLabel.appendChild(descHeader);

    const descTextarea = document.createElement('textarea');
    descTextarea.placeholder = 'Describe what makes this universe special...';
    descTextarea.maxLength = 200;
    descTextarea.rows = 3;
    descTextarea.style.cssText = `
      padding: 11px 14px;
      font-size: 13px;
      font-family: monospace;
      background: rgba(20, 20, 50, 0.8);
      border: 1px solid #3a3a5a;
      border-radius: 8px;
      color: #ddd;
      outline: none;
      resize: vertical;
      transition: border-color 0.2s;
      line-height: 1.5;
    `;
    descTextarea.onfocus = () => { descTextarea.style.borderColor = '#667eea'; };
    descTextarea.onblur = () => { descTextarea.style.borderColor = '#3a3a5a'; };
    descTextarea.oninput = () => {
      const len = descTextarea.value.length;
      charCounter.textContent = `${len} / 200`;
      charCounter.style.color = len >= 180 ? '#c8a840' : '#444';
    };
    descLabel.appendChild(descTextarea);
    modal.appendChild(descLabel);

    // Buttons
    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 4px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 11px 22px;
      font-size: 14px;
      font-family: monospace;
      background: transparent;
      color: #888;
      border: 1px solid #3a3a5a;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    cancelBtn.onmouseenter = () => { cancelBtn.style.borderColor = '#5a5a7a'; cancelBtn.style.color = '#bbb'; };
    cancelBtn.onmouseleave = () => { cancelBtn.style.borderColor = '#3a3a5a'; cancelBtn.style.color = '#888'; };
    cancelBtn.onclick = () => this.closeShareModal();
    buttonRow.appendChild(cancelBtn);

    const shareBtn = document.createElement('button');
    shareBtn.textContent = 'Share ✦';
    shareBtn.style.cssText = `
      padding: 11px 28px;
      font-size: 14px;
      font-family: monospace;
      background: linear-gradient(135deg, #9b59b6 0%, #667eea 100%);
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    `;
    shareBtn.onmouseenter = () => {
      shareBtn.style.transform = 'scale(1.04)';
      shareBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
    };
    shareBtn.onmouseleave = () => {
      shareBtn.style.transform = 'scale(1)';
      shareBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
    };
    shareBtn.onclick = async () => {
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.style.borderColor = '#e74c3c';
        titleInput.focus();
        return;
      }

      shareBtn.disabled = true;
      shareBtn.textContent = 'Sharing...';
      shareBtn.style.opacity = '0.7';

      try {
        await this.dataSource.sharePostcard(currentPostcard, title, descTextarea.value.trim());
        this.closeShareModal();
        this.showSuccessToast('Postcard shared across the multiverse!');
        await this.loadAndRender();
      } catch (err) {
        console.error('[PostcardGallery] Failed to share postcard:', err);
        shareBtn.disabled = false;
        shareBtn.textContent = 'Share ✦';
        shareBtn.style.opacity = '1';
      }
    };
    buttonRow.appendChild(shareBtn);

    modal.appendChild(buttonRow);
    backdrop.appendChild(modal);

    // Close on backdrop click
    backdrop.onclick = (e) => {
      if (e.target === backdrop) this.closeShareModal();
    };

    this.shareModalEl = backdrop;
    document.body.appendChild(backdrop);

    // Focus title input
    requestAnimationFrame(() => titleInput.focus());
  }

  private closeShareModal(): void {
    if (this.shareModalEl) {
      this.shareModalEl.remove();
      this.shareModalEl = null;
    }
  }

  // ─── Toast ───────────────────────────────────────────────────────────────────

  private showSuccessToast(message: string): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: linear-gradient(135deg, rgba(100, 120, 255, 0.9) 0%, rgba(155, 89, 182, 0.9) 100%);
      color: #fff;
      padding: 12px 28px;
      border-radius: 24px;
      font-size: 14px;
      font-family: monospace;
      z-index: 10010;
      pointer-events: none;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
      animation: postcardSuccessToast 3.2s ease-in-out forwards;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3300);
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────

  private injectStyles(): void {
    if (this.stylesInjected) return;
    this.stylesInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes postcardFloatIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes postcardPulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
      @keyframes postcardSuccessToast {
        0%   { opacity: 0; transform: translateX(-50%) translateY(20px); }
        10%  { opacity: 1; transform: translateX(-50%) translateY(0); }
        90%  { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  private relativeDate(iso: string): string {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const diffSec = diffMs / 1000;
    const diffMin = diffSec / 60;
    const diffHr = diffMin / 60;
    const diffDay = diffHr / 24;
    const diffMonth = diffDay / 30;
    const diffYear = diffDay / 365;

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${Math.floor(diffMin)} minute${Math.floor(diffMin) !== 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${Math.floor(diffHr)} hour${Math.floor(diffHr) !== 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${Math.floor(diffDay)} day${Math.floor(diffDay) !== 1 ? 's' : ''} ago`;
    if (diffYear < 1) return `${Math.floor(diffMonth)} month${Math.floor(diffMonth) !== 1 ? 's' : ''} ago`;

    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private speciesColor(species: string): string {
    let hash = 0;
    for (let i = 0; i < species.length; i++) {
      hash = species.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 55%)`;
  }
}
