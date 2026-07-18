import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importWithEnv } from '@/tests/env.js';

let csvImportJobHandler:
  | ((job: {
      data: {
        fieldMapping: {
          tags?: string;
          timeAdded?: string;
          title?: string;
          url: string;
        };
        filePath: string;
        importSessionId: string;
        tagName: string;
        userId: string;
      };
      id: string;
      updateProgress: ReturnType<typeof vi.fn>;
    }) => Promise<{
      failedCount: number;
      importedCount: number;
      skippedCount: number;
      status: string;
    }>)
  | undefined;

const createWorkerMock = vi.hoisted(() =>
  vi.fn((name: string, jobHandler: unknown) => {
    if (name === 'csv-import') {
      csvImportJobHandler = jobHandler as typeof csvImportJobHandler;
    }

    return { on: vi.fn() };
  })
);

const enqueueContentExtractionMock = vi.hoisted(() => ({
  add: vi.fn(),
  on: vi.fn()
}));

const enqueueCsvImportMock = vi.hoisted(() => ({
  add: vi.fn(),
  on: vi.fn()
}));

const linksAdapterMock = vi.hoisted(() => ({
  create: vi.fn(),
  findAllUrls: vi.fn()
}));

const importSessionsAdapterMock = vi.hoisted(() => ({
  findByIdOrThrow: vi.fn(),
  findPendingLinksInSession: vi.fn(),
  incrementCounts: vi.fn(),
  updateExtractionStatus: vi.fn(),
  updateStatus: vi.fn()
}));

const tagsAdapterMock = vi.hoisted(() => ({
  addTagsToLink: vi.fn(),
  createGroup: vi.fn(),
  createTag: vi.fn(),
  findGroupByName: vi.fn(),
  findTagsByUserId: vi.fn()
}));

vi.mock('@/db/index.js', () => ({ db: {} }));

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

vi.mock('@/queues/csv-import.queue.js', () => ({
  enqueueCsvImport: enqueueCsvImportMock
}));

vi.mock('@/repositories/import-sessions.repository.js', () => ({
  createDrizzleImportSessionsAdapter: vi.fn(() => importSessionsAdapterMock)
}));

vi.mock('@/repositories/links.repository.js', () => ({
  createDrizzleLinksAdapter: vi.fn(() => linksAdapterMock)
}));

vi.mock('@/repositories/tags.repository.js', () => ({
  createDrizzleTagsAdapter: vi.fn(() => tagsAdapterMock)
}));

await importWithEnv({ DEMO_MODE: 'true' }, async () => import('./csv-import.worker.js'));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('csv import worker in demo mode', () => {
  it('skips mutating work and follow-up extraction queueing', async () => {
    expect(csvImportJobHandler).toBeDefined();

    const updateProgress = vi.fn();
    const result = await csvImportJobHandler!({
      data: {
        fieldMapping: { url: 'url' },
        filePath: '/tmp/demo.csv',
        importSessionId: 'session-1',
        tagName: 'Imported from CSV',
        userId: 'user-1'
      },
      id: 'job-1',
      updateProgress
    });

    expect(result).toEqual({
      failedCount: 0,
      importedCount: 0,
      skippedCount: 0,
      status: 'skipped'
    });
    expect(updateProgress).not.toHaveBeenCalled();
    expect(importSessionsAdapterMock.updateStatus).not.toHaveBeenCalled();
    expect(importSessionsAdapterMock.findByIdOrThrow).not.toHaveBeenCalled();
    expect(importSessionsAdapterMock.findPendingLinksInSession).not.toHaveBeenCalled();
    expect(importSessionsAdapterMock.incrementCounts).not.toHaveBeenCalled();
    expect(importSessionsAdapterMock.updateExtractionStatus).not.toHaveBeenCalled();
    expect(linksAdapterMock.findAllUrls).not.toHaveBeenCalled();
    expect(linksAdapterMock.create).not.toHaveBeenCalled();
    expect(tagsAdapterMock.findGroupByName).not.toHaveBeenCalled();
    expect(tagsAdapterMock.createGroup).not.toHaveBeenCalled();
    expect(tagsAdapterMock.findTagsByUserId).not.toHaveBeenCalled();
    expect(tagsAdapterMock.createTag).not.toHaveBeenCalled();
    expect(tagsAdapterMock.addTagsToLink).not.toHaveBeenCalled();
    expect(enqueueContentExtractionMock.add).not.toHaveBeenCalled();
    expect(enqueueCsvImportMock.add).not.toHaveBeenCalled();
  });
});
