import type { JobsOptions } from 'bullmq';

import type { ContentExtractionJobData } from '@/queues/content-extraction.queue.js';
import { enqueueContentExtraction } from '@/queues/content-extraction.queue.js';

import type { Repos } from '@/lib/types.js';
import { normalizeUrl } from '@/lib/url-normalizer.js';

import type { UserIdentity } from '@/types/auth.js';
import type { LinkData } from '@/types/links.js';

export type LinkSaveResult = {
  created: boolean;
  link: LinkData;
  reconciledFeedItems: number;
};

type EnqueueExtraction = (
  jobName: string,
  data: ContentExtractionJobData,
  options?: JobsOptions
) => Promise<{ id?: string }>;

export type SaveLinkInput = {
  enqueueExtraction?: EnqueueExtraction;
  reconcileFeedItems?: boolean;
  repos: Pick<Repos, 'feedItems' | 'links'>;
  user: UserIdentity;
  url: string;
};

function newPendingLink(
  url: string,
  userId: string
): Omit<LinkData, 'coverImage' | 'errorMessage' | 'favicon' | 'id' | 'processingStartedAt'> {
  return {
    author: null,
    content: null,
    excerpt: null,
    isArchived: false,
    isFavorite: false,
    isPaywalled: false,
    isRead: false,
    lastReadAt: null,
    priority: 'none',
    processingStatus: 'pending',
    publishedAt: null,
    readingProgress: 0,
    readingTime: 0,
    textContent: null,
    timeSpentReading: 0,
    title: url,
    url,
    userId
  };
}

export async function saveLink(input: SaveLinkInput): Promise<LinkSaveResult> {
  const { repos, user, url } = input;
  const existing = await repos.links.findByUrl(url, user.id);
  const normalizedUrl = normalizeUrl(url);

  const shouldReconcileFeedItems = input.reconcileFeedItems ?? true;
  const enqueueExtraction =
    input.enqueueExtraction ?? enqueueContentExtraction.add.bind(enqueueContentExtraction);
  const enqueuePendingExtraction = (link: LinkData, targetUrl = link.url) =>
    enqueueExtraction(
      'process-new-article',
      {
        linkId: link.id,
        url: targetUrl,
        user
      },
      { jobId: `content-extraction-${link.id}` }
    );

  if (existing) {
    if (existing.processingStatus === 'pending') {
      await enqueuePendingExtraction(existing);
    }
    const reconciled = shouldReconcileFeedItems
      ? await repos.feedItems?.reconcileSavedByUrl({
          linkId: existing.id,
          normalizedUrl,
          userId: user.id
        })
      : undefined;

    return {
      created: false,
      link: existing,
      reconciledFeedItems: reconciled?.length ?? 0
    };
  }

  const link = await repos.links.create(newPendingLink(url, user.id));
  if (!link) throw new Error('Failed to create link');

  await enqueuePendingExtraction(link, url);

  const reconciled = shouldReconcileFeedItems
    ? await repos.feedItems?.reconcileSavedByUrl({
        linkId: link.id,
        normalizedUrl,
        userId: user.id
      })
    : undefined;

  return {
    created: true,
    link,
    reconciledFeedItems: reconciled?.length ?? 0
  };
}
