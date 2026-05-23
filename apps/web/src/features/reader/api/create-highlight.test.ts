import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { ApiResult } from '@/types/api';
import type { Highlight } from '@/types/highlights';

import { type CreateHighlightBody, useCreateHighlight } from './create-highlight';

const API_URL = 'http://localhost:3000';

describe('useCreateHighlight', () => {
  it('creates a highlight and returns the response', async () => {
    server.use(
      http.post(`${API_URL}/highlights/link-1`, async ({ request }) => {
        const body = (await request.json()) as CreateHighlightBody;

        expect(body).toEqual({
          color: '#ffeb3b',
          startOffset: 10,
          endOffset: 25,
          text: 'highlighted text',
          note: null
        });

        return HttpResponse.json({
          result: {
            id: 'highlight-1',
            color: body.color,
            startOffset: body.startOffset,
            endOffset: body.endOffset,
            text: body.text,
            note: body.note
          },
          message: 'ok',
          status: 200
        } satisfies ApiResult<Highlight>);
      })
    );

    const { result } = renderHookWithProviders(() => useCreateHighlight());

    await expect(
      result.current.mutateAsync({
        body: {
          color: '#ffeb3b',
          startOffset: 10,
          endOffset: 25,
          text: 'highlighted text',
          note: null
        },
        linkId: 'link-1'
      })
    ).resolves.toEqual({
      result: {
        id: 'highlight-1',
        color: '#ffeb3b',
        startOffset: 10,
        endOffset: 25,
        text: 'highlighted text',
        note: null
      },
      message: 'ok',
      status: 200
    });
  });
});
