import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createInMemoryRepos } from '@/tests/in-memory/index.js';

import { createTestApp } from '@/lib/create-app.js';
import { HttpStatus } from '@/lib/response.js';

import router from './auth.index.js';

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

const TEST_EMAIL = 'auth-test@example.com';
const TEST_PASSWORD = 'password123';

function extractTokenCookie(response: Response): string {
  const setCookie = response.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/token=([^;]+)/);
  return match?.[1] ?? '';
}

function buildClient() {
  const repos = createInMemoryRepos();
  return testClient(
    createTestApp(router, (app) => {
      app.use('*', async (c, next) => {
        c.set('repos', repos);
        return next();
      });
    })
  );
}

let client: ReturnType<typeof buildClient>;

beforeEach(() => {
  client = buildClient();
});

describe('auth routes', () => {
  describe('POST /api/auth/register', () => {
    it('invokes the register rate limiter', async () => {
      mockRateLimitState.registerStatus = 429;

      const response = await client.auth.register.$post({
        json: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          confirmPassword: TEST_PASSWORD
        }
      });

      expect(response.status).toBe(429);
      mockRateLimitState.registerStatus = 0;
    });

    it('validates email format', async () => {
      const response = await client.auth.register.$post({
        json: {
          email: 'not-an-email',
          password: TEST_PASSWORD,
          confirmPassword: TEST_PASSWORD
        }
      });
      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('validates password min length (8 chars)', async () => {
      const response = await client.auth.register.$post({
        json: {
          email: TEST_EMAIL,
          password: 'short',
          confirmPassword: 'short'
        }
      });
      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('validates passwords match', async () => {
      const response = await client.auth.register.$post({
        json: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          confirmPassword: 'different'
        }
      });
      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('creates a user and sets auth cookie', async () => {
      const response = await client.auth.register.$post({
        json: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          confirmPassword: TEST_PASSWORD
        }
      });
      expect(response.status).toBe(HttpStatus.CREATED);
      if (response.status === HttpStatus.CREATED) {
        const json = await response.json();
        expect(json.result.email).toBe(TEST_EMAIL);
        expect(json.result.role).toBe('admin');
        expect(json.status).toBe(HttpStatus.CREATED);
        expect(extractTokenCookie(response)).not.toBe('');
      }
    });

    it('returns 400 for duplicate email', async () => {
      await client.auth.register.$post({
        json: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          confirmPassword: TEST_PASSWORD
        }
      });
      const response = await client.auth.register.$post({
        json: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          confirmPassword: TEST_PASSWORD
        }
      });
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      if (response.status === HttpStatus.BAD_REQUEST) {
        const json = await response.json();
        expect(json.message).toBe('User already exists');
      }
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await client.auth.register.$post({
        json: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          confirmPassword: TEST_PASSWORD
        }
      });
    });

    it('invokes the login rate limiter', async () => {
      mockRateLimitState.loginStatus = 429;

      const response = await client.auth.login.$post({
        json: { email: TEST_EMAIL, password: TEST_PASSWORD }
      });

      expect(response.status).toBe(429);
      mockRateLimitState.loginStatus = 0;
    });

    it('returns 401 for wrong password', async () => {
      const response = await client.auth.login.$post({
        json: { email: TEST_EMAIL, password: 'wrongpassword' }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      if (response.status === HttpStatus.UNAUTHORIZED) {
        const json = await response.json();
        expect(json.message).toBe('Invalid email or password');
      }
    });

    it('returns 401 for unknown email', async () => {
      const response = await client.auth.login.$post({
        json: { email: 'nobody@example.com', password: TEST_PASSWORD }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('logs in and returns user with auth cookie', async () => {
      const response = await client.auth.login.$post({
        json: { email: TEST_EMAIL, password: TEST_PASSWORD }
      });
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.email).toBe(TEST_EMAIL);
        expect(json.result.role).toBe('admin');
        expect(extractTokenCookie(response)).not.toBe('');
      }
    });
  });

  describe('GET /api/auth/user', () => {
    it('returns 401 without auth cookie', async () => {
      const response = await client.auth.user.$get();
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns the current user with valid cookie', async () => {
      const registerResponse = await client.auth.register.$post({
        json: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          confirmPassword: TEST_PASSWORD
        }
      });
      const authCookie = extractTokenCookie(registerResponse);

      const response = await client.auth.user.$get(
        {},
        { headers: { Cookie: `token=${authCookie}` } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.email).toBe(TEST_EMAIL);
        expect(json.result.role).toMatch(/^(admin|user)$/);
      }
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the auth cookie', async () => {
      const response = await client.auth.logout.$post();
      expect(response.status).toBe(HttpStatus.OK);
      const setCookie = response.headers.get('set-cookie') ?? '';
      expect(setCookie).toContain('token=');
      expect(setCookie).toContain('Max-Age=0');
    });
  });
});
