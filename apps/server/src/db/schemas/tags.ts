import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { usersTable } from './users.js';

export const tagGroupsTable = pgTable(
  'tag_groups',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    color: varchar('color', { length: 10 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('idx_tag_groups_name').on(table.name),
    index('idx_tag_groups_user_id').on(table.userId),
    uniqueIndex('uq_tag_groups_user_id_name').on(table.userId, table.name)
  ]
);

export const selectTagGroupsSchema = createSelectSchema(tagGroupsTable).omit({
  userId: true,
  createdAt: true,
  updatedAt: true
});

export const insertTagGroupsSchema = createInsertSchema(tagGroupsTable).pick({
  id: true,
  name: true,
  color: true
});

export const tagsTable = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => tagGroupsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('idx_tags_user_id').on(table.userId),
    index('idx_tags_group_id').on(table.groupId),
    index('idx_tags_name').on(table.name),
    index('idx_tags_user_group').on(table.userId, table.groupId),
    uniqueIndex('uq_tags_user_group_name').on(table.userId, table.groupId, table.name)
  ]
);

export const selectTagsSchema = createSelectSchema(tagsTable).omit({
  userId: true,
  createdAt: true,
  updatedAt: true
});

export const insertTagsSchema = createInsertSchema(tagsTable).omit({
  id: true,
  userId: true,
  groupId: true,
  createdAt: true,
  updatedAt: true
});
