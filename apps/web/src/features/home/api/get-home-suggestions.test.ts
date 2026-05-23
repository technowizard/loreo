import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { ApiResult } from '@/types/api';
import type { HomeSuggestions } from '@/types/home';

import { useGetHomeSuggestions } from './get-home-suggestions';

const API_URL = 'http://localhost:3000';

const mockSuggestions: HomeSuggestions = {
  continueReading: null,
  longReads: {
    totalArticles: 5,
    totalReadingTime: 120
  },
  recentlySaved: [
    {
      id: 'link-1',
      url: 'https://example.com/article-1',
      title: 'Article One',
      excerpt: null,
      author: null,
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
  ],
  hasReadArticle: false,
  shortReads: {
    totalArticles: 3,
    totalReadingTime: 15
  }
};

describe('useGetHomeSuggestions', () => {
  it('returns home suggestions from the API through MSW', async () => {
    server.use(
      http.get(`${API_URL}/home/suggestions`, () => {
        const response: ApiResult<HomeSuggestions> = {
          result: mockSuggestions,
          message: 'ok',
          status: 200
        };

        return HttpResponse.json(response);
      })
    );

    const { result } = renderHookWithProviders(() => useGetHomeSuggestions());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.result).toEqual(mockSuggestions);
  });
});
