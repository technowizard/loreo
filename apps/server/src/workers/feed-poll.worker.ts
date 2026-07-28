import type { Job } from 'bullmq';

import type { FeedPollJobData } from '@/queues/feed-poll.queue.js';

import { db } from '@/db/index.js';

import { isDemoMode } from '@/lib/demo-mode.js';
import { createWorker } from '@/lib/job-queue.js';
import { logger } from '@/lib/logger.js';

import { createDrizzleFeedItemsAdapter } from '@/repositories/feed-items.repository.js';
import { createDrizzleFeedSubscriptionsAdapter } from '@/repositories/feed-subscriptions.repository.js';
import { createDrizzleLinksAdapter } from '@/repositories/links.repository.js';

import { createFeedIngestionService } from '@/services/feed-ingestion.service.js';

const workerName = 'feed-poll-worker';

const feedItems = createDrizzleFeedItemsAdapter(db);
const feedSubscriptions = createDrizzleFeedSubscriptionsAdapter(db);
const links = createDrizzleLinksAdapter(db);

const repos = { feedItems, feedSubscriptions, links };

function isDue(subscription: { nextFetchAfter: Date | null }, now: Date): boolean {
  return !subscription.nextFetchAfter || subscription.nextFetchAfter <= now;
}

export async function feedPollJob(job: Job<FeedPollJobData>): Promise<{
  autoSaved?: number;
  error?: string;
  fetched?: boolean;
  pruned?: number;
  staged?: number;
  status: string;
}> {
  if (isDemoMode()) {
    logger.info(`[${workerName}] Skipping feed poll job ${job.id} in demo mode`);
    return { status: 'skipped' };
  }

  const { force = false, subscriptionId, userId } = job.data;
  const subscription = await feedSubscriptions.findById(subscriptionId, userId);

  if (!subscription) {
    logger.warn(`[${workerName}] Feed subscription ${subscriptionId} not found`);
    return { error: 'Feed subscription not found', status: 'aborted' };
  }

  if (subscription.status !== 'active') {
    logger.info(`[${workerName}] Feed subscription ${subscriptionId} is not active`);
    return { status: 'skipped' };
  }

  if (!force && !isDue(subscription, new Date())) {
    logger.info(`[${workerName}] Feed subscription ${subscriptionId} is not due yet`);
    return { status: 'skipped' };
  }

  const ingestion = createFeedIngestionService({ repos });
  const result = await ingestion.pollSubscription({
    subscription,
    user: { id: userId }
  });

  logger.info(
    `[${workerName}] Feed poll ${job.id} completed. Staged: ${result.staged}, auto-saved: ${result.autoSaved}, pruned: ${result.pruned}`
  );

  return {
    autoSaved: result.autoSaved,
    fetched: result.fetched,
    pruned: result.pruned,
    staged: result.staged,
    status: 'completed'
  };
}

const feedPollWorker = createWorker('feed-poll', feedPollJob, {
  concurrency: 2,
  limiter: {
    duration: 60_000,
    max: 60
  }
});

feedPollWorker.on('completed', (job: Job<FeedPollJobData>) => {
  logger.info(`[${workerName}] Job ${job.id} completed`);
});

feedPollWorker.on('failed', (job: Job<FeedPollJobData> | undefined, error: Error) => {
  logger.error(`[${workerName}] Job ${job?.id ?? 'unknown'} failed: ${error.message}`);
});

feedPollWorker.on('error', (error: Error) => {
  logger.error(`[${workerName}] Error in feed poll worker: ${JSON.stringify(error)}`);
});

logger.info(
  `[${workerName}] Feed poll worker started and listening for jobs on 'feed-poll' queue.`
);

export default feedPollWorker;
