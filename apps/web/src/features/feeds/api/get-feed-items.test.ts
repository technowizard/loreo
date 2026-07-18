import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { PaginatedResponseOptions } from '@/types/api';
import type { FeedItem } from '@/types/feeds';

import { useFeedItems } from './get-feed-items';

const API_URL = 'http://localhost:3000';
const NOW = '2026-06-28T12:00:00.000Z';

function item(id: string): FeedItem {
  return {
    author: null,
    createdAt: NOW,
    discoveredAt: NOW,
    dismissedAt: null,
    excerpt: null,
    guid: null,
    id,
    imageUrl: null,
    linkId: null,
    normalizedUrl: `https://example.com/${id}`,
    publishedAt: NOW,
    savedAt: null,
    state: 'new',
    subscriptionId: 'feed-1',
    title: id,
    updatedAt: NOW,
    url: `https://example.com/${id}`,
    userId: 'user-1'
  };
}

describe('useFeedItems', () => {
  it('loads and flattens cursor-paginated feed items', async () => {
    const firstPage = [item('item-1'), item('item-2')];
    const secondPage = [item('item-3')];

    server.use(
      http.get(`${API_URL}/feeds/items`, ({ request }) => {
        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor');
        const response: PaginatedResponseOptions<FeedItem[]> = {
          message: 'ok',
          pagination: {
            hasMore: !cursor,
            limit: 24,
            nextCursor: cursor ? undefined : 'cursor-2',
            total: 3,
            totalReturned: cursor ? 1 : 2
          },
          result: cursor ? secondPage : firstPage,
          status: 200
        };

        expect(url.searchParams.get('sort')).toBe('newest');
        expect(url.searchParams.get('state')).toBe('new');
        expect(url.searchParams.get('limit')).toBe('24');
        return HttpResponse.json(response);
      })
    );

    const { result } = renderHookWithProviders(() =>
      useFeedItems({ filters: { sort: 'newest', state: 'new' } })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(firstPage);
    expect(result.current.total).toBe(3);
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.data).toEqual([...firstPage, ...secondPage]));
    expect(result.current.hasNextPage).toBe(false);
  });
});
