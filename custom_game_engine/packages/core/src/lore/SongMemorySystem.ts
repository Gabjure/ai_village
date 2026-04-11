/**
 * SongMemorySystem — Tracks per-agent song hearings and comprehension levels.
 *
 * When a song plays, every living agent "hears" it.
 * After repeated hearings, comprehension deepens:
 *   1st hearing  → vague (knows the song exists, recognizes the name)
 *   2nd hearing  → moderate (understands the mood and general theme)
 *   3rd+ hearing → full (can access translated lyrics and comment meaningfully)
 *
 * Ported from Precursors to work with MVEE's ECS architecture.
 */

export type SongComprehension = 'vague' | 'moderate' | 'full';

export interface SongHearing {
  /** Number of times this agent has heard this song. */
  playCount: number;
  /** Timestamp of first hearing. */
  firstHeard: number;
  /** Timestamp of most recent hearing. */
  lastHeard: number;
}

/** Per-agent song memory: Map<songFilename, SongHearing> */
export type AgentSongMemory = Map<string, SongHearing>;

/** Serialized format for song memories. */
export interface SongMemorySaveData {
  hearings: Record<string, Record<string, SongHearing>>;
  bootstrappedAgentIds: string[];
}

/** Callback to get living agent IDs from the world. */
export type GetLivingAgentsFn = () => string[];

/** Callback when a song change occurs (for event emission). */
export type OnSongChangedFn = (filename: string | null) => void;

export class SongMemorySystem {
  /** Per-agent song memories. Key = entity ID */
  private memories = new Map<string, AgentSongMemory>();

  /** Agent IDs that have already been bootstrapped (idempotency guard). */
  private bootstrappedAgentIds = new Set<string>();

  /** Currently playing song filename (null = silence). */
  private currentSongFilename: string | null = null;

  /** Callback to get living agents from the world. */
  private readonly getLivingAgents: GetLivingAgentsFn;

  constructor(getLivingAgents: GetLivingAgentsFn) {
    this.getLivingAgents = getLivingAgents;
  }

  /** Called by SongSystem when the current song changes. */
  onSongChanged(filename: string | null): void {
    this.currentSongFilename = filename;
    if (filename) {
      this.recordHearingForAllAgents(filename);
    }
  }

  /** Track which songs have been unlocked on the cross-game radio this session. */
  private radioUnlockedThisSession = new Set<string>();

  /** Record that all living agents heard a song. */
  private recordHearingForAllAgents(filename: string): void {
    const now = Date.now();
    const agents = this.getLivingAgents();

    for (const agentId of agents) {
      let agentMemory = this.memories.get(agentId);
      if (!agentMemory) {
        agentMemory = new Map();
        this.memories.set(agentId, agentMemory);
      }

      const existing = agentMemory.get(filename);
      if (existing) {
        existing.playCount++;
        existing.lastHeard = now;
      } else {
        agentMemory.set(filename, {
          playCount: 1,
          firstHeard: now,
          lastHeard: now,
        });
      }
    }

    // Unlock on cross-game radio (once per session per song)
    if (!this.radioUnlockedThisSession.has(filename)) {
      this.radioUnlockedThisSession.add(filename);
      SongMemorySystem.unlockSongOnRadio(filename);
    }
  }

  /**
   * Write a song to the shared mv-radio-unlocked localStorage key.
   * The website radio widget reads this to filter its playlist to songs
   * the player has actually heard in-game.
   */
  static unlockSongOnRadio(songFilename: string): void {
    const LS_KEY = 'mv-radio-unlocked';
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return;

      const normalized = songFilename
        .replace(/\.mp3$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      let changed = false;
      if (!arr.includes(songFilename)) { arr.push(songFilename); changed = true; }
      if (normalized && !arr.includes(normalized)) { arr.push(normalized); changed = true; }

      if (changed) {
        localStorage.setItem(LS_KEY, JSON.stringify(arr));
        try {
          const ch = new BroadcastChannel('mv-radio');
          ch.postMessage({ type: 'song-unlocked', trackId: songFilename });
          if (normalized !== songFilename) {
            ch.postMessage({ type: 'song-unlocked', trackId: normalized });
          }
          ch.close();
        } catch (_) { /* BroadcastChannel not available */ }
      }
    } catch (_) { /* localStorage not available */ }
  }

  /** Get comprehension level for an agent and a specific song. */
  getComprehension(agentId: string, filename: string): SongComprehension | null {
    const agentMemory = this.memories.get(agentId);
    if (!agentMemory) return null;
    const hearing = agentMemory.get(filename);
    if (!hearing) return null;

    if (hearing.playCount >= 3) return 'full';
    if (hearing.playCount >= 2) return 'moderate';
    return 'vague';
  }

  /** Get play count for an agent and a specific song. */
  getPlayCount(agentId: string, filename: string): number {
    return this.memories.get(agentId)?.get(filename)?.playCount ?? 0;
  }

  /** Get the currently playing song filename. */
  getCurrentSong(): string | null {
    return this.currentSongFilename;
  }

  /** Get display name from filename (strip .mp3 extension). */
  getSongDisplayName(filename: string): string {
    return filename.replace(/\.mp3$/i, '');
  }

  /** Get all songs an agent knows, sorted by play count descending. */
  getKnownSongs(agentId: string): Array<{ filename: string; hearing: SongHearing; comprehension: SongComprehension }> {
    const agentMemory = this.memories.get(agentId);
    if (!agentMemory) return [];

    const results: Array<{ filename: string; hearing: SongHearing; comprehension: SongComprehension }> = [];
    for (const [filename, hearing] of agentMemory) {
      results.push({
        filename,
        hearing,
        comprehension: this.getComprehension(agentId, filename)!,
      });
    }

    results.sort((a, b) => b.hearing.playCount - a.hearing.playCount);
    return results;
  }

  /**
   * Pre-load species-appropriate song knowledge for an agent.
   * Idempotent — calling multiple times for the same agent has no additional effect.
   */
  bootstrapSpeciesKnowledge(
    agentId: string,
    speciesId: string,
    catalogue: ReadonlyArray<{ filename: string; speciesId?: string }>,
    bootstrapPlayCount = 1,
  ): void {
    if (this.bootstrappedAgentIds.has(agentId)) return;

    const now = Date.now();
    let agentMemory = this.memories.get(agentId);
    if (!agentMemory) {
      agentMemory = new Map();
      this.memories.set(agentId, agentMemory);
    }

    for (const song of catalogue) {
      if (song.speciesId === speciesId && !agentMemory.has(song.filename)) {
        agentMemory.set(song.filename, {
          playCount: bootstrapPlayCount,
          firstHeard: now,
          lastHeard: now,
        });
      }
    }

    this.bootstrappedAgentIds.add(agentId);
  }

  /**
   * Record that a specific agent heard a song via proximity.
   */
  recordProximityHearing(agentId: string, filename: string): void {
    const now = Date.now();
    let agentMemory = this.memories.get(agentId);
    if (!agentMemory) {
      agentMemory = new Map();
      this.memories.set(agentId, agentMemory);
    }

    const existing = agentMemory.get(filename);
    if (existing) {
      existing.playCount++;
      existing.lastHeard = now;
    } else {
      agentMemory.set(filename, {
        playCount: 1,
        firstHeard: now,
        lastHeard: now,
      });
    }
  }

  /** Serialize song memories for save/load. */
  serialize(): SongMemorySaveData {
    const hearings: Record<string, Record<string, SongHearing>> = {};
    for (const [agentId, agentMemory] of this.memories) {
      const songData: Record<string, SongHearing> = {};
      for (const [filename, hearing] of agentMemory) {
        songData[filename] = { ...hearing };
      }
      hearings[agentId] = songData;
    }
    return {
      hearings,
      bootstrappedAgentIds: [...this.bootstrappedAgentIds],
    };
  }

  /** Restore song memories from save data. */
  restore(data: SongMemorySaveData): void {
    this.memories.clear();
    this.bootstrappedAgentIds.clear();

    for (const agentId of Object.keys(data.hearings)) {
      const agentMemory: AgentSongMemory = new Map();
      for (const [filename, hearing] of Object.entries(data.hearings[agentId]!)) {
        agentMemory.set(filename, hearing);
      }
      this.memories.set(agentId, agentMemory);
    }

    for (const id of data.bootstrappedAgentIds) {
      this.bootstrappedAgentIds.add(id);
    }
  }

  /** Clean up memories for dead agents (call periodically). */
  pruneDeadAgents(livingAgentIds: Set<string>): void {
    for (const agentId of this.memories.keys()) {
      if (!livingAgentIds.has(agentId)) {
        this.memories.delete(agentId);
      }
    }
  }
}
