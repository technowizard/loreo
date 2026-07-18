import type { Job } from 'bullmq';

import type { FeedPollScanJobData } from '@/queues/feed-poll-scheduler.queue.js';
import { enqueueDueFeedPolls } from '@/queues/feed-poll.queue.js';

import { db } from '@/db/index.js';

import { createWorker } from '@/lib/job-queue.js';
import { logger } from '@/lib/logger.js';

import { createDrizzleFeedSubscriptionsAdapter } from '@/repositories/feed-subscriptions.repository.js';

const workerName = 'feed-poll-scheduler-worker';
const feedSubscriptions = createDrizzleFeedSubscriptionsAdapter(db);

export async function scanDueFeedsJob(
  job: Job<FeedPollScanJobData>
): Promise<{ enqueued: number; status: 'completed' }> {
  const enqueued = await enqueueDueFeedPolls({
    feedSubscriptions,
    limit: job.data.batchSize
  });

  logger.info(`[${workerName}] Due-feed scan ${job.id} enqueued ${enqueued} subscription(s)`);
  return { enqueued, status: 'completed' };
}

const feedPollSchedulerWorker = createWorker('feed-poll-scheduler', scanDueFeedsJob, {
  concurrency: 1
});

feedPollSchedulerWorker.on('completed', (job: Job<FeedPollScanJobData>) => {
  logger.info(`[${workerName}] Job ${job.id} completed`);
});

feedPollSchedulerWorker.on('failed', (job: Job<FeedPollScanJobData> | undefined, error: Error) => {
  logger.error(`[${workerName}] Job ${job?.id ?? 'unknown'} failed: ${error.message}`);
});

feedPollSchedulerWorker.on('error', (error: Error) => {
  logger.error(`[${workerName}] Error: ${JSON.stringify(error)}`);
});

logger.info(`[${workerName}] Feed poll scheduler worker started and listening for scan jobs.`);

export default feedPollSchedulerWorker;
