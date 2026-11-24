import type { InternalApi, SessionLock } from '@wildself/internal-api';

import type { Logger } from '../observability/logger';
import { reportCheckInFinished, reportCheckInStarted, reportError } from '../observability/sentry';

import { Scheduler, type ScheduledJob } from './scheduler';

/**
 * The worker role. Exactly one worker runs jobs at a time: it must hold the leadership
 * lock in PostgreSQL (ARCHITECTURE.md §6.4). Others wait and retry, so a second copy
 * started by mistake, or during a deploy, never runs the midnight pipeline twice.
 *
 * Phase 0 has a single job, the heartbeat. Later phases add the midnight pipeline,
 * retention clean-up and partition creation.
 */

const LEADERSHIP_RETRY_MS = 30_000;

export type WorkerHandle = { stop(): Promise<void> };

export function heartbeatJob(internalApi: InternalApi, logger: Logger): ScheduledJob {
  return {
    name: 'heartbeat',
    everyMinutes: 1,
    run: async () => {
      const checkInId = reportCheckInStarted('worker-heartbeat');
      const database = await internalApi.system.checkDatabase();
      if (!database.ok) {
        reportCheckInFinished('worker-heartbeat', 'error', checkInId);
        throw database.error;
      }
      reportCheckInFinished('worker-heartbeat', 'ok', checkInId);
      logger.debug('worker heartbeat ok');
    },
  };
}

export function startWorker({
  internalApi,
  logger,
  extraJobs = [],
}: {
  internalApi: InternalApi;
  logger: Logger;
  extraJobs?: ScheduledJob[];
}): WorkerHandle {
  let stopped = false;
  let lock: SessionLock | null = null;
  let scheduler: Scheduler | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const jobs = [heartbeatJob(internalApi, logger), ...extraJobs];

  const stepDown = async (reason: string, error?: unknown) => {
    logger.error({ err: error }, `worker stepping down: ${reason}`);
    if (error) reportError(error, { component: 'worker-leadership' });
    const current = scheduler;
    scheduler = null;
    await current?.stop();
    const held = lock;
    lock = null;
    await held?.release().catch(() => undefined);
    scheduleRetry();
  };

  const scheduleRetry = () => {
    if (stopped) return;
    retryTimer = setTimeout(() => void tryLead(), LEADERSHIP_RETRY_MS);
  };

  const tryLead = async () => {
    if (stopped) return;
    try {
      const acquired = await internalApi.leadership.tryAcquireWorkerLeadership();
      if (!acquired) {
        logger.info('another worker is the leader; will retry');
        scheduleRetry();
        return;
      }
      if (stopped) {
        await acquired.release();
        return;
      }
      lock = acquired;
      logger.info({ jobs: jobs.map((job) => job.name) }, 'worker is the leader; scheduler started');
      scheduler = new Scheduler({
        jobs,
        // Before every tick, prove the lock's connection (and so the lock) still exists.
        guard: async () => {
          if (!lock) throw new Error('no leadership lock');
          await lock.verify();
        },
        hooks: {
          onJobError: (job, error) => {
            logger.error({ err: error, job: job.name }, 'scheduled job failed');
            reportError(error, { job: job.name });
          },
          onJobOverrun: (job) => {
            logger.warn({ job: job.name }, 'scheduled job still running from the previous minute; skipped');
            reportError(new Error(`Job "${job.name}" overran its interval`), { job: job.name });
          },
          onJobSuccess: (job, durationMs) => logger.debug({ job: job.name, durationMs }, 'scheduled job done'),
          onGuardFailed: (error) => void stepDown('leadership lock lost', error),
        },
      });
      scheduler.start();
    } catch (error) {
      logger.error({ err: error }, 'could not try for worker leadership');
      reportError(error, { component: 'worker-leadership' });
      scheduleRetry();
    }
  };

  void tryLead();

  return {
    stop: async () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      await scheduler?.stop();
      await lock?.release().catch(() => undefined);
      logger.info('worker stopped');
    },
  };
}
