import { promises as fs } from 'node:fs';

import type { Job, JobProgress } from 'bullmq';

import type { ContentExtractionJobData } from '@/queues/content-extraction.queue.js';
import { enqueueContentExtraction } from '@/queues/content-extraction.queue.js';
import type { CsvImportJobData } from '@/queues/csv-import.queue.js';

import { db } from '@/db/index.js';

import { parseLine, parseTags } from '@/lib/csv-parser.js';
import { isDemoMode } from '@/lib/demo-mode.js';
import { createWorker } from '@/lib/job-queue.js';
import { logger } from '@/lib/logger.js';
import { isValidUrl } from '@/lib/url-validator.js';

import { createDrizzleImportSessionsAdapter } from '@/repositories/import-sessions.repository.js';
import { createDrizzleLinksAdapter } from '@/repositories/links.repository.js';
import { createDrizzleTagsAdapter } from '@/repositories/tags.repository.js';

import type { Tag } from '@/types/tags.js';

const links = createDrizzleLinksAdapter(db);
const importSessions = createDrizzleImportSessionsAdapter(db);
const tags = createDrizzleTagsAdapter(db);

const workerName = 'csv-import-worker';

async function readCsvFile(
  filePath: string
): Promise<{ headerColumns: string[]; dataLines: string[] }> {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headerColumns: [], dataLines: [] };
  }

  const headerColumns = parseLine(lines[0] as string).map((col) => col.toLowerCase().trim());

  const hasHeader = headerColumns.some(
    (col) => col === 'url' || col === 'href' || col === 'link' || col === 'title' || col === 'name'
  );

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return { headerColumns, dataLines };
}

async function csvImportJob(job: Job<CsvImportJobData>): Promise<{
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  status: string;
}> {
  if (isDemoMode()) {
    logger.info(`[${workerName}] Skipping CSV import job ${job.id} in demo mode`);

    return {
      importedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      status: 'skipped'
    };
  }

  const { importSessionId, userId, filePath, fieldMapping, tagName } = job.data;

  logger.info(`[${workerName}] Starting CSV import job ${job.id} for session ${importSessionId}`);

  try {
    await importSessions.updateStatus(importSessionId, userId, {
      status: 'processing',
      startedAt: new Date()
    });

    const existingGroup = await tags.findGroupByName(tagName, userId);
    const groupId =
      existingGroup?.id ??
      (
        await tags.createGroup({
          name: tagName,
          description: 'Tags imported from CSV',
          color: '#6B7280',
          userId
        })
      ).id;

    if (!groupId) {
      throw new Error(`Group ${tagName} has no ID`);
    }

    logger.info(`[${workerName}] Using tag group: ${tagName}`);

    const existingUrls = new Set((await links.findAllUrls(userId)).map((url) => url.toLowerCase()));

    const allExistingTags = await tags.findTagsByUserId(userId);
    const tagLookupMap = new Map<string, Omit<Tag, 'userId'>>();
    for (const tag of allExistingTags) {
      const key = `${tag.groupId}:${tag.name.toLowerCase()}`;
      tagLookupMap.set(key, tag);
    }

    async function findOrCreateTag(tagName: string): Promise<Omit<Tag, 'userId'>> {
      const lookupKey = `${groupId}:${tagName.toLowerCase()}`;
      const existingTag = tagLookupMap.get(lookupKey);
      if (existingTag) {
        return existingTag;
      }

      const newTag = await tags.createTag({ name: tagName, groupId, userId });
      tagLookupMap.set(lookupKey, newTag);
      return newTag;
    }

    const { headerColumns, dataLines } = await readCsvFile(filePath);
    const totalRows = dataLines.length;

    const session = await importSessions.findByIdOrThrow(importSessionId, userId);

    if (session.totalRows !== totalRows) {
      await importSessions.updateStatus(importSessionId, userId, {
        status: 'processing'
      });
    }

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const batchSize = 20;
    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      const progress = Math.round(((i + batch.length) / totalRows) * 100);

      await job.updateProgress(progress);

      for (const line of batch) {
        try {
          const columns = parseLine(line);

          const urlIndex = headerColumns.indexOf(fieldMapping.url?.toLowerCase() || 'url');
          const titleIndex = headerColumns.indexOf(fieldMapping.title?.toLowerCase() || 'title');
          const tagsIndex = headerColumns.indexOf(fieldMapping.tags?.toLowerCase() || 'tags');
          const timeAddedIndex = headerColumns.indexOf(
            fieldMapping.timeAdded?.toLowerCase() || 'time_added'
          );

          const url = urlIndex >= 0 ? columns[urlIndex] : columns[0] || '';
          const title = titleIndex >= 0 ? columns[titleIndex] : columns[1] || url || '';
          const tagsValue = tagsIndex >= 0 ? (columns[tagsIndex] ?? '') : '';
          const timeAddedValue = timeAddedIndex >= 0 ? Number(columns[timeAddedIndex]) : new Date();

          if (!url || !(await isValidUrl(url))) {
            failedCount++;
            await importSessions.incrementCounts(importSessionId, userId, {
              failed: 1
            });
            continue;
          }

          const hasDuplicate = existingUrls.has(url.toLowerCase());

          if (hasDuplicate) {
            skippedCount++;
            await importSessions.incrementCounts(importSessionId, userId, {
              skipped: 1
            });
            logger.debug(`[${workerName}] Skipping duplicate URL: ${url}`);
            continue;
          }

          const newLink = await links.create({
            author: null,
            content: null,
            createdAt: timeAddedValue
              ? new Date(timeAddedValue).toISOString()
              : new Date().toISOString(),
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
            title: title || url,
            url,
            userId,
            importSessionId
          });

          if (newLink?.id) {
            const tagNames = parseTags(tagsValue);
            const tagIds: string[] = [];
            for (const tagName of tagNames) {
              const tag = await findOrCreateTag(tagName);
              tagIds.push(tag.id);
            }
            if (tagIds.length > 0) {
              await tags.addTagsToLink(newLink.id, tagIds, userId);
              logger.debug(
                `[${workerName}] Added ${tagIds.length} tags to link ${
                  newLink.id
                }: ${tagNames.join(', ')}`
              );
            }
          }

          if (newLink) {
            importedCount++;
            existingUrls.add(url.toLowerCase());
            await importSessions.incrementCounts(importSessionId, userId, {
              imported: 1
            });
          } else {
            failedCount++;
            await importSessions.incrementCounts(importSessionId, userId, {
              failed: 1
            });
          }
        } catch (rowError) {
          failedCount++;
          await importSessions.incrementCounts(importSessionId, userId, {
            failed: 1
          });
          logger.error(`[${workerName}] Error processing row: ${rowError}`);
        }
      }

      if (i + batchSize < dataLines.length) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    try {
      await fs.unlink(filePath);
      logger.info(`[${workerName}] Deleted CSV file: ${filePath}`);
    } catch (deleteError) {
      logger.warn(`[${workerName}] Failed to delete CSV file: ${deleteError}`);
    }

    await importSessions.updateStatus(importSessionId, userId, {
      status: 'completed',
      completedAt: new Date()
    });

    const pendingLinks = await importSessions.findPendingLinksInSession(importSessionId, userId, 1);

    if (pendingLinks.length > 0) {
      const firstLink = pendingLinks[0];

      await importSessions.updateExtractionStatus(importSessionId, userId, {
        extractionStatus: 'in_progress'
      });

      const jobData: ContentExtractionJobData = {
        linkId: firstLink?.id as string,
        url: firstLink?.url as string,
        user: { id: userId },
        importSessionId
      };

      await enqueueContentExtraction.add('process-imported-link', jobData, {
        priority: 20
      });

      logger.info(`[${workerName}] Enqueued first link ${firstLink?.id} for content extraction`);
    } else {
      await importSessions.updateExtractionStatus(importSessionId, userId, {
        extractionStatus: 'completed',
        extractionProgress: 100,
        extractionCompleted: importedCount,
        extractionFailed: failedCount
      });
    }

    logger.info(
      `[${workerName}] CSV import job ${job.id} completed. Imported: ${importedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`
    );

    return {
      importedCount,
      skippedCount,
      failedCount,
      status: 'completed'
    };
  } catch (error) {
    logger.error(`[${workerName}] CSV import job ${job.id} failed: ${error}`);

    try {
      await importSessions.updateStatus(importSessionId, userId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      });

      try {
        await fs.unlink(filePath);
      } catch {}
    } catch (updateError) {
      logger.error(`[${workerName}] Failed to update session status: ${updateError}`);
    }

    throw error;
  }
}

const csvImportWorker = createWorker('csv-import', csvImportJob, {
  name: workerName,
  concurrency: 1,
  limiter: {
    duration: 3000,
    max: 20
  }
});

csvImportWorker.on('completed', (job: Job<CsvImportJobData>, result) => {
  logger.info(`CSV import job ${job.id} completed. Result: ${JSON.stringify(result)}`);
});

csvImportWorker.on('failed', (job: Job<CsvImportJobData> | undefined, error) => {
  logger.error(`CSV import job ${job?.id} failed: ${error.message}`);
});

csvImportWorker.on('progress', (job: Job<CsvImportJobData>, progress: JobProgress) => {
  logger.info(`[${workerName}] Job ${job.id} progress: ${progress}`);
});

csvImportWorker.on('error', (error: Error) => {
  logger.error(`[${workerName}] Error in CSV import worker: ${JSON.stringify(error)}`);
});

if (!isDemoMode()) {
  logger.info(
    `[${workerName}] CSV import worker started and listening for jobs on 'csv-import' queue.`
  );
}

export default csvImportWorker;
