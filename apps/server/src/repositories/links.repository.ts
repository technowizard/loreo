import { and, asc, desc, eq, gt, gte, ilike, inArray, isNotNull, lt, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from '@/db/schemas/index.js';
import {
  highlightsTable,
  linksTable,
  linkTagsTable,
  tagGroupsTable,
  tagsTable
} from '@/db/schemas/index.js';

import { decodeCursor, extractCursor } from '@/lib/cursor.js';
import { logger } from '@/lib/logger.js';

import type { Highlight } from '@/types/highlights.js';
import type { HomeSuggestions, LinkData } from '@/types/links.js';
import type { CursorPaginationOptions, CursorQueryResult } from '@/types/pagination.js';
import type { LinkTags, Tag } from '@/types/tags.js';

type DrizzleClient = NodePgDatabase<typeof schema>;

// Tags returned from list/detail queries include the group color (joined from tagGroupsTable)
type TagWithGroupColor = { id: string; groupId: string; name: string; color: string };

// Highlights stripped of relational ids — safe to expose in list/detail views
type LinkHighlight = {
  id: string;
  color: string;
  text: string | null;
  note: string | null;
  startOffset: number;
  endOffset: number;
  createdAt: string;
};

// Omit 'highlights'/'tags' from LinkData to avoid conflict with the enriched shapes below
export type LinkListItem = Omit<LinkData, 'content' | 'userId' | 'highlights' | 'tags'> & {
  tags: TagWithGroupColor[];
  highlights: LinkHighlight[];
};

type LinkDetailItem = Omit<LinkData, 'userId' | 'highlights' | 'tags'> & {
  tags: TagWithGroupColor[];
  highlights: LinkHighlight[];
};

type LinkSearchFilters = {
  hasHighlights?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  isRead?: boolean;
  priority?: string;
  processingStatus?: string;
  readLength?: 'short' | 'long';
  sortBy?: 'newest' | 'oldest' | 'shortest' | 'longest';
  tagGroups?: string;
  tagNames?: string;
};

export interface LinksRepository {
  create(
    linkData: Omit<
      LinkData,
      'id' | 'coverImage' | 'errorMessage' | 'favicon' | 'processingStartedAt'
    >
  ): Promise<LinkData | null>;
  delete(id: string, userId: string): Promise<boolean>;
  update(id: string, userId: string, updates: Partial<LinkData>): Promise<LinkData | null>;
  findById(id: string, userId: string): Promise<LinkData | null>;
  findMany(
    userId: string,
    options?: CursorPaginationOptions
  ): Promise<CursorQueryResult<LinkListItem>>;
  findByIdDetailed(id: string, userId: string): Promise<LinkDetailItem | null>;
  addTags(linkId: string, tagIds: string[], userId: string): Promise<LinkTags[]>;
  findUpcoming(userId: string, currentArticleId: string): Promise<LinkData[]>;
  getHomeSuggestions(userId: string): Promise<HomeSuggestions>;
  search(
    userId: string,
    searchQuery?: string,
    filters?: LinkSearchFilters,
    options?: CursorPaginationOptions
  ): Promise<CursorQueryResult<LinkListItem>>;
  getTagsForLink(linkId: string, userId: string): Promise<Tag[]>;
  findAllUrls(userId: string): Promise<string[]>;
  existsByUrl(url: string, userId: string): Promise<boolean>;
}

export function createDrizzleLinksAdapter(db: DrizzleClient): LinksRepository {
  // Named function so getHomeSuggestions can call it without `this`
  async function findMany(
    userId: string,
    options?: CursorPaginationOptions
  ): Promise<CursorQueryResult<LinkListItem>> {
    try {
      const limit = Math.min(options?.limit ?? 50, 100);
      const cursor = options?.cursor;
      const orderDirection = options?.orderDirection ?? 'desc';
      const ascending = orderDirection === 'asc';

      const primaryOrderColumn = linksTable.createdAt;
      const secondaryOrderColumn = linksTable.id;

      const whereConditions = [eq(linksTable.userId, userId)];

      if (cursor) {
        try {
          const cursorData = decodeCursor(cursor);
          if (orderDirection === 'desc') {
            whereConditions.push(
              or(
                lt(linksTable.createdAt, cursorData.createdAt),
                and(
                  eq(linksTable.createdAt, cursorData.createdAt),
                  lt(linksTable.id, cursorData.id)
                )
              )!
            );
          } else {
            whereConditions.push(
              or(
                gt(linksTable.createdAt, cursorData.createdAt),
                and(
                  eq(linksTable.createdAt, cursorData.createdAt),
                  gt(linksTable.id, cursorData.id)
                )
              )!
            );
          }
        } catch (error) {
          logger.error(`Invalid cursor provided: ${cursor} ${error}`);
          throw new Error('Invalid cursor format');
        }
      }

      const baseLinks = await db
        .select({
          author: linksTable.author,
          coverImage: linksTable.coverImage,
          createdAt: linksTable.createdAt,
          errorMessage: linksTable.errorMessage,
          excerpt: linksTable.excerpt,
          favicon: linksTable.favicon,
          id: linksTable.id,
          isArchived: linksTable.isArchived,
          isFavorite: linksTable.isFavorite,
          isPaywalled: linksTable.isPaywalled,
          isRead: linksTable.isRead,
          lastReadAt: linksTable.lastReadAt,
          priority: linksTable.priority,
          processingStatus: linksTable.processingStatus,
          publishedAt: linksTable.publishedAt,
          readingProgress: linksTable.readingProgress,
          readingTime: linksTable.readingTime,
          textContent: linksTable.textContent,
          timeSpentReading: linksTable.timeSpentReading,
          title: linksTable.title,
          updatedAt: linksTable.updatedAt,
          url: linksTable.url
        })
        .from(linksTable)
        .where(and(...whereConditions))
        .orderBy(
          ascending ? asc(primaryOrderColumn) : desc(primaryOrderColumn),
          ascending ? asc(secondaryOrderColumn) : desc(secondaryOrderColumn)
        )
        .limit(limit + 1);

      if (baseLinks.length === 0) {
        return { items: [], hasMore: false, nextCursor: undefined };
      }

      const hasMore = baseLinks.length > limit;
      const items = hasMore ? baseLinks.slice(0, -1) : baseLinks;
      const linkIds = items.map((l) => l.id);
      const nextCursor = hasMore ? extractCursor(items) : undefined;

      const tagRows = await db
        .select({
          groupId: tagsTable.groupId,
          color: tagGroupsTable.color,
          id: tagsTable.id,
          linkId: linkTagsTable.linkId,
          name: tagsTable.name
        })
        .from(linkTagsTable)
        .innerJoin(tagsTable, eq(linkTagsTable.tagId, tagsTable.id))
        .innerJoin(tagGroupsTable, eq(tagsTable.groupId, tagGroupsTable.id))
        .where(and(inArray(linkTagsTable.linkId, linkIds), eq(linkTagsTable.userId, userId)));

      const tagsByLinkId = new Map<string, TagWithGroupColor[]>();
      for (const row of tagRows) {
        const list = tagsByLinkId.get(row.linkId) ?? [];
        list.push({ groupId: row.groupId, color: row.color, id: row.id, name: row.name });
        tagsByLinkId.set(row.linkId, list);
      }

      const highlightRows = await db
        .select({
          color: highlightsTable.color,
          createdAt: highlightsTable.createdAt,
          endOffset: highlightsTable.endOffset,
          id: highlightsTable.id,
          linkId: highlightsTable.linkId,
          note: highlightsTable.note,
          startOffset: highlightsTable.startOffset,
          text: highlightsTable.text
        })
        .from(highlightsTable)
        .where(and(inArray(highlightsTable.linkId, linkIds), eq(highlightsTable.userId, userId)));

      const highlightsByLinkId = new Map<string, LinkHighlight[]>();
      for (const row of highlightRows) {
        const list = highlightsByLinkId.get(row.linkId) ?? [];
        list.push({
          color: row.color,
          createdAt: row.createdAt,
          endOffset: row.endOffset,
          id: row.id,
          note: row.note,
          startOffset: row.startOffset,
          text: row.text
        });
        highlightsByLinkId.set(row.linkId, list);
      }

      const merged: LinkListItem[] = items.map((l) => ({
        ...l,
        highlights: highlightsByLinkId.get(l.id) ?? [],
        tags: tagsByLinkId.get(l.id) ?? []
      }));

      return { items: merged, hasMore, nextCursor };
    } catch (error) {
      logger.error(`Error finding links with tags in repository: ${error}`);
      throw error;
    }
  }

  return {
    async create(linkData) {
      try {
        const [link] = await db.insert(linksTable).values(linkData).returning();
        return link as LinkData;
      } catch (error) {
        logger.error(`Error creating link in repository: ${error}`);
        throw error;
      }
    },

    async delete(id, userId) {
      try {
        const deleted = await db
          .delete(linksTable)
          .where(and(eq(linksTable.id, id), eq(linksTable.userId, userId)))
          .returning();
        return deleted.length > 0;
      } catch (error) {
        logger.error(`Error deleting link in repository: ${error}`);
        throw error;
      }
    },

    async update(id, userId, updates) {
      try {
        const [updatedLink] = await db
          .update(linksTable)
          .set(updates)
          .where(and(eq(linksTable.id, id), eq(linksTable.userId, userId)))
          .returning();
        return updatedLink ?? null;
      } catch (error) {
        logger.error(`Error updating link in repository: ${error}`);
        throw error;
      }
    },

    async findById(id, userId) {
      try {
        const [link] = await db
          .select()
          .from(linksTable)
          .where(and(eq(linksTable.id, id), eq(linksTable.userId, userId)))
          .limit(1);
        return link ?? null;
      } catch (error) {
        logger.error(`Error finding link by id in repository: ${error}`);
        throw error;
      }
    },

    findMany,

    async findByIdDetailed(id, userId) {
      try {
        const [link] = await db
          .select({
            author: linksTable.author,
            content: linksTable.content,
            coverImage: linksTable.coverImage,
            createdAt: linksTable.createdAt,
            errorMessage: linksTable.errorMessage,
            excerpt: linksTable.excerpt,
            favicon: linksTable.favicon,
            id: linksTable.id,
            isArchived: linksTable.isArchived,
            isFavorite: linksTable.isFavorite,
            isPaywalled: linksTable.isPaywalled,
            isRead: linksTable.isRead,
            lastReadAt: linksTable.lastReadAt,
            priority: linksTable.priority,
            processingStatus: linksTable.processingStatus,
            publishedAt: linksTable.publishedAt,
            readingProgress: linksTable.readingProgress,
            readingTime: linksTable.readingTime,
            textContent: linksTable.textContent,
            timeSpentReading: linksTable.timeSpentReading,
            title: linksTable.title,
            updatedAt: linksTable.updatedAt,
            url: linksTable.url
          })
          .from(linksTable)
          .where(and(eq(linksTable.id, id), eq(linksTable.userId, userId)))
          .limit(1);

        if (!link) return null;

        const tagRows = await db
          .select({
            groupId: tagsTable.groupId,
            color: tagGroupsTable.color,
            id: tagsTable.id,
            name: tagsTable.name
          })
          .from(linkTagsTable)
          .innerJoin(tagsTable, eq(linkTagsTable.tagId, tagsTable.id))
          .innerJoin(tagGroupsTable, eq(tagsTable.groupId, tagGroupsTable.id))
          .where(and(eq(linkTagsTable.linkId, id), eq(linkTagsTable.userId, userId)));

        const highlights = await db.query.highlightsTable.findMany({
          where: and(eq(highlightsTable.linkId, id), eq(highlightsTable.userId, userId)),
          orderBy: asc(highlightsTable.startOffset)
        });

        const tagWithGroupColors: TagWithGroupColor[] = tagRows.map((t) => ({
          groupId: t.groupId,
          color: t.color,
          id: t.id,
          name: t.name
        }));

        const linkHighlights: LinkHighlight[] = highlights.map((h) => ({
          color: h.color,
          createdAt: h.createdAt,
          endOffset: h.endOffset,
          id: h.id,
          note: h.note,
          startOffset: h.startOffset,
          text: h.text
        }));

        return { ...link, highlights: linkHighlights, tags: tagWithGroupColors };
      } catch (error) {
        logger.error(`Error finding link with details by id in repository: ${error}`);
        throw error;
      }
    },

    async addTags(linkId, tagIds, userId) {
      try {
        if (tagIds.length === 0) return [];
        const rows = await db
          .insert(linkTagsTable)
          .values(tagIds.map((tagId) => ({ linkId, tagId, userId })))
          .onConflictDoNothing()
          .returning({
            id: linkTagsTable.id,
            linkId: linkTagsTable.linkId,
            tagId: linkTagsTable.tagId,
            createdAt: linkTagsTable.createdAt
          });
        return rows;
      } catch (error) {
        logger.error(`Error adding tags to link in repository: ${error}`);
        throw error;
      }
    },

    async findUpcoming(userId, currentArticleId) {
      try {
        const [current] = await db
          .select({ createdAt: linksTable.createdAt })
          .from(linksTable)
          .where(and(eq(linksTable.id, currentArticleId), eq(linksTable.userId, userId)))
          .limit(1);

        if (!current) return [];

        const base = await db
          .select({
            author: linksTable.author,
            coverImage: linksTable.coverImage,
            createdAt: linksTable.createdAt,
            errorMessage: linksTable.errorMessage,
            excerpt: linksTable.excerpt,
            favicon: linksTable.favicon,
            id: linksTable.id,
            isArchived: linksTable.isArchived,
            isFavorite: linksTable.isFavorite,
            isRead: linksTable.isRead,
            lastReadAt: linksTable.lastReadAt,
            priority: linksTable.priority,
            processingStatus: linksTable.processingStatus,
            publishedAt: linksTable.publishedAt,
            readingProgress: linksTable.readingProgress,
            readingTime: linksTable.readingTime,
            timeSpentReading: linksTable.timeSpentReading,
            title: linksTable.title,
            updatedAt: linksTable.updatedAt,
            url: linksTable.url
          })
          .from(linksTable)
          .where(and(eq(linksTable.userId, userId), lt(linksTable.createdAt, current.createdAt)))
          .orderBy(desc(linksTable.createdAt))
          .limit(3);

        if (base.length === 0) return [];

        const linkIds = base.map((l) => l.id);

        const tagRows = await db
          .select({
            groupId: tagsTable.groupId,
            color: tagGroupsTable.color,
            createdAt: tagsTable.createdAt,
            id: tagsTable.id,
            linkId: linkTagsTable.linkId,
            name: tagsTable.name
          })
          .from(linkTagsTable)
          .innerJoin(tagsTable, eq(linkTagsTable.tagId, tagsTable.id))
          .innerJoin(tagGroupsTable, eq(tagsTable.groupId, tagGroupsTable.id))
          .where(and(inArray(linkTagsTable.linkId, linkIds), eq(linkTagsTable.userId, userId)));

        const tagsByLinkId = new Map<string, Omit<Tag & { color: string }, 'userId'>[]>();
        for (const row of tagRows) {
          const list = tagsByLinkId.get(row.linkId) ?? [];
          list.push({
            groupId: row.groupId,
            id: row.id,
            name: row.name,
            createdAt: row.createdAt,
            color: row.color
          });
          tagsByLinkId.set(row.linkId, list);
        }

        const highlightRows = await db
          .select({
            color: highlightsTable.color,
            createdAt: highlightsTable.createdAt,
            endOffset: highlightsTable.endOffset,
            id: highlightsTable.id,
            linkId: highlightsTable.linkId,
            note: highlightsTable.note,
            startOffset: highlightsTable.startOffset,
            text: highlightsTable.text
          })
          .from(highlightsTable)
          .where(inArray(highlightsTable.linkId, linkIds));

        const highlightsByLinkId = new Map<string, Omit<Highlight, 'linkId' | 'userId'>[]>();
        for (const row of highlightRows) {
          const list = highlightsByLinkId.get(row.linkId) ?? [];
          list.push({
            color: row.color,
            createdAt: row.createdAt,
            endOffset: row.endOffset,
            id: row.id,
            note: row.note,
            startOffset: row.startOffset,
            text: row.text
          });
          highlightsByLinkId.set(row.linkId, list);
        }

        return base.map((l) => ({
          ...l,
          highlights: highlightsByLinkId.get(l.id) ?? [],
          tags: tagsByLinkId.get(l.id) ?? []
        })) as unknown as LinkData[];
      } catch (error) {
        logger.error(`Error finding upcoming articles in repository: ${error}`);
        throw error;
      }
    },

    async getHomeSuggestions(userId) {
      try {
        const [cont] = await db
          .select({
            coverImage: linksTable.coverImage,
            id: linksTable.id,
            lastReadAt: linksTable.lastReadAt,
            readingProgress: linksTable.readingProgress,
            readingTime: linksTable.readingTime,
            title: linksTable.title
          })
          .from(linksTable)
          .where(
            and(
              eq(linksTable.userId, userId),
              eq(linksTable.isRead, false),
              eq(linksTable.processingStatus, 'completed'),
              or(gt(linksTable.readingProgress, 0), isNotNull(linksTable.lastReadAt))
            )
          )
          .orderBy(desc(linksTable.lastReadAt))
          .limit(1);

        const continueReading = cont
          ? {
              coverImage: cont.coverImage,
              id: cont.id,
              lastReadAt: cont.lastReadAt || new Date().toISOString(),
              progress: cont.readingProgress || 0,
              readingTime: cont.readingTime || 0,
              title: cont.title || 'Untitled'
            }
          : null;

        const shortRows = await db
          .select({ readingTime: linksTable.readingTime })
          .from(linksTable)
          .where(
            and(
              eq(linksTable.userId, userId),
              eq(linksTable.isRead, false),
              eq(linksTable.isArchived, false),
              eq(linksTable.processingStatus, 'completed'),
              lt(linksTable.readingTime, 10)
            )
          );

        const longRows = await db
          .select({ readingTime: linksTable.readingTime })
          .from(linksTable)
          .where(
            and(
              eq(linksTable.userId, userId),
              eq(linksTable.isRead, false),
              eq(linksTable.isArchived, false),
              eq(linksTable.processingStatus, 'completed'),
              gte(linksTable.readingTime, 10)
            )
          );

        const recentlySaved = await findMany(userId, { limit: 3, orderDirection: 'desc' });

        const [readArticle] = await db
          .select({ id: linksTable.id })
          .from(linksTable)
          .where(
            and(
              eq(linksTable.userId, userId),
              or(eq(linksTable.isRead, true), gt(linksTable.readingProgress, 25))
            )
          )
          .limit(1);

        return {
          continueReading,
          hasReadArticle: readArticle != null,
          longReads: {
            totalArticles: longRows.length,
            totalReadingTime: longRows.reduce((sum, r) => sum + (r.readingTime || 0), 0)
          },
          recentlySaved: recentlySaved.items as unknown as HomeSuggestions['recentlySaved'],
          shortReads: {
            totalArticles: shortRows.length,
            totalReadingTime: shortRows.reduce((sum, r) => sum + (r.readingTime || 0), 0)
          }
        };
      } catch (error) {
        logger.error(`Error getting home suggestions in repository: ${error}`);
        throw error;
      }
    },

    async search(userId, searchQuery, filters, options) {
      try {
        const limit = Math.min(options?.limit ?? 50, 100);
        const cursor = options?.cursor;
        const whereClauses: ReturnType<typeof eq>[] = [eq(linksTable.userId, userId)];

        if (cursor) {
          try {
            const cursorData = decodeCursor(cursor);
            whereClauses.push(
              or(
                lt(linksTable.createdAt, cursorData.createdAt),
                and(
                  eq(linksTable.createdAt, cursorData.createdAt),
                  lt(linksTable.id, cursorData.id)
                )
              ) as ReturnType<typeof eq>
            );
          } catch (error) {
            logger.error(`Invalid cursor provided for search: ${cursor} ${error}`);
            throw new Error('Invalid cursor format');
          }
        }

        if (searchQuery && searchQuery.trim().length > 0) {
          const q = searchQuery.trim();
          whereClauses.push(
            or(
              sql`links.search_vector @@ websearch_to_tsquery('simple', ${q})`,
              ilike(linksTable.title, `%${q}%`),
              ilike(linksTable.url, `%${q}%`),
              ilike(linksTable.excerpt, `%${q}%`)
            ) as ReturnType<typeof eq>
          );
        }

        if (filters?.isFavorite !== undefined)
          whereClauses.push(
            eq(linksTable.isFavorite, !!filters.isFavorite) as ReturnType<typeof eq>
          );
        if (filters?.isRead !== undefined)
          whereClauses.push(eq(linksTable.isRead, !!filters.isRead) as ReturnType<typeof eq>);
        if (filters?.isArchived !== undefined)
          whereClauses.push(
            eq(linksTable.isArchived, !!filters.isArchived) as ReturnType<typeof eq>
          );
        if (filters?.priority)
          whereClauses.push(
            eq(linksTable.priority, filters.priority as never) as ReturnType<typeof eq>
          );
        if (filters?.processingStatus)
          whereClauses.push(
            eq(linksTable.processingStatus, filters.processingStatus as never) as ReturnType<
              typeof eq
            >
          );
        if (filters?.readLength === 'short')
          whereClauses.push(lt(linksTable.readingTime, 10) as ReturnType<typeof eq>);
        else if (filters?.readLength === 'long')
          whereClauses.push(gte(linksTable.readingTime, 10) as ReturnType<typeof eq>);

        if (filters?.hasHighlights) {
          const ids = await db
            .select({ linkId: highlightsTable.linkId })
            .from(highlightsTable)
            .where(eq(highlightsTable.userId, userId));
          if (ids.length === 0) return { items: [], hasMore: false, nextCursor: undefined };
          const unique = [...new Set(ids.map((r) => r.linkId))];
          whereClauses.push(inArray(linksTable.id, unique) as ReturnType<typeof eq>);
        }

        if (filters?.tagGroups && filters?.tagNames) {
          const tagIdRows = await db
            .select({ id: tagsTable.id })
            .from(tagsTable)
            .where(
              and(
                eq(tagsTable.userId, userId),
                eq(tagsTable.name, filters.tagNames),
                eq(tagsTable.groupId, filters.tagGroups)
              )
            );
          if (tagIdRows.length === 0) return { items: [], hasMore: false, nextCursor: undefined };
          const linkIdRows = await db
            .select({ linkId: linkTagsTable.linkId })
            .from(linkTagsTable)
            .where(
              inArray(
                linkTagsTable.tagId,
                tagIdRows.map((t) => t.id)
              )
            );
          if (linkIdRows.length === 0) return { items: [], hasMore: false, nextCursor: undefined };
          whereClauses.push(
            inArray(linksTable.id, [...new Set(linkIdRows.map((r) => r.linkId))]) as ReturnType<
              typeof eq
            >
          );
        } else if (filters?.tagGroups) {
          const tagIdsRows = await db
            .select({ id: tagsTable.id })
            .from(tagsTable)
            .where(and(eq(tagsTable.userId, userId), eq(tagsTable.groupId, filters.tagGroups)));
          if (tagIdsRows.length === 0) return { items: [], hasMore: false, nextCursor: undefined };
          const linkIdRows = await db
            .select({ link_id: linkTagsTable.linkId })
            .from(linkTagsTable)
            .where(
              inArray(
                linkTagsTable.tagId,
                tagIdsRows.map((t) => t.id)
              )
            );
          if (linkIdRows.length === 0) return { items: [], hasMore: false, nextCursor: undefined };
          whereClauses.push(
            inArray(
              linksTable.id,
              linkIdRows.map((r) => r.link_id)
            ) as ReturnType<typeof eq>
          );
        }

        const base = await db
          .select({
            author: linksTable.author,
            coverImage: linksTable.coverImage,
            createdAt: linksTable.createdAt,
            errorMessage: linksTable.errorMessage,
            excerpt: linksTable.excerpt,
            favicon: linksTable.favicon,
            id: linksTable.id,
            isArchived: linksTable.isArchived,
            isFavorite: linksTable.isFavorite,
            isPaywalled: linksTable.isPaywalled,
            isRead: linksTable.isRead,
            lastReadAt: linksTable.lastReadAt,
            priority: linksTable.priority,
            processingStatus: linksTable.processingStatus,
            publishedAt: linksTable.publishedAt,
            readingProgress: linksTable.readingProgress,
            readingTime: linksTable.readingTime,
            textContent: linksTable.textContent,
            timeSpentReading: linksTable.timeSpentReading,
            title: linksTable.title,
            updatedAt: linksTable.updatedAt,
            url: linksTable.url
          })
          .from(linksTable)
          .where(and(...whereClauses))
          .orderBy(
            ...(filters?.sortBy === 'newest'
              ? [desc(linksTable.createdAt), desc(linksTable.id)]
              : filters?.sortBy === 'oldest'
                ? [asc(linksTable.createdAt), asc(linksTable.id)]
                : filters?.sortBy === 'shortest'
                  ? [asc(linksTable.readingTime), asc(linksTable.id)]
                  : filters?.sortBy === 'longest'
                    ? [desc(linksTable.readingTime), asc(linksTable.id)]
                    : options?.orderDirection === 'desc'
                      ? [desc(linksTable.createdAt), desc(linksTable.id)]
                      : [asc(linksTable.createdAt), asc(linksTable.id)])
          )
          .limit(limit + 1);

        if (base.length === 0) return { items: [], hasMore: false, nextCursor: undefined };

        const hasMore = base.length > limit;
        const items = hasMore ? base.slice(0, -1) : base;
        const linkIds = items.map((l) => l.id);
        const nextCursor = hasMore ? extractCursor(items) : undefined;

        const tagRows = await db
          .select({
            group_id: tagsTable.groupId,
            color: tagGroupsTable.color,
            id: tagsTable.id,
            link_id: linkTagsTable.linkId,
            name: tagsTable.name
          })
          .from(linkTagsTable)
          .innerJoin(tagsTable, eq(linkTagsTable.tagId, tagsTable.id))
          .innerJoin(tagGroupsTable, eq(tagsTable.groupId, tagGroupsTable.id))
          .where(inArray(linkTagsTable.linkId, linkIds));

        const tagsByLinkId = new Map<
          string,
          { groupId: string; color: string; id: string; name: string }[]
        >();
        for (const row of tagRows) {
          const list = tagsByLinkId.get(row.link_id) ?? [];
          list.push({ groupId: row.group_id, color: row.color, id: row.id, name: row.name });
          tagsByLinkId.set(row.link_id, list);
        }

        const highlightRows = await db
          .select({
            color: highlightsTable.color,
            createdAt: highlightsTable.createdAt,
            endOffset: highlightsTable.endOffset,
            id: highlightsTable.id,
            linkId: highlightsTable.linkId,
            note: highlightsTable.note,
            startOffset: highlightsTable.startOffset,
            text: highlightsTable.text
          })
          .from(highlightsTable)
          .where(inArray(highlightsTable.linkId, linkIds));

        const highlightsByLinkId = new Map<string, Omit<Highlight, 'linkId' | 'userId'>[]>();
        for (const row of highlightRows) {
          const list = highlightsByLinkId.get(row.linkId) ?? [];
          list.push({
            color: row.color,
            createdAt: row.createdAt,
            endOffset: row.endOffset,
            id: row.id,
            note: row.note,
            startOffset: row.startOffset,
            text: row.text
          });
          highlightsByLinkId.set(row.linkId, list);
        }

        const merged = items.map((l) => ({
          ...l,
          highlights: highlightsByLinkId.get(l.id) ?? [],
          tags: tagsByLinkId.get(l.id) ?? []
        }));

        return { items: merged, hasMore, nextCursor };
      } catch (error) {
        logger.error(`Error searching links in repository: ${error}`);
        throw error;
      }
    },

    async getTagsForLink(linkId, userId) {
      try {
        const tagRows = await db
          .select({
            groupId: tagsTable.groupId,
            color: tagGroupsTable.color,
            createdAt: tagsTable.createdAt,
            id: tagsTable.id,
            name: tagsTable.name
          })
          .from(linkTagsTable)
          .innerJoin(tagsTable, eq(linkTagsTable.tagId, tagsTable.id))
          .innerJoin(tagGroupsTable, eq(tagsTable.groupId, tagGroupsTable.id))
          .where(and(eq(linkTagsTable.linkId, linkId), eq(linkTagsTable.userId, userId)));

        return tagRows.map((row) => ({
          groupId: row.groupId,
          color: row.color,
          createdAt: row.createdAt,
          id: row.id,
          name: row.name,
          userId
        }));
      } catch (error) {
        logger.error(`Error getting link tags in repository: ${error}`);
        throw error;
      }
    },

    async findAllUrls(userId) {
      try {
        const rows = await db
          .select({ url: linksTable.url })
          .from(linksTable)
          .where(eq(linksTable.userId, userId));
        return rows.map((row) => row.url);
      } catch (error) {
        logger.error(`Error fetching all URLs for user ${userId}: ${error}`);
        throw error;
      }
    },

    async existsByUrl(url, userId) {
      try {
        const result = await db.query.linksTable.findFirst({
          where: and(eq(linksTable.url, url), eq(linksTable.userId, userId)),
          columns: { id: true }
        });
        return result != null;
      } catch (error) {
        logger.error(`Error checking URL existence for user ${userId}: ${error}`);
        throw error;
      }
    }
  };
}
