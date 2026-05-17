import { and, desc, eq, inArray, lt, sql as sqlFn } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from '@/db/schemas/index.js';
import { importSessionsTable, linksTable, linkTagsTable } from '@/db/schemas/index.js';

import { decodeCursor, extractCursor, pageRows } from '@/lib/cursor.js';
import { logger } from '@/lib/logger.js';

import type { CursorPaginationOptions, CursorQueryResult } from '@/types/pagination.js';

type DrizzleClient = NodePgDatabase<typeof schema>;

export interface ImportSessionData {
  id: string;
  userId: string;
  filename: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  jobId: string | null;
  errorMessage: string | null;
  extractionStatus: 'pending' | 'in_progress' | 'completed';
  extractionProgress: number;
  extractionCompleted: number;
  extractionFailed: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkWithStatus {
  id: string;
  title: string;
  url: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
}

type CreateSessionData = Pick<ImportSessionData, 'userId' | 'filename' | 'totalRows'>;

export interface ImportSessionsRepository {
  cleanupOldSessions(daysOld?: number): Promise<{ sessionsDeleted: number; linksDeleted: number }>;
  countBySession(
    sessionId: string,
    userId: string
  ): Promise<{
    completed: number;
    failed: number;
    pending: number;
    total: number;
  }>;
  create(data: CreateSessionData): Promise<ImportSessionData | null>;
  delete(id: string, userId: string): Promise<boolean>;
  findById(id: string, userId: string): Promise<ImportSessionData | null>;
  findByIdOrThrow(id: string, userId: string): Promise<ImportSessionData>;
  findByUserId(
    userId: string,
    options?: CursorPaginationOptions & { status?: string }
  ): Promise<CursorQueryResult<ImportSessionData>>;
  findLinksBySession(
    sessionId: string,
    userId: string,
    options?: { cursor?: string; limit?: number; status?: string }
  ): Promise<{
    hasMore: boolean;
    links: LinkWithStatus[];
    nextCursor: string | undefined;
  }>;
  findPendingLinksInSession(
    sessionId: string,
    userId: string,
    limitCount?: number
  ): Promise<LinkWithStatus[]>;
  incrementCounts(
    id: string,
    userId: string,
    increments: { failed?: number; imported?: number; skipped?: number }
  ): Promise<ImportSessionData | null>;
  incrementExtractionCounts(
    id: string,
    userId: string,
    increments: { completed?: number; failed?: number }
  ): Promise<ImportSessionData | null>;
  resetProcessingLinksForCancel(sessionId: string, userId: string): Promise<number>;
  retryFailedLinks(sessionId: string, userId: string): Promise<LinkWithStatus[]>;
  updateExtractionStatus(
    id: string,
    userId: string,
    updates: Partial<
      Pick<
        ImportSessionData,
        'extractionCompleted' | 'extractionFailed' | 'extractionProgress' | 'extractionStatus'
      >
    >
  ): Promise<ImportSessionData | null>;
  updateStatus(
    id: string,
    userId: string,
    updates: Partial<
      Pick<ImportSessionData, 'completedAt' | 'errorMessage' | 'startedAt' | 'status'>
    >
  ): Promise<ImportSessionData | null>;
}

const sessionColumns = {
  id: importSessionsTable.id,
  userId: importSessionsTable.userId,
  filename: importSessionsTable.filename,
  totalRows: importSessionsTable.totalRows,
  importedCount: importSessionsTable.importedCount,
  skippedCount: importSessionsTable.skippedCount,
  failedCount: importSessionsTable.failedCount,
  status: importSessionsTable.status,
  jobId: importSessionsTable.jobId,
  errorMessage: importSessionsTable.errorMessage,
  extractionStatus: importSessionsTable.extractionStatus,
  extractionProgress: importSessionsTable.extractionProgress,
  extractionCompleted: importSessionsTable.extractionCompleted,
  extractionFailed: importSessionsTable.extractionFailed,
  startedAt: importSessionsTable.startedAt,
  completedAt: importSessionsTable.completedAt,
  createdAt: importSessionsTable.createdAt,
  updatedAt: importSessionsTable.updatedAt
};

export function createDrizzleImportSessionsAdapter(db: DrizzleClient): ImportSessionsRepository {
  async function findById(id: string, userId: string): Promise<ImportSessionData | null> {
    const [row] = await db
      .select(sessionColumns)
      .from(importSessionsTable)
      .where(and(eq(importSessionsTable.id, id), eq(importSessionsTable.userId, userId)))
      .limit(1);

    return (row as ImportSessionData) ?? null;
  }

  async function incrementExtractionCounts(
    id: string,
    userId: string,
    increments: { completed?: number; failed?: number }
  ): Promise<ImportSessionData | null> {
    const setValues: Record<string, unknown> = { updatedAt: new Date() };

    if (increments.completed !== undefined) {
      setValues.extractionCompleted = sqlFn`${importSessionsTable.extractionCompleted} + ${increments.completed}`;
    }
    if (increments.failed !== undefined) {
      setValues.extractionFailed = sqlFn`${importSessionsTable.extractionFailed} + ${increments.failed}`;
    }

    const [row] = await db
      .update(importSessionsTable)
      .set(setValues)
      .where(and(eq(importSessionsTable.id, id), eq(importSessionsTable.userId, userId)))
      .returning(sessionColumns);

    if (row) {
      const session = row as ImportSessionData;
      const totalProcessed = session.extractionCompleted + session.extractionFailed;
      const progress =
        session.importedCount > 0 ? Math.round((totalProcessed / session.importedCount) * 100) : 0;

      await db
        .update(importSessionsTable)
        .set({ extractionProgress: progress, updatedAt: new Date() })
        .where(and(eq(importSessionsTable.id, id), eq(importSessionsTable.userId, userId)));
    }

    return (row as ImportSessionData) ?? null;
  }

  return {
    findById,
    incrementExtractionCounts,

    async findByIdOrThrow(id, userId) {
      const session = await findById(id, userId);
      if (!session) throw new Error(`Import session ${id} not found`);
      return session;
    },

    async create(data) {
      const [row] = await db
        .insert(importSessionsTable)
        .values({
          userId: data.userId,
          filename: data.filename,
          totalRows: data.totalRows,
          status: 'pending',
          jobId: null,
          errorMessage: null,
          extractionStatus: 'pending',
          extractionProgress: 0,
          extractionCompleted: 0,
          extractionFailed: 0,
          startedAt: null,
          completedAt: null
        })
        .returning(sessionColumns);

      return (row as ImportSessionData) ?? null;
    },

    async delete(id, userId) {
      const rows = await db
        .delete(importSessionsTable)
        .where(and(eq(importSessionsTable.id, id), eq(importSessionsTable.userId, userId)))
        .returning({ id: importSessionsTable.id });

      return rows.length > 0;
    },

    async findByUserId(userId, options) {
      const limit = Math.min(options?.limit ?? 20, 100);
      const cursor = options?.cursor;
      const statusFilter = options?.status;

      const conditions = [eq(importSessionsTable.userId, userId)];

      if (statusFilter && statusFilter !== 'all') {
        conditions.push(
          eq(importSessionsTable.status, statusFilter as ImportSessionData['status'])
        );
      }

      if (cursor) {
        try {
          const cursorData = decodeCursor(cursor);
          conditions.push(lt(importSessionsTable.createdAt, new Date(cursorData.createdAt)));
        } catch (error) {
          logger.error(`Invalid cursor provided for import sessions: ${cursor} ${error}`);
          throw new Error('Invalid cursor format');
        }
      }

      const rows = await db
        .select(sessionColumns)
        .from(importSessionsTable)
        .where(and(...conditions))
        .orderBy(desc(importSessionsTable.createdAt))
        .limit(limit + 1);

      if (rows.length === 0) return { items: [], hasMore: false, nextCursor: undefined };

      const { items, hasMore } = pageRows(rows, limit);
      const nextCursor = hasMore
        ? extractCursor(
            items.map((item) => ({
              createdAt: item.createdAt.toISOString(),
              id: item.id
            }))
          )
        : undefined;

      return { items: items as ImportSessionData[], hasMore, nextCursor };
    },

    async updateStatus(id, userId, updates) {
      const [row] = await db
        .update(importSessionsTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(importSessionsTable.id, id), eq(importSessionsTable.userId, userId)))
        .returning(sessionColumns);

      return (row as ImportSessionData) ?? null;
    },

    async updateExtractionStatus(id, userId, updates) {
      const [row] = await db
        .update(importSessionsTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(importSessionsTable.id, id), eq(importSessionsTable.userId, userId)))
        .returning(sessionColumns);

      return (row as ImportSessionData) ?? null;
    },

    async incrementCounts(id, userId, increments) {
      const setValues: Record<string, unknown> = { updatedAt: new Date() };

      if (increments.imported !== undefined) {
        setValues.importedCount = sqlFn`${importSessionsTable.importedCount} + ${increments.imported}`;
      }
      if (increments.skipped !== undefined) {
        setValues.skippedCount = sqlFn`${importSessionsTable.skippedCount} + ${increments.skipped}`;
      }
      if (increments.failed !== undefined) {
        setValues.failedCount = sqlFn`${importSessionsTable.failedCount} + ${increments.failed}`;
      }

      const [row] = await db
        .update(importSessionsTable)
        .set(setValues)
        .where(and(eq(importSessionsTable.id, id), eq(importSessionsTable.userId, userId)))
        .returning(sessionColumns);

      return (row as ImportSessionData) ?? null;
    },

    async findLinksBySession(sessionId, userId, options) {
      const limit = Math.min(options?.limit ?? 50, 100);
      const statusFilter = options?.status;
      const cursor = options?.cursor;

      const conditions = [eq(linksTable.importSessionId, sessionId), eq(linksTable.userId, userId)];

      if (statusFilter && statusFilter !== 'all') {
        conditions.push(
          eq(linksTable.processingStatus, statusFilter as LinkWithStatus['processingStatus'])
        );
      }

      if (cursor) {
        try {
          const cursorData = decodeCursor(cursor);
          conditions.push(lt(linksTable.createdAt, cursorData.createdAt));
        } catch (error) {
          logger.error(`Invalid cursor provided for session links: ${cursor} ${error}`);
          throw new Error('Invalid cursor format');
        }
      }

      const rows = await db
        .select({
          id: linksTable.id,
          title: linksTable.title,
          url: linksTable.url,
          processingStatus: linksTable.processingStatus,
          errorMessage: linksTable.errorMessage,
          createdAt: linksTable.createdAt
        })
        .from(linksTable)
        .where(and(...conditions))
        .orderBy(desc(linksTable.createdAt))
        .limit(limit + 1);

      const { items: resultRows, hasMore } = pageRows(rows, limit);
      const links = resultRows.map((row) => ({
        id: row.id,
        title: row.title,
        url: row.url,
        processingStatus: row.processingStatus as LinkWithStatus['processingStatus'],
        errorMessage: row.errorMessage
      }));

      const nextCursor = extractCursor(
        resultRows.map((item) => ({ createdAt: item.createdAt, id: item.id }))
      );

      return { links, hasMore, nextCursor };
    },

    async findPendingLinksInSession(sessionId, userId, limitCount = 1) {
      const rows = await db
        .select({
          id: linksTable.id,
          title: linksTable.title,
          url: linksTable.url,
          processingStatus: linksTable.processingStatus,
          errorMessage: linksTable.errorMessage
        })
        .from(linksTable)
        .where(
          and(
            eq(linksTable.importSessionId, sessionId),
            eq(linksTable.userId, userId),
            eq(linksTable.processingStatus, 'pending')
          )
        )
        .limit(limitCount);

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        url: row.url,
        processingStatus: row.processingStatus as LinkWithStatus['processingStatus'],
        errorMessage: row.errorMessage
      }));
    },

    async countBySession(sessionId, userId) {
      const allRows = await db
        .select({ processingStatus: linksTable.processingStatus })
        .from(linksTable)
        .where(and(eq(linksTable.importSessionId, sessionId), eq(linksTable.userId, userId)));

      return {
        total: allRows.length,
        completed: allRows.filter((r) => r.processingStatus === 'completed').length,
        failed: allRows.filter((r) => r.processingStatus === 'failed').length,
        pending: allRows.filter((r) => r.processingStatus === 'pending').length
      };
    },

    async resetProcessingLinksForCancel(sessionId, userId) {
      const result = await db
        .update(linksTable)
        .set({
          processingStatus: 'pending',
          processingStartedAt: null,
          errorMessage: 'Import cancelled - reset for retry',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(linksTable.importSessionId, sessionId),
            eq(linksTable.userId, userId),
            eq(linksTable.processingStatus, 'processing')
          )
        );

      return Number(result.rowCount ?? 0);
    },

    async retryFailedLinks(sessionId, userId) {
      const failedLinks = await db
        .select({
          id: linksTable.id,
          title: linksTable.title,
          url: linksTable.url,
          processingStatus: linksTable.processingStatus,
          errorMessage: linksTable.errorMessage
        })
        .from(linksTable)
        .where(
          and(
            eq(linksTable.importSessionId, sessionId),
            eq(linksTable.userId, userId),
            eq(linksTable.processingStatus, 'failed')
          )
        );

      if (failedLinks.length === 0) return [];

      const linkIds = failedLinks.map((link) => link.id);

      await db
        .update(linksTable)
        .set({
          processingStatus: 'pending',
          errorMessage: null,
          updatedAt: new Date()
        })
        .where(and(eq(linksTable.importSessionId, sessionId), inArray(linksTable.id, linkIds)));

      logger.info(
        `[import-sessions] Reset ${failedLinks.length} failed links to pending for session ${sessionId}`
      );

      return failedLinks.map((row) => ({
        id: row.id,
        title: row.title,
        url: row.url,
        processingStatus: 'pending' as const,
        errorMessage: null
      }));
    },

    async cleanupOldSessions(daysOld = 90) {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const oldSessionRows = await db
        .select({ id: importSessionsTable.id })
        .from(importSessionsTable)
        .where(lt(importSessionsTable.createdAt, cutoffDate));

      const oldSessionIds = oldSessionRows.map((r) => r.id);

      if (oldSessionIds.length === 0) return { sessionsDeleted: 0, linksDeleted: 0 };

      logger.info(
        `[import-sessions] Found ${oldSessionIds.length} sessions older than ${daysOld} days`
      );

      let linksDeleted = 0;

      for (const sessionId of oldSessionIds) {
        const linkIds = await db
          .select({ id: linksTable.id })
          .from(linksTable)
          .where(eq(linksTable.importSessionId, sessionId));

        if (linkIds.length > 0) {
          const linkIdList = linkIds.map((l) => l.id);
          await db.delete(linkTagsTable).where(inArray(linkTagsTable.linkId, linkIdList));

          const deleteResult = await db
            .delete(linksTable)
            .where(eq(linksTable.importSessionId, sessionId));
          linksDeleted += Number(deleteResult.rowCount ?? 0);
        }

        await db.delete(importSessionsTable).where(eq(importSessionsTable.id, sessionId));
      }

      logger.info(
        `[import-sessions] Cleaned up ${oldSessionIds.length} sessions, ${linksDeleted} links deleted`
      );

      return { sessionsDeleted: oldSessionIds.length, linksDeleted };
    }
  };
}
