import { beforeEach, describe, expect, it, vi } from 'vitest';

const queueMock = vi.hoisted(() => ({
  add: vi.fn(async (_name, data) => ({ data, id: 'job-1' })),
  on: vi.fn()
}));

vi.mock('@/lib/job-queue.js', () => ({
  createQueue: vi.fn(() => queueMock)
}));

const { enqueueDueFeedPolls, enqueueFeedPollJob } = await import('./feed-poll.queue.js');

describe('feed poll queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enqueues a single feed poll job with stable identity', async () => {
    await enqueueFeedPollJob({
      reason: 'manual',
      subscriptionId: 'feed-1',
      userId: 'user-1'
    });

    expect(queueMock.add).toHaveBeenCalledWith(
      'poll-feed',
      { reason: 'manual', subscriptionId: 'feed-1', userId: 'user-1' },
      { jobId: 'feed-poll:feed-1:manual' }
    );
  });

  it('enqueues due subscriptions as scheduled jobs', async () => {
    const now = new Date('2026-06-28T12:00:00.000Z');
    const feedSubscriptions = {
      findDue: vi.fn(async () => [
        { id: 'feed-1', userId: 'user-1' },
        { id: 'feed-2', userId: 'user-2' }
      ])
    };

    await expect(
      enqueueDueFeedPolls({ feedSubscriptions: feedSubscriptions as never, limit: 2, now })
    ).resolves.toBe(2);

    expect(feedSubscriptions.findDue).toHaveBeenCalledWith(now, 2);
    expect(queueMock.add).toHaveBeenCalledTimes(2);
    expect(queueMock.add).toHaveBeenNthCalledWith(
      2,
      'poll-feed',
      { reason: 'scheduled', subscriptionId: 'feed-2', userId: 'user-2' },
      { jobId: 'feed-poll:feed-2:scheduled' }
    );
  });
});
