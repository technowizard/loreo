import { promises as fs } from 'node:fs';
import path from 'node:path';

import { testClient } from 'hono/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from '@/lib/create-app.js';
import { generateToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';

import type { AuthRepository } from '@/repositories/auth.repository.js';
import type { HighlightsRepository } from '@/repositories/highlights.repository.js';
import type { ImportSessionsRepository } from '@/repositories/import-sessions.repository.js';
import type { LinksRepository } from '@/repositories/links.repository.js';
import type { TagsRepository } from '@/repositories/tags.repository.js';

import { storageService } from '@/services/storage.service.js';

import type { UserWithoutPassword } from '@/types/auth.js';

import router from './files.index.js';

const STORAGE_ROOT = path.resolve(process.cwd(), 'data/storage');

const USER_EMAIL = 'files-test@example.com';
const USER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000001';
const FILE_CONTENT = 'test file content';

let userId: string;
let authCookie: string;
let userFileKey: string;
let sharedFileKey: string;
let testUser: UserWithoutPassword;

beforeAll(async () => {
  testUser = {
    id: USER_ID,
    email: USER_EMAIL,
    name: 'Files Test User',
    avatar: null,
    role: 'user',
    settings: {},
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  userId = testUser.id;
  authCookie = `token=${await generateToken(userId, testUser.email)}`;

  userFileKey = `user-${userId}/uploads/test.txt`;
  sharedFileKey = 'shared/uploads/test.txt';

  await fs.mkdir(path.join(STORAGE_ROOT, `user-${userId}/uploads`), {
    recursive: true
  });
  await fs.mkdir(path.join(STORAGE_ROOT, 'shared/uploads'), {
    recursive: true
  });
  await fs.writeFile(path.join(STORAGE_ROOT, userFileKey), FILE_CONTENT);
  await fs.writeFile(path.join(STORAGE_ROOT, sharedFileKey), FILE_CONTENT);
});

afterAll(async () => {
  await fs.rm(path.join(STORAGE_ROOT, `user-${userId}`), {
    recursive: true,
    force: true
  });
  await fs.rm(path.join(STORAGE_ROOT, 'shared/uploads/test.txt'), {
    force: true
  });
});

function createFakeAuthRepository(user: UserWithoutPassword): AuthRepository {
  return {
    create: async () => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      settings: user.settings
    }),
    findByEmail: async () => null,
    findById: async (id) => (id === user.id ? user : null),
    findByIdWithCredentials: async () => null,
    findByIdIncludingDeleted: async () => null,
    listUsers: async () => [],
    update: async () => null,
    updateUserForAdmin: async () => null,
    updateRole: async () => ({ ...user, role: 'user' }),
    updatePassword: async () => null,
    updateDeletedAt: async () => user,
    countUsers: async () => 1,
    countActiveAdmins: async () => 0
  } satisfies AuthRepository;
}

function createFakeHighlightsRepository(): HighlightsRepository {
  return {
    create: async () => null as never,
    delete: async () => false,
    findByLinkId: async () => [],
    update: async () => null
  } satisfies HighlightsRepository;
}

function createFakeLinksRepository(): LinksRepository {
  return {
    create: async () => null,
    delete: async () => false,
    update: async () => null,
    findById: async () => null,
    findMany: async () => ({
      data: [],
      nextCursor: undefined,
      hasMore: false,
      items: []
    }),
    findByIdDetailed: async () => null,
    addTags: async () => [],
    findUpcoming: async () => [],
    getHomeSuggestions: async () => ({
      continueReading: null,
      recentlySaved: [],
      longReads: { totalArticles: 0, totalReadingTime: 0 },
      shortReads: { totalArticles: 0, totalReadingTime: 0 },
      hasReadArticle: false
    }),
    search: async () => ({
      data: [],
      nextCursor: undefined,
      hasMore: false,
      items: []
    }),
    getTagsForLink: async () => [],
    findAllUrls: async () => [],
    existsByUrl: async () => false
  } satisfies LinksRepository;
}

function createFakeImportSessionsRepository(): ImportSessionsRepository {
  return {
    cleanupOldSessions: async () => ({
      sessionsDeleted: 0,
      linksDeleted: 0
    }),
    countBySession: async () => ({
      completed: 0,
      failed: 0,
      pending: 0,
      total: 0
    }),
    create: async () => null,
    delete: async () => false,
    findById: async () => null,
    findByIdOrThrow: async () => null as never,
    findByUserId: async () => ({
      data: [],
      nextCursor: undefined,
      hasMore: false,
      items: []
    }),
    findLinksBySession: async () => ({
      hasMore: false,
      links: [],
      nextCursor: undefined
    }),
    findPendingLinksInSession: async () => [],
    incrementCounts: async () => null,
    incrementExtractionCounts: async () => null,
    resetProcessingLinksForCancel: async () => 0,
    retryFailedLinks: async () => [],
    updateExtractionStatus: async () => null,
    updateStatus: async () => null
  } satisfies ImportSessionsRepository;
}

function createFakeTagsRepository(): TagsRepository {
  return {
    addTagsToLink: async () => [],
    bulkDeleteTagRelations: async () => 0,
    bulkDeleteTags: async () => 0,
    bulkUpdateTagGroup: async () => 0,
    countLinksByTagIds: async () => 0,
    createGroup: async () => null as never,
    createTag: async () => null as never,
    deleteTag: async () => false,
    deleteTagGroup: async () => false,
    findGroups: async () => [],
    findGroupsWithTags: async () => [],
    findGroupById: async () => null,
    findGroupByName: async () => null,
    findTagById: async () => null,
    findTagsByGroup: async () => [],
    findTagsByUserId: async () => [],
    getTagUsageCount: async () => 0,
    replaceTagsForLink: async () => [],
    updateGroup: async () => null,
    updateTag: async () => null
  } satisfies TagsRepository;
}

const client = testClient(
  createTestApp(router, (app) => {
    app.use('*', async (c, next) => {
      c.set('repos', {
        auth: createFakeAuthRepository(testUser),
        highlights: createFakeHighlightsRepository(),
        links: createFakeLinksRepository(),
        importSessions: createFakeImportSessionsRepository(),
        tags: createFakeTagsRepository()
      });
      return next();
    });
  })
);

describe('GET /files/:key', () => {
  describe('authentication', () => {
    it('returns 401 without auth cookie', async () => {
      const response = await client.files[':key{.*}'].$get({
        param: { key: userFileKey }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('access control', () => {
    it('returns 200 for own user file', async () => {
      const response = await client.files[':key{.*}'].$get(
        { param: { key: userFileKey } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
    });

    it('returns 200 for shared file', async () => {
      const response = await client.files[':key{.*}'].$get(
        { param: { key: sharedFileKey } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
    });

    it("returns 403 for another user's file", async () => {
      const otherUserKey = `user-${OTHER_USER_ID}/uploads/secret.txt`;
      const response = await client.files[':key{.*}'].$get(
        { param: { key: otherUserKey } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('rejects path traversal under the user prefix', () => {
      const traversalKey = `user-${userId}/../../../package.json`;
      expect(storageService.isUserFile(traversalKey, userId)).toBe(false);
    });
  });

  describe('file existence', () => {
    it('returns 404 for a non-existent user file', async () => {
      const response = await client.files[':key{.*}'].$get(
        { param: { key: `user-${userId}/uploads/nonexistent.txt` } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('remote image downloads', () => {
    it('rejects private network image URLs', async () => {
      const result = await storageService.uploadImageFromUrl('http://127.0.0.1/image.png');
      expect(result).toBeNull();
    });
  });

  describe('response headers', () => {
    it('returns correct content type for .txt', async () => {
      const response = await client.files[':key{.*}'].$get(
        { param: { key: userFileKey } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.headers.get('content-type')).toBe('application/octet-stream');
    });

    it('returns file contents', async () => {
      const response = await client.files[':key{.*}'].$get(
        { param: { key: userFileKey } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      const text = await response.text();
      expect(text).toBe(FILE_CONTENT);
    });
  });
});
