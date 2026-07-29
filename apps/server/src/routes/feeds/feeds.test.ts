import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createInMemoryAuthAdapter } from '@/tests/in-memory/auth.js';
import { createInMemoryHighlightsAdapter } from '@/tests/in-memory/highlights.js';
import { createInMemoryImportSessionsAdapter } from '@/tests/in-memory/import-sessions.js';
import { createInMemoryLinksAdapter } from '@/tests/in-memory/links.js';
import { createInMemoryTagsAdapter } from '@/tests/in-memory/tags.js';

import { createTestApp } from '@/lib/create-app.js';
import { decodeCursor, encodeCursor } from '@/lib/cursor.js';
import { generateToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';
import type { Repos } from '@/lib/types.js';

import type { FeedItemData, FeedItemsRepository } from '@/repositories/feed-items.repository.js';
import type {
  FeedSubscriptionData,
  FeedSubscriptionsRepository
} from '@/repositories/feed-subscriptions.repository.js';

import type { UserWithoutPassword } from '@/types/auth.js';
import type { Tag } from '@/types/tags.js';

import router from './feeds.index.js';

const addSubscriptionMock = vi.hoisted(() => vi.fn());
const enqueueFeedPollJobMock = vi.hoisted(() => vi.fn(async () => ({ id: 'feed-job-1' })));
let demoMode = false;

vi.mock('@/services/feed-ingestion.service.js', () => ({
  createFeedIngestionService: vi.fn(() => ({ addSubscription: addSubscriptionMock }))
}));

vi.mock('@/queues/feed-poll.queue.js', () => ({
  enqueueFeedPollJob: enqueueFeedPollJobMock
}));

vi.mock('@/queues/content-extraction.queue.js', () => ({
  enqueueContentExtraction: { add: vi.fn(async () => ({ id: 'extract-job-1' })), on: vi.fn() }
}));

vi.mock('@/middlewares/rate-limit.js', () => ({
  addFeedRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  rateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  refreshFeedRateLimit: async (_c: unknown, next: () => Promise<void>) => next()
}));

vi.mock('@/lib/demo-mode.js', () => ({
  demoModeForbiddenResponse: () => ({ message: 'Demo mode is read-only', status: 403 }),
  isDemoMode: () => demoMode
}));

const NOW = new Date('2026-06-28T12:00:00.000Z');
const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'feeds-test@example.com',
  name: 'Test User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString()
};
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000002';
const authCookie = `token=${await generateToken(TEST_USER.id, TEST_USER.email)}`;

function subscriptionFixture(overrides: Partial<FeedSubscriptionData> = {}): FeedSubscriptionData {
  return {
    autoSave: false,
    createdAt: NOW,
    description: null,
    etag: null,
    failureCount: 0,
    feedUrl: 'https://example.com/feed.xml',
    id: crypto.randomUUID(),
    imageUrl: null,
    lastError: null,
    lastFetchedAt: null,
    lastModified: null,
    lastSuccessfulFetchAt: null,
    nextFetchAfter: null,
    normalizedFeedUrl: 'https://example.com/feed.xml',
    siteUrl: 'https://example.com/',
    status: 'active',
    title: 'Example Feed',
    updatedAt: NOW,
    userId: TEST_USER.id,
    ...overrides
  };
}

function itemFixture(overrides: Partial<FeedItemData> = {}): FeedItemData {
  return {
    author: null,
    createdAt: NOW,
    discoveredAt: NOW,
    dismissedAt: null,
    excerpt: 'Excerpt',
    guid: 'guid-1',
    id: crypto.randomUUID(),
    imageUrl: null,
    linkId: null,
    normalizedUrl: 'https://example.com/article',
    publishedAt: NOW,
    savedAt: null,
    state: 'new',
    subscriptionId: 'feed-1',
    title: 'Article',
    updatedAt: NOW,
    url: 'https://example.com/article',
    userId: TEST_USER.id,
    ...overrides
  };
}

function buildFeedRepos() {
  const subscriptions = new Map<string, FeedSubscriptionData>();
  const items = new Map<string, FeedItemData>();

  const feedSubscriptions: FeedSubscriptionsRepository = {
    create: async (data) => {
      const subscription = subscriptionFixture(data);
      subscriptions.set(subscription.id, subscription);
      return subscription;
    },
    delete: async (id, userId) =>
      subscriptions.delete(
        [...subscriptions.values()].find((s) => s.id === id && s.userId === userId)?.id ?? ''
      ),
    findById: async (id, userId) =>
      [...subscriptions.values()].find((s) => s.id === id && s.userId === userId) ?? null,
    findByNormalizedUrl: async (normalizedFeedUrl, userId) =>
      [...subscriptions.values()].find(
        (s) => s.normalizedFeedUrl === normalizedFeedUrl && s.userId === userId
      ) ?? null,
    findDue: async () => [],
    findManyByUserId: async (userId) =>
      [...subscriptions.values()].filter((s) => s.userId === userId),
    update: async (id, userId, updates) => {
      const existing = [...subscriptions.values()].find((s) => s.id === id && s.userId === userId);
      if (!existing) return null;
      const updated = { ...existing, ...updates, updatedAt: NOW };
      subscriptions.set(id, updated);
      return updated;
    },
    updateFetchMetadata: async (id, userId, updates) =>
      feedSubscriptions.update(id, userId, updates)
  };

  const feedItems: FeedItemsRepository = {
    create: async (data) => {
      const item = itemFixture(data);
      items.set(item.id, item);
      return item;
    },
    delete: async (id, userId) => {
      const existing = await feedItems.findById(id, userId);
      return existing ? items.delete(id) : false;
    },
    dismiss: async (id, userId, dismissedAt = NOW) => {
      const existing = await feedItems.findById(id, userId);
      if (!existing) return null;
      const updated = { ...existing, dismissedAt, state: 'dismissed' as const, updatedAt: NOW };
      items.set(id, updated);
      return updated;
    },
    findById: async (id, userId) =>
      [...items.values()].find((item) => item.id === id && item.userId === userId) ?? null,
    findBySubscriptionAndIdentity: async () => null,
    findManyForReview: async ({
      cursor,
      limit = 24,
      sort = 'newest',
      state,
      subscriptionId,
      userId
    }) => {
      const matching = [...items.values()]
        .filter(
          (item) =>
            item.userId === userId &&
            (!state || item.state === state) &&
            (!subscriptionId || item.subscriptionId === subscriptionId)
        )
        .sort((a, b) => {
          const aDate = (a.publishedAt ?? a.discoveredAt).getTime();
          const bDate = (b.publishedAt ?? b.discoveredAt).getTime();
          const difference = bDate - aDate || b.id.localeCompare(a.id);
          return sort === 'newest' ? difference : -difference;
        });
      const cursorData = cursor ? decodeCursor(cursor) : null;
      const cursorIndex = cursorData ? matching.findIndex((item) => item.id === cursorData.id) : -1;
      const remaining = matching.slice(cursorIndex + 1);
      const pageItems = remaining.slice(0, limit);
      const hasMore = remaining.length > limit;
      const lastItem = pageItems.at(-1);

      return {
        hasMore,
        items: pageItems,
        nextCursor:
          hasMore && lastItem
            ? encodeCursor({
                createdAt: (lastItem.publishedAt ?? lastItem.discoveredAt).toISOString(),
                id: lastItem.id
              })
            : undefined,
        total: matching.length
      };
    },
    pruneForSubscription: async () => 0,
    reconcileSavedByUrl: async ({ linkId, normalizedUrl, savedAt = NOW, userId }) => {
      const matching = [...items.values()].filter(
        (item) => item.userId === userId && item.normalizedUrl === normalizedUrl
      );
      return matching.map((item) => {
        const updated = { ...item, linkId, savedAt, state: 'saved' as const, updatedAt: NOW };
        items.set(item.id, updated);
        return updated;
      });
    },
    save: async (id, userId, linkId, savedAt = NOW) => {
      const existing = await feedItems.findById(id, userId);
      if (!existing) return null;
      const updated = { ...existing, linkId, savedAt, state: 'saved' as const, updatedAt: NOW };
      items.set(id, updated);
      return updated;
    },
    summarizeBySubscription: async (subscriptionId, userId) => {
      const matching = [...items.values()].filter(
        (item) => item.subscriptionId === subscriptionId && item.userId === userId
      );
      return {
        dismissed: matching.filter((item) => item.state === 'dismissed').length,
        new: matching.filter((item) => item.state === 'new').length,
        saved: matching.filter((item) => item.state === 'saved').length
      };
    },
    upsertByIdentity: async (data) => ({ created: true, item: await feedItems.create(data) }),
    upsertManyByIdentity: async (data) =>
      Promise.all(data.map((item) => feedItems.upsertByIdentity(item)))
  };

  return { feedItems, feedSubscriptions, items, subscriptions };
}

function buildClient() {
  const tagLinkRelations = new Map<string, Tag[]>();
  const auth = createInMemoryAuthAdapter();
  auth.findById = async (id) => (id === TEST_USER.id ? TEST_USER : null);
  const feedRepos = buildFeedRepos();

  const repos: Repos = {
    auth,
    feedItems: feedRepos.feedItems,
    feedSubscriptions: feedRepos.feedSubscriptions,
    highlights: createInMemoryHighlightsAdapter(),
    importSessions: createInMemoryImportSessionsAdapter().repo,
    links: createInMemoryLinksAdapter(tagLinkRelations),
    tags: createInMemoryTagsAdapter(tagLinkRelations).repo
  };

  const client = testClient(
    createTestApp(router, (app) => {
      app.use('*', async (c, next) => {
        c.set('repos', repos);
        return next();
      });
    })
  );

  return { client, ...feedRepos };
}

let built: ReturnType<typeof buildClient>;

beforeEach(() => {
  demoMode = false;
  vi.clearAllMocks();
  built = buildClient();
});

describe('feed routes', () => {
  it('requires auth', async () => {
    const response = await built.client.feeds.subscriptions.$get();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('adds a valid feed subscription', async () => {
    const subscription = subscriptionFixture();
    addSubscriptionMock.mockResolvedValue({
      autoSaved: 0,
      createdSubscription: true,
      fetched: true,
      pruned: 0,
      staged: 2,
      subscription
    });

    const response = await built.client.feeds.subscriptions.$post(
      { json: { feedUrl: subscription.feedUrl } },
      { headers: { Cookie: authCookie } }
    );

    expect(response.status).toBe(HttpStatus.ACCEPTED);
    expect(addSubscriptionMock).toHaveBeenCalledWith({
      autoSave: undefined,
      feedUrl: subscription.feedUrl,
      user: TEST_USER
    });
  });

  it('returns existing subscription behavior from duplicate add', async () => {
    const subscription = subscriptionFixture();
    addSubscriptionMock.mockResolvedValue({
      autoSaved: 0,
      createdSubscription: false,
      fetched: false,
      pruned: 0,
      staged: 0,
      subscription
    });

    const response = await built.client.feeds.subscriptions.$post(
      { json: { feedUrl: subscription.feedUrl } },
      { headers: { Cookie: authCookie } }
    );
    expect(response.status).toBe(HttpStatus.ACCEPTED);
    const json = (await response.json()) as { result: { createdSubscription: boolean } };

    expect(json.result.createdSubscription).toBe(false);
  });

  it('returns a bad request for blocked or private feed URLs', async () => {
    addSubscriptionMock.mockRejectedValue(new Error('Feed URL is not allowed'));

    const response = await built.client.feeds.subscriptions.$post(
      { json: { feedUrl: 'https://example.com/feed.xml' } },
      { headers: { Cookie: authCookie } }
    );
    const json = await response.json();

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(json.message).toMatch(/not allowed/i);
  });

  it('lists user-scoped subscriptions and items', async () => {
    const userFeed = subscriptionFixture({ id: 'feed-user', userId: TEST_USER.id });
    const otherFeed = subscriptionFixture({ id: 'feed-other', userId: OTHER_USER_ID });
    built.subscriptions.set(userFeed.id, userFeed);
    built.subscriptions.set(otherFeed.id, otherFeed);
    built.items.set(
      'item-user',
      itemFixture({ id: 'item-user', subscriptionId: userFeed.id, userId: TEST_USER.id })
    );
    built.items.set(
      'item-other',
      itemFixture({ id: 'item-other', subscriptionId: otherFeed.id, userId: OTHER_USER_ID })
    );

    const subscriptionsResponse = await built.client.feeds.subscriptions.$get(undefined, {
      headers: { Cookie: authCookie }
    });
    const itemsResponse = await built.client.feeds.items.$get(
      { query: { state: 'new' } },
      { headers: { Cookie: authCookie } }
    );

    const subscriptionsJson = (await subscriptionsResponse.json()) as { result: unknown[] };
    const itemsJson = (await itemsResponse.json()) as { result: unknown[] };

    expect(subscriptionsJson.result).toHaveLength(1);
    expect(itemsJson.result).toHaveLength(1);
  });

  it('paginates feed items and exposes total matching count', async () => {
    const feed = subscriptionFixture({ id: 'feed-user', userId: TEST_USER.id });
    built.subscriptions.set(feed.id, feed);
    for (let index = 0; index < 3; index += 1) {
      const item = itemFixture({
        discoveredAt: new Date(`2026-06-2${index + 1}T12:00:00.000Z`),
        id: `00000000-0000-0000-0000-00000000000${index + 3}`,
        publishedAt: null,
        subscriptionId: feed.id,
        title: `Article ${index + 1}`,
        userId: TEST_USER.id
      });
      built.items.set(item.id, item);
    }

    const firstResponse = await built.client.feeds.items.$get(
      { query: { limit: '2', sort: 'newest', state: 'new' } },
      { headers: { Cookie: authCookie } }
    );
    const firstJson = (await firstResponse.json()) as {
      pagination: { hasMore: boolean; nextCursor?: string; total: number; totalReturned: number };
      result: Array<{ title: string }>;
    };

    expect(firstJson.result.map((item) => item.title)).toEqual(['Article 3', 'Article 2']);
    expect(firstJson.pagination).toMatchObject({
      hasMore: true,
      total: 3,
      totalReturned: 2
    });

    const secondResponse = await built.client.feeds.items.$get(
      {
        query: {
          cursor: firstJson.pagination.nextCursor,
          limit: '2',
          sort: 'newest',
          state: 'new'
        }
      },
      { headers: { Cookie: authCookie } }
    );
    const secondJson = (await secondResponse.json()) as {
      pagination: { hasMore: boolean; total: number };
      result: Array<{ title: string }>;
    };

    expect(secondJson.result.map((item) => item.title)).toEqual(['Article 1']);
    expect(secondJson.pagination).toMatchObject({ hasMore: false, total: 3 });
  });

  it('returns a user-scoped subscription item summary', async () => {
    const userFeed = subscriptionFixture({ id: 'feed-user', userId: TEST_USER.id });
    const otherFeed = subscriptionFixture({ id: 'feed-other', userId: OTHER_USER_ID });
    built.subscriptions.set(userFeed.id, userFeed);
    built.subscriptions.set(otherFeed.id, otherFeed);
    built.items.set(
      'item-new',
      itemFixture({ id: 'item-new', subscriptionId: userFeed.id, userId: TEST_USER.id })
    );
    built.items.set(
      'item-saved',
      itemFixture({
        id: 'item-saved',
        state: 'saved',
        subscriptionId: userFeed.id,
        userId: TEST_USER.id
      })
    );
    built.items.set(
      'item-dismissed',
      itemFixture({
        id: 'item-dismissed',
        state: 'dismissed',
        subscriptionId: userFeed.id,
        userId: TEST_USER.id
      })
    );

    const response = await built.client.feeds.subscriptions[':id'].summary.$get(
      { param: { id: userFeed.id } },
      { headers: { Cookie: authCookie } }
    );
    const missingResponse = await built.client.feeds.subscriptions[':id'].summary.$get(
      { param: { id: otherFeed.id } },
      { headers: { Cookie: authCookie } }
    );
    const json = (await response.json()) as {
      result: { dismissed: number; new: number; saved: number };
    };

    expect(response.status).toBe(HttpStatus.OK);
    expect(json.result).toEqual({ dismissed: 1, new: 1, saved: 1 });
    expect(missingResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('updates and refreshes user-owned subscriptions only', async () => {
    const subscription = subscriptionFixture({ id: 'feed-user' });
    built.subscriptions.set(subscription.id, subscription);

    const updateResponse = await built.client.feeds.subscriptions[':id'].$patch(
      { param: { id: subscription.id }, json: { autoSave: true } },
      { headers: { Cookie: authCookie } }
    );
    const refreshResponse = await built.client.feeds.subscriptions[':id'].refresh.$post(
      { param: { id: subscription.id } },
      { headers: { Cookie: authCookie } }
    );
    const deniedResponse = await built.client.feeds.subscriptions[':id'].refresh.$post(
      { param: { id: 'missing-feed' } },
      { headers: { Cookie: authCookie } }
    );

    expect(updateResponse.status).toBe(HttpStatus.OK);
    expect(refreshResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(enqueueFeedPollJobMock).toHaveBeenCalledWith({
      force: true,
      reason: 'manual',
      subscriptionId: subscription.id,
      userId: TEST_USER.id
    });
    expect(deniedResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('deletes only user-owned feed subscriptions', async () => {
    const userFeed = subscriptionFixture({ id: 'feed-user', userId: TEST_USER.id });
    const otherFeed = subscriptionFixture({ id: 'feed-other', userId: OTHER_USER_ID });
    built.subscriptions.set(userFeed.id, userFeed);
    built.subscriptions.set(otherFeed.id, otherFeed);

    const response = await built.client.feeds.subscriptions[':id'].$delete(
      { param: { id: userFeed.id } },
      { headers: { Cookie: authCookie } }
    );
    const deniedResponse = await built.client.feeds.subscriptions[':id'].$delete(
      { param: { id: otherFeed.id } },
      { headers: { Cookie: authCookie } }
    );
    const json = (await response.json()) as { result: { id: string } };

    expect(response.status).toBe(HttpStatus.OK);
    expect(json.result.id).toBe(userFeed.id);
    expect(built.subscriptions.has(userFeed.id)).toBe(false);
    expect(deniedResponse.status).toBe(HttpStatus.NOT_FOUND);
    expect(built.subscriptions.has(otherFeed.id)).toBe(true);
  });

  it('saves and dismisses feed items', async () => {
    const item = itemFixture({ id: 'item-user', url: 'https://example.com/feed-item' });
    built.items.set(item.id, item);

    const saveResponse = await built.client.feeds.items[':id'].save.$post(
      { param: { id: item.id } },
      { headers: { Cookie: authCookie } }
    );
    const saveJson = (await saveResponse.json()) as { result: { item: { state: string } } };
    const dismissItem = itemFixture({ id: 'item-dismiss' });
    built.items.set(dismissItem.id, dismissItem);
    const dismissResponse = await built.client.feeds.items[':id'].dismiss.$post(
      { param: { id: dismissItem.id } },
      { headers: { Cookie: authCookie } }
    );

    expect(saveResponse.status).toBe(HttpStatus.OK);
    expect(saveJson.result.item.state).toBe('saved');
    expect(dismissResponse.status).toBe(HttpStatus.OK);
  });

  it('blocks feed mutations in demo mode', async () => {
    demoMode = true;

    const feed = subscriptionFixture({ id: 'feed-user', userId: TEST_USER.id });
    built.subscriptions.set(feed.id, feed);

    const createResponse = await built.client.feeds.subscriptions.$post(
      { json: { feedUrl: 'https://example.com/feed.xml' } },
      { headers: { Cookie: authCookie } }
    );
    const deleteResponse = await built.client.feeds.subscriptions[':id'].$delete(
      { param: { id: feed.id } },
      { headers: { Cookie: authCookie } }
    );

    expect(createResponse.status).toBe(HttpStatus.FORBIDDEN);
    expect(deleteResponse.status).toBe(HttpStatus.FORBIDDEN);
    expect(built.subscriptions.has(feed.id)).toBe(true);
  });
});
