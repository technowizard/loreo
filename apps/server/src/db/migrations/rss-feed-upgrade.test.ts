import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/index.js';

async function applyMigration(filename: string) {
  const migration = await readFile(new URL(filename, import.meta.url), 'utf8');
  await db.execute(sql.raw(migration.replaceAll('--> statement-breakpoint', '')));
}

describe('RSS feed forward migrations', () => {
  it('upgrades a database where migration 0001 was recorded before feed tables existed', async () => {
    await db.execute(sql`drop schema if exists rss_feed_upgrade_test cascade`);
    await db.execute(sql`create schema rss_feed_upgrade_test`);
    await db.execute(sql`set local search_path to rss_feed_upgrade_test, public`);

    await applyMigration('./0002_smooth_rss_feed_tables.sql');
    await applyMigration('./0003_feed_item_pagination_indexes.sql');
    await applyMigration('./0004_feed_item_pagination_query_shapes.sql');

    const tableResult = await db.execute<{
      feedItems: string | null;
      feedSubscriptions: string | null;
    }>(sql`
      select
        to_regclass('rss_feed_upgrade_test.feed_items')::text as "feedItems",
        to_regclass('rss_feed_upgrade_test.feed_subscriptions')::text as "feedSubscriptions"
    `);
    expect(tableResult.rows[0]).toEqual({
      feedItems: 'feed_items',
      feedSubscriptions: 'feed_subscriptions'
    });

    const indexResult = await db.execute<{ indexname: string }>(sql`
      select indexname
      from pg_indexes
      where schemaname = 'rss_feed_upgrade_test' and tablename = 'feed_items'
    `);
    const indexes = indexResult.rows.map(({ indexname }) => indexname);

    expect(indexes).toEqual(
      expect.arrayContaining([
        'idx_feed_items_user_effective_date_id',
        'idx_feed_items_user_state_effective_date_id',
        'idx_feed_items_user_subscription_effective_date_id',
        'idx_feed_items_user_state_subscription_effective_date_id'
      ])
    );
  });
});
