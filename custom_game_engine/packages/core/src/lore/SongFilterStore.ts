/**
 * SongFilterStore — manages song/species include/exclude state, manual queue,
 * saved playlists, and playback mode. Persisted to localStorage.
 *
 * Ported from Precursors to work with MVEE's ECS architecture.
 * Uses string speciesId instead of Species enum.
 */

const STORAGE_KEY = 'mvee.songFilter';

export type PlaybackMode = 'adaptive' | 'manual';

export type SongFilterEvent =
  | { type: 'mode_changed'; mode: PlaybackMode }
  | { type: 'queue_changed'; queue: readonly string[] };

interface PersistedState {
  disabledSpecies: string[];
  disabledSongs: string[];
  playlists: Record<string, string[]>;
  mode: PlaybackMode;
}

export class SongFilterStore {
  private disabledSpecies = new Set<string>();
  private disabledSongs = new Set<string>();
  private queue: string[] = [];
  private playlists = new Map<string, string[]>();
  private mode: PlaybackMode = 'adaptive';
  private readonly onEvent?: (event: SongFilterEvent) => void;

  constructor(onEvent?: (event: SongFilterEvent) => void) {
    this.onEvent = onEvent;
    this._load();
  }

  // ── Species filtering ───────────────────────────────────────────────────────

  isSpeciesEnabled(speciesId: string): boolean {
    return !this.disabledSpecies.has(speciesId);
  }

  setSpeciesEnabled(speciesId: string, enabled: boolean): void {
    if (enabled) {
      this.disabledSpecies.delete(speciesId);
    } else {
      this.disabledSpecies.add(speciesId);
    }
    this._persist();
  }

  // ── Song filtering ──────────────────────────────────────────────────────────

  isSongEnabled(filename: string): boolean {
    return !this.disabledSongs.has(filename);
  }

  setSongEnabled(filename: string, enabled: boolean): void {
    if (enabled) {
      this.disabledSongs.delete(filename);
    } else {
      this.disabledSongs.add(filename);
    }
    this._persist();
  }

  /** Combined check: song is allowed if both its species and the song itself are enabled. */
  isSongAllowed(filename: string, speciesId?: string): boolean {
    if (speciesId && !this.isSpeciesEnabled(speciesId)) return false;
    return this.isSongEnabled(filename);
  }

  // ── Playback mode ───────────────────────────────────────────────────────────

  getMode(): PlaybackMode {
    return this.mode;
  }

  setMode(mode: PlaybackMode): void {
    this.mode = mode;
    this._persist();
    this.onEvent?.({ type: 'mode_changed', mode });
  }

  // ── Queue ───────────────────────────────────────────────────────────────────

  getQueue(): ReadonlyArray<string> {
    return this.queue;
  }

  enqueue(filename: string): void {
    this.queue.push(filename);
    this.onEvent?.({ type: 'queue_changed', queue: this.queue });
  }

  dequeue(): string | undefined {
    const item = this.queue.shift();
    if (item !== undefined) {
      this.onEvent?.({ type: 'queue_changed', queue: this.queue });
    }
    return item;
  }

  removeFromQueue(filename: string): void {
    const idx = this.queue.indexOf(filename);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      this.onEvent?.({ type: 'queue_changed', queue: this.queue });
    }
  }

  reorderQueue(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.queue.length) return;
    if (toIndex < 0 || toIndex >= this.queue.length) return;
    const [item] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, item!);
    this.onEvent?.({ type: 'queue_changed', queue: this.queue });
  }

  clearQueue(): void {
    this.queue = [];
    this.onEvent?.({ type: 'queue_changed', queue: this.queue });
  }

  // ── Saved playlists ─────────────────────────────────────────────────────────

  getPlaylistNames(): string[] {
    return [...this.playlists.keys()];
  }

  getPlaylist(name: string): string[] | null {
    return this.playlists.get(name) ?? null;
  }

  savePlaylist(name: string, songs: string[]): void {
    this.playlists.set(name, [...songs]);
    this._persist();
  }

  deletePlaylist(name: string): void {
    this.playlists.delete(name);
    this._persist();
  }

  /** Load a saved playlist into the queue, replacing current queue. */
  loadPlaylistToQueue(name: string): void {
    const songs = this.playlists.get(name);
    if (!songs) return;
    this.queue = [...songs];
    this.onEvent?.({ type: 'queue_changed', queue: this.queue });
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  private _persist(): void {
    try {
      const state: PersistedState = {
        disabledSpecies: [...this.disabledSpecies],
        disabledSongs: [...this.disabledSongs],
        playlists: Object.fromEntries(this.playlists),
        mode: this.mode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      console.error('[SongFilterStore] Failed to persist to localStorage');
    }
  }

  private _load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state: PersistedState = JSON.parse(raw);
      if (Array.isArray(state.disabledSpecies)) {
        this.disabledSpecies = new Set(state.disabledSpecies);
      }
      if (Array.isArray(state.disabledSongs)) {
        this.disabledSongs = new Set(state.disabledSongs);
      }
      if (state.playlists && typeof state.playlists === 'object') {
        this.playlists = new Map(Object.entries(state.playlists));
      }
      if (state.mode === 'adaptive' || state.mode === 'manual') {
        this.mode = state.mode;
      }
    } catch {
      console.error('[SongFilterStore] Failed to load from localStorage');
    }
  }
}
