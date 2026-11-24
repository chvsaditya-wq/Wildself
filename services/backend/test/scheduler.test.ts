import { afterEach, describe, expect, it, vi } from 'vitest';

import { Scheduler, type ScheduledJob, type SchedulerHooks } from '../src/worker/scheduler';

const MINUTE = 60_000;
const T0 = Date.UTC(2026, 10, 24, 10, 0, 0); // a minute boundary

function hooks(): SchedulerHooks & {
  errors: string[];
  overruns: string[];
  successes: string[];
  guardFailures: number;
} {
  const state = { errors: [] as string[], overruns: [] as string[], successes: [] as string[], guardFailures: 0 };
  return {
    ...state,
    onJobError: (job) => state.errors.push(job.name),
    onJobOverrun: (job) => state.overruns.push(job.name),
    onJobSuccess: (job) => state.successes.push(job.name),
    onGuardFailed: () => {
      state.guardFailures += 1;
    },
    get errors() {
      return state.errors;
    },
    get overruns() {
      return state.overruns;
    },
    get successes() {
      return state.successes;
    },
    get guardFailures() {
      return state.guardFailures;
    },
  };
}

const job = (name: string, everyMinutes: number, run: ScheduledJob['run'] = async () => undefined): ScheduledJob => ({
  name,
  everyMinutes,
  run,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Scheduler', () => {
  it('fires on minute boundaries, not on start-up', async () => {
    vi.useFakeTimers({ now: T0 + 25_000 });
    const runs: number[] = [];
    const h = hooks();
    const scheduler = new Scheduler({
      jobs: [job('tick', 1, async ({ scheduledFor }) => void runs.push(scheduledFor.getTime()))],
      hooks: h,
    });
    scheduler.start();

    await vi.advanceTimersByTimeAsync(34_000);
    expect(runs).toEqual([]);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(runs).toEqual([T0 + MINUTE]);
    await vi.advanceTimersByTimeAsync(MINUTE);
    expect(runs).toEqual([T0 + MINUTE, T0 + 2 * MINUTE]);
    await scheduler.stop();
  });

  it('runs a job only on minutes that are multiples of its interval', async () => {
    const h = hooks();
    const runs: string[] = [];
    const scheduler = new Scheduler({
      jobs: [job('every-1', 1, async () => void runs.push('1')), job('every-5', 5, async () => void runs.push('5'))],
      hooks: h,
    });
    for (let m = 0; m < 10; m++) await scheduler.tick(T0 + m * MINUTE);
    await scheduler.stop();
    expect(runs.filter((r) => r === '1')).toHaveLength(10);
    expect(runs.filter((r) => r === '5')).toHaveLength(2);
  });

  it('never runs a job twice at the same time; the overlap is reported', async () => {
    const h = hooks();
    let release: () => void = () => undefined;
    const slow = job('slow', 1, () => new Promise<void>((resolve) => (release = resolve)));
    const scheduler = new Scheduler({ jobs: [slow], hooks: h });

    await scheduler.tick(T0);
    await scheduler.tick(T0 + MINUTE);
    expect(h.overruns).toEqual(['slow']);

    release();
    await scheduler.stop();
    expect(h.successes).toEqual(['slow']);
  });

  it('reports a failing job and keeps running the others', async () => {
    const h = hooks();
    const scheduler = new Scheduler({
      jobs: [
        job('broken', 1, async () => {
          throw new Error('boom');
        }),
        job('fine', 1),
      ],
      hooks: h,
    });
    await scheduler.tick(T0);
    await scheduler.stop();
    expect(h.errors).toEqual(['broken']);
    expect(h.successes).toEqual(['fine']);
  });

  it('skips the whole tick if the guard fails (e.g. leadership lost)', async () => {
    const h = hooks();
    const run = vi.fn(async () => undefined);
    const scheduler = new Scheduler({
      jobs: [job('guarded', 1, run)],
      hooks: h,
      guard: async () => {
        throw new Error('lock lost');
      },
    });
    await scheduler.tick(T0);
    await scheduler.stop();
    expect(run).not.toHaveBeenCalled();
    expect(h.guardFailures).toBe(1);
  });

  it('asks running jobs to stop when the scheduler stops', async () => {
    const h = hooks();
    let aborted = false;
    const scheduler = new Scheduler({
      jobs: [
        job('long', 1, ({ signal }) => {
          return new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => {
              aborted = true;
              resolve();
            });
          });
        }),
      ],
      hooks: h,
    });
    await scheduler.tick(T0);
    await scheduler.stop();
    expect(aborted).toBe(true);
  });

  it('rejects invalid job definitions up front', () => {
    expect(() => new Scheduler({ jobs: [job('zero', 0)], hooks: hooks() })).toThrow();
    expect(() => new Scheduler({ jobs: [job('a', 1), job('a', 2)], hooks: hooks() })).toThrow();
  });
});
