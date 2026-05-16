import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { createInMemoryAuthAdapter } from '@/tests/in-memory/auth.js';
import { createInMemoryHighlightsAdapter } from '@/tests/in-memory/highlights.js';
import { createInMemoryImportSessionsAdapter } from '@/tests/in-memory/import-sessions.js';
import { createInMemoryLinksAdapter } from '@/tests/in-memory/links.js';
import { createInMemoryTagsAdapter } from '@/tests/in-memory/tags.js';

import { createTestApp } from '@/lib/create-app.js';
import { generateToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';
import type { Repos } from '@/lib/types.js';

import type { UserWithoutPassword } from '@/types/auth.js';

import router from './tags.index.js';

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'tags-test@example.com',
  name: 'Test User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';
const GROUP_ID = '00000000-0000-0000-0000-000000000010';
const CATEGORY2_ID = '00000000-0000-0000-0000-000000000011';
const TAG_ID = '00000000-0000-0000-0000-000000000020';

const authCookie = `token=${await generateToken(TEST_USER.id, TEST_USER.email)}`;

function buildClient() {
  const tagsAdapter = createInMemoryTagsAdapter();
  const authAdapter = createInMemoryAuthAdapter();
  const importSessionsAdapter = createInMemoryImportSessionsAdapter();

  authAdapter.findById = async (id) => (id === TEST_USER.id ? TEST_USER : null);

  // Pre-seed the two categories and one tag that most tests rely on.
  tagsAdapter.seedGroup(GROUP_ID, 'Tech', '#10B981', 'Engineering topics');
  tagsAdapter.seedGroup(CATEGORY2_ID, 'Design', '#F59E0B', 'Design topics');
  tagsAdapter.seedTag(TAG_ID, GROUP_ID, 'TypeScript');

  const repos: Repos = {
    auth: authAdapter,
    highlights: createInMemoryHighlightsAdapter(),
    importSessions: importSessionsAdapter.repo,
    links: createInMemoryLinksAdapter(),
    tags: tagsAdapter.repo
  };

  const client = testClient(
    createTestApp(router, (app) => {
      app.use('*', async (c, next) => {
        c.set('repos', repos);
        return next();
      });
    })
  );

  return { client, seedGroup: tagsAdapter.seedGroup, seedTag: tagsAdapter.seedTag };
}

let client: ReturnType<typeof buildClient>['client'];
let seedGroup: ReturnType<typeof buildClient>['seedGroup'];
let seedTag: ReturnType<typeof buildClient>['seedTag'];

beforeEach(() => {
  const built = buildClient();
  client = built.client;
  seedGroup = built.seedGroup;
  seedTag = built.seedTag;
});

describe('tags routes', () => {
  describe('GET /api/tags/categories', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags.groups.$get();
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns tag categories with nested tags', async () => {
      const response = await client.tags.groups.$get({}, { headers: { Cookie: authCookie } });
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(Array.isArray(json.result)).toBe(true);
        expect(json.result.length).toBeGreaterThanOrEqual(2);
        const tech = json.result.find((c: { name: string }) => c.name === 'Tech');
        expect(tech).toBeDefined();
        expect(Array.isArray((tech as { tags: unknown[] })?.tags)).toBe(true);
      }
    });
  });

  describe('POST /api/tags/categories', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags.groups.$post({
        json: { name: 'New', color: '#000', description: null }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('creates a new category', async () => {
      const response = await client.tags.groups.$post(
        { json: { name: 'Science', color: '#6366F1', description: 'Science articles' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.CREATED);
      if (response.status === HttpStatus.CREATED) {
        const json = await response.json();
        expect(json.result.name).toBe('Science');
        expect(json.result.color).toBe('#6366F1');
      }
    });

    it('returns 409 for duplicate category name', async () => {
      const response = await client.tags.groups.$post(
        { json: { name: 'Tech', color: '#000000', description: null } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.CONFLICT);
    });
  });

  describe('PUT /api/tags/categories/:id', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags.groups[':id'].$put({
        param: { id: GROUP_ID },
        json: { name: 'Updated' }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown category', async () => {
      const response = await client.tags.groups[':id'].$put(
        { param: { id: UNKNOWN_ID }, json: { name: 'Updated' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('updates category color and description', async () => {
      const response = await client.tags.groups[':id'].$put(
        {
          param: { id: GROUP_ID },
          json: { color: '#3B82F6', description: 'Updated description' }
        },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.color).toBe('#3B82F6');
      }
    });
  });

  describe('DELETE /api/tags/categories/:id', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags.groups[':id'].$delete({
        param: { id: UNKNOWN_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown category', async () => {
      const response = await client.tags.groups[':id'].$delete(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('deletes a category (cascade removes its tags)', async () => {
      const tempCatId = 'temp-cat-delete-id';
      seedGroup(tempCatId, 'TempCat', '#AABBCC');
      seedTag('temp-tag-delete-id', tempCatId, 'TempTag');

      const response = await client.tags.groups[':id'].$delete(
        { param: { id: tempCatId } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.id).toBe(tempCatId);
      }
    });
  });

  describe('GET /api/tags', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags.$get();
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns all tags for the user', async () => {
      const response = await client.tags.$get({}, { headers: { Cookie: authCookie } });
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(Array.isArray(json.result)).toBe(true);
        expect(json.result.some((t: { name: string }) => t.name === 'TypeScript')).toBe(true);
      }
    });
  });

  describe('GET /api/tags/categories/:groupId', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags.groups[':groupId'].$get({
        param: { groupId: GROUP_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns tags for the specified category', async () => {
      const response = await client.tags.groups[':groupId'].$get(
        { param: { groupId: GROUP_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(Array.isArray(json.result)).toBe(true);
        expect(json.result.some((t: { name: string }) => t.name === 'TypeScript')).toBe(true);
      }
    });

    it('returns empty array for category with no tags', async () => {
      const response = await client.tags.groups[':groupId'].$get(
        { param: { groupId: CATEGORY2_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result).toEqual([]);
      }
    });
  });

  describe('POST /api/tags', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags.$post({
        json: { groupId: GROUP_ID, name: 'React' }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('creates a new tag', async () => {
      const response = await client.tags.$post(
        { json: { groupId: GROUP_ID, name: 'React' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.CREATED);
      if (response.status === HttpStatus.CREATED) {
        const json = await response.json();
        expect(json.result.name).toBe('React');
        expect(json.result.groupId).toBe(GROUP_ID);
      }
    });

    it('returns 409 for duplicate tag name in same category', async () => {
      const response = await client.tags.$post(
        { json: { groupId: GROUP_ID, name: 'TypeScript' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.CONFLICT);
    });
  });

  // describe('PUT /api/tags/:tagId/:groupId', () => {
  //   it('returns 401 without auth', async () => {
  //     const response = await client.tags[':tagId'][':groupId'].$put({
  //       param: { tagId: TAG_ID, groupId: GROUP_ID },
  //       json: { name: 'Updated' }
  //     });
  //     expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  //   });

  //   it('returns 404 for unknown tag', async () => {
  //     const response = await client.tags[':tagId'][':groupId'].$put(
  //       { param: { tagId: UNKNOWN_ID, groupId: GROUP_ID }, json: { name: 'Updated' } },
  //       { headers: { Cookie: authCookie } }
  //     );
  //     expect(response.status).toBe(HttpStatus.NOT_FOUND);
  //   });

  //   it('returns 400 when no fields provided', async () => {
  //     const response = await client.tags[':tagId'][':groupId'].$put(
  //       { param: { tagId: TAG_ID, groupId: GROUP_ID }, json: {} },
  //       { headers: { Cookie: authCookie } }
  //     );
  //     expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  //   });

  //   it('updates the tag name', async () => {
  //     const response = await client.tags[':tagId'][':groupId'].$put(
  //       { param: { tagId: TAG_ID, groupId: GROUP_ID }, json: { name: 'TypeScript Updated' } },
  //       { headers: { Cookie: authCookie } }
  //     );
  //     expect(response.status).toBe(HttpStatus.OK);
  //     if (response.status === HttpStatus.OK) {
  //       const json = await response.json();
  //       expect(json.result.name).toBe('TypeScript Updated');
  //       expect(json.result.id).toBe(TAG_ID);
  //     }
  //   });
  // });

  describe('POST /api/tags/:tagId/move', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags[':tagId'].move.$post({
        param: { tagId: TAG_ID },
        json: { targetGroupId: CATEGORY2_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown tag', async () => {
      const response = await client.tags[':tagId'].move.$post(
        { param: { tagId: UNKNOWN_ID }, json: { targetGroupId: CATEGORY2_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('moves tag to another category', async () => {
      const response = await client.tags[':tagId'].move.$post(
        { param: { tagId: TAG_ID }, json: { targetGroupId: CATEGORY2_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.groupId).toBe(CATEGORY2_ID);
        expect(json.result.id).toBe(TAG_ID);
      }
    });
  });

  // describe('DELETE /api/tags/:tagId/:groupId', () => {
  //   it('returns 401 without auth', async () => {
  //     const response = await client.tags[':tagId'][':groupId'].$delete({
  //       param: { tagId: TAG_ID, groupId: GROUP_ID }
  //     });
  //     expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  //   });

  //   it('returns 404 for unknown tag', async () => {
  //     const response = await client.tags[':tagId'][':groupId'].$delete(
  //       { param: { tagId: UNKNOWN_ID, groupId: GROUP_ID } },
  //       { headers: { Cookie: authCookie } }
  //     );
  //     expect(response.status).toBe(HttpStatus.NOT_FOUND);
  //   });

  //   it('deletes the tag', async () => {
  //     const response = await client.tags[':tagId'][':groupId'].$delete(
  //       { param: { tagId: TAG_ID, groupId: GROUP_ID } },
  //       { headers: { Cookie: authCookie } }
  //     );
  //     expect(response.status).toBe(HttpStatus.OK);
  //   });
  // });

  describe('DELETE /api/tags/bulk', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags.bulk.$delete({
        json: { tagIds: [UNKNOWN_ID] }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('bulk deletes tags', async () => {
      const t1Id = 'bulk-tag-1';
      const t2Id = 'bulk-tag-2';
      seedTag(t1Id, GROUP_ID, 'BulkTag1');
      seedTag(t2Id, GROUP_ID, 'BulkTag2');

      const response = await client.tags.bulk.$delete(
        { json: { tagIds: [t1Id, t2Id] } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.deletedTags).toBe(2);
      }
    });
  });

  describe('POST /api/tags/move-batch', () => {
    it('returns 401 without auth', async () => {
      const response = await client.tags['move-batch'].$post({
        json: { toGroupId: CATEGORY2_ID, fromGroupId: GROUP_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('bulk moves tags between categories', async () => {
      const t1Id = 'move-tag-1';
      const t2Id = 'move-tag-2';
      seedTag(t1Id, GROUP_ID, 'MoveTag1');
      seedTag(t2Id, GROUP_ID, 'MoveTag2');

      const response = await client.tags['move-batch'].$post(
        { json: { toGroupId: CATEGORY2_ID, tagIds: [t1Id, t2Id] } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.movedTags).toBe(2);
      }
    });
  });
});
