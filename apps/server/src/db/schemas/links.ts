import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import * as z from 'zod';

import { importSessionsTable } from './import-sessions.js';
import { tagsTable } from './tags.js';
import { usersTable } from './users.js';

export const linksTable = pgTable(
  'links',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    textContent: text('text_content'),
    excerpt: text('excerpt'),
    author: text('author'),
    favicon: text('favicon'),
    coverImage: text('cover_image'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    readingTime: integer('reading_time').notNull(),
    readingProgress: integer('reading_progress').notNull().default(0),
    timeSpentReading: integer('time_spent_reading').notNull().default(0),
    isRead: boolean('is_read').notNull().default(false),
    isFavorite: boolean('is_favorite').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),
    isPaywalled: boolean('is_paywalled').notNull().default(false),
    priority: varchar('priority', {
      enum: ['none', 'low-priority', 'this-week', 'must-read'],
      length: 20
    })
      .notNull()
      .default('none'),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    processingStatus: varchar('processing_status', {
      enum: ['pending', 'processing', 'completed', 'failed'],
      length: 20
    })
      .notNull()
      .default('pending'),
    errorMessage: text('error_message'),
    importSessionId: uuid('import_session_id').references(() => importSessionsTable.id, {
      onDelete: 'set null'
    }),
    processingStartedAt: timestamp('processing_started_at', {
      withTimezone: true
    }),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string'
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_links_user_id').on(table.userId),
    index('idx_links_url').on(table.url),
    index('idx_links_title').on(table.title),
    index('idx_links_is_read').on(table.isRead),
    index('idx_links_is_favorite').on(table.isFavorite),
    index('idx_links_is_archived').on(table.isArchived),
    index('idx_links_priority').on(table.priority),
    index('idx_links_processing_status').on(table.processingStatus),
    index('idx_links_created_at').on(table.createdAt.desc()),
    index('idx_links_last_read_at').on(table.userId, table.lastReadAt.desc()),
    index('idx_links_user_created').on(table.userId, table.createdAt.desc()),
    index('idx_links_user_last_read_at').on(table.userId, table.lastReadAt.desc()),
    index('idx_links_import_session_id').on(table.importSessionId),
    index('idx_links_processing_started_at').on(table.processingStartedAt)
  ]
);

export const selectLinksSchema = createSelectSchema(linksTable).omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
  processingStartedAt: true,
  importSessionId: true
});

const tagWithGroupColorSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  name: z.string(),
  color: z.string()
});

const linkHighlightSchema = z.object({
  id: z.string(),
  color: z.string(),
  text: z.string().nullable(),
  note: z.string().nullable(),
  startOffset: z.number(),
  endOffset: z.number(),
  createdAt: z.string()
});

// Matches what the links repository findMany/search actually returns:
// base columns minus content/userId/processingStartedAt/importSessionId, plus joined tags and highlights.
// createdAt/updatedAt are optional to match LinkListItem (inherited from LinkData interface).
export const selectLinksListSchema = createSelectSchema(linksTable)
  .omit({
    content: true,
    userId: true,
    processingStartedAt: true,
    importSessionId: true
  })
  .extend({
    createdAt: z.string().optional(),
    updatedAt: z.date().optional(),
    tags: z.array(tagWithGroupColorSchema),
    highlights: z.array(linkHighlightSchema)
  });

export const selectLinksWithSignedUrlSchema = createSelectSchema(linksTable).extend({
  coverImageSignedUrl: z.string().optional()
});

export const insertLinksSchema = createInsertSchema(linksTable).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true
});

export const linkTagsTable = pgTable(
  'link_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    linkId: uuid('link_id')
      .notNull()
      .references(() => linksTable.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tagsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string'
    })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('idx_link_tags_link_id').on(table.linkId),
    index('idx_link_tags_tag_id').on(table.tagId),
    index('idx_link_tags_user_id').on(table.userId),
    uniqueIndex('uq_link_tags_link_tag').on(table.linkId, table.tagId)
  ]
);

// Request schema for POST /links — only the fields the client provides
export const createLinkSchema = z.object({
  url: z.string().url(),
  tags: z
    .array(
      z.object({
        id: z.string(),
        groupId: z.string(),
        name: z.string()
      })
    )
    .optional()
});

export const selectLinkTagsSchema = createSelectSchema(linkTagsTable);
export const insertLinkTagsSchema = createInsertSchema(linkTagsTable).omit({
  id: true,
  linkId: true,
  tagId: true,
  userId: true,
  createdAt: true
});
