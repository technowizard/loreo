import { describe, expect, it, vi } from 'vitest';

import type { FeedItemsRepository } from '@/repositories/feed-items.repository.js';
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
  const createdItems: unknown[] = [];

  const feedSubscriptions = {
    create: vi.fn(async () => subscription),
    findByNormalizedUrl: vi.fn(async () => options.existingSubscription ?? null),
    update: vi.fn(async (_id, _userId, updates) => ({ ...subscription, ...updates })),
    updateFetchMetadata: vi.fn(async (_id, _userId, updates) => ({ ...subscription, ...updates }))
  } as unknown as FeedSubscriptionsRepository;

  const feedItems = {
    pruneForSubscription: vi.fn(async () => 0),
    upsertByIdentity: vi.fn(async (data) => {
      const item = { ...data, id: crypto.randomUUID() };
      createdItems.push(item);
      return item;
    })
  } as unknown as FeedItemsRepository;

  const links = {
    create: vi.fn(),
    findByUrl: vi.fn()
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

  it('returns an existing subscription without fetching on duplicate add', async () => {
    const existingSubscription = subscriptionFixture({ id: 'existing-feed' });
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

  it('auto-saves feed items when the subscription enables auto-save', async () => {
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
      expect.objectContaining({ state: 'saved' })
    );
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
