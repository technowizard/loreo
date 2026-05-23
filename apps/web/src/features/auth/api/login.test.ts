import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { ApiResult } from '@/types/api';

import type { UserResult } from './get-user';
import { type LoginBody, useLogin } from './login';

const API_URL = 'http://localhost:3000';

describe('auth login', () => {
  it('submits credentials and returns the mapped user', async () => {
    server.use(
      http.post(`${API_URL}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as LoginBody;

        expect(body).toEqual({
          email: 'reader@loreo.test',
          password: 'password123'
        });

        return HttpResponse.json({
          result: {
            avatar: 'https://cdn.example.com/avatar.png',
            email: body.email,
            name: 'Reader User'
          },
          message: 'ok',
          status: 200
        } satisfies ApiResult<UserResult>);
      })
    );

    const { result } = renderHookWithProviders(() => useLogin());

    await expect(
      result.current.mutateAsync({
        email: 'reader@loreo.test',
        password: 'password123'
      })
    ).resolves.toEqual({
      message: 'ok',
      result: {
        avatar: 'https://cdn.example.com/avatar.png',
        displayName: 'Reader User',
        email: 'reader@loreo.test',
        name: 'Reader User'
      },
      status: 200
    });
  });
});
