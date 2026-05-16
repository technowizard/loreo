import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { linksTable } from './links.js';
import { usersTable } from './users.js';

export const highlightsTable = pgTable(
  'highlights',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    linkId: uuid('link_id')
      .notNull()
      .references(() => linksTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    text: text('text'),
    startOffset: integer('start_offset').notNull(),
    endOffset: integer('end_offset').notNull(),
    color: varchar('color', { length: 10 }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('idx_highlights_link_id').on(table.linkId),
    index('idx_highlights_user_id').on(table.userId),
    index('idx_highlights_link_user').on(table.linkId, table.userId),
    index('idx_highlights_start_offset').on(table.startOffset)
  ]
);

export const selectHighlightsSchema = createSelectSchema(highlightsTable).omit({
  id: true,
  linkId: true,
  userId: true,
  updatedAt: true,
  createdAt: true
});

export const insertHighlightsSchema = createInsertSchema(highlightsTable).omit({
  id: true,
  linkId: true,
  userId: true,
  createdAt: true,
  updatedAt: true
});
