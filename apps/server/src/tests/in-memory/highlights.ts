import type { HighlightsRepository } from '@/repositories/highlights.repository.js';

import type { Highlight } from '@/types/highlights.js';

export function createInMemoryHighlightsAdapter(): HighlightsRepository {
  const store = new Map<string, Highlight>();

  return {
    create: async (highlightData) => {
      const highlight: Highlight = {
        ...highlightData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      store.set(highlight.id, highlight);
      const { userId: _, ...rest } = highlight;
      return rest;
    },

    delete: async (id, userId) => {
      const existing = store.get(id);
      if (!existing || existing.userId !== userId) return false;
      store.delete(id);
      return true;
    },

    findByLinkId: async (linkId, userId) =>
      [...store.values()].filter((h) => h.linkId === linkId && h.userId === userId),

    update: async (id, userId, updates) => {
      const existing = store.get(id);
      if (!existing || existing.userId !== userId) return null;
      const updated = { ...existing, ...updates };
      store.set(id, updated);
      const { userId: _, ...rest } = updated;
      return rest;
    }
  };
}
