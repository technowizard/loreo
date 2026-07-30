import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { importWithEnv } from '@/tests/env.js';

let contentExtractionJobHandler:
  | ((job: {
      data: {
        importSessionId?: string;
        linkId: string;
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

const browserServiceMock = vi.hoisted(() => ({
  crawlPage: vi.fn()
}));

const contentExtractionServiceMock = vi.hoisted(() => ({
  extractMetadata: vi.fn(),
  extractReadableContent: vi.fn()
}));

const markdownServiceMock = vi.hoisted(() => ({
  convertToMarkdown: vi.fn()
}));

const storageServiceMock = vi.hoisted(() => ({
  uploadImageFromUrl: vi.fn()
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

vi.mock('@/services/browser.service.js', () => ({ browserService: browserServiceMock }));
vi.mock('@/services/content-extraction.service.js', () => ({
  contentExtractionService: contentExtractionServiceMock
}));
vi.mock('@/services/markdown.service.js', () => ({ markdownService: markdownServiceMock }));
vi.mock('@/services/storage.service.js', () => ({ storageService: storageServiceMock }));

await importWithEnv({ DEMO_MODE: 'false' }, async () => import('./content-extraction.worker.js'));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(globalThis, 'setTimeout');

  linksAdapterMock.findById.mockResolvedValue(
    makeLink({
      processingStartedAt: null,
      processingStatus: 'pending'
    })
  );
  linksAdapterMock.update.mockResolvedValue(null);
  browserServiceMock.crawlPage.mockResolvedValue({
    html: '<article><img src="/body.png"></article>',
    isPaywalled: false
  });
  contentExtractionServiceMock.extractMetadata.mockResolvedValue({
    author: 'Author',
    favicon: 'favicon.ico',
    image: 'https://example.com/cover.png',
    publishedDate: '2026-01-01',
    title: 'Article Title'
  });
  contentExtractionServiceMock.extractReadableContent.mockResolvedValue({
    author: 'Readable Author',
    content: '<article><img src="/body.png"></article>',
    excerpt: 'Excerpt',
    textContent: 'Text content',
    title: 'Readable Title'
  });
  markdownServiceMock.convertToMarkdown.mockReturnValue('Markdown content');
  storageServiceMock.uploadImageFromUrl
    .mockResolvedValueOnce({ key: 'user-user-1/articles/cover.png', url: 'https://cdn/cover.png' })
    .mockResolvedValueOnce({ key: 'user-user-1/articles/body.png', url: 'https://cdn/body.png' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeLink(overrides: Record<string, unknown> = {}) {
  return {
    author: null,
    content: null,
    coverImage: null,
    createdAt: new Date().toISOString(),
    errorMessage: null,
    excerpt: null,
    favicon: null,
    highlights: [],
    id: 'link-1',
    importSessionId: null,
    isArchived: false,
    isFavorite: false,
    isPaywalled: false,
    isRead: false,
    lastReadAt: null,
    priority: 'none',
    processingStartedAt: null,
    processingStatus: 'pending',
    publishedAt: null,
    readingProgress: 0,
    readingTime: 1,
    tags: [],
    textContent: null,
    timeSpentReading: 0,
    title: 'Seed Title',
    updatedAt: new Date(),
    url: 'https://example.com/article',
    userId: 'user-1',
    ...overrides
  };
}

function job(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      linkId: 'link-1',
      url: 'https://example.com/article',
      user: { id: 'user-1' },
      ...overrides
    },
    id: 'job-1',
    updateProgress: vi.fn()
  };
}

describe('content extraction worker behavior', () => {
  it('uploads article images under the current user and does not pause between images', async () => {
    expect(contentExtractionJobHandler).toBeDefined();

    const setTimeoutSpy = vi.mocked(globalThis.setTimeout);

    const result = await contentExtractionJobHandler!(job());

    expect(result).toMatchObject({ status: 'success', imagesProcessed: 1, imagesFailed: 0 });
    expect(linksAdapterMock.update).toHaveBeenCalledWith(
      'link-1',
      'user-1',
      expect.objectContaining({
        processingStatus: 'processing',
        processingStartedAt: expect.any(Date)
      })
    );
    expect(storageServiceMock.uploadImageFromUrl).toHaveBeenNthCalledWith(
      1,
      'https://example.com/cover.png',
      { userId: 'user-1' }
    );
    expect(storageServiceMock.uploadImageFromUrl).toHaveBeenNthCalledWith(
      2,
      'https://example.com/body.png',
      { userId: 'user-1' }
    );
    expect(markdownServiceMock.convertToMarkdown).toHaveBeenCalledWith(expect.any(String), {
      baseUrl: 'https://example.com/article',
      title: 'Readable Title'
    });
    expect(setTimeoutSpy.mock.calls.some(([, delay]) => delay === 500)).toBe(false);
  });

  it('resumes stale processing jobs instead of skipping them', async () => {
    linksAdapterMock.findById.mockResolvedValueOnce(
      makeLink({
        processingStartedAt: new Date(Date.now() - 6 * 60 * 1000),
        processingStatus: 'processing'
      })
    );

    expect(contentExtractionJobHandler).toBeDefined();

    const result = await contentExtractionJobHandler!(job());

    expect(result.status).toBe('success');
    expect(
      linksAdapterMock.update.mock.calls.map(
        ([, , updates]) => (updates as { processingStatus?: string }).processingStatus
      )
    ).toEqual(['pending', 'processing', 'completed']);
    expect(linksAdapterMock.update).toHaveBeenNthCalledWith(
      1,
      'link-1',
      'user-1',
      expect.objectContaining({ processingStartedAt: null, processingStatus: 'pending' })
    );
  });

  it('marks processing jobs as failed when extraction throws', async () => {
    contentExtractionServiceMock.extractMetadata.mockRejectedValueOnce(new Error('boom'));

    expect(contentExtractionJobHandler).toBeDefined();

    await expect(contentExtractionJobHandler!(job())).rejects.toThrow('boom');
    expect(
      linksAdapterMock.update.mock.calls.map(
        ([, , updates]) => (updates as { processingStatus?: string }).processingStatus
      )
    ).toEqual(['processing', 'failed']);
    expect(linksAdapterMock.update).toHaveBeenNthCalledWith(
      1,
      'link-1',
      'user-1',
      expect.objectContaining({
        processingStartedAt: expect.any(Date),
        processingStatus: 'processing'
      })
    );
    expect(linksAdapterMock.update).toHaveBeenNthCalledWith(
      2,
      'link-1',
      'user-1',
      expect.objectContaining({ processingStartedAt: null, processingStatus: 'failed' })
    );
  });
});
