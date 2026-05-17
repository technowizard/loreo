import { promises as fs } from 'node:fs';
import path from 'node:path';

import { enqueueContentExtraction } from '@/queues/content-extraction.queue.js';
import type { CsvImportJobData } from '@/queues/csv-import.queue.js';
import { enqueueCsvImport } from '@/queues/csv-import.queue.js';

import { getColumns, parseLine, parseTags } from '@/lib/csv-parser.js';
import { logger } from '@/lib/logger.js';
import { errorResponse, HttpStatus, successResponse } from '@/lib/response.js';
import type { AppRouteHandler } from '@/lib/types.js';
import { isValidUrl } from '@/lib/url-validator.js';

import type { ImportSessionData } from '@/repositories/import-sessions.repository.js';

import type {
  CancelImportSessionRoute,
  CleanupOldSessionsRoute,
  DeleteImportSessionRoute,
  ExecuteImportRoute,
  GetImportSessionRoute,
  GetJobStatusRoute,
  GetSessionLinksRoute,
  ListImportSessionsRoute,
  PreviewImportRoute,
  ResumeImportRoute,
  RetryFailedImportRoute,
  UploadImportRoute
} from './imports.routes.js';

function mapSessionToResponse(session: ImportSessionData) {
  return {
    id: session.id,
    filename: session.filename,
    totalRows: session.totalRows,
    importedCount: session.importedCount,
    skippedCount: session.skippedCount,
    failedCount: session.failedCount,
    status: session.status,
    errorMessage: session.errorMessage,
    extractionStatus: session.extractionStatus,
    extractionProgress: session.extractionProgress,
    extractionCompleted: session.extractionCompleted,
    extractionFailed: session.extractionFailed,
    startedAt: session.startedAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString()
  };
}

async function getFilePath(fileId: string): Promise<string | null> {
  if (!/^[\w-]+$/.test(fileId)) return null;

  const filePath = path.resolve('/tmp', `import_${fileId}.csv`);

  if (!filePath.startsWith('/tmp/import_')) return null;

  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

export const uploadImport: AppRouteHandler<UploadImportRoute> = async (c) => {
  try {
    const formData = c.req.valid('form');
    const file = formData.file;

    if (!file || !(file instanceof File)) {
      const response = errorResponse('File is required', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const MAX_CSV_SIZE = 10 * 1024 * 1024; // 10MB

    if (file.size > MAX_CSV_SIZE) {
      const response = errorResponse('File too large', HttpStatus.REQUEST_TOO_LONG);
      return c.json(response, response.status);
    }

    const fileContent = await file.text();

    if (!fileContent.trim()) {
      const response = errorResponse('File content is empty', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const filePath = path.resolve('/tmp', `import_${fileId}.csv`);

    await fs.writeFile(filePath, fileContent, 'utf8');

    const columns = getColumns(fileContent);
    const lines = fileContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const hasHeader = columns.some(
      (col) => col.toLowerCase() === 'url' || col.toLowerCase() === 'title'
    );
    const dataRows = hasHeader ? Math.max(0, lines.length - 1) : lines.length;

    logger.info(
      `[import] File uploaded: ${fileId}, ${dataRows} rows, columns: ${JSON.stringify(columns)}`
    );

    const response = successResponse({
      fileId,
      filename: file.name || 'import.csv',
      columns,
      rowCount: dataRows
    });
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Upload error: ${error}`);
    const response = errorResponse('Failed to upload file');
    return c.json(response, response.status);
  }
};

export const previewImport: AppRouteHandler<PreviewImportRoute> = async (c) => {
  const body = await c.req.json();
  const { fileId, mapping } = body;

  try {
    const filePath = await getFilePath(fileId);

    if (!filePath) {
      const response = errorResponse('File not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const firstLine = lines[0] ?? '';
    const hasHeader =
      lines.length > 0 &&
      (firstLine.toLowerCase().includes('url') || firstLine.toLowerCase().includes('title'));
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const previewRows = dataLines.slice(0, 5).map((line) => {
      const columns = parseLine(line).map((c) => c.trim().replaceAll(/^"|"$/g, ''));
      const headerColumns = hasHeader
        ? firstLine.split(',').map((c) => c.trim().replaceAll(/^"|"$/g, '').toLowerCase())
        : [];

      const urlColIndex = mapping?.url
        ? headerColumns.indexOf(mapping.url.toLowerCase())
        : headerColumns.findIndex((c) => c === 'url' || c === 'href' || c === 'link');
      const titleColIndex = mapping?.title
        ? headerColumns.indexOf(mapping.title.toLowerCase())
        : headerColumns.findIndex((c) => c === 'title' || c === 'name');
      const tagsColIndex = mapping?.tags
        ? headerColumns.indexOf(mapping.tags.toLowerCase())
        : headerColumns.findIndex((c) => c === 'tags' || c === 'tag_list');
      const timeAddedColIndex = mapping?.timeAdded
        ? headerColumns.indexOf(mapping.timeAdded.toLowerCase())
        : headerColumns.findIndex((c) => c === 'time_added' || c === 'added_at');

      const url = urlColIndex >= 0 ? columns[urlColIndex] : columns[0];
      const title = titleColIndex >= 0 ? columns[titleColIndex] : columns[1] || '';
      const tagsStr = tagsColIndex >= 0 ? columns[tagsColIndex] : '';
      const timeAddedStr = timeAddedColIndex >= 0 ? columns[timeAddedColIndex] : '';

      const errors: string[] = [];
      let isValid = true;

      if (!url || !isValidUrl(url)) {
        errors.push('Invalid or missing URL');
        isValid = false;
      }

      return {
        url: url || undefined,
        title: title || undefined,
        tags: tagsStr ? parseTags(tagsStr) : undefined,
        timeAdded: timeAddedStr ? Number(timeAddedStr) : undefined,
        isValid,
        errors: errors.length > 0 ? errors : undefined
      };
    });

    const totalRows = dataLines.length;
    const batches = Math.ceil(totalRows / 20);
    const estimatedSeconds = batches * 3.5;
    const estimatedTime =
      estimatedSeconds < 60
        ? `~${Math.round(estimatedSeconds)} seconds`
        : `~${Math.round(estimatedSeconds / 60)} minutes`;

    const response = successResponse({
      preview: previewRows,
      totalRows,
      estimatedTime
    });
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Preview error: ${error}`);
    const response = errorResponse('Failed to generate preview');
    return c.json(response, response.status);
  }
};

export const executeImport: AppRouteHandler<ExecuteImportRoute> = async (c) => {
  const user = c.get('user');
  const { importSessions, tags } = c.get('repos');
  const { fileId, mapping, options } = c.req.valid('json');

  try {
    const filePath = await getFilePath(fileId);

    if (!filePath) {
      const response = errorResponse('File not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const firstLine = lines[0] ?? '';
    const hasHeader =
      lines.length > 0 &&
      (firstLine.toLowerCase().includes('url') || firstLine.toLowerCase().includes('title'));
    const rowCount = hasHeader ? Math.max(0, lines.length - 1) : lines.length;

    const session = await importSessions.create({
      userId: user.id,
      filename: `${fileId}.csv`,
      totalRows: rowCount
    });

    if (!session) {
      const response = errorResponse('Failed to create import session');
      return c.json(response, response.status);
    }

    const baseTagName = 'Imported Tags from CSV';
    const existingGroups = await tags.findGroupsWithTags(user.id);

    let tagName = baseTagName;
    const baseExists = existingGroups.some((group) => group.name === baseTagName);

    if (baseExists) {
      let maxNum = 1;
      for (const group of existingGroups) {
        const match = group.name?.match(/Imported Tags from CSV \((\d+)\)/);
        if (match) maxNum = Math.max(maxNum, Number.parseInt(match[1] ?? '0') + 1);
      }
      tagName = `${baseTagName} (${maxNum})`;
    }

    const jobData: CsvImportJobData = {
      importSessionId: session.id,
      userId: user.id,
      filePath,
      fieldMapping: {
        url: mapping?.url ?? 'url',
        title: mapping?.title ?? 'title',
        tags: mapping?.tags ?? 'tags',
        timeAdded: mapping?.timeAdded ?? 'timeAdded'
      },
      tagName,
      skipDuplicates: options?.skipDuplicates ?? true
    };

    const job = await enqueueCsvImport.add('process', jobData);

    logger.info(
      `[import] Import job queued: ${job.id} for session ${session.id}, tagName: ${tagName}`
    );

    const response = successResponse(
      {
        jobId: String(job.id),
        estimatedCount: rowCount,
        importSessionId: session.id,
        message: 'Import job queued'
      },
      'Import job queued successfully',
      HttpStatus.ACCEPTED
    );
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Execute error: ${error}`);
    const response = errorResponse('Failed to queue import job', HttpStatus.INTERNAL_SERVER_ERROR);
    return c.json(response, response.status);
  }
};

export const getJobStatus: AppRouteHandler<GetJobStatusRoute> = async (c) => {
  const { jobId } = c.req.valid('param');

  try {
    const job = await enqueueCsvImport.getJob(jobId);

    if (!job) {
      const response = errorResponse('Job not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const state = await job.getState();
    const progress = typeof job.progress === 'function' ? job.progress() : 0;

    let processed = 0;
    let total = 0;
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    if (typeof progress === 'object' && progress !== null) {
      processed = (progress as Record<string, number>).processed || 0;
      total = (progress as Record<string, number>).total || 0;
      imported = (progress as Record<string, number>).imported || 0;
      skipped = (progress as Record<string, number>).skipped || 0;
      failed = (progress as Record<string, number>).failed || 0;
    } else if (typeof progress === 'number') {
      processed = progress;
    }

    if (total === 0) total = 1;

    const progressPercent = Math.round((processed / total) * 100);

    let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
    let error: string | undefined;

    switch (state) {
      case 'waiting':
      case 'delayed':
        status = 'pending';
        break;
      case 'active':
        status = 'processing';
        break;
      case 'completed':
        status = 'completed';
        break;
      case 'failed':
        status = 'failed';
        error = job.failedReason || 'Unknown error';
        break;
      default:
        status = 'pending';
    }

    const response = successResponse({
      jobId,
      status,
      progress: progressPercent,
      processed,
      total,
      imported,
      skipped,
      failed,
      error
    });
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Get status error: ${error}`);
    const response = errorResponse('Failed to get job status');
    return c.json(response, response.status);
  }
};

export const listImportSessions: AppRouteHandler<ListImportSessionsRoute> = async (c) => {
  const user = c.get('user');
  const { cursor, limit } = c.req.valid('query');
  const { importSessions } = c.get('repos');

  try {
    const result = await importSessions.findByUserId(user.id, {
      cursor,
      limit: limit ? Number(limit) : undefined
    });

    const response = successResponse(
      {
        items: result.items.map(mapSessionToResponse),
        hasMore: result.hasMore,
        nextCursor: result.nextCursor
      },
      'List of import sessions'
    );
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] List sessions error: ${error}`);
    const response = errorResponse('Failed to list sessions');
    return c.json(response, response.status);
  }
};

export const getImportSession: AppRouteHandler<GetImportSessionRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { importSessions } = c.get('repos');

  try {
    const session = await importSessions.findById(id, user.id);

    if (!session) {
      const response = errorResponse('Session not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = successResponse(mapSessionToResponse(session));
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Get session error: ${error}`);
    const response = errorResponse('Failed to get session');
    return c.json(response, response.status);
  }
};

export const cancelImportSession: AppRouteHandler<CancelImportSessionRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { importSessions } = c.get('repos');

  try {
    const session = await importSessions.findById(id, user.id);

    if (!session) {
      const response = errorResponse('Session not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const linksReset = await importSessions.resetProcessingLinksForCancel(id, user.id);

    await importSessions.updateStatus(id, user.id, {
      status: 'cancelled',
      completedAt: new Date()
    });

    const response = successResponse({
      message: 'Import cancelled successfully',
      linksReset
    });
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Cancel error: ${error}`);
    const response = errorResponse('Failed to cancel import', HttpStatus.INTERNAL_SERVER_ERROR);
    return c.json(response, response.status);
  }
};

export const deleteImportSession: AppRouteHandler<DeleteImportSessionRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { importSessions } = c.get('repos');

  try {
    const session = await importSessions.findById(id, user.id);

    if (!session) {
      const response = errorResponse('Session not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    if (session.status === 'processing') {
      const response = errorResponse(
        'Session is currently processing — cancel it before deleting',
        HttpStatus.BAD_REQUEST
      );
      return c.json(response, response.status);
    }

    await importSessions.delete(id, user.id);

    const response = successResponse({
      message: 'Import session deleted successfully'
    });
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Delete session error: ${error}`);
    const response = errorResponse(
      'Failed to delete import session',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    return c.json(response, response.status);
  }
};

export const resumeImport: AppRouteHandler<ResumeImportRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { importSessions } = c.get('repos');

  try {
    const session = await importSessions.findById(id, user.id);

    if (!session) {
      const response = errorResponse('Session not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    if (session.status !== 'cancelled' && session.status !== 'processing') {
      const response = errorResponse(
        'Session cannot be resumed. Only cancelled or processing sessions can be resumed.',
        HttpStatus.BAD_REQUEST
      );
      return c.json(response, response.status);
    }

    const counts = await importSessions.countBySession(id, user.id);

    if (counts.pending === 0) {
      const response = errorResponse('No pending links to resume', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    await importSessions.updateStatus(id, user.id, {
      status: 'processing',
      completedAt: null
    });
    await importSessions.updateExtractionStatus(id, user.id, {
      extractionStatus: 'in_progress'
    });

    const pendingLinks = await importSessions.findPendingLinksInSession(id, user.id, 1);

    if (pendingLinks.length > 0) {
      const firstLink = pendingLinks[0]!;
      await enqueueContentExtraction.add('process', {
        linkId: firstLink.id,
        url: firstLink.url,
        user,
        importSessionId: id
      });

      logger.info(
        `[import] Resumed import session ${id}, enqueued first pending link ${firstLink.id}`
      );
    }

    const response = successResponse({
      message: 'Import resumed successfully',
      linksResumed: counts.pending
    });
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Resume error: ${error}`);
    const response = errorResponse('Failed to resume import', HttpStatus.INTERNAL_SERVER_ERROR);
    return c.json(response, response.status);
  }
};

export const getSessionLinks: AppRouteHandler<GetSessionLinksRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { status, limit, cursor } = c.req.valid('query');
  const { importSessions } = c.get('repos');

  try {
    const session = await importSessions.findById(id, user.id);

    if (!session) {
      const response = errorResponse('Session not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const result = await importSessions.findLinksBySession(id, user.id, {
      status: status || undefined,
      limit: limit ? Number(limit) : undefined,
      cursor: cursor || undefined
    });

    const response = successResponse(
      {
        items: result.links.map((link) => ({
          id: link.id,
          title: link.title,
          url: link.url,
          status: link.processingStatus,
          errorMessage: link.errorMessage
        })),
        hasMore: result.hasMore,
        nextCursor: result.nextCursor
      },
      'Session fetched successfully'
    );
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Get session links error: ${error}`);
    const response = errorResponse('Failed to get session links');
    return c.json(response, response.status);
  }
};

export const retryFailedImport: AppRouteHandler<RetryFailedImportRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { importSessions } = c.get('repos');

  try {
    const session = await importSessions.findById(id, user.id);

    if (!session) {
      const response = errorResponse('Session not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const failedLinks = await importSessions.retryFailedLinks(id, user.id);

    if (failedLinks.length === 0) {
      const response = successResponse({ id }, 'No failed links to retry');
      return c.json(response, response.status);
    }

    try {
      const extractionProgress =
        session.importedCount > 0
          ? Math.round((session.extractionCompleted / session.importedCount) * 100)
          : 0;

      await importSessions.updateExtractionStatus(id, user.id, {
        extractionStatus: 'in_progress',
        extractionFailed: 0,
        extractionProgress
      });
    } catch (updateError) {
      logger.error(`[import] Failed to update extraction status for session ${id}: ${updateError}`);
    }

    const firstLink = failedLinks[0]!;
    await enqueueContentExtraction.add('process', {
      linkId: firstLink.id,
      url: firstLink.url,
      user: { id: user.id },
      importSessionId: id
    });

    logger.info(
      `[import] Re-queued ${failedLinks.length} failed links for extraction in session ${id}, started with ${firstLink.id}`
    );

    const response = successResponse({ id }, 'Failed links re-queued');
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Retry failed error: ${error}`);
    const response = errorResponse('Failed to retry failed imports');
    return c.json(response, response.status);
  }
};

async function cleanupOrphanedTempFiles(): Promise<number> {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  let deleted = 0;

  try {
    const files = await fs.readdir('/tmp');
    const csvFiles = files.filter((f) => f.startsWith('import_') && f.endsWith('.csv'));

    for (const file of csvFiles) {
      const filePath = path.resolve('/tmp', file);
      try {
        const stat = await fs.stat(filePath);
        if (Date.now() - stat.mtimeMs > ONE_HOUR_MS) {
          await fs.unlink(filePath);
          deleted++;
        }
      } catch {
        // file may have been deleted between readdir and stat — ignore
      }
    }
  } catch (error) {
    logger.warn(`[import] Failed to cleanup orphaned temp files: ${error}`);
  }

  return deleted;
}

export const cleanupOldSessions: AppRouteHandler<CleanupOldSessionsRoute> = async (c) => {
  const user = c.get('user');
  const { importSessions } = c.get('repos');
  const { daysOld } = c.req.valid('json');

  try {
    if (daysOld < 30 || daysOld > 365) {
      const response = errorResponse('Invalid range', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    logger.info(
      `[import] User ${user.id} requesting cleanup of sessions older than ${daysOld} days`
    );

    const [result, tempFilesDeleted] = await Promise.all([
      importSessions.cleanupOldSessions(daysOld),
      cleanupOrphanedTempFiles()
    ]);

    logger.info(
      `[import] Cleanup complete: ${result.sessionsDeleted} sessions, ${result.linksDeleted} links, ${tempFilesDeleted} temp files deleted`
    );

    const response = successResponse({
      sessionsDeleted: result.sessionsDeleted,
      linksDeleted: result.linksDeleted,
      message: `Cleaned up ${result.sessionsDeleted} sessions older than ${daysOld} days`
    });
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`[import] Cleanup error: ${error}`);
    const response = errorResponse('Failed to cleanup old sessions');
    return c.json(response, response.status);
  }
};
