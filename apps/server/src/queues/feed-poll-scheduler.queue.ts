import type { Job } from 'bullmq';

import { env } from '@/lib/env-config.js';
import { createQueue } from '@/lib/job-queue.js';
import { logger } from '@/lib/logger.js';

export interface FeedPollScanJobData {
  batchSize: number;
}

const SCHEDULER_ID = 'feed-poll-due-scan';

const feedPollSchedulerQueue = createQueue('feed-poll-scheduler');

feedPollSchedulerQueue.on('error', (error: Error) => {
  logger.error(`[Queue] Feed poll scheduler queue error: ${JSON.stringify(error)}`);
});

export async function registerFeedPollScheduler(
  options: {
    batchSize?: number;
    intervalMs?: number;
  } = {}
): Promise<Job> {
  const batchSize = options.batchSize ?? env.FEED_POLL_SCAN_BATCH_SIZE;
  const intervalMs = options.intervalMs ?? env.FEED_POLL_SCAN_INTERVAL_MS;

  const job = await feedPollSchedulerQueue.upsertJobScheduler(
    SCHEDULER_ID,
    { every: intervalMs },
    {
      data: { batchSize } satisfies FeedPollScanJobData,
      name: 'scan-due-feeds'
    }
  );

  logger.info(
    `[Queue] Feed poll scheduler registered every ${intervalMs}ms with batch size ${batchSize}`
  );

  return job;
}

export { feedPollSchedulerQueue };
