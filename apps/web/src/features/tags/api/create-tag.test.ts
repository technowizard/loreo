import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { ApiResult } from '@/types/api';
import type { CreateTagResponse } from '@/types/tags';

import { type CreateTagBody, useCreateTag } from './create-tag';

const API_URL = 'http://localhost:3000';

describe('useCreateTag', () => {
  it('creates a tag and returns the response', async () => {
    server.use(
      http.post(`${API_URL}/tags`, async ({ request }) => {
        const body = (await request.json()) as CreateTagBody;

        expect(body).toEqual({
          groupId: 'group-1',
          name: 'New Tag'
        });

        return HttpResponse.json({
          result: {
            id: 'tag-1',
            groupId: 'group-1',
            name: 'New Tag',
            createdAt: '2025-01-01T00:00:00Z'
          },
          message: 'ok',
          status: 200
        } satisfies ApiResult<CreateTagResponse>);
      })
    );

    const { result } = renderHookWithProviders(() => useCreateTag());

    await expect(
      result.current.mutateAsync({
        groupId: 'group-1',
        name: 'New Tag'
      })
    ).resolves.toEqual({
      result: {
        id: 'tag-1',
        groupId: 'group-1',
        name: 'New Tag',
        createdAt: '2025-01-01T00:00:00Z'
      },
      message: 'ok',
      status: 200
    });
  });
});
