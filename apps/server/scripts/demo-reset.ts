import { pathToFileURL } from 'node:url';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import {
  DEMO_RESET_HIGHLIGHTS,
  DEMO_RESET_LINK,
  DEMO_RESET_TAG_GROUPS,
  DEMO_RESET_TAGS,
  DEMO_RESET_USER
} from '../src/db/fixtures.js';
import {
  highlightsTable,
  linksTable,
  linkTagsTable,
  tagGroupsTable,
  tagsTable,
  usersTable
} from '../src/db/schemas/index.js';

import { assertDemoResetCanRun } from '../src/lib/demo-reset.js';
import { env } from '../src/lib/env-config.js';
import { logger } from '../src/lib/logger.js';
import { passwordManager } from '../src/lib/password-manager.js';

async function resetDemoDatabase() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    await db.transaction(async (tx) => {
      await tx.execute(
        sql.raw(
          'TRUNCATE TABLE link_tags, highlights, tags, tag_groups, links, import_sessions, users CASCADE'
        )
      );

      await tx.insert(usersTable).values({
        id: DEMO_RESET_USER.id,
        email: DEMO_RESET_USER.email,
        name: DEMO_RESET_USER.name,
        passwordHash: await passwordManager.hash('demo-password'),
        settings: DEMO_RESET_USER.settings
      });

      await tx.insert(tagGroupsTable).values(
        DEMO_RESET_TAG_GROUPS.map((group) => ({
          id: group.id,
          name: group.name,
          color: group.color,
          description: group.description,
          userId: DEMO_RESET_USER.id
        }))
      );

      await tx.insert(tagsTable).values(
        DEMO_RESET_TAGS.map((tag) => ({
          id: tag.id,
          name: tag.name,
          groupId: tag.groupId,
          userId: DEMO_RESET_USER.id
        }))
      );

      await tx.insert(linksTable).values({
        id: DEMO_RESET_LINK.id,
        author: DEMO_RESET_LINK.author,
        content: DEMO_RESET_LINK.content,
        excerpt: DEMO_RESET_LINK.excerpt,
        isArchived: DEMO_RESET_LINK.isArchived,
        isFavorite: DEMO_RESET_LINK.isFavorite,
        isRead: DEMO_RESET_LINK.isRead,
        priority: DEMO_RESET_LINK.priority,
        processingStatus: DEMO_RESET_LINK.processingStatus,
        readingProgress: DEMO_RESET_LINK.readingProgress,
        readingTime: DEMO_RESET_LINK.readingTime,
        textContent: DEMO_RESET_LINK.textContent,
        title: DEMO_RESET_LINK.title,
        url: DEMO_RESET_LINK.url,
        userId: DEMO_RESET_USER.id
      });

      await tx.insert(linkTagsTable).values([
        {
          linkId: DEMO_RESET_LINK.id,
          tagId: DEMO_RESET_TAGS[0].id,
          userId: DEMO_RESET_USER.id
        },
        {
          linkId: DEMO_RESET_LINK.id,
          tagId: DEMO_RESET_TAGS[2].id,
          userId: DEMO_RESET_USER.id
        }
      ]);

      await tx.insert(highlightsTable).values(
        DEMO_RESET_HIGHLIGHTS.map((highlight) => ({
          color: highlight.color,
          endOffset: highlight.endOffset,
          linkId: highlight.linkId,
          note: highlight.note,
          startOffset: highlight.startOffset,
          text: highlight.text,
          userId: DEMO_RESET_USER.id
        }))
      );
    });
  } finally {
    await pool.end();
  }
}

async function main() {
  assertDemoResetCanRun(env.isDemo, env.DATABASE_URL);

  logger.info('Resetting demo database');
  await resetDemoDatabase();
  logger.info('Demo database reset complete');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
