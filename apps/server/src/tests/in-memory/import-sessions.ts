import type {
  ImportSessionData,
  ImportSessionsRepository,
  LinkWithStatus
} from '@/repositories/import-sessions.repository.js';

export function createInMemoryImportSessionsAdapter(): {
  repo: ImportSessionsRepository;
  seedSession: (
    id: string,
    userId: string,
    overrides?: Partial<ImportSessionData>
  ) => ImportSessionData;
} {
  const store = new Map<string, ImportSessionData>();
  const linksBySession = new Map<string, LinkWithStatus[]>();

  function seedSession(
    id: string,
    userId: string,
    overrides: Partial<ImportSessionData> = {}
  ): ImportSessionData {
    const session: ImportSessionData = {
      id,
      userId,
      filename: 'test.csv',
      totalRows: 0,
      importedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      status: 'pending',
      jobId: null,
      errorMessage: null,
      extractionStatus: 'pending',
      extractionProgress: 0,
      extractionCompleted: 0,
      extractionFailed: 0,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
    store.set(id, session);
    return session;
  }

  const repo: ImportSessionsRepository = {
    create: async (data) => {
      const session: ImportSessionData = {
        ...data,
        id: crypto.randomUUID(),
        importedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        status: 'pending',
        jobId: null,
        errorMessage: null,
        extractionStatus: 'pending',
        extractionProgress: 0,
        extractionCompleted: 0,
        extractionFailed: 0,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.set(session.id, session);
      return session;
    },

    delete: async (id, userId) => {
      const existing = store.get(id);
      if (!existing || existing.userId !== userId) return false;
      store.delete(id);
      return true;
    },

    findById: async (id, userId) => {
      const session = store.get(id);
      if (!session || session.userId !== userId) return null;
      return session;
    },

    findByIdOrThrow: async (id, userId) => {
      const session = store.get(id);
      if (!session || session.userId !== userId) throw new Error(`Import session ${id} not found`);
      return session;
    },

    findByUserId: async (userId, _options) => {
      const items = [...store.values()].filter((s) => s.userId === userId);
      return { items, hasMore: false, nextCursor: undefined };
    },

    updateStatus: async (id, userId, updates) => {
      const existing = store.get(id);
      if (!existing || existing.userId !== userId) return null;
      const updated = { ...existing, ...updates, updatedAt: new Date() };
      store.set(id, updated);
      return updated;
    },

    updateExtractionStatus: async (id, userId, updates) => {
      const existing = store.get(id);
      if (!existing || existing.userId !== userId) return null;
      const updated = { ...existing, ...updates, updatedAt: new Date() };
      store.set(id, updated);
      return updated;
    },

    incrementCounts: async (id, userId, increments) => {
      const existing = store.get(id);
      if (!existing || existing.userId !== userId) return null;
      const updated: ImportSessionData = {
        ...existing,
        importedCount: existing.importedCount + (increments.imported ?? 0),
        skippedCount: existing.skippedCount + (increments.skipped ?? 0),
        failedCount: existing.failedCount + (increments.failed ?? 0),
        updatedAt: new Date()
      };
      store.set(id, updated);
      return updated;
    },

    incrementExtractionCounts: async (id, userId, increments) => {
      const existing = store.get(id);
      if (!existing || existing.userId !== userId) return null;
      const updated: ImportSessionData = {
        ...existing,
        extractionCompleted: existing.extractionCompleted + (increments.completed ?? 0),
        extractionFailed: existing.extractionFailed + (increments.failed ?? 0),
        updatedAt: new Date()
      };
      store.set(id, updated);
      return updated;
    },

    findLinksBySession: async (sessionId, _userId, _options) => {
      const links = linksBySession.get(sessionId) ?? [];
      return { links, hasMore: false, nextCursor: undefined };
    },

    findPendingLinksInSession: async (sessionId, _userId, limitCount = 1) => {
      const links = linksBySession.get(sessionId) ?? [];
      return links.filter((l) => l.processingStatus === 'pending').slice(0, limitCount);
    },

    countBySession: async (sessionId, _userId) => {
      const links = linksBySession.get(sessionId) ?? [];
      return {
        total: links.length,
        completed: links.filter((l) => l.processingStatus === 'completed').length,
        failed: links.filter((l) => l.processingStatus === 'failed').length,
        pending: links.filter((l) => l.processingStatus === 'pending').length
      };
    },

    resetProcessingLinksForCancel: async () => 0,

    retryFailedLinks: async () => [],

    cleanupOldSessions: async () => ({ sessionsDeleted: 0, linksDeleted: 0 })
  };

  return { repo, seedSession };
}
