import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { usersTable } from './users.js';

export const importSessionsTable = pgTable(
  'import_sessions',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    filename: varchar('filename', { length: 255 }).notNull(),
    totalRows: integer('total_rows').notNull(),
    importedCount: integer('imported_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
    failedCount: integer('failed_count').notNull().default(0),
    status: varchar('status', {
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      length: 20
    })
      .notNull()
      .default('pending'),
    jobId: varchar('job_id', { length: 255 }),
    errorMessage: text('error_message'),
    extractionStatus: varchar('extraction_status', {
      enum: ['pending', 'in_progress', 'completed'],
      length: 20
    })
      .notNull()
      .default('pending'),
    extractionProgress: integer('extraction_progress').notNull().default(0),
    extractionCompleted: integer('extraction_completed').notNull().default(0),
    extractionFailed: integer('extraction_failed').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_import_sessions_user_id').on(table.userId),
    index('idx_import_sessions_status').on(table.status),
    index('idx_import_sessions_created_at').on(table.createdAt.desc())
  ]
);

export const selectImportSessionsSchema = createSelectSchema(importSessionsTable);

export const insertImportSessionsSchema = createInsertSchema(importSessionsTable).omit({
  id: true,
  userId: true,
  importedCount: true,
  skippedCount: true,
  failedCount: true,
  status: true,
  extractionStatus: true,
  extractionProgress: true,
  extractionCompleted: true,
  extractionFailed: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true
});
