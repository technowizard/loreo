import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import type { ApiResult } from '@/types/api';

import type { UserResult } from './get-user';
import { type RegisterBody, useRegister } from './register';

const API_URL = 'http://localhost:3000';

describe('auth register', () => {
  it('submits the registration payload and returns the mapped user', async () => {
    server.use(
      http.post(`${API_URL}/auth/register`, async ({ request }) => {
        const body = (await request.json()) as RegisterBody;

        expect(body).toEqual({
          confirmPassword: 'password123',
          email: 'new-reader@loreo.test',
          name: 'New Reader',
          password: 'password123'
        });

        return HttpResponse.json({
          result: {
            avatar: null,
            email: body.email,
            name: body.name,
            role: 'user'
          },
          message: 'ok',
          status: 200
        } satisfies ApiResult<UserResult>);
      })
    );

    const { result } = renderHookWithProviders(() => useRegister());

    await expect(
      result.current.mutateAsync({
        confirmPassword: 'password123',
        email: 'new-reader@loreo.test',
        name: 'New Reader',
        password: 'password123'
      })
    ).resolves.toEqual({
      message: 'ok',
      result: {
        avatar: null,
        displayName: 'New Reader',
        email: 'new-reader@loreo.test',
        name: 'New Reader',
        role: 'user'
      },
      status: 200
    });
  });
});
