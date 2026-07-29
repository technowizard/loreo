import { beforeEach, describe, expect, it, vi } from 'vitest';

const createWorkerMock = vi.hoisted(() => vi.fn(() => ({ close: vi.fn(), on: vi.fn() })));
const feedSubscriptionsAdapterMock = vi.hoisted(() => ({ findDue: vi.fn() }));
const enqueueDueFeedPollsMock = vi.hoisted(() => vi.fn());

vi.mock('@/db/index.js', () => ({ db: {} }));
vi.mock('@/lib/job-queue.js', () => ({ createWorker: createWorkerMock }));
vi.mock('@/queues/feed-poll.queue.js', () => ({
  enqueueDueFeedPolls: enqueueDueFeedPollsMock
}));
vi.mock('@/repositories/feed-subscriptions.repository.js', () => ({
  createDrizzleFeedSubscriptionsAdapter: vi.fn(() => feedSubscriptionsAdapterMock)
}));

const { scanDueFeedsJob } = await import('./feed-poll-scheduler.worker.js');

describe('feed poll scheduler worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scans one bounded batch and enqueues each due subscription', async () => {
    enqueueDueFeedPollsMock.mockResolvedValue(3);

    await expect(
      scanDueFeedsJob({ data: { batchSize: 75 }, id: 'scan-1' } as never)
    ).resolves.toEqual({ enqueued: 3, status: 'completed' });

    expect(enqueueDueFeedPollsMock).toHaveBeenCalledWith({
      feedSubscriptions: feedSubscriptionsAdapterMock,
      limit: 75
    });
  });
});
