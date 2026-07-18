import { describe, expect, it, vi } from 'vitest';

import type {
  CreateFeedItemData,
  FeedItemData,
  FeedItemsRepository
} from '@/repositories/feed-items.repository.js';
import type {
  FeedSubscriptionData,
  FeedSubscriptionsRepository
} from '@/repositories/feed-subscriptions.repository.js';
import type { LinksRepository } from '@/repositories/links.repository.js';

import type { UserWithoutPassword } from '@/types/auth.js';

import { createFeedIngestionService } from './feed-ingestion.service.js';
import type { NormalizedFeed } from './feed-parser.service.js';

const NOW = new Date('2026-06-28T12:00:00.000Z');
const USER: UserWithoutPassword = {
  avatar: null,
  createdAt: NOW.toISOString(),
  deletedAt: null,
  email: 'reader@example.com',
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Reader',
  role: 'user',
  settings: {},
  updatedAt: NOW.toISOString()
};

function subscriptionFixture(overrides: Partial<FeedSubscriptionData> = {}): FeedSubscriptionData {
  return {
    autoSave: false,
    createdAt: NOW,
    description: null,
    etag: null,
    failureCount: 0,
    feedUrl: 'https://example.com/feed.xml',
    id: '00000000-0000-0000-0000-000000000100',
    imageUrl: null,
    lastError: null,
    lastFetchedAt: null,
    lastModified: null,
    lastSuccessfulFetchAt: null,
    nextFetchAfter: null,
    normalizedFeedUrl: 'https://example.com/feed.xml',
    siteUrl: null,
    status: 'active',
    title: 'Example Feed',
    updatedAt: NOW,
    userId: USER.id,
    ...overrides
  };
}

function feedFixture(itemCount = 3): NormalizedFeed {
  return {
    description: 'A useful feed',
    imageUrl: 'https://example.com/feed.png',
    items: Array.from({ length: itemCount }, (_, index) => ({
      author: `Author ${index}`,
      excerpt: `Excerpt ${index}`,
      guid: `guid-${index}`,
      imageUrl: null,
      normalizedUrl: `https://example.com/articles/${index}`,
      publishedAt: new Date(NOW.getTime() - index * 60_000),
      title: `Article ${index}`,
      url: `https://example.com/articles/${index}`
    })),
    siteUrl: 'https://example.com/',
    title: 'Example Feed'
  };
}

function createRepos(options: { existingSubscription?: FeedSubscriptionData | null } = {}) {
  const subscription = subscriptionFixture();
  const createdItems: FeedItemData[] = [];

  const feedSubscriptions = {
    create: vi.fn(async () => subscription),
    delete: vi.fn(async () => true),
    findByNormalizedUrl: vi.fn(async () => options.existingSubscription ?? null),
    update: vi.fn(async (_id, _userId, updates) => ({
      ...(options.existingSubscription ?? subscription),
      ...updates
    })),
    updateFetchMetadata: vi.fn(async (_id, _userId, updates) => ({
      ...(options.existingSubscription ?? subscription),
      ...updates
    }))
  } as unknown as FeedSubscriptionsRepository;

  const feedItems = {
    delete: vi.fn(async () => true),
    pruneForSubscription: vi.fn(async () => 0),
    save: vi.fn(async (id, userId, linkId, savedAt = new Date()) => ({
      ...createdItems.find((item) => (item as { id: string }).id === id),
      id,
      linkId,
      savedAt,
      state: 'saved',
      userId
    })),
    upsertByIdentity: vi.fn(async (data) => {
      const createdAt = new Date();
      const item: FeedItemData = {
        author: data.author ?? null,
        createdAt,
        discoveredAt: data.discoveredAt ?? createdAt,
        dismissedAt: null,
        excerpt: data.excerpt ?? null,
        guid: data.guid ?? null,
        id: crypto.randomUUID(),
        imageUrl: data.imageUrl ?? null,
        linkId: data.linkId ?? null,
        normalizedUrl: data.normalizedUrl,
        publishedAt: data.publishedAt ?? null,
        savedAt: null,
        state: data.state ?? 'new',
        subscriptionId: data.subscriptionId,
        title: data.title,
        updatedAt: createdAt,
        url: data.url,
        userId: data.userId
      };
      createdItems.push(item);
      return { created: true, item };
    })
  } as unknown as FeedItemsRepository;
  feedItems.upsertManyByIdentity = vi.fn(async (items: CreateFeedItemData[]) =>
    Promise.all(items.map((item) => feedItems.upsertByIdentity(item)))
  );

  const links = {
    create: vi.fn(),
    findByUrl: vi.fn(async () => null)
  } as unknown as LinksRepository;

  return {
    createdItems,
    repos: { feedItems, feedSubscriptions, links }
  };
}

describe('createFeedIngestionService', () => {
  it('adds a subscription and stages the latest 50 eligible items', async () => {
    const { repos } = createRepos();
    const oldPublishedAt = new Date(NOW.getTime() - 91 * 24 * 60 * 60 * 1000);
    const feed = feedFixture(55);
    feed.items[54] = { ...feed.items[54]!, publishedAt: oldPublishedAt };
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => ({
        body: '<rss />',
        headers: { etag: 'etag-1', lastModified: 'Sun, 28 Jun 2026 12:00:00 GMT' },
        status: 'ok' as const
      })),
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feed),
      repos
    });

    const result = await service.addSubscription({
      feedUrl: 'https://example.com/feed.xml',
      user: USER
    });

    expect(result).toMatchObject({ createdSubscription: true, fetched: true, staged: 50 });
    expect(repos.feedSubscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        etag: 'etag-1',
        normalizedFeedUrl: 'https://example.com/feed.xml',
        title: 'Example Feed',
        userId: USER.id
      })
    );
    expect(repos.feedItems.upsertByIdentity).toHaveBeenCalledTimes(50);
    expect(repos.feedItems.pruneForSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        keepLatest: 500,
        subscriptionId: expect.any(String),
        userId: USER.id
      })
    );
  });

  it('selects the latest 50 initial items even when the feed is oldest-first', async () => {
    const { repos } = createRepos();
    const feed = feedFixture(55);
    feed.items.reverse();
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => ({
        body: '<rss />',
        headers: { etag: null, lastModified: null },
        status: 'ok' as const
      })),
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feed),
      repos
    });

    await service.addSubscription({
      feedUrl: 'https://example.com/feed.xml',
      user: USER
    });

    const stagedGuids = vi
      .mocked(repos.feedItems.upsertByIdentity)
      .mock.calls.map(([item]) => item.guid);
    expect(stagedGuids).toHaveLength(50);
    expect(stagedGuids).toContain('guid-0');
    expect(stagedGuids).toContain('guid-49');
    expect(stagedGuids).not.toContain('guid-50');
  });

  it('returns an existing subscription without fetching on duplicate add', async () => {
    const existingSubscription = subscriptionFixture({
      id: 'existing-feed',
      lastSuccessfulFetchAt: NOW
    });
    const { repos } = createRepos({ existingSubscription });
    const fetchFeed = vi.fn();
    const service = createFeedIngestionService({ fetchFeed, now: () => NOW, repos });

    const result = await service.addSubscription({
      feedUrl: 'https://example.com/feed.xml',
      user: USER
    });

    expect(result).toMatchObject({
      createdSubscription: false,
      fetched: false,
      subscription: existingSubscription
    });
    expect(fetchFeed).not.toHaveBeenCalled();
  });

  it('resumes ingestion when duplicate add finds an incomplete subscription', async () => {
    const existingSubscription = subscriptionFixture({
      id: 'existing-incomplete-feed',
      lastSuccessfulFetchAt: null
    });
    const { repos } = createRepos({ existingSubscription });
    const fetchFeed = vi.fn(async () => ({
      body: '<rss />',
      headers: { etag: null, lastModified: null },
      status: 'ok' as const
    }));
    const service = createFeedIngestionService({
      fetchFeed,
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feedFixture(1)),
      repos
    });

    const result = await service.addSubscription({
      feedUrl: existingSubscription.feedUrl,
      user: USER
    });

    expect(result).toMatchObject({ createdSubscription: false, fetched: true, staged: 1 });
    expect(fetchFeed).toHaveBeenCalledOnce();
  });

  it('returns the concurrent winner when subscription creation hits a duplicate race', async () => {
    const concurrent = subscriptionFixture({
      id: 'concurrent-feed',
      lastSuccessfulFetchAt: NOW
    });
    const { repos } = createRepos();
    vi.mocked(repos.feedSubscriptions.findByNormalizedUrl)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrent);
    vi.mocked(repos.feedSubscriptions.create).mockRejectedValueOnce(
      new Error('duplicate key value violates unique constraint')
    );
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => ({
        body: '<rss />',
        headers: { etag: null, lastModified: null },
        status: 'ok' as const
      })),
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feedFixture(1)),
      repos
    });

    await expect(
      service.addSubscription({ feedUrl: concurrent.feedUrl, user: USER })
    ).resolves.toMatchObject({
      createdSubscription: false,
      fetched: false,
      subscription: { id: concurrent.id }
    });
  });

  it('removes a new subscription when initial item persistence fails', async () => {
    const { repos } = createRepos();
    vi.mocked(repos.feedItems.upsertByIdentity).mockRejectedValueOnce(
      new Error('database write failed')
    );
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => ({
        body: '<rss />',
        headers: { etag: null, lastModified: null },
        status: 'ok' as const
      })),
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feedFixture(1)),
      repos
    });

    await expect(
      service.addSubscription({
        feedUrl: 'https://example.com/feed.xml',
        user: USER
      })
    ).rejects.toThrow(/persist feed items/i);

    expect(repos.feedSubscriptions.delete).toHaveBeenCalledWith(expect.any(String), USER.id);
  });

  it('polls a subscription and inserts only parsed items through identity upsert', async () => {
    const { repos } = createRepos();
    const subscription = subscriptionFixture({ etag: 'old-etag', lastModified: 'old-date' });
    const fetchFeed = vi.fn(async () => ({
      body: '<rss />',
      headers: { etag: 'new-etag', lastModified: 'new-date' },
      status: 'ok' as const
    }));
    const service = createFeedIngestionService({
      fetchFeed,
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feedFixture(2)),
      repos
    });

    const result = await service.pollSubscription({ subscription, user: USER });

    expect(fetchFeed).toHaveBeenCalledWith(subscription.feedUrl, {
      etag: 'old-etag',
      lastModified: 'old-date'
    });
    expect(result).toMatchObject({ fetched: true, staged: 2 });
    expect(repos.feedItems.upsertByIdentity).toHaveBeenCalledTimes(2);
    expect(repos.feedSubscriptions.update).toHaveBeenCalledWith(
      subscription.id,
      USER.id,
      expect.objectContaining({ failureCount: 0, lastError: null, lastSuccessfulFetchAt: NOW })
    );
  });

  it('handles not-modified polls without staging items', async () => {
    const { repos } = createRepos();
    const subscription = subscriptionFixture();
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => ({
        headers: { etag: null, lastModified: null },
        status: 'not-modified' as const
      })),
      now: () => NOW,
      repos
    });

    const result = await service.pollSubscription({ subscription, user: USER });

    expect(result).toMatchObject({ fetched: false, staged: 0 });
    expect(repos.feedItems.upsertByIdentity).not.toHaveBeenCalled();
    expect(repos.feedSubscriptions.updateFetchMetadata).toHaveBeenCalledWith(
      subscription.id,
      USER.id,
      expect.objectContaining({ failureCount: 0, lastError: null, lastSuccessfulFetchAt: NOW })
    );
  });

  it('auto-saves feed items first discovered while auto-save is enabled', async () => {
    const { repos } = createRepos();
    const saveLink = vi.fn(async ({ url }) => ({
      created: true,
      link: { id: `link-for-${url}` },
      reconciledFeedItems: 0
    }));
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => ({
        body: '<rss />',
        headers: { etag: null, lastModified: null },
        status: 'ok' as const
      })),
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feedFixture(2)),
      repos,
      saveLink: saveLink as never
    });

    const result = await service.pollSubscription({
      subscription: subscriptionFixture({ autoSave: true }),
      user: USER
    });

    expect(result).toMatchObject({ autoSaved: 2, staged: 0 });
    expect(saveLink).toHaveBeenCalledTimes(2);
    expect(repos.feedItems.upsertByIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'new' })
    );
    expect(repos.feedItems.save).toHaveBeenCalledTimes(2);
  });

  it('does not retroactively auto-save existing review or dismissed items', async () => {
    const { repos } = createRepos();
    vi.mocked(repos.feedItems.upsertByIdentity)
      .mockResolvedValueOnce({
        created: false,
        item: {
          ...feedFixture(1).items[0]!,
          createdAt: NOW,
          discoveredAt: NOW,
          dismissedAt: null,
          id: 'existing-review-item',
          linkId: null,
          savedAt: null,
          state: 'new',
          subscriptionId: 'subscription-id',
          updatedAt: NOW,
          userId: USER.id
        }
      })
      .mockResolvedValueOnce({
        created: false,
        item: {
          ...feedFixture(2).items[1]!,
          createdAt: NOW,
          discoveredAt: NOW,
          dismissedAt: NOW,
          id: 'existing-dismissed-item',
          linkId: null,
          savedAt: null,
          state: 'dismissed',
          subscriptionId: 'subscription-id',
          updatedAt: NOW,
          userId: USER.id
        }
      });
    const saveLink = vi.fn();
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => ({
        body: '<rss />',
        headers: { etag: null, lastModified: null },
        status: 'ok' as const
      })),
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feedFixture(2)),
      repos,
      saveLink: saveLink as never
    });

    const result = await service.pollSubscription({
      subscription: subscriptionFixture({ autoSave: true }),
      user: USER
    });

    expect(result).toMatchObject({ autoSaved: 0, staged: 0 });
    expect(saveLink).not.toHaveBeenCalled();
    expect(repos.feedItems.save).not.toHaveBeenCalled();
  });

  it('finishes a pending auto-save when the saved link already exists', async () => {
    const { repos } = createRepos();
    const existingItem = {
      ...feedFixture(1).items[0]!,
      createdAt: NOW,
      discoveredAt: NOW,
      dismissedAt: null,
      id: 'pending-auto-save-item',
      linkId: null,
      savedAt: null,
      state: 'new' as const,
      subscriptionId: 'feed-subscription-1',
      updatedAt: NOW,
      userId: USER.id
    };
    vi.mocked(repos.feedItems.upsertByIdentity).mockResolvedValueOnce({
      created: false,
      item: existingItem
    });
    vi.mocked(repos.links.findByUrl).mockResolvedValueOnce({ id: 'existing-link' } as never);
    const saveLinkMock = vi.fn(async () => ({
      created: false,
      link: { id: 'existing-link' },
      reconciledFeedItems: 0
    }));
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => ({
        body: '<rss />',
        headers: { etag: null, lastModified: null },
        status: 'ok' as const
      })),
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feedFixture(1)),
      repos,
      saveLink: saveLinkMock as never
    });

    await expect(
      service.pollSubscription({
        subscription: subscriptionFixture({ autoSave: true }),
        user: USER
      })
    ).resolves.toMatchObject({ autoSaved: 1, staged: 0 });
    expect(saveLinkMock).toHaveBeenCalledOnce();
    expect(repos.feedItems.save).toHaveBeenCalledWith(existingItem.id, USER.id, 'existing-link');
  });

  it('removes a newly discovered item when auto-save fails before a link exists', async () => {
    const { repos } = createRepos();
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => ({
        body: '<rss />',
        headers: { etag: null, lastModified: null },
        status: 'ok' as const
      })),
      now: () => NOW,
      parseFeedXml: vi.fn(async () => feedFixture(1)),
      repos,
      saveLink: vi.fn(async () => {
        throw new Error('queue unavailable');
      })
    });

    await expect(
      service.pollSubscription({
        subscription: subscriptionFixture({ autoSave: true }),
        user: USER
      })
    ).rejects.toThrow(/auto-save.*feed items/i);
    expect(repos.feedItems.delete).toHaveBeenCalledOnce();
  });

  it('records failure metadata and backoff when polling fails', async () => {
    const { repos } = createRepos();
    const subscription = subscriptionFixture({ failureCount: 1 });
    const service = createFeedIngestionService({
      fetchFeed: vi.fn(async () => {
        throw new Error('network exploded with details');
      }),
      now: () => NOW,
      repos
    });

    await expect(service.pollSubscription({ subscription, user: USER })).rejects.toThrow(
      /network exploded/
    );

    expect(repos.feedSubscriptions.updateFetchMetadata).toHaveBeenCalledWith(
      subscription.id,
      USER.id,
      expect.objectContaining({
        failureCount: 2,
        lastError: 'network exploded with details',
        lastFetchedAt: NOW,
        nextFetchAfter: new Date('2026-06-28T12:30:00.000Z')
      })
    );
  });
});
