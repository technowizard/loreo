import type { Job, JobProgress } from 'bullmq';
import { parseHTML } from 'linkedom';

import type { ContentExtractionJobData } from '@/queues/content-extraction.queue.js';
import { enqueueContentExtraction } from '@/queues/content-extraction.queue.js';

import { db } from '@/db/index.js';

import { assertSafeArticleUrl } from '@/lib/article-url-guard.js';
import { isDemoMode } from '@/lib/demo-mode.js';
import { createWorker } from '@/lib/job-queue.js';
import { logger } from '@/lib/logger.js';
import { estimateReadingTime } from '@/lib/reading-time.js';

import { createDrizzleImportSessionsAdapter } from '@/repositories/import-sessions.repository.js';
import { createDrizzleLinksAdapter } from '@/repositories/links.repository.js';

import { browserService } from '@/services/browser.service.js';
import { contentExtractionService } from '@/services/content-extraction.service.js';
import { markdownService } from '@/services/markdown.service.js';
import { storageService } from '@/services/storage.service.js';

const links = createDrizzleLinksAdapter(db);
const importSessions = createDrizzleImportSessionsAdapter(db);

const workerName = 'content-extraction-worker';
const jobTimeoutMs = 5 * 60 * 1000;

const isDataURI = (uri: string): boolean => uri.startsWith('data:');

function abortPromise(signal: AbortSignal): Promise<never> {
  if (signal.aborted) {
    const p = Promise.reject(signal.reason ?? new Error('AbortError'));
    p.catch(() => {});
    return p;
  }

  const p = new Promise<never>((_, reject) => {
    signal.addEventListener(
      'abort',
      () => {
        reject(signal.reason ?? new Error('AbortError'));
      },
      { once: true }
    );
  });

  p.catch(() => {});
  return p;
}

async function enqueueNextPendingLink(importSessionId: string, userId: string): Promise<void> {
  const pendingLinks = await importSessions.findPendingLinksInSession(importSessionId, userId, 1);

  if (pendingLinks.length > 0) {
    const nextLink = pendingLinks[0];
    await enqueueContentExtraction.add('process', {
      linkId: nextLink?.id,
      url: nextLink?.url,
      user: { id: userId },
      importSessionId
    });
    logger.info(
      `Enqueued next pending link ${nextLink?.id} from import session ${importSessionId}`
    );
  } else {
    // no more pending links, update session extraction status to completed
    await importSessions.updateExtractionStatus(importSessionId, userId, {
      extractionStatus: 'completed'
    });
    logger.info(`No more pending links in import session ${importSessionId}, marked as completed`);
  }
}

async function contentExtractionJob(job: Job<ContentExtractionJobData>): Promise<{
  articleTitle?: string;
  error?: string;
  imagesFailed?: number;
  imagesProcessed?: number;
  status: string;
}> {
  if (isDemoMode()) {
    logger.info(`[${workerName}] Skipping content extraction job ${job.id} in demo mode`);

    return { status: 'skipped' };
  }

  const { linkId, url: articleUrl, user } = job.data;

  const jobController = new AbortController();
  const jobTimeout = setTimeout(() => {
    jobController.abort(new Error('Job exceeded 5 minute timeout'));
  }, jobTimeoutMs);

  logger.info(`Processing article job ${job.id} for URL: ${articleUrl}`);

  const initialDoc = await links.findById(linkId, user.id);

  if (!initialDoc) {
    clearTimeout(jobTimeout);
    logger.warn(`Link with id ${linkId} not found`);

    return { error: 'Link not found', status: 'aborted' };
  }

  let currentDoc = initialDoc;

  if (currentDoc.processingStatus === 'processing') {
    const startedAtMs = currentDoc.processingStartedAt?.getTime();
    const isStale = !startedAtMs || Date.now() - startedAtMs >= jobTimeoutMs;

    if (isStale) {
      await links.update(linkId, user.id, {
        processingStartedAt: null,
        processingStatus: 'pending'
      });
      currentDoc = {
        ...currentDoc,
        processingStartedAt: null,
        processingStatus: 'pending'
      };
    }
  }

  if (currentDoc.processingStatus !== 'pending') {
    clearTimeout(jobTimeout);
    logger.warn(`Link with id ${linkId} is not pending`);

    return { articleTitle: currentDoc.title as string, status: 'skipped' };
  }

  try {
    await links.update(linkId, user.id, {
      processingStartedAt: new Date(),
      processingStatus: 'processing'
    });
  } catch (error: unknown) {
    clearTimeout(jobTimeout);
    logger.error(
      `[${workerName}] FATAL: Job ${job.id} could not update document ${linkId} to 'processing' status. Aborting. ${error}`
    );

    throw error;
  }

  let imagesProcessed = 0;
  let imagesFailed = 0;

  try {
    await job.updateProgress(5);

    await assertSafeArticleUrl(articleUrl);

    const { html: htmlContent, isPaywalled } = await browserService.crawlPage(articleUrl);

    logger.info('Content successfully fetched');

    const metadata = await Promise.race([
      contentExtractionService.extractMetadata(htmlContent, articleUrl),
      abortPromise(jobController.signal)
    ]);

    jobController.signal.throwIfAborted();

    logger.info('Metadata successfully extracted');

    const readableContent = await Promise.race([
      contentExtractionService.extractReadableContent(htmlContent, articleUrl),
      abortPromise(jobController.signal)
    ]);

    jobController.signal.throwIfAborted();

    logger.info('Readable content extracted');

    await job.updateProgress(30);

    if (readableContent && readableContent.content) {
      let htmlContent = readableContent.content;

      const { document } = parseHTML(htmlContent);

      const images = Array.from(document.querySelectorAll('img'));

      let coverImage = null;

      if (metadata.image) {
        try {
          // resolve relative URLs using articleUrl as base
          const absoluteImageUrl = metadata.image.startsWith('http')
            ? metadata.image
            : new URL(metadata.image, articleUrl).href;

          const uploadedImage = await storageService.uploadImageFromUrl(absoluteImageUrl, {
            userId: user.id
          });

          coverImage = metadata.image?.startsWith('data:') ? null : (uploadedImage?.url ?? null);
        } catch (coverError) {
          // cover image is optional
          logger.warn(`Cover image upload failed, using favicon fallback: ${coverError}`);
          coverImage = metadata.favicon || null;
        }
      }

      logger.info(`Found ${images.length} images in the article`);

      let currentImageProgress = 0;

      for (const img of images) {
        const originalSrc = img.getAttribute('src');

        currentImageProgress++;

        const overallProgress = 30 + Math.round((currentImageProgress / images.length) * 60);

        await job.updateProgress(overallProgress);

        if (originalSrc && !isDataURI(originalSrc)) {
          try {
            const absoluteSrc = new URL(originalSrc, articleUrl).href;

            logger.info(
              `Processing image ${currentImageProgress} of ${images.length}: ${absoluteSrc}`
            );

            const uploadedImage = await storageService.uploadImageFromUrl(absoluteSrc, {
              userId: user.id
            });

            if (!uploadedImage?.url) {
              // upload failed, hide broken image
              logger.warn(`Image upload failed: ${absoluteSrc}`);
              img.setAttribute('src', '');
              img.setAttribute('style', 'display:none');
              imagesFailed++;
              continue;
            }

            img.setAttribute('src', uploadedImage.url);

            imagesProcessed++;
          } catch (imgError: unknown) {
            logger.error(
              `Unexpected error processing image ${currentImageProgress} of ${
                images.length
              }: ${(imgError as Error).message}`
            );
            img.setAttribute('src', '');
            img.setAttribute('style', 'display:none');
            imagesFailed++;
          }
        }
      }

      htmlContent = document.toString();

      const content = markdownService.convertToMarkdown(htmlContent);

      const readingTime = estimateReadingTime(readableContent.textContent as string);

      const updatePayload = {
        author: metadata.author || readableContent.author,
        content,
        coverImage,
        errorMessage: null,
        excerpt: readableContent.excerpt,
        favicon: metadata.favicon,
        isPaywalled,
        processingStartedAt: null,
        processingStatus: 'completed' as const,
        publishedAt: metadata.publishedDate ? new Date(metadata.publishedDate) : null,
        readingTime,
        textContent: readableContent.textContent,
        title: readableContent.title
      };

      await links.update(linkId, user.id, updatePayload);

      await job.updateProgress(100);

      logger.info('Article processing completed successfully');

      // update extraction counts if part of import session
      if (job.data.importSessionId) {
        await importSessions.incrementExtractionCounts(job.data.importSessionId, user.id, {
          completed: 1
        });
        await enqueueNextPendingLink(job.data.importSessionId, user.id);
      }

      return {
        articleTitle: metadata.title,
        imagesFailed,
        imagesProcessed,
        status: 'success'
      };
    } else if (readableContent) {
      logger.info('Article processing completed with no content');

      const updatePayload = {
        content: readableContent.content || null,
        errorMessage: 'No content extracted from the article',
        isPaywalled,
        processingStartedAt: null,
        processingStatus: 'completed' as const,
        textContent: readableContent.textContent || null,
        title: readableContent.title
      };

      await links.update(linkId, user.id, updatePayload);
      await job.updateProgress(100);

      // update extraction counts if part of import session
      if (job.data.importSessionId) {
        await importSessions.incrementExtractionCounts(job.data.importSessionId, user.id, {
          completed: 1
        });
        await enqueueNextPendingLink(job.data.importSessionId, user.id);
      }

      return {
        articleTitle: metadata.title,
        imagesFailed,
        imagesProcessed,
        status: 'success'
      };
    } else {
      logger.warn('Article processing completed with no content');

      await links.update(linkId, user.id, {
        errorMessage: 'No content extracted from the article',
        processingStartedAt: null,
        processingStatus: 'failed'
      });

      throw new Error('No content extracted from the article');
    }
  } catch (error: unknown) {
    logger.error(`[${workerName}] FATAL: Could not process article job ${job.id}. Error: ${error}`);

    try {
      await links.update(linkId, user.id, {
        content: 'No content extracted from the article',
        errorMessage: "Content couldn't be extracted. Link may be broken",
        processingStartedAt: null,
        processingStatus: 'failed'
      });

      // update extraction failed count if part of import session
      if (job.data.importSessionId) {
        await importSessions.incrementExtractionCounts(job.data.importSessionId, user.id, {
          failed: 1
        });
        await enqueueNextPendingLink(job.data.importSessionId, user.id);
      }
    } catch (updateError: unknown) {
      logger.error(
        `[${workerName}] FATAL: Could not update database for failed job ${job.id}. Update error: ${updateError}`
      );

      throw new Error('Failed to update database for failed job');
    }

    throw error;
  } finally {
    clearTimeout(jobTimeout);
  }
}

const contentExtractionWorker = createWorker('content-extraction', contentExtractionJob, {
  name: workerName,
  concurrency: 3
});

contentExtractionWorker.on('completed', (job: Job<ContentExtractionJobData>, result) => {
  logger.info(
    `Content extraction job ${job.id} completed successfully. Result: ${JSON.stringify(result)}`
  );
});

contentExtractionWorker.on('failed', (job: Job<ContentExtractionJobData> | undefined, error) => {
  logger.error(`Content extraction job ${job?.id} failed: ${error.message}`);
});

contentExtractionWorker.on(
  'progress',
  (job: Job<ContentExtractionJobData>, progress: JobProgress) => {
    logger.info(`[${workerName}] Job ${job.id} progress: ${progress}`);
  }
);

contentExtractionWorker.on('error', (error: Error) => {
  logger.error(`[${workerName}] Error in content-extraction worker: ${JSON.stringify(error)}`);
});

if (!isDemoMode()) {
  logger.info(
    `[${workerName}] Content extraction worker started and listening for jobs on 'content-extraction' queue.`
  );
}

export default contentExtractionWorker;
