import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const usersTable = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 255 }),
    avatar: varchar('avatar', { length: 512 }),
    role: varchar('role', { length: 20 }).notNull().default('user'),
    settings: jsonb('settings').$type<Record<string, unknown>>().notNull().default({}),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_settings').using('gin', table.settings),
    index('idx_users_role').on(table.role),
    index('idx_users_deleted_at').on(table.deletedAt)
  ]
);

export const selectUsersSchema = createSelectSchema(usersTable).omit({
  role: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});

export const insertUsersSchema = createInsertSchema(usersTable).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true
});
