import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { importWithEnv } from '@/tests/env.js';
import { createInMemoryAuthAdapter } from '@/tests/in-memory/auth.js';
import { createInMemoryHighlightsAdapter } from '@/tests/in-memory/highlights.js';
import { createInMemoryImportSessionsAdapter } from '@/tests/in-memory/import-sessions.js';
import { createInMemoryLinksAdapter } from '@/tests/in-memory/links.js';
import { createInMemoryTagsAdapter } from '@/tests/in-memory/tags.js';

import { createTestApp } from '@/lib/create-app.js';
import { DEMO_MODE_DISABLED_MESSAGE } from '@/lib/demo-mode.js';
import { generateToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';

import type { UserWithoutPassword } from '@/types/auth.js';

const { default: demoRouter } = await importWithEnv(
  { DEMO_MODE: 'true' },
  async () => import('./tags.index.js')
);

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'tags-demo@example.com',
  name: 'Demo User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const GROUP_ID = '00000000-0000-0000-0000-000000000010';
const CATEGORY2_ID = '00000000-0000-0000-0000-000000000011';
const TAG_ID = '00000000-0000-0000-0000-000000000020';

const authCookie = `token=${await generateToken(TEST_USER.id, TEST_USER.email)}`;

function buildClient() {
  const tagsAdapter = createInMemoryTagsAdapter();
  const authAdapter = createInMemoryAuthAdapter();
  const importSessionsAdapter = createInMemoryImportSessionsAdapter();

  authAdapter.findById = async (id) => (id === TEST_USER.id ? TEST_USER : null);

  tagsAdapter.seedGroup(GROUP_ID, 'Tech', '#10B981', 'Engineering topics');
  tagsAdapter.seedGroup(CATEGORY2_ID, 'Design', '#F59E0B', 'Design topics');
  tagsAdapter.seedTag(TAG_ID, GROUP_ID, 'TypeScript');

  const repos = {
    auth: authAdapter,
    highlights: createInMemoryHighlightsAdapter(),
    importSessions: importSessionsAdapter.repo,
    links: createInMemoryLinksAdapter(),
    tags: tagsAdapter.repo
  };

  const client = testClient(
    createTestApp(demoRouter, (app) => {
      app.use('*', async (c, next) => {
        c.set('repos', repos);
        return next();
      });
    })
  );

  return {
    client,
    seedGroup: tagsAdapter.seedGroup,
    seedTag: tagsAdapter.seedTag
  };
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

describe('tags routes in demo mode', () => {
  it('blocks tag mutations', async () => {
    const createGroup = await client.tags.groups.$post(
      { json: { name: 'New', color: '#000000', description: null } },
      { headers: { Cookie: authCookie } }
    );
    expect(createGroup.status).toBe(HttpStatus.FORBIDDEN);

    const updateGroup = await client.tags.groups[':id'].$put(
      { param: { id: GROUP_ID }, json: { name: 'Updated' } },
      { headers: { Cookie: authCookie } }
    );
    expect(updateGroup.status).toBe(HttpStatus.FORBIDDEN);

    const deleteGroup = await client.tags.groups[':id'].$delete(
      { param: { id: GROUP_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(deleteGroup.status).toBe(HttpStatus.FORBIDDEN);

    const createTag = await client.tags.$post(
      { json: { groupId: GROUP_ID, name: 'React' } },
      { headers: { Cookie: authCookie } }
    );
    expect(createTag.status).toBe(HttpStatus.FORBIDDEN);

    const updateTag = await client.tags[':tagId'].$put(
      { param: { tagId: TAG_ID }, json: { name: 'TypeScript Updated' } },
      { headers: { Cookie: authCookie } }
    );
    expect(updateTag.status).toBe(HttpStatus.FORBIDDEN);

    const deleteTag = await client.tags[':tagId'].$delete(
      { param: { tagId: TAG_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(deleteTag.status).toBe(HttpStatus.FORBIDDEN);

    const moveTag = await client.tags[':tagId'].move.$post(
      { param: { tagId: TAG_ID }, json: { targetGroupId: CATEGORY2_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(moveTag.status).toBe(HttpStatus.FORBIDDEN);

    const bulkDelete = await client.tags.bulk.$delete(
      { json: { tagIds: [TAG_ID] } },
      { headers: { Cookie: authCookie } }
    );
    expect(bulkDelete.status).toBe(HttpStatus.FORBIDDEN);

    const bulkMove = await client.tags['move-batch'].$post(
      { json: { fromGroupId: GROUP_ID, toGroupId: CATEGORY2_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(bulkMove.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('keeps tag reads available', async () => {
    const groups = await client.tags.groups.$get({}, { headers: { Cookie: authCookie } });
    expect(groups.status).toBe(HttpStatus.OK);

    const tags = await client.tags.$get({}, { headers: { Cookie: authCookie } });
    expect(tags.status).toBe(HttpStatus.OK);

    const tagsByGroup = await client.tags.groups[':groupId'].$get(
      { param: { groupId: GROUP_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(tagsByGroup.status).toBe(HttpStatus.OK);

    expect(typeof seedGroup).toBe('function');
    expect(typeof seedTag).toBe('function');
  });

  it('returns the canonical demo message for create group', async () => {
    const response = await client.tags.groups.$post(
      { json: { name: 'Blocked', color: '#000000', description: null } },
      { headers: { Cookie: authCookie } }
    );

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    const json = await response.json();
    expect(json.message).toBe(DEMO_MODE_DISABLED_MESSAGE);
  });
});
