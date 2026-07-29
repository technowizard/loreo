import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/index.js';

async function applyMigration(filename: string) {
  const migration = await readFile(new URL(filename, import.meta.url), 'utf8');
  await db.execute(
    sql.raw(
      migration
        .replaceAll('--> statement-breakpoint', '')
        .replaceAll('"public"."feed_subscriptions"', '"rss_feed_upgrade_test"."feed_subscriptions"')
        .replaceAll('"public"."links"', '"rss_feed_upgrade_test"."links"')
    )
  );
}

describe('RSS feed forward migrations', () => {
  it('upgrades a database where migration 0001 was recorded before feed tables existed', async () => {
    await db.execute(sql`drop schema if exists rss_feed_upgrade_test cascade`);
    await db.execute(sql`create schema rss_feed_upgrade_test`);
    await db.execute(sql`set local search_path to rss_feed_upgrade_test, public`);
    await db.execute(sql`
      create table rss_feed_upgrade_test.links (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.users(id) on delete cascade
      )
    `);

    await applyMigration('./0002_smooth_rss_feed_tables.sql');
    await applyMigration('./0003_feed_item_pagination_indexes.sql');
    await applyMigration('./0004_feed_item_pagination_query_shapes.sql');

    const userA = '30000000-0000-0000-0000-000000000001';
    const userB = '30000000-0000-0000-0000-000000000002';
    await db.execute(sql`
      insert into public.users (id, email, password_hash, name, settings)
      values
        (${userA}::uuid, 'rss-upgrade-a@example.com', 'hash', 'Upgrade A', '{}'::jsonb),
        (${userB}::uuid, 'rss-upgrade-b@example.com', 'hash', 'Upgrade B', '{}'::jsonb)
      on conflict (id) do nothing
    `);
    await db.execute(sql`
      insert into rss_feed_upgrade_test.feed_subscriptions (
        id, user_id, feed_url, normalized_feed_url, title, status
      ) values
        ('30000000-0000-0000-0000-000000000010', ${userA}::uuid,
          'https://example.com/feed', 'https://example.com/feed', 'Valid legacy feed', 'active'),
        ('30000000-0000-0000-0000-000000000011', ${userA}::uuid,
          'https://example.com/invalid', 'https://example.com/invalid', 'Invalid legacy feed', 'legacy')
    `);
    await db.execute(sql`
      insert into rss_feed_upgrade_test.links (id, user_id)
      values ('30000000-0000-0000-0000-000000000020', ${userB}::uuid)
    `);
    await db.execute(sql`
      insert into rss_feed_upgrade_test.feed_items (
        id, subscription_id, user_id, link_id, url, normalized_url, title, state
      ) values
        ('30000000-0000-0000-0000-000000000030',
          '30000000-0000-0000-0000-000000000010', ${userB}::uuid, null,
          'https://example.com/cross-sub', 'https://example.com/cross-sub',
          'Legacy cross-owner subscription', 'new'),
        ('30000000-0000-0000-0000-000000000031',
          '30000000-0000-0000-0000-000000000010', ${userA}::uuid,
          '30000000-0000-0000-0000-000000000020',
          'https://example.com/cross-link', 'https://example.com/cross-link',
          'Legacy cross-owner link', 'saved'),
        ('30000000-0000-0000-0000-000000000032',
          '30000000-0000-0000-0000-000000000010', ${userA}::uuid, null,
          'https://example.com/invalid-state', 'https://example.com/invalid-state',
          'Legacy invalid state', 'legacy')
    `);

    await applyMigration('./0005_feed_owner_constraints.sql');

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

    const constraintResult = await db.execute<{ conname: string }>(sql`
      select constraint_name as conname
      from information_schema.table_constraints
      where table_schema = 'rss_feed_upgrade_test'
        and table_name in ('feed_items', 'feed_subscriptions')
    `);
    const constraints = constraintResult.rows.map(({ conname }) => conname);
    expect(constraints).toEqual(
      expect.arrayContaining([
        'chk_feed_items_state',
        'chk_feed_subscriptions_status',
        'fk_feed_items_link_owner',
        'fk_feed_items_subscription_owner'
      ])
    );

    const validationResult = await db.execute<{ conname: string; validated: boolean }>(sql`
      select conname, convalidated as validated
      from pg_constraint
      where conname in (
        'chk_feed_items_state',
        'chk_feed_subscriptions_status',
        'fk_feed_items_link_owner',
        'fk_feed_items_subscription_owner'
      )
        and conrelid in (
          'rss_feed_upgrade_test.feed_items'::regclass,
          'rss_feed_upgrade_test.feed_subscriptions'::regclass
        )
      order by conname
    `);
    expect(validationResult.rows).toEqual([
      { conname: 'chk_feed_items_state', validated: false },
      { conname: 'chk_feed_subscriptions_status', validated: false },
      { conname: 'fk_feed_items_link_owner', validated: false },
      { conname: 'fk_feed_items_subscription_owner', validated: false }
    ]);

    const legacyViolations = await db.execute<{ violations: number }>(sql`
      select count(*)::int as violations
      from rss_feed_upgrade_test.feed_items item
      left join rss_feed_upgrade_test.feed_subscriptions subscription
        on subscription.id = item.subscription_id and subscription.user_id = item.user_id
      left join rss_feed_upgrade_test.links link
        on link.id = item.link_id and link.user_id = item.user_id
      where subscription.id is null
        or (item.link_id is not null and link.id is null)
        or item.state not in ('new', 'dismissed', 'saved')
    `);
    expect(legacyViolations.rows[0]?.violations).toBe(3);

    await db.execute(sql`
      delete from rss_feed_upgrade_test.feed_items
      where id in (
        '30000000-0000-0000-0000-000000000030',
        '30000000-0000-0000-0000-000000000031',
        '30000000-0000-0000-0000-000000000032'
      )
    `);
    await db.execute(sql`
      delete from rss_feed_upgrade_test.feed_subscriptions
      where id = '30000000-0000-0000-0000-000000000011'
    `);
    await db.execute(sql`
      alter table rss_feed_upgrade_test.feed_items
        validate constraint fk_feed_items_subscription_owner;
      alter table rss_feed_upgrade_test.feed_items
        validate constraint fk_feed_items_link_owner;
      alter table rss_feed_upgrade_test.feed_items
        validate constraint chk_feed_items_state;
      alter table rss_feed_upgrade_test.feed_subscriptions
        validate constraint chk_feed_subscriptions_status;
    `);

    const validatedResult = await db.execute<{ validated: boolean }>(sql`
      select bool_and(convalidated) as validated
      from pg_constraint
      where conname in (
        'chk_feed_items_state',
        'chk_feed_subscriptions_status',
        'fk_feed_items_link_owner',
        'fk_feed_items_subscription_owner'
      )
        and conrelid in (
          'rss_feed_upgrade_test.feed_items'::regclass,
          'rss_feed_upgrade_test.feed_subscriptions'::regclass
        )
    `);
    expect(validatedResult.rows[0]?.validated).toBe(true);
  });
});
