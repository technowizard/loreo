import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { feedSubscriptionsTable } from './feed-subscriptions.js';
import { linksTable } from './links.js';
import { usersTable } from './users.js';

export const feedItemsTable = pgTable(
  'feed_items',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => feedSubscriptionsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    linkId: uuid('link_id').references(() => linksTable.id, { onDelete: 'set null' }),
    guid: text('guid'),
    url: text('url').notNull(),
    normalizedUrl: text('normalized_url').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    author: text('author'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    imageUrl: text('image_url'),
    state: varchar('state', { enum: ['new', 'dismissed', 'saved'], length: 20 })
      .notNull()
      .default('new'),
    discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull().defaultNow(),
    savedAt: timestamp('saved_at', { withTimezone: true }),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check('chk_feed_items_state', sql`${table.state} in ('new', 'dismissed', 'saved')`),
    foreignKey({
      columns: [table.subscriptionId, table.userId],
      foreignColumns: [feedSubscriptionsTable.id, feedSubscriptionsTable.userId],
      name: 'fk_feed_items_subscription_owner'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.linkId, table.userId],
      foreignColumns: [linksTable.id, linksTable.userId],
      name: 'fk_feed_items_link_owner'
    }),
    uniqueIndex('uq_feed_items_subscription_guid').on(table.subscriptionId, table.guid),
    uniqueIndex('uq_feed_items_subscription_normalized_url').on(
      table.subscriptionId,
      table.normalizedUrl
    ),
    index('idx_feed_items_user_state_published').on(
      table.userId,
      table.state,
      table.publishedAt.desc()
    ),
    index('idx_feed_items_user_effective_date_id').on(
      table.userId,
      sql`coalesce(${table.publishedAt}, ${table.discoveredAt})`,
      table.id
    ),
    index('idx_feed_items_user_state_effective_date_id').on(
      table.userId,
      table.state,
      sql`coalesce(${table.publishedAt}, ${table.discoveredAt})`,
      table.id
    ),
    index('idx_feed_items_user_subscription_effective_date_id').on(
      table.userId,
      table.subscriptionId,
      sql`coalesce(${table.publishedAt}, ${table.discoveredAt})`,
      table.id
    ),
    index('idx_feed_items_user_state_subscription_effective_date_id').on(
      table.userId,
      table.state,
      table.subscriptionId,
      sql`coalesce(${table.publishedAt}, ${table.discoveredAt})`,
      table.id
    ),
    index('idx_feed_items_user_normalized_url').on(table.userId, table.normalizedUrl),
    index('idx_feed_items_subscription_discovered').on(
      table.subscriptionId,
      table.discoveredAt.desc()
    ),
    index('idx_feed_items_link_id').on(table.linkId)
  ]
);

export const selectFeedItemsSchema = createSelectSchema(feedItemsTable);

export const insertFeedItemsSchema = createInsertSchema(feedItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
