import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { ApiResult } from '@/types/api';

import { getDisplayName, mapUserResponse, type UserResult, useGetUser } from './get-user';

const API_URL = 'http://localhost:3000';

describe('auth get-user', () => {
  it('derives a display name from the email when the name is missing', () => {
    expect(getDisplayName({ email: 'reader@loreo.test' })).toBe('reader');
    expect(getDisplayName({ email: 'reader@loreo.test', name: 'Reader User' })).toBe('Reader User');
  });

  it('maps the API response into the auth user shape', () => {
    const response: ApiResult<UserResult> = {
      result: {
        avatar: undefined,
        email: 'reader@loreo.test',
        name: undefined
      },
      message: 'ok',
      status: 200
    };

    expect(mapUserResponse(response)).toEqual({
      message: 'ok',
      result: {
        avatar: null,
        displayName: 'reader',
        email: 'reader@loreo.test',
        name: 'reader'
      },
      status: 200
    });
  });

  it('returns the signed-in user from the API through MSW', async () => {
    server.use(
      http.get(`${API_URL}/auth/user`, () =>
        HttpResponse.json({
          result: {
            avatar: null,
            email: 'reader@loreo.test',
            name: undefined
          },
          message: 'ok',
          status: 200
        } satisfies ApiResult<UserResult>)
      )
    );

    const { result } = renderHookWithProviders(() => useGetUser());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      message: 'ok',
      result: {
        avatar: null,
        displayName: 'reader',
        email: 'reader@loreo.test',
        name: 'reader'
      },
      status: 200
    });
  });
});
