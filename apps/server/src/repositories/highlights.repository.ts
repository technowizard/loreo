import { and, asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from '@/db/schemas/index.js';
import { highlightsTable } from '@/db/schemas/index.js';

import { logger } from '@/lib/logger.js';

import type { Highlight } from '@/types/highlights.js';

type DrizzleClient = NodePgDatabase<typeof schema>;

export interface HighlightsRepository {
  create(
    highlightData: Omit<Highlight, 'id' | 'createdAt'>
  ): Promise<Omit<Highlight, 'userId'> | null>;
  delete(id: string, userId: string): Promise<boolean>;
  findByLinkId(linkId: string, userId: string): Promise<Highlight[]>;
  update(
    id: string,
    userId: string,
    updates: Partial<Omit<Highlight, 'createdAt'>>
  ): Promise<Omit<Highlight, 'userId'> | null>;
}

export function createDrizzleHighlightsAdapter(db: DrizzleClient): HighlightsRepository {
  return {
    async create(highlightData) {
      const [createdHighlight] = await db
        .insert(highlightsTable)
        .values({
          color: highlightData.color,
          endOffset: highlightData.endOffset,
          linkId: highlightData.linkId,
          note: highlightData.note,
          startOffset: highlightData.startOffset,
          text: highlightData.text,
          userId: highlightData.userId
        })
        .returning({
          color: highlightsTable.color,
          createdAt: highlightsTable.createdAt,
          endOffset: highlightsTable.endOffset,
          id: highlightsTable.id,
          linkId: highlightsTable.linkId,
          note: highlightsTable.note,
          startOffset: highlightsTable.startOffset,
          text: highlightsTable.text
        });

      if (!createdHighlight) {
        throw new Error('Failed to create highlight');
      }

      return createdHighlight;
    },

    async delete(id, userId) {
      const [deleted] = await db
        .delete(highlightsTable)
        .where(and(eq(highlightsTable.id, id), eq(highlightsTable.userId, userId)))
        .returning({ id: highlightsTable.id });

      return deleted?.id === id;
    },

    async findByLinkId(linkId, userId) {
      return await db.query.highlightsTable.findMany({
        where: and(eq(highlightsTable.linkId, linkId), eq(highlightsTable.userId, userId)),
        orderBy: asc(highlightsTable.startOffset)
      });
    },

    async update(id, userId, updates) {
      const [updatedHighlight] = await db
        .update(highlightsTable)
        .set(updates)
        .where(and(eq(highlightsTable.id, id), eq(highlightsTable.userId, userId)))
        .returning({
          color: highlightsTable.color,
          createdAt: highlightsTable.createdAt,
          endOffset: highlightsTable.endOffset,
          id: highlightsTable.id,
          linkId: highlightsTable.linkId,
          note: highlightsTable.note,
          startOffset: highlightsTable.startOffset,
          text: highlightsTable.text
        });

      if (!updatedHighlight) {
        logger.warn(`No highlights found for id: ${id}, userId: ${userId}`);
        return null;
      }

      return updatedHighlight;
    }
  };
}
