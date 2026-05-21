import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { importWithEnv } from '@/tests/env.js';
import { createInMemoryRepos } from '@/tests/in-memory/index.js';

import { createTestApp } from '@/lib/create-app.js';
import { generateToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';

import type { UserWithoutPassword } from '@/types/auth.js';

const { default: demoRouter } = await importWithEnv(
  { DEMO_MODE: 'true' },
  async () => import('./highlights.index.js')
);

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'highlights-demo@example.com',
  name: 'Demo User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const TEST_LINK_ID = '00000000-0000-0000-0000-000000000010';

const authCookie = `token=${await generateToken(TEST_USER.id, TEST_USER.email)}`;

function buildClient() {
  const repos = createInMemoryRepos();

  repos.auth.findById = async (id) => (id === TEST_USER.id ? TEST_USER : null);

  repos.links.findById = async (id, userId) => {
    if (id === TEST_LINK_ID && userId === TEST_USER.id) {
      return {
        id: TEST_LINK_ID,
        userId: TEST_USER.id,
        url: 'https://example.com/article',
        title: 'Test Article',
        author: null,
        excerpt: null,
        content: null,
        favicon: null,
        coverImage: null,
        readingTime: 5,
        processingStatus: 'completed',
        priority: 'none',
        isRead: false,
        isArchived: false,
        isFavorite: false,
        isPaywalled: false,
        readingProgress: 0,
        lastReadAt: null,
        publishedAt: null,
        textContent: null,
        timeSpentReading: 0,
        errorMessage: null,
        processingStartedAt: null
      };
    }

    return null;
  };

  const client = testClient(
    createTestApp(demoRouter, (app) => {
      app.use('*', async (c, next) => {
        c.set('repos', repos);
        return next();
      });
    })
  );

  return client;
}

let client: ReturnType<typeof buildClient>;

beforeEach(() => {
  client = buildClient();
});

describe('highlights routes in demo mode', () => {
  it('keeps highlight CRUD available', async () => {
    const create = await client.highlights[':linkId'].$post(
      {
        param: { linkId: TEST_LINK_ID },
        json: {
          color: 'yellow',
          endOffset: 50,
          note: 'interesting point',
          startOffset: 10,
          text: 'selected text'
        }
      },
      { headers: { Cookie: authCookie } }
    );
    expect(create.status).toBe(HttpStatus.CREATED);

    const created = (await create.json()) as unknown as {
      result: {
        id: string;
      };
    };
    const highlightId = created.result.id;

    const getHighlights = await client.highlights.link[':linkId'].$get(
      { param: { linkId: TEST_LINK_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(getHighlights.status).toBe(HttpStatus.OK);

    const update = await client.highlights[':id'].$put(
      {
        param: { id: highlightId },
        json: { color: 'blue', note: 'updated note' }
      },
      { headers: { Cookie: authCookie } }
    );
    expect(update.status).toBe(HttpStatus.OK);

    const remove = await client.highlights[':id'].$delete(
      { param: { id: highlightId } },
      { headers: { Cookie: authCookie } }
    );
    expect(remove.status).toBe(HttpStatus.OK);
  });
});
