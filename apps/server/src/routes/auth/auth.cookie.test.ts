import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importWithEnv } from '@/tests/env.js';
import { createInMemoryRepos } from '@/tests/in-memory/index.js';

import { createTestApp } from '@/lib/create-app.js';
import { HttpStatus } from '@/lib/response.js';

const mockRateLimitState = {
  registerStatus: 0,
  loginStatus: 0
};

vi.mock('@/middlewares/rate-limit', () => ({
  authRegisterRateLimit: async (_c: unknown, next: () => Promise<void>) => {
    if (mockRateLimitState.registerStatus)
      return new Response(null, { status: mockRateLimitState.registerStatus });
    return next();
  },
  authLoginRateLimit: async (_c: unknown, next: () => Promise<void>) => {
    if (mockRateLimitState.loginStatus)
      return new Response(null, { status: mockRateLimitState.loginStatus });
    return next();
  },
  createLinkRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  importUploadRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  importPreviewRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  importExecuteRateLimit: async (_c: unknown, next: () => Promise<void>) => next()
}));

const TEST_EMAIL = 'cookie-test@example.com';
const TEST_PASSWORD = 'password123';

const { default: authRouter } = await importWithEnv(
  {
    DATABASE_URL: 'postgresql://demo:secret@db.example.com:5432/loreo',
    JWT_SECRET: 'secret',
    NODE_ENV: 'production'
  },
  () => import('./auth.index.js')
);

describe('auth cookie policy', () => {
  async function buildClient() {
    const repos = createInMemoryRepos();

    const client = testClient(
      createTestApp(authRouter, (app) => {
        app.use('*', async (c, next) => {
          c.set('repos', repos);
          return next();
        });
      })
    );

    return { client };
  }

  let client: Awaited<ReturnType<typeof buildClient>>['client'];

  beforeEach(async () => {
    const built = await buildClient();
    client = built.client;
  });

  it('sets SameSite=None on the auth cookie in production', async () => {
    await client.auth.register.$post({
      json: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        confirmPassword: TEST_PASSWORD
      }
    });

    const response = await client.auth.login.$post({
      json: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });

    expect(response.status).toBe(HttpStatus.OK);

    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('SameSite=None');
    expect(setCookie).toContain('Secure');
  });
});
