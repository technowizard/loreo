import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { ApiResult } from '@/types/api';
import type { Tag } from '@/types/tags';

import { useGetTags } from './get-tags';

const API_URL = 'http://localhost:3000';

const mockTags: Tag[] = [
  { id: '1', groupId: 'default', name: 'Unread' },
  { id: '2', groupId: 'default', name: 'Research' }
];

describe('useGetTags', () => {
  it('returns tags from the API through MSW', async () => {
    server.use(
      http.get(`${API_URL}/tags`, () => {
        const response: ApiResult<Tag[]> = {
          result: mockTags,
          message: 'ok',
          status: 200
        };

        return HttpResponse.json(response);
      })
    );

    const { result } = renderHookWithProviders(() => useGetTags());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.result).toEqual(mockTags);
  });
});
