import type { Repos } from '@/lib/types.js';
import { normalizeUrl } from '@/lib/url-normalizer.js';

import type { FeedItemsRepository } from '@/repositories/feed-items.repository.js';
import type {
  FeedSubscriptionData,
  FeedSubscriptionsRepository
} from '@/repositories/feed-subscriptions.repository.js';

import type { UserIdentity } from '@/types/auth.js';

import type { FeedFetchResult } from './feed-fetch.service.js';
import { fetchFeed } from './feed-fetch.service.js';
import type { NormalizedFeed, NormalizedFeedItem } from './feed-parser.service.js';
import { parseFeedXml } from './feed-parser.service.js';
import { saveLink } from './link-save.service.js';

const INITIAL_ITEM_LIMIT = 50;
const RETENTION_DAYS = 90;
const RETENTION_ITEM_LIMIT = 500;
const DEFAULT_SUCCESS_INTERVAL_MS = 60 * 60 * 1000;
const MAX_FAILURE_BACKOFF_MS = 24 * 60 * 60 * 1000;

class FeedItemPersistenceError extends Error {
  constructor(cause: unknown) {
    super('Failed to persist feed items', { cause });
    this.name = 'FeedItemPersistenceError';
  }
}

class FeedAutoSaveError extends Error {
  constructor(cause: unknown) {
    super('Failed to auto-save one or more feed items', { cause });
    this.name = 'FeedAutoSaveError';
  }
}

export type FeedIngestionRepos = Pick<Repos, 'feedItems' | 'feedSubscriptions' | 'links'> & {
  feedItems: FeedItemsRepository;
  feedSubscriptions: FeedSubscriptionsRepository;
};

export type FeedIngestionDependencies = {
  fetchFeed?: typeof fetchFeed;
  now?: () => Date;
  parseFeedXml?: typeof parseFeedXml;
  repos: FeedIngestionRepos;
  saveLink?: typeof saveLink;
};

export type AddFeedInput = {
  autoSave?: boolean;
  feedUrl: string;
  user: UserIdentity;
};

export type PollFeedInput = {
  subscription: FeedSubscriptionData;
  user: UserIdentity;
};

export type FeedIngestionResult = {
  autoSaved: number;
  createdSubscription: boolean;
  fetched: boolean;
  pruned: number;
  staged: number;
  subscription: FeedSubscriptionData;
};

function nextSuccessfulFetchAfter(now: Date): Date {
  return new Date(now.getTime() + DEFAULT_SUCCESS_INTERVAL_MS);
}

function nextFailureFetchAfter(now: Date, failureCount: number): Date {
  const backoffMs = Math.min(
    2 ** Math.max(failureCount - 1, 0) * 15 * 60 * 1000,
    MAX_FAILURE_BACKOFF_MS
  );
  return new Date(now.getTime() + backoffMs);
}

function retentionCutoff(now: Date): Date {
  return new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

function itemsForInitialIngest(items: NormalizedFeedItem[], now: Date): NormalizedFeedItem[] {
  const cutoff = retentionCutoff(now);
  return items
    .map((item, sourceIndex) => ({ item, sourceIndex }))
    .filter(({ item }) => !item.publishedAt || item.publishedAt >= cutoff)
    .sort((left, right) => {
      const leftTimestamp = left.item.publishedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
      const rightTimestamp = right.item.publishedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
      return rightTimestamp - leftTimestamp || left.sourceIndex - right.sourceIndex;
    })
    .slice(0, INITIAL_ITEM_LIMIT)
    .map(({ item }) => item);
}

function sanitizedError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message.slice(0, 500);
  return 'Feed ingestion failed';
}

export function createFeedIngestionService(dependencies: FeedIngestionDependencies) {
  const fetchFeedDependency = dependencies.fetchFeed ?? fetchFeed;
  const parseFeedXmlDependency = dependencies.parseFeedXml ?? parseFeedXml;
  const saveLinkDependency = dependencies.saveLink ?? saveLink;
  const now = dependencies.now ?? (() => new Date());
  const { repos } = dependencies;

  async function stageItems(input: {
    items: NormalizedFeedItem[];
    subscription: FeedSubscriptionData;
    user: UserIdentity;
  }): Promise<{ autoSaved: number; staged: number }> {
    const itemData = input.items.map((item) => ({
      author: item.author,
      excerpt: item.excerpt,
      guid: item.guid,
      imageUrl: item.imageUrl,
      linkId: null,
      normalizedUrl: item.normalizedUrl,
      publishedAt: item.publishedAt,
      state: 'new' as const,
      subscriptionId: input.subscription.id,
      title: item.title,
      url: item.url,
      userId: input.user.id
    }));

    let results: Awaited<ReturnType<FeedItemsRepository['upsertManyByIdentity']>>;
    try {
      results = await repos.feedItems.upsertManyByIdentity(itemData);
    } catch (error) {
      throw new FeedItemPersistenceError(error);
    }

    const persisted = results.map((result, index) => ({
      created: result.created,
      feedItem: result.item,
      parsedItem: input.items[index]!
    }));

    let autoSaved = 0;
    let staged = persisted.filter(({ created }) => created).length;
    let firstAutoSaveError: unknown;

    if (input.subscription.autoSave) {
      for (const { created, feedItem, parsedItem } of persisted) {
        if (feedItem.state !== 'new') continue;
        if (!created) {
          const existingLink = await repos.links.findByUrl(parsedItem.url, input.user.id);
          if (!existingLink) continue;
        }

        try {
          const saved = await saveLinkDependency({
            reconcileFeedItems: false,
            repos,
            user: input.user,
            url: parsedItem.url
          });
          const updated = await repos.feedItems.save(feedItem.id, input.user.id, saved.link.id);
          if (!updated) throw new Error('Failed to mark auto-saved feed item as saved');
          autoSaved += 1;
          if (created) staged -= 1;
        } catch (error) {
          firstAutoSaveError ??= error;

          let persistedLink: Awaited<ReturnType<typeof repos.links.findByUrl>> | undefined;
          try {
            persistedLink = await repos.links.findByUrl(parsedItem.url, input.user.id);
          } catch {
            persistedLink = undefined;
          }
          if (persistedLink === null) {
            await repos.feedItems.delete(feedItem.id, input.user.id);
          }
        }
      }
    }

    if (firstAutoSaveError) throw new FeedAutoSaveError(firstAutoSaveError);
    return { autoSaved, staged };
  }

  async function markSuccess(input: {
    feed: NormalizedFeed;
    fetchedAt: Date;
    headers: FeedFetchResult['headers'];
    subscription: FeedSubscriptionData;
  }): Promise<FeedSubscriptionData> {
    const updated = await repos.feedSubscriptions.update(
      input.subscription.id,
      input.subscription.userId,
      {
        description: input.feed.description,
        etag: input.headers.etag,
        failureCount: 0,
        imageUrl: input.feed.imageUrl,
        lastError: null,
        lastFetchedAt: input.fetchedAt,
        lastModified: input.headers.lastModified,
        lastSuccessfulFetchAt: input.fetchedAt,
        nextFetchAfter: nextSuccessfulFetchAfter(input.fetchedAt),
        siteUrl: input.feed.siteUrl,
        title: input.feed.title
      }
    );

    if (!updated) throw new Error('Failed to update feed subscription after fetch');
    return updated;
  }

  async function markNotModified(input: {
    fetchedAt: Date;
    headers: FeedFetchResult['headers'];
    subscription: FeedSubscriptionData;
  }): Promise<FeedSubscriptionData> {
    const updated = await repos.feedSubscriptions.updateFetchMetadata(
      input.subscription.id,
      input.subscription.userId,
      {
        etag: input.headers.etag ?? input.subscription.etag,
        failureCount: 0,
        lastError: null,
        lastFetchedAt: input.fetchedAt,
        lastModified: input.headers.lastModified ?? input.subscription.lastModified,
        lastSuccessfulFetchAt: input.fetchedAt,
        nextFetchAfter: nextSuccessfulFetchAfter(input.fetchedAt)
      }
    );

    if (!updated) throw new Error('Failed to update feed subscription after no-change fetch');
    return updated;
  }

  async function markFailure(
    subscription: FeedSubscriptionData,
    fetchedAt: Date,
    error: unknown
  ): Promise<void> {
    const failureCount = subscription.failureCount + 1;
    await repos.feedSubscriptions.updateFetchMetadata(subscription.id, subscription.userId, {
      failureCount,
      lastError: sanitizedError(error),
      lastFetchedAt: fetchedAt,
      nextFetchAfter: nextFailureFetchAfter(fetchedAt, failureCount)
    });
  }

  async function pollSubscription(input: PollFeedInput): Promise<FeedIngestionResult> {
    const fetchedAt = now();

    try {
      const fetched = await fetchFeedDependency(input.subscription.feedUrl, {
        etag: input.subscription.etag,
        lastModified: input.subscription.lastModified
      });

      if (fetched.status === 'not-modified') {
        const subscription = await markNotModified({
          fetchedAt,
          headers: fetched.headers,
          subscription: input.subscription
        });
        return {
          autoSaved: 0,
          createdSubscription: false,
          fetched: false,
          pruned: 0,
          staged: 0,
          subscription
        };
      }

      const feed = await parseFeedXmlDependency(fetched.body, input.subscription.feedUrl);
      const stagedResult = await stageItems({
        items: feed.items,
        subscription: input.subscription,
        user: input.user
      });
      const pruned = await repos.feedItems.pruneForSubscription({
        before: retentionCutoff(fetchedAt),
        keepLatest: RETENTION_ITEM_LIMIT,
        subscriptionId: input.subscription.id,
        userId: input.user.id
      });
      const subscription = await markSuccess({
        feed,
        fetchedAt,
        headers: fetched.headers,
        subscription: input.subscription
      });

      return {
        ...stagedResult,
        createdSubscription: false,
        fetched: true,
        pruned,
        subscription
      };
    } catch (error) {
      await markFailure(input.subscription, fetchedAt, error);
      throw error;
    }
  }

  async function resultForExistingSubscription(
    subscription: FeedSubscriptionData,
    user: UserIdentity
  ): Promise<FeedIngestionResult> {
    if (!subscription.lastSuccessfulFetchAt) {
      return pollSubscription({ subscription, user });
    }
    return {
      autoSaved: 0,
      createdSubscription: false,
      fetched: false,
      pruned: 0,
      staged: 0,
      subscription
    };
  }

  async function addSubscription(input: AddFeedInput): Promise<FeedIngestionResult> {
    const normalizedFeedUrl = normalizeUrl(input.feedUrl);
    const existing = await repos.feedSubscriptions.findByNormalizedUrl(
      normalizedFeedUrl,
      input.user.id
    );
    if (existing) {
      return resultForExistingSubscription(existing, input.user);
    }

    const fetchedAt = now();
    const fetched = await fetchFeedDependency(input.feedUrl);
    if (fetched.status === 'not-modified') {
      throw new Error('Feed returned not modified before subscription was created');
    }

    const feed = await parseFeedXmlDependency(fetched.body, input.feedUrl);
    let subscription: FeedSubscriptionData;
    try {
      subscription = await repos.feedSubscriptions.create({
        autoSave: input.autoSave ?? false,
        description: feed.description,
        etag: fetched.headers.etag,
        feedUrl: input.feedUrl,
        imageUrl: feed.imageUrl,
        lastModified: fetched.headers.lastModified,
        nextFetchAfter: nextSuccessfulFetchAfter(fetchedAt),
        normalizedFeedUrl,
        siteUrl: feed.siteUrl,
        title: feed.title,
        userId: input.user.id
      });
    } catch (error) {
      const concurrent = await repos.feedSubscriptions.findByNormalizedUrl(
        normalizedFeedUrl,
        input.user.id
      );
      if (!concurrent) throw error;
      return resultForExistingSubscription(concurrent, input.user);
    }

    try {
      const stagedResult = await stageItems({
        items: itemsForInitialIngest(feed.items, fetchedAt),
        subscription,
        user: input.user
      });
      const pruned = await repos.feedItems.pruneForSubscription({
        before: retentionCutoff(fetchedAt),
        keepLatest: RETENTION_ITEM_LIMIT,
        subscriptionId: subscription.id,
        userId: input.user.id
      });
      subscription = await markSuccess({
        feed,
        fetchedAt,
        headers: fetched.headers,
        subscription
      });

      return {
        ...stagedResult,
        createdSubscription: true,
        fetched: true,
        pruned,
        subscription
      };
    } catch (error) {
      if (error instanceof FeedItemPersistenceError) {
        await repos.feedSubscriptions.delete(subscription.id, input.user.id);
      }
      throw error;
    }
  }

  return {
    addSubscription,
    pollSubscription
  };
}
