import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importWithEnv } from '@/tests/env.js';
import { createInMemoryRepos } from '@/tests/in-memory/index.js';

import { createTestApp } from '@/lib/create-app.js';
import { DEMO_MODE_DISABLED_MESSAGE } from '@/lib/demo-mode.js';
import { generateToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';

import type { UserWithoutPassword } from '@/types/auth.js';

vi.mock('@/queues/content-extraction.queue', () => ({
  enqueueContentExtraction: {
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
    on: vi.fn()
  }
}));

vi.mock('@/middlewares/rate-limit', () => ({
  createLinkRateLimit: async (_c: unknown, next: () => Promise<void>) => next()
}));

const { default: demoRouter } = await importWithEnv(
  { DEMO_MODE: 'true' },
  async () => import('./links.index.js')
);

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'links-demo@example.com',
  name: 'Demo User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function seedLink(repos: ReturnType<typeof createInMemoryRepos>) {
  return repos.links.create({
    author: null,
    content: null,
    excerpt: null,
    isArchived: false,
    isFavorite: false,
    isPaywalled: false,
    isRead: false,
    lastReadAt: null,
    priority: 'none',
    processingStatus: 'completed',
    publishedAt: null,
    readingProgress: 0,
    readingTime: 5,
    textContent: null,
    timeSpentReading: 0,
    title: 'Demo article',
    url: 'https://example.com/demo-article',
    userId: TEST_USER.id
  });
}

async function buildClient() {
  const repos = createInMemoryRepos();
  repos.auth.findById = async (id) => (id === TEST_USER.id ? TEST_USER : null);
  const link = await seedLink(repos);
  const authCookie = `token=${await generateToken(TEST_USER.id, TEST_USER.email)}`;

  const client = testClient(
    createTestApp(demoRouter, (app) => {
      app.use('*', async (c, next) => {
        c.set('repos', repos);
        return next();
      });
    })
  );

  return { authCookie, client, linkId: link!.id };
}

let authCookie: string;
let client: Awaited<ReturnType<typeof buildClient>>['client'];
let linkId: string;

beforeEach(async () => {
  const built = await buildClient();
  authCookie = built.authCookie;
  client = built.client;
  linkId = built.linkId;
});

describe('links routes in demo mode', () => {
  it('blocks link mutations', async () => {
    const create = await client.links.$post(
      { json: { url: 'https://example.com/new-demo-link' } },
      { headers: { Cookie: authCookie } }
    );
    expect(create.status).toBe(HttpStatus.FORBIDDEN);

    const update = await client.links[':id'].$patch(
      { param: { id: linkId }, json: { isFavorite: true } },
      { headers: { Cookie: authCookie } }
    );
    expect(update.status).toBe(HttpStatus.FORBIDDEN);

    const deleteLink = await client.links[':id'].$delete(
      { param: { id: linkId } },
      { headers: { Cookie: authCookie } }
    );
    expect(deleteLink.status).toBe(HttpStatus.FORBIDDEN);

    const refetch = await client.links.refetch[':id'].$post(
      { param: { id: linkId } },
      { headers: { Cookie: authCookie } }
    );
    expect(refetch.status).toBe(HttpStatus.FORBIDDEN);

    const updateTags = await client.links[':id'].tags.$put(
      {
        param: { id: linkId },
        json: { tags: [{ id: 'tag-1', name: 'Demo', groupId: 'group-1' }] }
      },
      { headers: { Cookie: authCookie } }
    );
    expect(updateTags.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('keeps reads available', async () => {
    const list = await client.links.$get({ query: {} }, { headers: { Cookie: authCookie } });
    expect(list.status).toBe(HttpStatus.OK);

    const byId = await client.links[':id'].$get(
      { param: { id: linkId } },
      { headers: { Cookie: authCookie } }
    );
    expect(byId.status).toBe(HttpStatus.OK);

    const upcoming = await client.links[':id'].upcoming.$get(
      { param: { id: linkId } },
      { headers: { Cookie: authCookie } }
    );
    expect(upcoming.status).toBe(HttpStatus.OK);

    const search = await client.search.$get(
      { query: { q: 'demo' } },
      { headers: { Cookie: authCookie } }
    );
    expect(search.status).toBe(HttpStatus.OK);
  });

  it('returns the canonical demo message for create', async () => {
    const response = await client.links.$post(
      { json: { url: 'https://example.com/blocked-demo-link' } },
      { headers: { Cookie: authCookie } }
    );

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    const json = await response.json();
    expect(json.message).toBe(DEMO_MODE_DISABLED_MESSAGE);
  });
});
