import { describe, expect, it } from 'vitest';

import { createInMemoryRepos } from '@/tests/in-memory/index.js';

import { createTestApp } from '@/lib/create-app.js';
import { generateToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';

import router from './admin.index.js';

function buildApp() {
  const repos = createInMemoryRepos();
  const app = createTestApp(router, (app) => {
    app.use('*', async (c, next) => {
      c.set('repos', repos);
      return next();
    });
  });

  return { app, repos };
}

describe('admin routes', () => {
  describe('GET /admin/users', () => {
    it('returns 401 without auth', async () => {
      const { app } = buildApp();

      const response = await app.request('/admin/users');

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 403 for non-admin users', async () => {
      const { app, repos } = buildApp();
      const user = await repos.auth.create({
        email: 'reader@example.com',
        passwordHash: 'not-used-in-this-test',
        name: 'Reader',
        role: 'user'
      });
      const token = await generateToken(user.id, user.email);

      const response = await app.request('/admin/users', {
        headers: { Cookie: `token=${token}` }
      });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
