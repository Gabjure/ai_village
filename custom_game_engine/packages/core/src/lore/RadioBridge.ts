/**
 * RadioBridge — Cross-tab music coordination for MVEE.
 *
 * Uses BroadcastChannel to ensure only one tab plays music at a time.
 * When this tab loses leadership (another game tab takes over),
 * music is paused. When leadership returns, it resumes.
 *
 * Ported from Precursors. Uses the same 'mv-radio' channel so that
 * Precursors and MVEE tabs coordinate with each other.
 */

const CHANNEL_NAME = 'mv-radio';
const HEARTBEAT_INTERVAL = 3000;
const LEADER_TIMEOUT = 10000;
const ELECTION_DELAY = 200;

const PRIORITY = {
  BACKGROUND: 0,
  WIDGET: 1,
  GAME_HIDDEN: 2,
  GAME_VISIBLE: 3,
  GAME_FOCUSED: 4,
} as const;

export interface RadioBridgeCallbacks {
  pause: () => void;
  resume: () => void;
}

export class RadioBridge {
  private readonly tabId: string;
  private readonly callbacks: RadioBridgeCallbacks;
  private channel: BroadcastChannel | null = null;
  private isLeader = false;
  private priority: number;
  private currentLeaderId: string | null = null;
  private currentLeaderPriority = -1;
  private lastLeaderHeartbeat = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private electionTimer: ReturnType<typeof setTimeout> | null = null;
  private leaderWatchdog: ReturnType<typeof setInterval> | null = null;
  private mutedByCoordination = false;
  private destroyed = false;

  // Bound listeners for cleanup
  private readonly _onVisibility = () => this.onVisibilityChange();
  private readonly _onFocus = () => this.onFocusChange();
  private readonly _onBlur = () => this.onVisibilityChange();
  private readonly _onUnload = () => this.onBeforeUnload();
  private readonly _onMessage = (e: MessageEvent) => this.handleMessage(e.data);

  constructor(callbacks: RadioBridgeCallbacks) {
    this.callbacks = callbacks;
    this.tabId = `game-mvee-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.priority = this.computePriority();

    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.addEventListener('message', this._onMessage);
    } catch {
      // BroadcastChannel not supported — this tab operates standalone as leader
      this.isLeader = true;
      return;
    }

    document.addEventListener('visibilitychange', this._onVisibility);
    window.addEventListener('focus', this._onFocus);
    window.addEventListener('blur', this._onBlur);
    window.addEventListener('beforeunload', this._onUnload);

    // Watchdog: detect dead leaders
    this.leaderWatchdog = setInterval(() => {
      if (!this.isLeader && this.currentLeaderId) {
        if (Date.now() - this.lastLeaderHeartbeat > LEADER_TIMEOUT) {
          this.currentLeaderId = null;
          this.currentLeaderPriority = -1;
          this.startElection();
        }
      }
    }, LEADER_TIMEOUT);

    this.startElection();
  }

  private computePriority(): number {
    if (typeof document === 'undefined') return PRIORITY.BACKGROUND;
    if (document.hasFocus()) return PRIORITY.GAME_FOCUSED;
    if (!document.hidden) return PRIORITY.GAME_VISIBLE;
    return PRIORITY.GAME_HIDDEN;
  }

  private broadcast(msg: Record<string, unknown>): void {
    if (this.channel) {
      try { this.channel.postMessage(msg); } catch { /* noop */ }
    }
  }

  private handleMessage(data: Record<string, unknown>): void {
    if (!data?.type || data.tabId === this.tabId) return;

    switch (data.type) {
      case 'leader-claim':
        this.handleLeaderClaim(data);
        break;
      case 'leader-heartbeat':
        this.handleLeaderHeartbeat(data);
        break;
      case 'leader-resign':
        if (data.tabId === this.currentLeaderId) {
          this.currentLeaderId = null;
          this.currentLeaderPriority = -1;
          this.startElection();
        }
        break;
    }
  }

  private handleLeaderClaim(data: Record<string, unknown>): void {
    const claimPriority = (data.priority as number) ?? 0;
    this.currentLeaderId = data.tabId as string;
    this.currentLeaderPriority = claimPriority;
    this.lastLeaderHeartbeat = Date.now();
    if (this.electionTimer) clearTimeout(this.electionTimer);

    if (this.isLeader) {
      if (claimPriority >= this.priority) {
        this.yieldLeadership();
      } else {
        this.claimLeadership();
      }
    } else {
      this.muteIfNeeded();
    }
  }

  private handleLeaderHeartbeat(data: Record<string, unknown>): void {
    if (data.tabId === this.currentLeaderId) {
      this.lastLeaderHeartbeat = Date.now();
      if (data.priority !== undefined) {
        this.currentLeaderPriority = data.priority as number;
      }
    }
  }

  private startElection(): void {
    if (this.destroyed) return;
    if (this.electionTimer) clearTimeout(this.electionTimer);
    const delay = Math.max(50, ELECTION_DELAY - (this.priority * 40));
    this.electionTimer = setTimeout(() => {
      if (!this.currentLeaderId || this.priority > this.currentLeaderPriority) {
        this.claimLeadership();
      }
    }, delay);
  }

  private claimLeadership(): void {
    this.isLeader = true;
    this.currentLeaderId = this.tabId;
    this.currentLeaderPriority = this.priority;
    this.lastLeaderHeartbeat = Date.now();

    this.broadcast({
      type: 'leader-claim',
      tabId: this.tabId,
      role: 'game',
      gameId: 'mvee',
      priority: this.priority,
    });

    this.startHeartbeat();
    this.unmuteIfNeeded();
  }

  private yieldLeadership(): void {
    this.isLeader = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.muteIfNeeded();
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.lastLeaderHeartbeat = Date.now();
    this.heartbeatTimer = setInterval(() => {
      this.priority = this.computePriority();
      this.broadcast({
        type: 'leader-heartbeat',
        tabId: this.tabId,
        role: 'game',
        gameId: 'mvee',
        priority: this.priority,
      });
    }, HEARTBEAT_INTERVAL);
  }

  private onVisibilityChange(): void {
    const oldPriority = this.priority;
    this.priority = this.computePriority();
    if (this.priority !== oldPriority) {
      this.onPriorityChange();
    }
  }

  private onFocusChange(): void {
    const oldPriority = this.priority;
    this.priority = this.computePriority();
    if (this.priority > oldPriority) {
      this.onPriorityChange();
    }
  }

  private onPriorityChange(): void {
    if (this.isLeader) {
      this.broadcast({
        type: 'leader-heartbeat',
        tabId: this.tabId,
        role: 'game',
        gameId: 'mvee',
        priority: this.priority,
      });
    } else if (this.priority > this.currentLeaderPriority) {
      this.claimLeadership();
    }
  }

  private muteIfNeeded(): void {
    if (!this.mutedByCoordination) {
      this.mutedByCoordination = true;
      this.callbacks.pause();
    }
  }

  private unmuteIfNeeded(): void {
    if (this.mutedByCoordination) {
      this.mutedByCoordination = false;
      this.callbacks.resume();
    }
  }

  private onBeforeUnload(): void {
    if (this.isLeader) {
      this.broadcast({ type: 'leader-resign', tabId: this.tabId });
    }
    this.destroy();
  }

  /** Clean up all listeners and timers. */
  destroy(): void {
    this.destroyed = true;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.leaderWatchdog) clearInterval(this.leaderWatchdog);
    if (this.electionTimer) clearTimeout(this.electionTimer);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._onVisibility);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this._onFocus);
      window.removeEventListener('blur', this._onBlur);
      window.removeEventListener('beforeunload', this._onUnload);
    }
    if (this.channel) {
      this.channel.removeEventListener('message', this._onMessage);
      this.channel.close();
      this.channel = null;
    }
  }
}
