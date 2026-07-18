import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importWithEnv } from '@/tests/env.js';

let contentExtractionJobHandler:
  | ((job: {
      data: {
        linkId: string;
        importSessionId?: string;
        url: string;
        user: { id: string };
      };
      id: string;
      updateProgress: ReturnType<typeof vi.fn>;
    }) => Promise<{ status: string }>)
  | undefined;

const createWorkerMock = vi.hoisted(() =>
  vi.fn((name: string, jobHandler: unknown) => {
    if (name === 'content-extraction') {
      contentExtractionJobHandler = jobHandler as typeof contentExtractionJobHandler;
    }

    return { on: vi.fn() };
  })
);

const enqueueContentExtractionMock = vi.hoisted(() => ({
  add: vi.fn(),
  on: vi.fn()
}));

const linksAdapterMock = vi.hoisted(() => ({
  findById: vi.fn(),
  update: vi.fn()
}));

const importSessionsAdapterMock = vi.hoisted(() => ({
  incrementExtractionCounts: vi.fn(),
  findPendingLinksInSession: vi.fn(),
  updateExtractionStatus: vi.fn()
}));

vi.mock('@/db/index.js', () => ({ db: {} }));

vi.mock('@/index.js', () => ({ getIsShuttingDown: vi.fn(() => false) }));

vi.mock('@/lib/job-queue.js', () => ({
  createWorker: createWorkerMock,
  createQueue: vi.fn(() => ({
    add: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    upsertJobScheduler: vi.fn()
  }))
}));

vi.mock('@/queues/content-extraction.queue.js', () => ({
  enqueueContentExtraction: enqueueContentExtractionMock
}));

vi.mock('@/repositories/import-sessions.repository.js', () => ({
  createDrizzleImportSessionsAdapter: vi.fn(() => importSessionsAdapterMock)
}));

vi.mock('@/repositories/links.repository.js', () => ({
  createDrizzleLinksAdapter: vi.fn(() => linksAdapterMock)
}));

await importWithEnv({ DEMO_MODE: 'true' }, async () => import('./content-extraction.worker.js'));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('content extraction worker in demo mode', () => {
  it('skips expensive work and queueing', async () => {
    expect(contentExtractionJobHandler).toBeDefined();

    const updateProgress = vi.fn();
    const result = await contentExtractionJobHandler!({
      data: {
        linkId: 'link-1',
        url: 'https://example.com/article',
        user: { id: 'user-1' }
      },
      id: 'job-1',
      updateProgress
    });

    expect(result).toEqual({ status: 'skipped' });
    expect(updateProgress).not.toHaveBeenCalled();
    expect(linksAdapterMock.findById).not.toHaveBeenCalled();
    expect(linksAdapterMock.update).not.toHaveBeenCalled();
    expect(importSessionsAdapterMock.findPendingLinksInSession).not.toHaveBeenCalled();
    expect(importSessionsAdapterMock.incrementExtractionCounts).not.toHaveBeenCalled();
    expect(importSessionsAdapterMock.updateExtractionStatus).not.toHaveBeenCalled();
    expect(enqueueContentExtractionMock.add).not.toHaveBeenCalled();
  });
});
