import type { Job } from 'bullmq';

import { createQueue } from '@/lib/job-queue.js';
import { logger } from '@/lib/logger.js';

import type { FeedSubscriptionsRepository } from '@/repositories/feed-subscriptions.repository.js';

export type FeedPollReason = 'scheduled' | 'manual';

export interface FeedPollJobData {
  force?: boolean;
  reason: FeedPollReason;
  subscriptionId: string;
  userId: string;
}

const enqueueFeedPoll = createQueue('feed-poll');

enqueueFeedPoll.on('waiting', (job: Job<FeedPollJobData>) => {
  logger.info(`[Queue] Feed poll job ${job.id} is waiting`);
});

enqueueFeedPoll.on('error', (error: Error) => {
  logger.error(`[Queue] Feed poll queue error: ${JSON.stringify(error)}`);
});

export async function enqueueFeedPollJob(data: FeedPollJobData): Promise<Job<FeedPollJobData>> {
  return enqueueFeedPoll.add('poll-feed', data, {
    deduplication: {
      id: `feed-poll:${data.subscriptionId}`,
      keepLastIfActive: true
    }
  });
}

export async function enqueueDueFeedPolls(input: {
  feedSubscriptions: FeedSubscriptionsRepository;
  limit?: number;
  now?: Date;
}): Promise<number> {
  const now = input.now ?? new Date();
  const dueSubscriptions = await input.feedSubscriptions.findDue(now, input.limit);

  for (const subscription of dueSubscriptions) {
    await enqueueFeedPollJob({
      reason: 'scheduled',
      subscriptionId: subscription.id,
      userId: subscription.userId
    });
  }

  return dueSubscriptions.length;
}

export { enqueueFeedPoll };
