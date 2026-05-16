import { testClient } from 'hono/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { createInMemoryRepos } from '@/tests/in-memory/index.js';

import { createTestApp } from '@/lib/create-app.js';
import { generateToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';

import type { UserWithoutPassword } from '@/types/auth.js';

import router from './highlights.index.js';

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'highlights-test@example.com',
  name: 'Test User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const TEST_LINK_ID = '00000000-0000-0000-0000-000000000010';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

const authCookie = `token=${await generateToken(TEST_USER.id, TEST_USER.email)}`;

function buildClient() {
  const repos = createInMemoryRepos();

  // Auth middleware resolves the JWT user ID via findById.
  repos.auth.findById = async (id) => (id === TEST_USER.id ? TEST_USER : null);

  // Highlights routes check link existence via links.findById before operating.
  // The links router is not mounted here, so we stub the known test link.
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

describe('highlights routes', () => {
  describe('POST /api/highlights', () => {
    it('returns 401 without auth', async () => {
      const response = await client.highlights[':linkId'].$post({
        param: { linkId: TEST_LINK_ID },
        json: {
          color: 'yellow',
          endOffset: 50,
          startOffset: 0,
          text: 'hello'
        }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown linkId', async () => {
      const response = await client.highlights[':linkId'].$post(
        {
          param: { linkId: UNKNOWN_ID },
          json: {
            color: 'yellow',
            endOffset: 50,

            startOffset: 0,
            text: 'hello'
          }
        },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('creates a highlight and returns it', async () => {
      const response = await client.highlights[':linkId'].$post(
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
      expect(response.status).toBe(HttpStatus.CREATED);
      if (response.status === HttpStatus.CREATED) {
        const json = await response.json();
        expect(json.result.text).toBe('selected text');
        expect(json.result.color).toBe('yellow');
        expect(json.result.note).toBe('interesting point');
        expect(json.result.startOffset).toBe(10);
        expect(json.result.endOffset).toBe(50);
      }
    });
  });

  describe('GET /api/highlights/link/:linkId', () => {
    it('returns 401 without auth', async () => {
      const response = await client.highlights.link[':linkId'].$get({
        param: { linkId: TEST_LINK_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown linkId', async () => {
      const response = await client.highlights.link[':linkId'].$get(
        { param: { linkId: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns highlights for the link', async () => {
      await client.highlights[':linkId'].$post(
        {
          param: { linkId: TEST_LINK_ID },
          json: {
            color: 'yellow',
            endOffset: 50,
            startOffset: 10,
            text: 'selected text'
          }
        },
        { headers: { Cookie: authCookie } }
      );

      const response = await client.highlights.link[':linkId'].$get(
        { param: { linkId: TEST_LINK_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(Array.isArray(json.result)).toBe(true);
        expect(json.result.length).toBe(1);
        expect(json.result[0]?.text).toBe('selected text');
      }
    });
  });

  describe('PUT /api/highlights/:id', () => {
    let highlightId: string;

    beforeEach(async () => {
      const created = await client.highlights[':linkId'].$post(
        {
          param: { linkId: TEST_LINK_ID },
          json: {
            color: 'yellow',
            endOffset: 50,
            startOffset: 10,
            text: 'selected text'
          }
        },
        { headers: { Cookie: authCookie } }
      );
      if (created.status === HttpStatus.CREATED) {
        const body = await created.json();
        highlightId = (body.result as unknown as { id: string }).id;
      }
    });

    it('returns 401 without auth', async () => {
      const response = await client.highlights[':id'].$put({
        param: { id: highlightId },
        json: { color: 'blue' }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown highlight id', async () => {
      const response = await client.highlights[':id'].$put(
        { param: { id: UNKNOWN_ID }, json: { color: 'blue' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('updates color and note', async () => {
      const response = await client.highlights[':id'].$put(
        { param: { id: highlightId }, json: { color: 'blue', note: 'updated note' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.color).toBe('blue');
        expect(json.result.note).toBe('updated note');
      }
    });
  });

  describe('DELETE /api/highlights/:id', () => {
    let highlightId: string;

    beforeEach(async () => {
      const created = await client.highlights[':linkId'].$post(
        {
          param: { linkId: TEST_LINK_ID },
          json: {
            color: 'yellow',
            endOffset: 50,
            startOffset: 10,
            text: 'selected text'
          }
        },
        { headers: { Cookie: authCookie } }
      );
      if (created.status === HttpStatus.CREATED) {
        const body = await created.json();
        highlightId = (body.result as unknown as { id: string }).id;
      }
    });

    it('returns 401 without auth', async () => {
      const response = await client.highlights[':id'].$delete({
        param: { id: highlightId }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown highlight id', async () => {
      const response = await client.highlights[':id'].$delete(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('deletes the highlight', async () => {
      const response = await client.highlights[':id'].$delete(
        { param: { id: highlightId } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect((json.result as unknown as { id: string }).id).toBe(highlightId);
      }
    });

    it('returns empty list after deletion', async () => {
      await client.highlights[':id'].$delete(
        { param: { id: highlightId } },
        { headers: { Cookie: authCookie } }
      );

      const response = await client.highlights.link[':linkId'].$get(
        { param: { linkId: TEST_LINK_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.length).toBe(0);
      }
    });
  });
});
