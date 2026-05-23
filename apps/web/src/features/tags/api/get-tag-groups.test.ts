import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { ApiResult } from '@/types/api';
import type { TagGroup } from '@/types/tags';

import { useGetTagGroups } from './get-tag-groups';

const API_URL = 'http://localhost:3000';

const mockTagGroups: TagGroup[] = [
  {
    id: '1',
    name: 'Default',
    description: 'Default group',
    color: '#ff0000',
    createdAt: '2025-01-01T00:00:00Z',
    tags: [
      { id: '1', groupId: '1', name: 'Unread' },
      { id: '2', groupId: '1', name: 'Research' }
    ]
  }
];

describe('useGetTagGroups', () => {
  it('returns tag groups from the API through MSW', async () => {
    server.use(
      http.get(`${API_URL}/tags/groups`, () => {
        const response: ApiResult<TagGroup[]> = {
          result: mockTagGroups,
          message: 'ok',
          status: 200
        };

        return HttpResponse.json(response);
      })
    );

    const { result } = renderHookWithProviders(() => useGetTagGroups());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.result).toEqual(mockTagGroups);
  });
});
