import { describe, expect, it, vi } from 'vitest';

import type { Repos } from '@/lib/types.js';

import type { FeedItemsRepository } from '@/repositories/feed-items.repository.js';
import type { LinksRepository } from '@/repositories/links.repository.js';

import type { UserWithoutPassword } from '@/types/auth.js';
import type { LinkData } from '@/types/links.js';

import { saveLink } from './link-save.service.js';

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'reader@example.com',
  name: 'Reader',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function linkFixture(overrides: Partial<LinkData> = {}): LinkData {
  return {
    author: null,
    content: null,
    coverImage: null,
    errorMessage: null,
    excerpt: null,
    favicon: null,
    id: crypto.randomUUID(),
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
    readingTime: 0,
    textContent: null,
    timeSpentReading: 0,
    title: overrides.url ?? 'https://example.com/article',
    url: 'https://example.com/article',
    userId: TEST_USER.id,
    ...overrides
  };
}

function buildRepos(existingLink: LinkData | null = null) {
  const createdLink = linkFixture({ id: '00000000-0000-0000-0000-000000000100' });
  const links = {
    create: vi.fn(async () => createdLink),
    findByUrl: vi.fn(async () => existingLink)
  } as unknown as LinksRepository;
  const feedItems = {
    reconcileSavedByUrl: vi.fn(async () => [])
  } as unknown as FeedItemsRepository;

  return { createdLink, repos: { feedItems, links } as Pick<Repos, 'feedItems' | 'links'> };
}

describe('saveLink', () => {
  it('creates a pending link, enqueues extraction, and reconciles matching feed items', async () => {
    const { createdLink, repos } = buildRepos();
    const enqueueExtraction = vi.fn(async () => ({ id: 'job-1' }));
    expect(repos.feedItems).toBeDefined();
    vi.mocked(repos.feedItems!.reconcileSavedByUrl).mockResolvedValue([
      { id: 'feed-item-1' }
    ] as never);

    const result = await saveLink({
      enqueueExtraction,
      repos,
      user: TEST_USER,
      url: 'https://example.com/article?b=2&a=1#section'
    });

    expect(result).toEqual({ created: true, link: createdLink, reconciledFeedItems: 1 });
    expect(repos.links.create).toHaveBeenCalledWith(
      expect.objectContaining({
        processingStatus: 'pending',
        title: 'https://example.com/article?b=2&a=1#section',
        url: 'https://example.com/article?b=2&a=1#section',
        userId: TEST_USER.id
      })
    );
    expect(enqueueExtraction).toHaveBeenCalledWith(
      'process-new-article',
      {
        linkId: createdLink.id,
        url: 'https://example.com/article?b=2&a=1#section',
        user: TEST_USER
      },
      { jobId: `content-extraction-${createdLink.id}` }
    );
    expect(repos.feedItems?.reconcileSavedByUrl).toHaveBeenCalledWith({
      linkId: createdLink.id,
      normalizedUrl: 'https://example.com/article?a=1&b=2',
      userId: TEST_USER.id
    });
  });

  it('reuses an existing completed user link without enqueueing extraction', async () => {
    const existingLink = linkFixture({
      id: '00000000-0000-0000-0000-000000000200',
      processingStatus: 'completed'
    });
    const { repos } = buildRepos(existingLink);
    const enqueueExtraction = vi.fn(async () => ({ id: 'job-1' }));

    const result = await saveLink({
      enqueueExtraction,
      repos,
      user: TEST_USER,
      url: existingLink.url
    });

    expect(result).toEqual({ created: false, link: existingLink, reconciledFeedItems: 0 });
    expect(repos.links.create).not.toHaveBeenCalled();
    expect(enqueueExtraction).not.toHaveBeenCalled();
    expect(repos.feedItems?.reconcileSavedByUrl).toHaveBeenCalledWith({
      linkId: existingLink.id,
      normalizedUrl: existingLink.url,
      userId: TEST_USER.id
    });
  });

  it('idempotently re-enqueues extraction for an existing pending link', async () => {
    const existingLink = linkFixture({ id: '00000000-0000-0000-0000-000000000201' });
    const { repos } = buildRepos(existingLink);
    const enqueueExtraction = vi.fn(async () => ({ id: 'job-1' }));

    await saveLink({
      enqueueExtraction,
      reconcileFeedItems: false,
      repos,
      user: TEST_USER,
      url: existingLink.url
    });

    expect(enqueueExtraction).toHaveBeenCalledWith(
      'process-new-article',
      { linkId: existingLink.id, url: existingLink.url, user: TEST_USER },
      { jobId: `content-extraction-${existingLink.id}` }
    );
  });

  it('does not reconcile feed items when link creation fails', async () => {
    const { repos } = buildRepos();
    vi.mocked(repos.links.create).mockResolvedValue(null);

    await expect(
      saveLink({
        enqueueExtraction: vi.fn(),
        repos,
        user: TEST_USER,
        url: 'https://example.com/fails'
      })
    ).rejects.toThrow(/failed to create link/i);

    expect(repos.feedItems?.reconcileSavedByUrl).not.toHaveBeenCalled();
  });

  it('keeps duplicate checks scoped to the current user', async () => {
    const { repos } = buildRepos();

    await saveLink({
      enqueueExtraction: vi.fn(async () => ({ id: 'job-1' })),
      repos,
      user: TEST_USER,
      url: 'https://example.com/scoped'
    });

    expect(repos.links.findByUrl).toHaveBeenCalledWith('https://example.com/scoped', TEST_USER.id);
  });
});
