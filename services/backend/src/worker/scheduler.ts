/**
 * Minute-aligned job scheduler for the worker role (ARCHITECTURE.md §5).
 *
 * - Ticks on every minute boundary (00 seconds), recomputing the delay each time so it never drifts.
 * - A job runs when the minute number is a multiple of its `everyMinutes`.
 * - A job never overlaps itself: if the previous run is still going, the new one is skipped
 *   and reported as an overrun.
 * - Errors never disappear: each failure goes to `onJobError`.
 * - An optional `guard` runs before each tick (e.g. "am I still the leader?"); if it says no,
 *   the tick is skipped.
 */

export type JobContext = {
  /** The minute boundary this run belongs to. */
  scheduledFor: Date;
  /** Aborted when the scheduler stops, so long jobs can end early and cleanly. */
  signal: AbortSignal;
};

export type ScheduledJob = {
  name: string;
  everyMinutes: number;
  run(context: JobContext): Promise<void>;
};

export type SchedulerHooks = {
  onJobError(job: ScheduledJob, error: unknown): void;
  onJobOverrun(job: ScheduledJob): void;
  onJobSuccess?(job: ScheduledJob, durationMs: number): void;
  onGuardFailed?(error: unknown): void;
};

export type SchedulerOptions = {
  jobs: ScheduledJob[];
  hooks: SchedulerHooks;
  guard?: () => Promise<void>;
  now?: () => number;
};

const MINUTE = 60_000;

export class Scheduler {
  private readonly jobs: ScheduledJob[];
  private readonly hooks: SchedulerHooks;
  private readonly guard: (() => Promise<void>) | undefined;
  private readonly now: () => number;
  private readonly running = new Map<string, Promise<void>>();
  private readonly abort = new AbortController();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor({ jobs, hooks, guard, now = Date.now }: SchedulerOptions) {
    for (const job of jobs) {
      if (!Number.isInteger(job.everyMinutes) || job.everyMinutes < 1) {
        throw new Error(`Job "${job.name}" needs everyMinutes as a whole number ≥ 1`);
      }
    }
    const names = new Set(jobs.map((job) => job.name));
    if (names.size !== jobs.length) throw new Error('Job names must be unique');
    this.jobs = jobs;
    this.hooks = hooks;
    this.guard = guard;
    this.now = now;
  }

  start(): void {
    if (this.stopped) throw new Error('A stopped scheduler cannot be restarted');
    this.scheduleNext();
  }

  /** Stops ticking, signals running jobs to finish, and waits up to `timeoutMs` for them. */
  async stop(timeoutMs = 10_000): Promise<void> {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.abort.abort();
    const all = Promise.allSettled([...this.running.values()]);
    await Promise.race([all, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
  }

  /** Runs one tick for the given minute. Exposed for tests; normally driven by the timer. */
  async tick(minuteStartMs: number): Promise<void> {
    if (this.guard) {
      try {
        await this.guard();
      } catch (error) {
        this.hooks.onGuardFailed?.(error);
        return;
      }
    }

    const minuteIndex = Math.floor(minuteStartMs / MINUTE);
    const scheduledFor = new Date(minuteIndex * MINUTE);

    for (const job of this.jobs) {
      if (minuteIndex % job.everyMinutes !== 0) continue;
      if (this.running.has(job.name)) {
        this.hooks.onJobOverrun(job);
        continue;
      }
      const startedAt = this.now();
      const run = (async () => {
        try {
          await job.run({ scheduledFor, signal: this.abort.signal });
          this.hooks.onJobSuccess?.(job, this.now() - startedAt);
        } catch (error) {
          this.hooks.onJobError(job, error);
        } finally {
          this.running.delete(job.name);
        }
      })();
      this.running.set(job.name, run);
    }
  }

  private scheduleNext(): void {
    if (this.stopped) return;
    const now = this.now();
    const nextMinute = (Math.floor(now / MINUTE) + 1) * MINUTE;
    this.timer = setTimeout(() => {
      void this.tick(nextMinute).finally(() => this.scheduleNext());
    }, nextMinute - now);
  }
}
