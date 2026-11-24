import type { KeyValueStore } from './storage';

/**
 * Offline action queue (ARCHITECTURE.md §3.4).
 *
 * Every user action that must reach the server (tick, untick, glass of water, ...) is saved
 * on the phone first, with the moment it happened and a unique id, then sent in order.
 * - The id makes resending safe: the server stores an action once, however often it arrives.
 * - The phone's clock at the moment of sending travels with each action, so the server
 *   can correct a phone clock that is wrong.
 * - Order is kept: if one action cannot be sent yet, the ones after it wait.
 *
 * The queue decides nothing about the actions themselves; it only stores and delivers them.
 */

export type QueuedAction<P = unknown> = {
  clientActionId: string;
  type: string;
  payload: P;
  /** When it happened, by the phone's clock (ISO 8601). */
  deviceOccurredAt: string;
  attempts: number;
};

/**
 * What the sender reports for one action:
 * - `sent`: the server stored it (or already had it); remove it.
 * - `retry-later`: no connection or a temporary server error; stop and keep it.
 * - `rejected`: the server refused it for good (e.g. invalid); remove it and report it.
 */
export type SendOutcome = 'sent' | 'retry-later' | 'rejected';

export type Sender = (action: QueuedAction, deviceSentAt: string) => Promise<SendOutcome>;

export type FlushResult = {
  sent: QueuedAction[];
  rejected: QueuedAction[];
  remaining: number;
};

type Options = {
  store: KeyValueStore;
  newId: () => string;
  now?: () => Date;
  storageKey?: string;
};

export class OfflineQueue {
  private readonly store: KeyValueStore;
  private readonly newId: () => string;
  private readonly now: () => Date;
  private readonly key: string;
  private flushing: Promise<FlushResult> | null = null;

  constructor({ store, newId, now = () => new Date(), storageKey = 'offline-queue' }: Options) {
    this.store = store;
    this.newId = newId;
    this.now = now;
    this.key = storageKey;
  }

  /** Saves an action on the phone straight away. Never touches the network. */
  enqueue<P>(type: string, payload: P): QueuedAction<P> {
    const action: QueuedAction<P> = {
      clientActionId: this.newId(),
      type,
      payload,
      deviceOccurredAt: this.now().toISOString(),
      attempts: 0,
    };
    this.write([...this.read(), action]);
    return action;
  }

  pending(): QueuedAction[] {
    return this.read();
  }

  size(): number {
    return this.read().length;
  }

  /**
   * Sends queued actions oldest first. Stops at the first `retry-later`, so order is kept.
   * Calls made while a flush is running share that flush instead of starting another.
   */
  flush(send: Sender): Promise<FlushResult> {
    if (!this.flushing) {
      this.flushing = this.runFlush(send).finally(() => {
        this.flushing = null;
      });
    }
    return this.flushing;
  }

  private async runFlush(send: Sender): Promise<FlushResult> {
    const sent: QueuedAction[] = [];
    const rejected: QueuedAction[] = [];

    for (;;) {
      const [next] = this.read();
      if (!next) break;

      let outcome: SendOutcome;
      try {
        outcome = await send(next, this.now().toISOString());
      } catch {
        outcome = 'retry-later';
      }

      if (outcome === 'retry-later') {
        this.replaceHead({ ...next, attempts: next.attempts + 1 });
        break;
      }

      this.removeHead(next.clientActionId);
      (outcome === 'sent' ? sent : rejected).push(next);
    }

    return { sent, rejected, remaining: this.size() };
  }

  private read(): QueuedAction[] {
    const raw = this.store.getItem(this.key);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as QueuedAction[]) : [];
    } catch {
      return [];
    }
  }

  private write(actions: QueuedAction[]): void {
    if (actions.length === 0) {
      this.store.removeItem(this.key);
    } else {
      this.store.setItem(this.key, JSON.stringify(actions));
    }
  }

  private removeHead(clientActionId: string): void {
    // Re-read so actions enqueued during a send are never lost.
    this.write(this.read().filter((action) => action.clientActionId !== clientActionId));
  }

  private replaceHead(updated: QueuedAction): void {
    this.write(
      this.read().map((action) =>
        action.clientActionId === updated.clientActionId ? updated : action,
      ),
    );
  }
}
