import { beforeEach, describe, expect, it, vi } from 'vitest';

const createWorkerMock = vi.hoisted(() => vi.fn(() => ({ on: vi.fn(), close: vi.fn() })));
const feedSubscriptionsAdapterMock = vi.hoisted(() => ({ findById: vi.fn() }));
const feedItemsAdapterMock = vi.hoisted(() => ({}));
const linksAdapterMock = vi.hoisted(() => ({}));
const pollSubscriptionMock = vi.hoisted(() => vi.fn());
const createFeedIngestionServiceMock = vi.hoisted(() =>
  vi.fn(() => ({ pollSubscription: pollSubscriptionMock }))
);

vi.mock('@/db/index.js', () => ({ db: {} }));
vi.mock('@/lib/job-queue.js', () => ({ createWorker: createWorkerMock }));
vi.mock('@/repositories/feed-subscriptions.repository.js', () => ({
  createDrizzleFeedSubscriptionsAdapter: vi.fn(() => feedSubscriptionsAdapterMock)
}));
vi.mock('@/repositories/feed-items.repository.js', () => ({
  createDrizzleFeedItemsAdapter: vi.fn(() => feedItemsAdapterMock)
}));
vi.mock('@/repositories/links.repository.js', () => ({
  createDrizzleLinksAdapter: vi.fn(() => linksAdapterMock)
}));
vi.mock('@/services/feed-ingestion.service.js', () => ({
  createFeedIngestionService: createFeedIngestionServiceMock
}));

const { feedPollJob } = await import('./feed-poll.worker.js');

function job(data: {
  force?: boolean;
  reason: 'manual' | 'scheduled';
  subscriptionId: string;
  userId: string;
}) {
  return { data, id: 'job-1' } as never;
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    autoSave: false,
    etag: null,
    failureCount: 0,
    feedUrl: 'https://example.com/feed.xml',
    id: 'feed-1',
    lastModified: null,
    nextFetchAfter: null,
    status: 'active',
    userId: 'user-1',
    ...overrides
  };
}

describe('feed poll worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pollSubscriptionMock.mockResolvedValue({ autoSaved: 0, fetched: true, pruned: 0, staged: 2 });
  });

  it('polls a due subscription through the ingestion service', async () => {
    const feed = subscription();
    feedSubscriptionsAdapterMock.findById.mockResolvedValue(feed);

    await expect(
      feedPollJob(job({ reason: 'scheduled', subscriptionId: 'feed-1', userId: 'user-1' }))
    ).resolves.toEqual({ autoSaved: 0, fetched: true, pruned: 0, staged: 2, status: 'completed' });

    expect(createFeedIngestionServiceMock).toHaveBeenCalledWith({
      repos: {
        feedItems: feedItemsAdapterMock,
        feedSubscriptions: feedSubscriptionsAdapterMock,
        links: linksAdapterMock
      }
    });
    expect(pollSubscriptionMock).toHaveBeenCalledWith({
      subscription: feed,
      user: expect.objectContaining({ id: 'user-1' })
    });
  });

  it('skips subscriptions that are not due unless forced', async () => {
    feedSubscriptionsAdapterMock.findById.mockResolvedValue(
      subscription({ nextFetchAfter: new Date(Date.now() + 60_000) })
    );

    await expect(
      feedPollJob(job({ reason: 'scheduled', subscriptionId: 'feed-1', userId: 'user-1' }))
    ).resolves.toEqual({ status: 'skipped' });

    expect(pollSubscriptionMock).not.toHaveBeenCalled();
  });

  it('allows forced manual refresh even when the feed is not due', async () => {
    feedSubscriptionsAdapterMock.findById.mockResolvedValue(
      subscription({ nextFetchAfter: new Date(Date.now() + 60_000) })
    );

    await expect(
      feedPollJob(
        job({ force: true, reason: 'manual', subscriptionId: 'feed-1', userId: 'user-1' })
      )
    ).resolves.toMatchObject({ status: 'completed' });

    expect(pollSubscriptionMock).toHaveBeenCalledOnce();
  });

  it('skips paused subscriptions', async () => {
    feedSubscriptionsAdapterMock.findById.mockResolvedValue(subscription({ status: 'paused' }));

    await expect(
      feedPollJob(job({ reason: 'scheduled', subscriptionId: 'feed-1', userId: 'user-1' }))
    ).resolves.toEqual({ status: 'skipped' });

    expect(pollSubscriptionMock).not.toHaveBeenCalled();
  });

  it('aborts missing subscriptions', async () => {
    feedSubscriptionsAdapterMock.findById.mockResolvedValue(null);

    await expect(
      feedPollJob(job({ reason: 'scheduled', subscriptionId: 'missing', userId: 'user-1' }))
    ).resolves.toEqual({ error: 'Feed subscription not found', status: 'aborted' });
  });

  it('propagates ingestion failures after ingestion records backoff metadata', async () => {
    feedSubscriptionsAdapterMock.findById.mockResolvedValue(subscription({ failureCount: 2 }));
    pollSubscriptionMock.mockRejectedValue(new Error('fetch failed'));

    await expect(
      feedPollJob(job({ reason: 'scheduled', subscriptionId: 'feed-1', userId: 'user-1' }))
    ).rejects.toThrow(/fetch failed/);
  });
});
