import type { LinkListItem, LinksRepository } from '@/repositories/links.repository.js';

import type { LinkData } from '@/types/links.js';
import type { Tag } from '@/types/tags.js';

export function createInMemoryLinksAdapter(
  tagLinkRelations = new Map<string, Tag[]>()
): LinksRepository {
  const store = new Map<string, LinkData>();

  return {
    create: async (linkData) => {
      const link: LinkData = {
        ...linkData,
        id: crypto.randomUUID(),
        coverImage: null,
        errorMessage: null,
        favicon: null,
        processingStartedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date()
      };
      store.set(link.id, link);
      return link;
    },

    delete: async (id, userId) => {
      const existing = store.get(id);
      if (!existing || existing.userId !== userId) return false;
      store.delete(id);
      return true;
    },

    update: async (id, userId, updates) => {
      const existing = store.get(id);
      if (!existing || existing.userId !== userId) return null;
      const updated = { ...existing, ...updates };
      store.set(id, updated);
      return updated;
    },

    findById: async (id, userId) => {
      const link = store.get(id);
      if (!link || link.userId !== userId) return null;
      return link;
    },

    findMany: async (userId, _options) => {
      const items = [...store.values()].filter((l) => l.userId === userId);
      return { items, hasMore: false, nextCursor: undefined } as unknown as Awaited<
        ReturnType<LinksRepository['findMany']>
      >;
    },

    findByIdDetailed: async (id, userId) => {
      const link = store.get(id);
      if (!link || link.userId !== userId) return null;
      return { ...link, tags: [], highlights: [] } as unknown as Awaited<
        ReturnType<LinksRepository['findByIdDetailed']>
      >;
    },

    addTags: async () => [],

    findUpcoming: async () => [],

    getHomeSuggestions: async () => ({
      continueReading: null,
      hasReadArticle: false,
      recentlySaved: [],
      longReads: { totalArticles: 0, totalReadingTime: 0 },
      shortReads: { totalArticles: 0, totalReadingTime: 0 }
    }),

    search: async (userId, query, filters, _options) => {
      let items = [...store.values()].filter((l) => l.userId === userId);

      const q = query?.trim().toLowerCase() ?? '';
      if (q) {
        items = items.filter(
          (l) => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
        );
      }
      if (filters?.isFavorite !== undefined)
        items = items.filter((l) => l.isFavorite === filters.isFavorite);
      if (filters?.isRead !== undefined) items = items.filter((l) => l.isRead === filters.isRead);
      if (filters?.isArchived !== undefined)
        items = items.filter((l) => l.isArchived === filters.isArchived);

      return { items: items as unknown as LinkListItem[], hasMore: false, nextCursor: undefined };
    },

    getTagsForLink: async (linkId, _userId) => tagLinkRelations.get(linkId) ?? [],

    findAllUrls: async (userId) =>
      [...store.values()].filter((l) => l.userId === userId).map((l) => l.url),

    existsByUrl: async (url, userId) =>
      [...store.values()].some((l) => l.url === url && l.userId === userId)
  };
}
