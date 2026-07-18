import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
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

import { usersTable } from './users.js';

export const feedSubscriptionsTable = pgTable(
  'feed_subscriptions',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    feedUrl: text('feed_url').notNull(),
    normalizedFeedUrl: text('normalized_feed_url').notNull(),
    siteUrl: text('site_url'),
    title: text('title').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    autoSave: boolean('auto_save').notNull().default(false),
    status: varchar('status', { enum: ['active', 'paused'], length: 20 })
      .notNull()
      .default('active'),
    lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
    lastSuccessfulFetchAt: timestamp('last_successful_fetch_at', { withTimezone: true }),
    nextFetchAfter: timestamp('next_fetch_after', { withTimezone: true }),
    lastError: text('last_error'),
    failureCount: integer('failure_count').notNull().default(0),
    etag: text('etag'),
    lastModified: text('last_modified'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check('chk_feed_subscriptions_status', sql`${table.status} in ('active', 'paused')`),
    uniqueIndex('uq_feed_subscriptions_id_user').on(table.id, table.userId),
    uniqueIndex('uq_feed_subscriptions_user_normalized_url').on(
      table.userId,
      table.normalizedFeedUrl
    ),
    index('idx_feed_subscriptions_user_created').on(table.userId, table.createdAt.desc()),
    index('idx_feed_subscriptions_status_next_fetch').on(table.status, table.nextFetchAfter),
    index('idx_feed_subscriptions_user_status').on(table.userId, table.status)
  ]
);

export const selectFeedSubscriptionsSchema = createSelectSchema(feedSubscriptionsTable);

export const insertFeedSubscriptionsSchema = createInsertSchema(feedSubscriptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
