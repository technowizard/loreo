import { promises as fs } from 'node:fs';
import path from 'node:path';

import { testClient } from 'hono/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

import router from './imports.index.js';

vi.mock('@/queues/csv-import.queue', () => ({
  enqueueCsvImport: {
    add: vi.fn().mockResolvedValue({ id: 'mock-csv-job-id' }),
    getJob: vi.fn().mockResolvedValue(null),
    on: vi.fn()
  }
}));

vi.mock('@/queues/content-extraction.queue', () => ({
  enqueueContentExtraction: {
    add: vi.fn().mockResolvedValue({ id: 'mock-extraction-job-id' }),
    on: vi.fn()
  }
}));

vi.mock('@/middlewares/rate-limit', () => ({
  importUploadRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  importPreviewRateLimit: async (_c: unknown, next: () => Promise<void>) => next(),
  importExecuteRateLimit: async (_c: unknown, next: () => Promise<void>) => next()
}));

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'imports-test@example.com',
  name: 'Test User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const ADMIN_USER: UserWithoutPassword = {
  ...TEST_USER,
  id: '00000000-0000-0000-0000-000000000002',
  email: 'admin-imports-test@example.com',
  role: 'admin'
};

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';
const SESSION_ID = '00000000-0000-0000-0000-000000000010';

const authCookie = `token=${await generateToken(TEST_USER.id, TEST_USER.email)}`;
const adminCookie = `token=${await generateToken(ADMIN_USER.id, ADMIN_USER.email)}`;

// A real temp CSV file used by execute/preview tests
const TEST_CSV_ID = `test-imports-${Date.now()}`;
const TEST_CSV_PATH = path.resolve('/tmp', `import_${TEST_CSV_ID}.csv`);
const TEST_CSV_CONTENT =
  'url,title\nhttps://example.com/a,Article A\nhttps://example.com/b,Article B';

beforeAll(async () => {
  await fs.writeFile(TEST_CSV_PATH, TEST_CSV_CONTENT, 'utf8');
});

afterAll(async () => {
  await fs.unlink(TEST_CSV_PATH).catch(() => {});
});

function buildClient() {
  const importSessionsAdapter = createInMemoryImportSessionsAdapter();
  const tagsAdapter = createInMemoryTagsAdapter();
  const authAdapter = createInMemoryAuthAdapter();

  authAdapter.findById = async (id) => {
    if (id === TEST_USER.id) return TEST_USER;
    if (id === ADMIN_USER.id) return ADMIN_USER;
    return null;
  };

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

  return { client, seedSession: importSessionsAdapter.seedSession };
}

let client: ReturnType<typeof buildClient>['client'];
let seedSession: ReturnType<typeof buildClient>['seedSession'];

beforeEach(() => {
  const built = buildClient();
  client = built.client;
  seedSession = built.seedSession;
});

describe('imports routes', () => {
  describe('POST /api/imports/upload', () => {
    it('returns 401 without auth', async () => {
      const formData = new FormData();
      formData.append('file', new File(['url,title'], 'test.csv', { type: 'text/csv' }));
      const response = await client.imports.upload.$post({
        form: { file: formData.get('file') as File }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('uploads a valid CSV and returns file metadata', async () => {
      const file = new File([TEST_CSV_CONTENT], 'links.csv', { type: 'text/csv' });
      const response = await client.imports.upload.$post(
        { form: { file } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.filename).toBe('links.csv');
        expect(json.result.columns).toContain('url');
        expect(json.result.rowCount).toBe(2);
        expect(json.result.fileId).toBeTruthy();
        // cleanup file written by handler
        await fs.unlink(path.resolve('/tmp', `import_${json.result.fileId}.csv`)).catch(() => {});
      }
    });
  });

  describe('POST /api/imports/preview', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.preview.$post({
        json: { fileId: TEST_CSV_ID, mapping: { url: 'url', title: 'title' } }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown fileId', async () => {
      const response = await client.imports.preview.$post(
        { json: { fileId: 'nonexistent-file-id', mapping: { url: 'url', title: 'title' } } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns preview rows for a valid CSV file', async () => {
      const response = await client.imports.preview.$post(
        { json: { fileId: TEST_CSV_ID, mapping: { url: 'url', title: 'title' } } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.totalRows).toBe(2);
        expect(Array.isArray(json.result.preview)).toBe(true);
        expect(json.result.preview[0]?.url).toBe('https://example.com/a');
        expect(json.result.preview[0]?.isValid).toBe(true);
      }
    });
  });

  describe('POST /api/imports/execute', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.execute.$post({
        json: { fileId: TEST_CSV_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown fileId', async () => {
      const response = await client.imports.execute.$post(
        { json: { fileId: 'nonexistent-file-id' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('queues an import job and returns session info', async () => {
      const response = await client.imports.execute.$post(
        { json: { fileId: TEST_CSV_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.ACCEPTED);
      if (response.status === HttpStatus.ACCEPTED) {
        const json = await response.json();
        expect(json.result.jobId).toBe('mock-csv-job-id');
        expect(json.result.importSessionId).toBeTruthy();
        expect(json.result.estimatedCount).toBe(2);
      }
    });
  });

  describe('GET /api/imports/status/:jobId', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.status[':jobId'].$get({
        param: { jobId: 'job-1' }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown job', async () => {
      const response = await client.imports.status[':jobId'].$get(
        { param: { jobId: 'nonexistent-job' } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /api/imports/sessions', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.sessions.$get({ query: {} });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns empty list when no sessions exist', async () => {
      const response = await client.imports.sessions.$get(
        { query: {} },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.items).toEqual([]);
        expect(json.result.hasMore).toBe(false);
      }
    });

    it('returns seeded sessions for the user', async () => {
      seedSession(SESSION_ID, TEST_USER.id, { filename: 'my-links.csv', totalRows: 10 });
      const response = await client.imports.sessions.$get(
        { query: {} },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.items.length).toBe(1);
        expect(json.result.items[0]?.filename).toBe('my-links.csv');
        expect(json.result.items[0]?.totalRows).toBe(10);
      }
    });
  });

  describe('GET /api/imports/sessions/:id', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.sessions[':id'].$get({ param: { id: UNKNOWN_ID } });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown session', async () => {
      const response = await client.imports.sessions[':id'].$get(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns session details', async () => {
      seedSession(SESSION_ID, TEST_USER.id, { filename: 'details.csv', totalRows: 5 });
      const response = await client.imports.sessions[':id'].$get(
        { param: { id: SESSION_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.id).toBe(SESSION_ID);
        expect(json.result.filename).toBe('details.csv');
        expect(json.result.status).toBe('pending');
      }
    });
  });

  describe('POST /api/imports/sessions/:id/cancel', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.sessions[':id'].cancel.$post({
        param: { id: UNKNOWN_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown session', async () => {
      const response = await client.imports.sessions[':id'].cancel.$post(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('cancels a session and returns linksReset count', async () => {
      seedSession(SESSION_ID, TEST_USER.id, { status: 'processing' });
      const response = await client.imports.sessions[':id'].cancel.$post(
        { param: { id: SESSION_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.linksReset).toBe(0);
        expect(typeof json.result.message).toBe('string');
      }
    });
  });

  describe('DELETE /api/imports/sessions/:id', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.sessions[':id'].$delete({
        param: { id: UNKNOWN_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown session', async () => {
      const response = await client.imports.sessions[':id'].$delete(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns 400 when session is processing', async () => {
      seedSession(SESSION_ID, TEST_USER.id, { status: 'processing' });
      const response = await client.imports.sessions[':id'].$delete(
        { param: { id: SESSION_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('deletes a completed session', async () => {
      seedSession(SESSION_ID, TEST_USER.id, { status: 'completed' });
      const response = await client.imports.sessions[':id'].$delete(
        { param: { id: SESSION_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  describe('POST /api/imports/sessions/:id/resume', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.sessions[':id'].resume.$post({
        param: { id: UNKNOWN_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown session', async () => {
      const response = await client.imports.sessions[':id'].resume.$post(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns 400 for a session that cannot be resumed', async () => {
      // Sessions with status 'pending' or 'completed' cannot be resumed
      seedSession(SESSION_ID, TEST_USER.id, { status: 'completed' });
      const response = await client.imports.sessions[':id'].resume.$post(
        { param: { id: SESSION_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 for cancelled session with no pending links', async () => {
      seedSession(SESSION_ID, TEST_USER.id, { status: 'cancelled' });
      const response = await client.imports.sessions[':id'].resume.$post(
        { param: { id: SESSION_ID } },
        { headers: { Cookie: authCookie } }
      );
      // countBySession returns 0 pending → "No pending links to resume"
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/imports/sessions/:id/links', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.sessions[':id'].links.$get({
        param: { id: UNKNOWN_ID },
        query: {}
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown session', async () => {
      const response = await client.imports.sessions[':id'].links.$get(
        { param: { id: UNKNOWN_ID }, query: {} },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns empty links list for a session with no links', async () => {
      seedSession(SESSION_ID, TEST_USER.id);
      const response = await client.imports.sessions[':id'].links.$get(
        { param: { id: SESSION_ID }, query: {} },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.items).toEqual([]);
        expect(json.result.hasMore).toBe(false);
      }
    });
  });

  describe('POST /api/imports/sessions/:id/retry-failed', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.sessions[':id']['retry-failed'].$post({
        param: { id: UNKNOWN_ID }
      });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 404 for unknown session', async () => {
      const response = await client.imports.sessions[':id']['retry-failed'].$post(
        { param: { id: UNKNOWN_ID } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns 200 with session id when no failed links exist', async () => {
      seedSession(SESSION_ID, TEST_USER.id, { status: 'completed' });
      const response = await client.imports.sessions[':id']['retry-failed'].$post(
        { param: { id: SESSION_ID } },
        { headers: { Cookie: authCookie } }
      );
      // retryFailedLinks returns [] in the in-memory adapter → "No failed links to retry"
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.id).toBe(SESSION_ID);
      }
    });
  });

  describe('POST /api/imports/cleanup', () => {
    it('returns 401 without auth', async () => {
      const response = await client.imports.cleanup.$post({ json: { daysOld: 90 } });
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 403 for non-admin user', async () => {
      const response = await client.imports.cleanup.$post(
        { json: { daysOld: 90 } },
        { headers: { Cookie: authCookie } }
      );
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('returns 400 for out-of-range daysOld', async () => {
      const response = await client.imports.cleanup.$post(
        { json: { daysOld: 10 } },
        { headers: { Cookie: adminCookie } }
      );
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('runs cleanup and returns counts', async () => {
      const response = await client.imports.cleanup.$post(
        { json: { daysOld: 90 } },
        { headers: { Cookie: adminCookie } }
      );
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const json = await response.json();
        expect(json.result.sessionsDeleted).toBe(0);
        expect(json.result.linksDeleted).toBe(0);
        expect(typeof json.result.message).toBe('string');
      }
    });
  });
});
