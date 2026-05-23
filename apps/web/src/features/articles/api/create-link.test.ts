import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { CreateLinkResponse } from '@/types/links';

import { type CreateLinkBody, useCreateLink } from './create-link';

const API_URL = 'http://localhost:3000';

describe('useCreateLink', () => {
  it('creates a link and returns the response', async () => {
    server.use(
      http.post(`${API_URL}/links`, async ({ request }) => {
        const body = (await request.json()) as CreateLinkBody;

        expect(body).toEqual({
          url: 'https://example.com/new-article',
          tags: [{ groupId: 'group-1', name: 'Research' }]
        });

        return HttpResponse.json({
          id: 'link-new',
          url: body.url
        } satisfies CreateLinkResponse);
      })
    );

    const { result } = renderHookWithProviders(() => useCreateLink());

    await expect(
      result.current.mutateAsync({
        url: 'https://example.com/new-article',
        tags: [{ groupId: 'group-1', name: 'Research' }]
      })
    ).resolves.toEqual({
      id: 'link-new',
      url: 'https://example.com/new-article'
    });
  });
});
