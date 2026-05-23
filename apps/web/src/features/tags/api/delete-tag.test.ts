import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { ApiResult } from '@/types/api';

import { useDeleteTag } from './delete-tag';

const API_URL = 'http://localhost:3000';

describe('useDeleteTag', () => {
  it('deletes a tag and returns empty result', async () => {
    server.use(
      http.delete(`${API_URL}/tags/tag-1/group-1`, () => {
        return HttpResponse.json({
          result: undefined,
          message: 'ok',
          status: 200
        } satisfies ApiResult<void>);
      })
    );

    const { result } = renderHookWithProviders(() => useDeleteTag());

    await expect(
      result.current.mutateAsync({
        id: 'tag-1',
        groupId: 'group-1'
      })
    ).resolves.toEqual({
      result: undefined,
      message: 'ok',
      status: 200
    });
  });
});
