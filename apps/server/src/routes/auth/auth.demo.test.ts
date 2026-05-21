import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importWithEnv } from '@/tests/env.js';
import { createInMemoryRepos } from '@/tests/in-memory/index.js';

import { defaultUserSettings } from '@/db/schemas/user-settings.js';

import { createTestApp } from '@/lib/create-app.js';
import { DEMO_MODE_DISABLED_MESSAGE } from '@/lib/demo-mode.js';
import { generateToken } from '@/lib/jwt.js';
import { passwordManager } from '@/lib/password-manager.js';
import { HttpStatus } from '@/lib/response.js';

vi.mock('@/middlewares/rate-limit', () => ({
  authRegisterRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  authLoginRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  createLinkRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  importUploadRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  importPreviewRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  importExecuteRateLimit: async (_c: unknown, next: () => Promise<void>) => next()
}));

const { default: demoRouter } = await importWithEnv(
  { DEMO_MODE: 'true' },
  async () => import('./auth.index.js')
);

const TEST_EMAIL = 'demo-auth@example.com';
const TEST_PASSWORD = 'password123';

async function buildClient() {
  const repos = createInMemoryRepos();
  const user = await repos.auth.create({
    email: TEST_EMAIL,
    passwordHash: await passwordManager.hash(TEST_PASSWORD),
    name: 'Demo User',
    settings: defaultUserSettings
  });
  const authCookie = `token=${await generateToken(user.id, user.email)}`;

  const client = testClient(
    createTestApp(demoRouter, (app) => {
      app.use('*', async (c, next) => {
        c.set('repos', repos);
        return next();
      });
    })
  );

  return { authCookie, client };
}

let authCookie: string;
let client: Awaited<ReturnType<typeof buildClient>>['client'];

beforeEach(async () => {
  const built = await buildClient();
  authCookie = built.authCookie;
  client = built.client;
});

describe('auth routes in demo mode', () => {
  it('blocks registration and account mutations', async () => {
    const register = await client.auth.register.$post({
      json: {
        email: 'new@example.com',
        password: TEST_PASSWORD,
        confirmPassword: TEST_PASSWORD
      }
    });
    expect(register.status).toBe(HttpStatus.FORBIDDEN);

    const updateEmail = await client.auth.email.$patch(
      {
        json: {
          currentPassword: TEST_PASSWORD,
          newEmail: 'new-email@example.com'
        }
      },
      { headers: { Cookie: authCookie } }
    );
    expect(updateEmail.status).toBe(HttpStatus.FORBIDDEN);

    const changePassword = await client.auth['change-password'].$post(
      {
        json: {
          currentPassword: TEST_PASSWORD,
          newPassword: 'new-password-123',
          confirmNewPassword: 'new-password-123'
        }
      },
      { headers: { Cookie: authCookie } }
    );
    expect(changePassword.status).toBe(HttpStatus.FORBIDDEN);

    const updateSettings = await client.auth.settings.$patch(
      { json: defaultUserSettings },
      { headers: { Cookie: authCookie } }
    );
    expect(updateSettings.status).toBe(HttpStatus.FORBIDDEN);

    const avatar = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const uploadAvatar = await client.auth.avatar.$post(
      { form: { file: avatar } },
      { headers: { Cookie: authCookie } }
    );
    expect(uploadAvatar.status).toBe(HttpStatus.FORBIDDEN);

    const updateAccount = await client.auth.account.$patch(
      { json: { name: 'Updated Demo User' } },
      { headers: { Cookie: authCookie } }
    );
    expect(updateAccount.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('keeps login and current-user reads available', async () => {
    const login = await client.auth.login.$post({
      json: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    expect(login.status).toBe(HttpStatus.OK);

    const currentUser = await client.auth.user.$get({}, { headers: { Cookie: authCookie } });
    expect(currentUser.status).toBe(HttpStatus.OK);

    const settings = await client.auth.settings.$get({}, { headers: { Cookie: authCookie } });
    expect(settings.status).toBe(HttpStatus.OK);
  });

  it('returns the canonical demo message', async () => {
    const response = await client.auth.register.$post({
      json: {
        email: 'blocked@example.com',
        password: TEST_PASSWORD,
        confirmPassword: TEST_PASSWORD
      }
    });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    const json = await response.json();
    expect(json.message).toBe(DEMO_MODE_DISABLED_MESSAGE);
  });
});
