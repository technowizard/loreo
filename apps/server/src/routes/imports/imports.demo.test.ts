import { promises as fs } from 'node:fs';
import path from 'node:path';

import { testClient } from 'hono/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { importWithEnv } from '@/tests/env.js';
import { createInMemoryAuthAdapter } from '@/tests/in-memory/auth.js';
import { createInMemoryHighlightsAdapter } from '@/tests/in-memory/highlights.js';
import { createInMemoryImportSessionsAdapter } from '@/tests/in-memory/import-sessions.js';
import { createInMemoryLinksAdapter } from '@/tests/in-memory/links.js';
import { createInMemoryTagsAdapter } from '@/tests/in-memory/tags.js';
import { authCookieFor, makeTestUser } from '@/tests/route-harness.js';

import { createTestApp } from '@/lib/create-app.js';
import { DEMO_MODE_DISABLED_MESSAGE } from '@/lib/demo-mode.js';
import { HttpStatus } from '@/lib/response.js';
import type { Repos } from '@/lib/types.js';

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

const { default: demoRouter } = await importWithEnv(
  { DEMO_MODE: 'true' },
  async () => import('./imports.index.js')
);

const TEST_USER = makeTestUser({ email: 'imports-demo@example.com' });
const SESSION_ID = '00000000-0000-0000-0000-000000000010';

const TEST_CSV_ID = `demo-imports-${Date.now()}`;
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

  authAdapter.findById = async (id) => (id === TEST_USER.id ? TEST_USER : null);

  const repos: Repos = {
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

  return { client, seedSession: importSessionsAdapter.seedSession };
}

let client: ReturnType<typeof buildClient>['client'];
let seedSession: ReturnType<typeof buildClient>['seedSession'];
const authCookie = await authCookieFor(TEST_USER);

beforeEach(() => {
  const built = buildClient();
  client = built.client;
  seedSession = built.seedSession;
});

describe('imports routes in demo mode', () => {
  it('blocks import mutations and queueing paths', async () => {
    const upload = await client.imports.upload.$post(
      {
        form: {
          file: new File([TEST_CSV_CONTENT], 'links.csv', { type: 'text/csv' })
        }
      },
      { headers: { Cookie: authCookie } }
    );
    expect(upload.status).toBe(HttpStatus.FORBIDDEN);

    const preview = await client.imports.preview.$post(
      {
        json: { fileId: TEST_CSV_ID, mapping: { url: 'url', title: 'title' } }
      },
      { headers: { Cookie: authCookie } }
    );
    expect(preview.status).toBe(HttpStatus.FORBIDDEN);

    const execute = await client.imports.execute.$post(
      { json: { fileId: TEST_CSV_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(execute.status).toBe(HttpStatus.FORBIDDEN);

    const cancel = await client.imports.sessions[':id'].cancel.$post(
      { param: { id: SESSION_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(cancel.status).toBe(HttpStatus.FORBIDDEN);

    const deleteSession = await client.imports.sessions[':id'].$delete(
      { param: { id: SESSION_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(deleteSession.status).toBe(HttpStatus.FORBIDDEN);

    const resume = await client.imports.sessions[':id'].resume.$post(
      { param: { id: SESSION_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(resume.status).toBe(HttpStatus.FORBIDDEN);

    const retry = await client.imports.sessions[':id']['retry-failed'].$post(
      { param: { id: SESSION_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(retry.status).toBe(HttpStatus.FORBIDDEN);

    const cleanup = await client.imports.cleanup.$post(
      { json: { daysOld: 30 } },
      { headers: { Cookie: authCookie } }
    );
    expect(cleanup.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('keeps import reads available', async () => {
    seedSession(SESSION_ID, TEST_USER.id, {
      filename: 'demo.csv',
      totalRows: 2
    });

    const sessions = await client.imports.sessions.$get(
      { query: {} },
      { headers: { Cookie: authCookie } }
    );
    expect(sessions.status).toBe(HttpStatus.OK);

    const session = await client.imports.sessions[':id'].$get(
      { param: { id: SESSION_ID } },
      { headers: { Cookie: authCookie } }
    );
    expect(session.status).toBe(HttpStatus.OK);

    const status = await client.imports.status[':jobId'].$get(
      { param: { jobId: 'job-1' } },
      { headers: { Cookie: authCookie } }
    );
    expect(status.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('returns the canonical demo message for upload', async () => {
    const response = await client.imports.upload.$post(
      {
        form: {
          file: new File([TEST_CSV_CONTENT], 'links.csv', { type: 'text/csv' })
        }
      },
      { headers: { Cookie: authCookie } }
    );

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    const json = await response.json();
    expect(json.message).toBe(DEMO_MODE_DISABLED_MESSAGE);
  });
});
