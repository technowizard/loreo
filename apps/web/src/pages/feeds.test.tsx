import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/tests/mocks/server';
import { render } from '@/tests/test-utils';

const createFeedMutate = vi.hoisted(() => vi.fn());
const deleteFeedMutate = vi.hoisted(() => vi.fn());
const saveFeedMutate = vi.hoisted(() => vi.fn());
const dismissFeedMutate = vi.hoisted(() => vi.fn());
const updateFeedMutate = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();

  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <a href="#feed-items">{children}</a>,
    useNavigate: () => navigate,
    useSearch: () => ({})
  };
});

vi.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn()
  },
  useTranslation: () => ({
    i18n: { language: 'en' },
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
      mutate: createFeedMutate,
      reset: vi.fn()
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

vi.mock('@/features/feeds/api/delete-feed-subscription', () => ({
  useDeleteFeedSubscription: () => ({
    error: null,
    isPending: false,
    mutate: deleteFeedMutate
  })
}));

vi.mock('@/features/feeds/api/dismiss-feed-item', () => ({
  useDismissFeedItem: () => ({
    error: null,
    isPending: false,
    mutate: dismissFeedMutate
  })
}));

vi.mock('@/features/feeds/api/get-feed-subscription-summary', () => ({
  useFeedSubscriptionSummary: () => ({
    data: { result: { dismissed: 2, new: 3, saved: 4 } },
    isError: false,
    isLoading: false
  })
}));

vi.mock('@/features/feeds/api/update-feed-subscription', () => ({
  useUpdateFeedSubscription: () => ({
    error: null,
    isPending: false,
    mutate: updateFeedMutate
  })
}));

import {
  FeedManagerDialog,
  filterManagedFeeds,
  getDefaultManagedFeedId
} from '@/features/feeds/components/feed-manager-dialog';
import {
  chunkFeedItems,
  shouldVirtualizeFeedGrid
} from '@/features/feeds/components/virtualized-feed-grid';

import type { FeedItem, FeedSubscription } from '@/types/feeds';

import FeedsPage, { AddFeedForm, FeedItemCard } from './feeds';

const API_URL = 'http://localhost:3000';
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
    title: 'Example Source',
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
  it('prioritizes feeds needing attention and filters by search and status', () => {
    const active = subscription({ id: 'active', title: 'Active Source' });
    const warning = subscription({
      failureCount: 2,
      id: 'warning',
      lastError: 'Timed out',
      title: 'Warning Source'
    });
    const paused = subscription({ id: 'paused', status: 'paused', title: 'Paused Source' });
    const subscriptions = [active, warning, paused];

    expect(getDefaultManagedFeedId(subscriptions)).toBe('warning');
    expect(filterManagedFeeds(subscriptions, 'paused', 'all').map((feed) => feed.id)).toEqual([
      'paused'
    ]);
    expect(filterManagedFeeds(subscriptions, '', 'attention').map((feed) => feed.id)).toEqual([
      'warning'
    ]);
  });

  it('suspends virtualization while keyboard focus is inside the collection', () => {
    expect(shouldVirtualizeFeedGrid(37, false)).toBe(true);
    expect(shouldVirtualizeFeedGrid(37, true)).toBe(false);
    expect(shouldVirtualizeFeedGrid(36, false)).toBe(false);
  });

  it('chunks feed items into responsive virtual rows', () => {
    const items = [
      item({ id: 'one' }),
      item({ id: 'two' }),
      item({ id: 'three' }),
      item({ id: 'four' }),
      item({ id: 'five' })
    ];

    expect(chunkFeedItems(items, 2).map((row) => row.map((feedItem) => feedItem.id))).toEqual([
      ['one', 'two'],
      ['three', 'four'],
      ['five']
    ]);
    expect(chunkFeedItems(items, 3).map((row) => row.map((feedItem) => feedItem.id))).toEqual([
      ['one', 'two', 'three'],
      ['four', 'five']
    ]);
  });
});

describe('feed page components', () => {
  it('shows the first-use empty state without requesting feed items', async () => {
    let itemRequests = 0;

    server.use(
      http.get(`${API_URL}/feeds/subscriptions`, () =>
        HttpResponse.json({ message: 'ok', result: [], status: 200 })
      ),
      http.get(`${API_URL}/feeds/items`, () => {
        itemRequests++;
        return HttpResponse.json({ message: 'failed', status: 400 }, { status: 400 });
      })
    );

    render(<FeedsPage />);

    expect(await screen.findByText('feeds.empty.title')).toBeInTheDocument();
    expect(screen.queryByText('feeds.error.title')).not.toBeInTheDocument();
    expect(itemRequests).toBe(0);
  });

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
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: /feeds.addFeed/i }));

    expect(createFeedMutate).toHaveBeenCalledWith({
      autoSave: true,
      feedUrl: 'https://example.com/feed.xml'
    });
  });

  it('wires save and dismiss actions for new feed items', async () => {
    const user = userEvent.setup();
    render(<FeedItemCard item={item({ id: 'item-save' })} sourceTitle="Example Source" />);

    expect(screen.getByText('Example Source')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /feeds.actions.save/i }));
    await user.click(screen.getByRole('button', { name: /feeds.actions.dismiss/i }));

    expect(saveFeedMutate).toHaveBeenCalledWith('item-save');
    expect(dismissFeedMutate).toHaveBeenCalledWith('item-save');
  });

  it('hides review actions for saved feed items', () => {
    render(<FeedItemCard item={item({ state: 'saved' })} sourceTitle="Example Source" />);

    expect(screen.queryByRole('button', { name: /feeds.actions.save/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /feeds.actions.dismiss/i })
    ).not.toBeInTheDocument();
  });

  it('renders a feed item image as the article cover', () => {
    const coverUrl = 'https://publisher.example/article-cover.jpg';
    const { container } = render(
      <FeedItemCard item={item({ imageUrl: coverUrl })} sourceTitle="Example Source" />
    );

    const cover = container.querySelector(`img[src="${coverUrl}"]`);
    expect(cover).toBeInTheDocument();

    fireEvent.error(cover!);
    expect(container.querySelector(`img[src="${coverUrl}"]`)).not.toBeInTheDocument();
  });

  it('updates status and auto-save from the selected feed detail', async () => {
    const user = userEvent.setup();
    render(
      <FeedManagerDialog
        onOpenChange={vi.fn()}
        onQueryChange={vi.fn()}
        onSelectFeed={vi.fn()}
        onStartAdd={vi.fn()}
        onStatusFilterChange={vi.fn()}
        open
        query=""
        selectedFeedId="feed-1"
        statusFilter="all"
        subscriptions={[subscription()]}
        subscriptionsLoading={false}
      />
    );

    const switches = await screen.findAllByRole('switch');
    await user.click(switches[0]!);
    await user.click(switches[1]!);

    expect(updateFeedMutate).toHaveBeenNthCalledWith(1, {
      body: { status: 'paused' },
      subscriptionId: 'feed-1'
    });
    expect(updateFeedMutate).toHaveBeenNthCalledWith(2, {
      body: { autoSave: true },
      subscriptionId: 'feed-1'
    });
  });
});
