import { describe, expect, it } from 'vitest';

import { createInMemoryRepos } from '@/tests/in-memory/index.js';

import { createTestApp } from '@/lib/create-app.js';
import { generateToken } from '@/lib/jwt.js';
import { passwordManager } from '@/lib/password-manager.js';
import { HttpStatus } from '@/lib/response.js';

import router from './admin.index.js';

function buildApp() {
  const repos = createInMemoryRepos();
  const app = createTestApp(router, (testApp) => {
    testApp.use('*', async (c, next) => {
      c.set('repos', repos);
      return next();
    });
  });

  return { app, repos };
}

async function createAdmin(repos: ReturnType<typeof createInMemoryRepos>) {
  const admin = await repos.auth.create({
    email: 'admin@example.com',
    passwordHash: 'not-used-in-this-test',
    name: 'Admin',
    role: 'admin'
  });
  const token = await generateToken(admin.id, admin.email);

  return { admin, token };
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

    it('returns active users without password hashes', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      await repos.auth.create({
        email: 'active@example.com',
        passwordHash: 'active-secret',
        name: 'Active User',
        role: 'user'
      });
      const deleted = await repos.auth.create({
        email: 'deleted@example.com',
        passwordHash: 'deleted-secret',
        name: 'Deleted User',
        role: 'user'
      });
      await repos.auth.updateDeletedAt(deleted.id, new Date().toISOString());

      const response = await app.request('/admin/users', {
        headers: { Cookie: `token=${token}` }
      });
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.result).toHaveLength(2);
      expect(body.result.map((user: { email: string }) => user.email)).toEqual([
        'active@example.com',
        'admin@example.com'
      ]);
      expect(body.result[0]).not.toHaveProperty('passwordHash');
    });

    it('filters deleted users when requested', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      await repos.auth.create({
        email: 'visible@example.com',
        passwordHash: 'secret',
        name: 'Visible User',
        role: 'user'
      });
      const deleted = await repos.auth.create({
        email: 'only-deleted@example.com',
        passwordHash: 'secret',
        name: 'Only Deleted',
        role: 'user'
      });
      await repos.auth.updateDeletedAt(deleted.id, new Date().toISOString());

      const response = await app.request('/admin/users?status=deleted', {
        headers: { Cookie: `token=${token}` }
      });
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.result).toHaveLength(1);
      expect(body.result[0]).toMatchObject({ email: 'only-deleted@example.com' });
    });
  });

  describe('GET /admin/users/:id', () => {
    it('returns 404 for missing users', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);

      const response = await app.request(`/admin/users/${crypto.randomUUID()}`, {
        headers: { Cookie: `token=${token}` }
      });

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns deleted user details without password hashes', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      const user = await repos.auth.create({
        email: 'deleted-detail@example.com',
        passwordHash: 'secret',
        name: 'Deleted Detail',
        role: 'user'
      });
      await repos.auth.updateDeletedAt(user.id, new Date().toISOString());

      const response = await app.request(`/admin/users/${user.id}`, {
        headers: { Cookie: `token=${token}` }
      });
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.result.email).toBe('deleted-detail@example.com');
      expect(body.result.deletedAt).toEqual(expect.any(String));
      expect(body.result).not.toHaveProperty('passwordHash');
    });
  });

  describe('PATCH /admin/users/:id', () => {
    it('updates allowed account fields', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      const user = await repos.auth.create({
        email: 'rename@example.com',
        passwordHash: 'secret',
        name: 'Before',
        role: 'user'
      });

      const response = await app.request(`/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { Cookie: `token=${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'After', role: 'admin' })
      });
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.result).toMatchObject({
        email: 'rename@example.com',
        name: 'After',
        role: 'admin'
      });
      expect(body.result).not.toHaveProperty('passwordHash');
    });

    it('prevents demoting the last active admin', async () => {
      const { app, repos } = buildApp();
      const { admin, token } = await createAdmin(repos);

      const response = await app.request(`/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: { Cookie: `token=${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' })
      });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('rejects empty updates', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      const user = await repos.auth.create({
        email: 'empty-update@example.com',
        passwordHash: 'secret',
        name: 'Empty Update',
        role: 'user'
      });

      const response = await app.request(`/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { Cookie: `token=${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('rejects invalid roles', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      const user = await repos.auth.create({
        email: 'invalid-role@example.com',
        passwordHash: 'secret',
        name: 'Invalid Role',
        role: 'user'
      });

      const response = await app.request(`/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { Cookie: `token=${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'owner' })
      });

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('POST /admin/users/:id/reset-password', () => {
    it('updates a user password without returning it', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      const user = await repos.auth.create({
        email: 'reset@example.com',
        passwordHash: await passwordManager.hash('old-password'),
        name: 'Reset User',
        role: 'user'
      });

      const response = await app.request(`/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { Cookie: `token=${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'new-password', confirmNewPassword: 'new-password' })
      });
      const credentials = await repos.auth.findByIdWithCredentials(user.id);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.result).toBeNull();
      expect(await passwordManager.compare(credentials?.passwordHash ?? '', 'new-password')).toBe(
        true
      );
    });

    it('rejects mismatched passwords', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      const user = await repos.auth.create({
        email: 'mismatch@example.com',
        passwordHash: 'secret',
        name: 'Mismatch User',
        role: 'user'
      });

      const response = await app.request(`/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { Cookie: `token=${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'new-password', confirmNewPassword: 'different' })
      });

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('soft-deletes a user', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      const user = await repos.auth.create({
        email: 'delete@example.com',
        passwordHash: 'secret',
        name: 'Delete User',
        role: 'user'
      });

      const response = await app.request(`/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Cookie: `token=${token}` }
      });
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.result.deletedAt).toEqual(expect.any(String));
      expect(await repos.auth.findById(user.id)).toBeNull();
    });

    it('prevents deleting the last active admin', async () => {
      const { app, repos } = buildApp();
      const { admin, token } = await createAdmin(repos);

      const response = await app.request(`/admin/users/${admin.id}`, {
        method: 'DELETE',
        headers: { Cookie: `token=${token}` }
      });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /admin/users/:id/restore', () => {
    it('restores a soft-deleted user', async () => {
      const { app, repos } = buildApp();
      const { token } = await createAdmin(repos);
      const user = await repos.auth.create({
        email: 'restore@example.com',
        passwordHash: 'secret',
        name: 'Restore User',
        role: 'user'
      });
      await repos.auth.updateDeletedAt(user.id, new Date().toISOString());

      const response = await app.request(`/admin/users/${user.id}/restore`, {
        method: 'POST',
        headers: { Cookie: `token=${token}` }
      });
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.result.deletedAt).toBeNull();
      expect(await repos.auth.findById(user.id)).not.toBeNull();
    });
  });
});
