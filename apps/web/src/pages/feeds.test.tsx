import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createFeedMutate = vi.hoisted(() => vi.fn());
const saveFeedMutate = vi.hoisted(() => vi.fn());
const dismissFeedMutate = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      if (values?.count !== undefined) return `${key} ${values.count}`;
      return key;
    }
  })
}));

vi.mock('@/features/feeds/api/create-feed-subscription', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/feeds/api/create-feed-subscription')>();

  return {
    ...actual,
    useCreateFeedSubscription: () => ({
      error: null,
      isPending: false,
      mutate: createFeedMutate
    })
  };
});

vi.mock('@/features/feeds/api/save-feed-item', () => ({
  useSaveFeedItem: () => ({
    error: null,
    isPending: false,
    mutate: saveFeedMutate
  })
}));

vi.mock('@/features/feeds/api/dismiss-feed-item', () => ({
  useDismissFeedItem: () => ({
    error: null,
    isPending: false,
    mutate: dismissFeedMutate
  })
}));

import type { FeedItem, FeedSubscription } from '@/types/feeds';

import { AddFeedForm, FeedItemCard, buildFeedShelves, groupFeedItemsBySubscription } from './feeds';

const NOW = '2026-06-28T12:00:00.000Z';

function subscription(overrides: Partial<FeedSubscription> = {}): FeedSubscription {
  return {
    autoSave: false,
    createdAt: NOW,
    description: null,
    etag: null,
    failureCount: 0,
    feedUrl: 'https://example.com/feed.xml',
    id: 'feed-1',
    imageUrl: null,
    lastError: null,
    lastFetchedAt: null,
    lastModified: null,
    lastSuccessfulFetchAt: null,
    nextFetchAfter: null,
    normalizedFeedUrl: 'https://example.com/feed.xml',
    siteUrl: 'https://example.com',
    status: 'active',
    title: 'Example',
    updatedAt: NOW,
    userId: 'user-1',
    ...overrides
  };
}

function item(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    author: null,
    createdAt: NOW,
    discoveredAt: NOW,
    dismissedAt: null,
    excerpt: null,
    guid: null,
    id: 'item-1',
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
    userId: 'user-1',
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('feeds page helpers', () => {
  it('groups items by subscription id', () => {
    const grouped = groupFeedItemsBySubscription([
      item({ id: 'one', subscriptionId: 'feed-a' }),
      item({ id: 'two', subscriptionId: 'feed-b' }),
      item({ id: 'three', subscriptionId: 'feed-a' })
    ]);

    expect(grouped.get('feed-a')?.map((feedItem) => feedItem.id)).toEqual(['one', 'three']);
    expect(grouped.get('feed-b')?.map((feedItem) => feedItem.id)).toEqual(['two']);
  });

  it('orders shelves by new items, warnings, then quiet feeds', () => {
    const newFeed = subscription({ id: 'new-feed', title: 'New Feed' });
    const warningFeed = subscription({
      id: 'warning-feed',
      lastError: 'Fetch failed',
      title: 'Warning Feed'
    });
    const quietFeed = subscription({ id: 'quiet-feed', title: 'Quiet Feed' });
    const grouped = groupFeedItemsBySubscription([
      item({ id: 'new-item', state: 'new', subscriptionId: newFeed.id })
    ]);

    const shelves = buildFeedShelves([quietFeed, warningFeed, newFeed], grouped);

    expect(shelves.map((shelf) => shelf.subscription.id)).toEqual([
      'new-feed',
      'warning-feed',
      'quiet-feed'
    ]);
  });

  it('opens shelves with new items or warnings by default', () => {
    const newFeed = subscription({ id: 'new-feed' });
    const warningFeed = subscription({ id: 'warning-feed', lastError: 'Fetch failed' });
    const quietFeed = subscription({ id: 'quiet-feed' });
    const grouped = groupFeedItemsBySubscription([
      item({ id: 'new-item', subscriptionId: newFeed.id })
    ]);

    const shelves = buildFeedShelves([newFeed, warningFeed, quietFeed], grouped);

    expect(
      Object.fromEntries(shelves.map((shelf) => [shelf.subscription.id, shelf.defaultOpen]))
    ).toEqual({
      'new-feed': true,
      'warning-feed': true,
      'quiet-feed': false
    });
  });
});

describe('feed page components', () => {
  it('validates add feed input before submitting', async () => {
    const user = userEvent.setup();
    render(<AddFeedForm />);

    await user.type(screen.getByLabelText('feeds.form.urlLabel'), 'not a url');
    await user.click(screen.getByRole('button', { name: /feeds.addFeed/i }));

    expect(screen.getByText('feeds.form.invalidUrl')).toBeInTheDocument();
    expect(createFeedMutate).not.toHaveBeenCalled();
  });

  it('submits a valid feed URL with auto-save preference', async () => {
    const user = userEvent.setup();
    render(<AddFeedForm />);

    await user.type(screen.getByLabelText('feeds.form.urlLabel'), 'https://example.com/feed.xml');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /feeds.addFeed/i }));

    expect(createFeedMutate).toHaveBeenCalledWith({
      autoSave: true,
      feedUrl: 'https://example.com/feed.xml'
    });
  });

  it('wires save and dismiss actions for new feed items', async () => {
    const user = userEvent.setup();
    render(<FeedItemCard item={item({ id: 'item-save' })} />);

    await user.click(screen.getByRole('button', { name: /feeds.actions.save/i }));
    await user.click(screen.getByRole('button', { name: /feeds.actions.dismiss/i }));

    expect(saveFeedMutate).toHaveBeenCalledWith('item-save');
    expect(dismissFeedMutate).toHaveBeenCalledWith('item-save');
  });
});
