import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
import type { Tag } from '@/types/tags.js';

import router from './links.index.js';

vi.mock('@/queues/content-extraction.queue', () => ({
  enqueueContentExtraction: {
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
    on: vi.fn()
  }
}));

vi.mock('@/middlewares/rate-limit', () => ({
  createLinkRateLimit: async (_c: unknown, next: () => Promise<void>) => next()
}));

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'links-test@example.com',
  name: 'Test User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

const authCookie = `token=${await generateToken(TEST_USER.id, TEST_USER.email)}`;

function buildClient() {
  const tagLinkRelations = new Map<string, Tag[]>();
  const tagsAdapter = createInMemoryTagsAdapter(tagLinkRelations);
  const authAdapter = createInMemoryAuthAdapter();
  const importSessionsAdapter = createInMemoryImportSessionsAdapter();

  // The auth middleware resolves the JWT user ID via findById.
  // Override to return TEST_USER for requests authenticated with authCookie.
  authAdapter.findById = async (id) => (id === TEST_USER.id ? TEST_USER : null);

  const repos: Repos = {
    auth: authAdapter,
    highlights: createInMemoryHighlightsAdapter(),
    importSessions: importSessionsAdapter.repo,
    links: createInMemoryLinksAdapter(tagLinkRelations),
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

  return { client, seedTag: tagsAdapter.seedTag };
}

let client: ReturnType<typeof buildClient>['client'];
let seedTag: ReturnType<typeof buildClient>['seedTag'];

beforeEach(() => {
  const built = buildClient();
  client = built.client;
  seedTag = built.seedTag;
});

// Helper: create a link via the API and return its id
async function createLink(url: string): Promise<string> {
  const response = await client.links.$post({ json: { url } }, { headers: { Cookie: authCookie } });
  if (response.status !== HttpStatus.ACCEPTED)
    throw new Error(`createLink failed: ${response.status}`);
  const json = await response.json();
  return json.result.id;
}

const UNKNOWN_URL_COUNTER = { n: 0 };
function uniqueUrl() {
  return `https://example.com/article-${++UNKNOWN_URL_COUNTER.n}-${crypto.randomUUID()}`;
}

describe('links routes', () => {
  describe('GET /api/links', () => {
    it('returns 401 without auth', async () => {
      const response = await client.links.$get({ query: {} });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns links with pagination metadata', async () => {
      await createLink('https://example.com/typescript-guide');
      const response = await client.links.$get({ query: {} }, { headers: { Cookie: authCookie } });
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(Array.isArray(json.result)).toBe(true);
        expect(json.result.length).toBeGreaterThanOrEqual(1);
        expect(json).toHaveProperty('pagination');
      }
    });

    it('filters by favorite', async () => {
      const favId = await createLink('https://example.com/fav-article');
      await client.links[':id'].$patch(
        { param: { id: favId }, json: { isFavorite: true } },
        { headers: { Cookie: authCookie } }
      );
      await createLink('https://example.com/normal-article');

      const response = await client.links.$get(
        { query: { filter: 'favorites' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.every((l: { isFavorite: boolean }) => l.isFavorite)).toBe(true);
      }
    });
  });

  describe('GET /api/links/:id', () => {
    it('returns 401 without auth', async () => {
      const response = await client.links[':id'].$get({
        param: { id: UNKNOWN_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown id', async () => {
      const response = await client.links[':id'].$get(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns link with tags and highlights', async () => {
      const id = await createLink('https://example.com/typescript-guide');
      const response = await client.links[':id'].$get(
        { param: { id } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.id).toBe(id);
      }
    });
  });

  describe('GET /api/links/:id/upcoming', () => {
    it('returns 401 without auth', async () => {
      const response = await client.links[':id'].upcoming.$get({
        param: { id: UNKNOWN_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns upcoming articles array', async () => {
      const id = await createLink(uniqueUrl());
      const response = await client.links[':id'].upcoming.$get(
        { param: { id } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(Array.isArray(json.result)).toBe(true);
      }
    });
  });

  describe('POST /api/links', () => {
    it('returns 401 without auth', async () => {
      const response = await client.links.$post({
        json: { url: 'https://new.example.com' }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('rejects localhost URLs before enqueueing', async () => {
      const response = await client.links.$post(
        { json: { url: 'http://127.0.0.1:3000/internal' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('rejects private network URLs before enqueueing', async () => {
      const response = await client.links.$post(
        { json: { url: 'http://localhost/internal' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('returns 409 for duplicate URL', async () => {
      const url = 'https://example.com/typescript-guide';
      await createLink(url);
      const response = await client.links.$post(
        { json: { url } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.CONFLICT);
    });

    it('accepts a new URL and enqueues extraction', async () => {
      const response = await client.links.$post(
        { json: { url: 'https://example.com/new-article/post' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.ACCEPTED);
      if (response.status === HttpStatus.ACCEPTED) {
        const json = await response.json();
        expect(json.result.url).toBe('https://example.com/new-article/post');
        expect(json.result.id).toBeTruthy();
      }
    });
  });

  describe('PATCH /api/links/:id', () => {
    it('returns 401 without auth', async () => {
      const response = await client.links[':id'].$patch({
        param: { id: UNKNOWN_ID },
        json: { isFavorite: true }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown id', async () => {
      const response = await client.links[':id'].$patch(
        { param: { id: UNKNOWN_ID }, json: { isFavorite: true } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns 400 for invalid reading progress', async () => {
      const id = await createLink(uniqueUrl());
      const response = await client.links[':id'].$patch(
        { param: { id }, json: { readingProgress: 150 } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('marks as favorite', async () => {
      const id = await createLink(uniqueUrl());
      const response = await client.links[':id'].$patch(
        { param: { id }, json: { isFavorite: true } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.isFavorite).toBe(true);
      }
    });

    it('marks as read and sets lastReadAt', async () => {
      const id = await createLink(uniqueUrl());
      const response = await client.links[':id'].$patch(
        { param: { id }, json: { isRead: true } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.isRead).toBe(true);
        expect(json.result.lastReadAt).not.toBeNull();
      }
    });
  });

  describe('POST /api/links/refetch/:id', () => {
    it('returns 401 without auth', async () => {
      const response = await client.links.refetch[':id'].$post({
        param: { id: UNKNOWN_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown id', async () => {
      const response = await client.links.refetch[':id'].$post(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('resets status to pending and enqueues job', async () => {
      const id = await createLink(uniqueUrl());
      const response = await client.links.refetch[':id'].$post(
        { param: { id } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.ACCEPTED);
      if (response.status === HttpStatus.ACCEPTED) {
        const json = await response.json();
        expect(json.result.processingStatus).toBe('pending');
      }
    });
  });

  describe('GET /api/search', () => {
    it('returns 401 without auth', async () => {
      const response = await client.search.$get({ query: { q: 'typescript' } });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns matching links', async () => {
      await createLink('https://example.com/typescript-article');
      await createLink('https://example.com/react-guide');

      const response = await client.search.$get(
        { query: { q: 'typescript' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(Array.isArray(json.result)).toBe(true);
        expect(
          json.result.some((l: { url: string }) => l.url.toLowerCase().includes('typescript'))
        ).toBe(true);
      }
    });
  });

  describe('PUT /api/links/:id/tags', () => {
    const tagId = '00000000-0000-0000-0000-000000000100';
    const tagGroupId = '00000000-0000-0000-0000-000000000200';

    it('returns 401 without auth', async () => {
      const response = await client.links[':id'].tags.$put({
        param: { id: UNKNOWN_ID },
        json: { tags: [] }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown link', async () => {
      const response = await client.links[':id'].tags.$put(
        { param: { id: UNKNOWN_ID }, json: { tags: [] } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('replaces tags on link', async () => {
      const id = await createLink(uniqueUrl());
      seedTag(tagId, tagGroupId, 'TypeScript');

      const response = await client.links[':id'].tags.$put(
        {
          param: { id },
          json: {
            tags: [{ id: tagId, name: 'TypeScript', groupId: tagGroupId }]
          }
        },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.some((t: { name: string }) => t.name === 'TypeScript')).toBe(true);
      }
    });
  });

  describe('DELETE /api/links/:id', () => {
    it('returns 401 without auth', async () => {
      const response = await client.links[':id'].$delete({
        param: { id: UNKNOWN_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown id', async () => {
      const response = await client.links[':id'].$delete(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('deletes the link', async () => {
      const id = await createLink('https://example.com/delete-me');
      const response = await client.links[':id'].$delete(
        { param: { id } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.id).toBe(id);
      }
    });
  });
});
