import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { PaginatedResponseOptions } from '@/types/api';
import type { StreamlinedLink } from '@/types/links';

import { useGetLinks } from './get-links';

const API_URL = 'http://localhost:3000';

const mockLinks: StreamlinedLink[] = [
  {
    id: 'link-1',
    url: 'https://example.com/article-1',
    title: 'Article One',
    excerpt: 'First article excerpt',
    author: 'Author One',
    favicon: null,
    coverImage: null,
    isArchived: false,
    isFavorite: false,
    isPaywalled: false,
    isRead: false,
    lastReadAt: null,
    priority: 'none',
    processingStatus: 'completed',
    publishedAt: null,
    readingProgress: 0,
    readingTime: 5,
    tags: [],
    highlights: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    timeAdded: '2025-01-01T00:00:00Z',
    timeSpentReading: 0
  }
];

describe('useGetLinks', () => {
  it('returns paginated links from the API through MSW', async () => {
    server.use(
      http.get(`${API_URL}/links`, ({ request }) => {
        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor');

        const response: PaginatedResponseOptions<StreamlinedLink[]> = {
          result: cursor ? [] : mockLinks,
          message: 'ok',
          status: 200,
          pagination: {
            nextCursor: cursor ? undefined : 'cursor-2',
            hasMore: !cursor,
            limit: 20,
            totalReturned: cursor ? 0 : 1
          }
        };

        return HttpResponse.json(response);
      })
    );

    const { result } = renderHookWithProviders(() => useGetLinks({ filters: {} }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockLinks);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('returns no next page when the API omits nextCursor', async () => {
    server.use(
      http.get(`${API_URL}/links`, () => {
        const response: PaginatedResponseOptions<StreamlinedLink[]> = {
          result: mockLinks,
          message: 'ok',
          status: 200,
          pagination: {
            nextCursor: undefined,
            hasMore: false,
            limit: 20,
            totalReturned: 1
          }
        };

        return HttpResponse.json(response);
      })
    );

    const { result } = renderHookWithProviders(() => useGetLinks({ filters: {} }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNextPage).toBe(false);
  });
});
