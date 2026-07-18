import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: (options: {
    count: number;
    getItemKey: (index: number) => string | number;
  }) => ({
    getTotalSize: () => 520,
    getVirtualItems: () =>
      options.count > 0
        ? [{ index: 0, key: options.getItemKey(0), start: 0, size: 520, end: 520, lane: 0 }]
        : [],
    measureElement: vi.fn(),
    scrollMargin: 0
  })
}));

import { render } from '@/tests/test-utils';

import type { FeedItem } from '@/types/feeds';

import { VirtualizedFeedGrid } from './virtualized-feed-grid';

const NOW = '2026-07-18T00:00:00.000Z';

function feedItem(index: number): FeedItem {
  return {
    author: null,
    createdAt: NOW,
    discoveredAt: NOW,
    dismissedAt: null,
    excerpt: null,
    guid: `guid-${index}`,
    id: `item-${index}`,
    imageUrl: null,
    linkId: null,
    normalizedUrl: `https://example.com/article-${index}`,
    publishedAt: NOW,
    savedAt: null,
    state: 'new',
    subscriptionId: 'feed-1',
    title: `Article ${index}`,
    updatedAt: NOW,
    url: `https://example.com/article-${index}`,
    userId: 'user-1'
  };
}

describe('VirtualizedFeedGrid', () => {
  it('keeps focus while mounting every loaded row for keyboard traversal', async () => {
    const items = Array.from({ length: 37 }, (_, index) => feedItem(index + 1));

    render(
      <VirtualizedFeedGrid
        ariaLabel="Feed articles"
        items={items}
        showActions
        sourceTitleBySubscriptionId={new Map([['feed-1', 'Example Feed']])}
      />
    );

    expect(screen.queryByRole('heading', { name: 'Article 37' })).not.toBeInTheDocument();
    const focusedLink = screen.getAllByRole('link', { name: 'Article 1' })[0]!;

    focusedLink.focus();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Article 37' })).toBeVisible());
    expect(focusedLink).toHaveFocus();
  });
});
