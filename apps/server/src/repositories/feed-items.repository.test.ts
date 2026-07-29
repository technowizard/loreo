import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/index.js';
import { linksTable, usersTable } from '@/db/schemas/index.js';

import { createDrizzleFeedItemsAdapter } from './feed-items.repository.js';
import { createDrizzleFeedSubscriptionsAdapter } from './feed-subscriptions.repository.js';

const USER_A_ID = '20000000-0000-0000-0000-000000000001';
const USER_B_ID = '20000000-0000-0000-0000-000000000002';
const LINK_ID = '20000000-0000-0000-0000-000000000010';

async function seedUser(id: string, email: string) {
  await db.insert(usersTable).values({
    id,
    email,
    passwordHash: 'hashed-password',
    name: email,
    settings: {}
  });
}

async function seedSubscription(userId: string, url = 'https://example.com/feed.xml') {
  const subscriptions = createDrizzleFeedSubscriptionsAdapter(db);
  return subscriptions.create({
    feedUrl: url,
    normalizedFeedUrl: url,
    title: `Feed ${url}`,
    userId
  });
}

async function seedLink(userId: string, id = LINK_ID, url = 'https://example.com/post') {
  const [link] = await db
    .insert(linksTable)
    .values({
      id,
      author: null,
      content: null,
      excerpt: null,
      isArchived: false,
      isFavorite: false,
      isPaywalled: false,
      isRead: false,
      lastReadAt: null,
      priority: 'none',
      processingStatus: 'pending',
      publishedAt: null,
      readingProgress: 0,
      readingTime: 0,
      textContent: null,
      timeSpentReading: 0,
      title: url,
      url,
      userId
    })
    .returning({ id: linksTable.id });

  if (!link) throw new Error('Failed to seed link');
  return link.id;
}

describe('feed items repository', () => {
  it('creates and queries review items scoped by user and state', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    await seedUser(USER_B_ID, 'feed-items-b@example.com');
    const subscriptionA = await seedSubscription(USER_A_ID);
    const subscriptionB = await seedSubscription(USER_B_ID, 'https://other.example/feed.xml');

    const itemA = await items.create({
      excerpt: 'A staged item',
      guid: 'guid-a',
      normalizedUrl: 'https://example.com/a',
      publishedAt: new Date('2026-06-28T12:00:00Z'),
      subscriptionId: subscriptionA.id,
      title: 'Item A',
      url: 'https://example.com/a',
      userId: USER_A_ID
    });
    await items.create({
      guid: 'guid-b',
      normalizedUrl: 'https://example.com/b',
      subscriptionId: subscriptionB.id,
      title: 'Item B',
      url: 'https://example.com/b',
      userId: USER_B_ID
    });

    await expect(items.findById(itemA.id, USER_B_ID)).resolves.toBeNull();
    await expect(
      items.findManyForReview({ state: 'new', userId: USER_A_ID })
    ).resolves.toMatchObject({ items: [{ id: itemA.id, title: 'Item A' }], total: 1 });
    await expect(
      items.findManyForReview({ state: 'new', userId: USER_B_ID })
    ).resolves.toMatchObject({ items: [expect.any(Object)], total: 1 });
  });

  it('rejects feed items whose user does not own the subscription', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    await seedUser(USER_B_ID, 'feed-items-b@example.com');
    const subscriptionA = await seedSubscription(USER_A_ID);

    await expect(
      items.create({
        normalizedUrl: 'https://example.com/cross-user-subscription',
        subscriptionId: subscriptionA.id,
        title: 'Cross-user subscription',
        url: 'https://example.com/cross-user-subscription',
        userId: USER_B_ID
      })
    ).rejects.toThrow();
  });

  it("rejects feed items linked to another user's saved article", async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    await seedUser(USER_B_ID, 'feed-items-b@example.com');
    const subscriptionA = await seedSubscription(USER_A_ID);
    const linkB = await seedLink(
      USER_B_ID,
      '20000000-0000-0000-0000-000000000011',
      'https://example.com/user-b-post'
    );

    await expect(
      items.create({
        linkId: linkB,
        normalizedUrl: 'https://example.com/cross-user-link',
        state: 'saved',
        subscriptionId: subscriptionA.id,
        title: 'Cross-user link',
        url: 'https://example.com/cross-user-link',
        userId: USER_A_ID
      })
    ).rejects.toThrow();
  });

  it('rejects invalid feed item states at the database boundary', async () => {
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    const subscription = await seedSubscription(USER_A_ID);

    await expect(
      db.execute(sql`
        insert into feed_items (
          subscription_id, user_id, url, normalized_url, title, state
        ) values (
          ${subscription.id}::uuid,
          ${USER_A_ID}::uuid,
          'https://example.com/invalid-state',
          'https://example.com/invalid-state',
          'Invalid state',
          'unexpected'
        )
      `)
    ).rejects.toThrow();
  });

  it('paginates review items with stable newest and oldest cursors', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    const subscription = await seedSubscription(USER_A_ID);

    const oldest = await items.create({
      discoveredAt: new Date('2026-06-20T12:00:00Z'),
      normalizedUrl: 'https://example.com/oldest',
      subscriptionId: subscription.id,
      title: 'Oldest',
      url: 'https://example.com/oldest',
      userId: USER_A_ID
    });
    const middle = await items.create({
      discoveredAt: new Date('2026-06-24T12:00:00Z'),
      normalizedUrl: 'https://example.com/middle',
      publishedAt: new Date('2026-06-24T12:00:00Z'),
      subscriptionId: subscription.id,
      title: 'Middle',
      url: 'https://example.com/middle',
      userId: USER_A_ID
    });
    const newest = await items.create({
      discoveredAt: new Date('2026-06-28T12:00:00Z'),
      normalizedUrl: 'https://example.com/newest',
      subscriptionId: subscription.id,
      title: 'Newest',
      url: 'https://example.com/newest',
      userId: USER_A_ID
    });

    const firstPage = await items.findManyForReview({
      limit: 2,
      sort: 'newest',
      userId: USER_A_ID
    });
    expect(firstPage.items.map((item) => item.id)).toEqual([newest.id, middle.id]);
    expect(firstPage).toMatchObject({ hasMore: true, total: 3 });
    expect(firstPage.nextCursor).toBeDefined();

    const secondPage = await items.findManyForReview({
      cursor: firstPage.nextCursor,
      limit: 2,
      sort: 'newest',
      userId: USER_A_ID
    });
    expect(secondPage.items.map((item) => item.id)).toEqual([oldest.id]);
    expect(secondPage).toMatchObject({ hasMore: false, total: 3 });

    const oldestFirst = await items.findManyForReview({
      limit: 2,
      sort: 'oldest',
      userId: USER_A_ID
    });
    expect(oldestFirst.items.map((item) => item.id)).toEqual([oldest.id, middle.id]);
  });

  it('traverses sub-millisecond timestamp ties without gaps in both directions', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    const subscription = await seedSubscription(USER_A_ID);
    const ids = [
      '21000000-0000-0000-0000-000000000001',
      '21000000-0000-0000-0000-000000000002',
      '21000000-0000-0000-0000-000000000003'
    ];

    await db.execute(sql`
      insert into feed_items (
        id, subscription_id, user_id, url, normalized_url, title,
        published_at, discovered_at, state
      ) values
        (${ids[0]}::uuid, ${subscription.id}::uuid, ${USER_A_ID}::uuid,
          'https://example.com/micro-1', 'https://example.com/micro-1', 'Micro 1',
          '2026-06-28T12:00:00.123100Z'::timestamptz,
          '2026-06-28T12:00:00.123100Z'::timestamptz, 'new'),
        (${ids[1]}::uuid, ${subscription.id}::uuid, ${USER_A_ID}::uuid,
          'https://example.com/micro-2', 'https://example.com/micro-2', 'Micro 2',
          '2026-06-28T12:00:00.123500Z'::timestamptz,
          '2026-06-28T12:00:00.123500Z'::timestamptz, 'new'),
        (${ids[2]}::uuid, ${subscription.id}::uuid, ${USER_A_ID}::uuid,
          'https://example.com/micro-3', 'https://example.com/micro-3', 'Micro 3',
          '2026-06-28T12:00:00.123900Z'::timestamptz,
          '2026-06-28T12:00:00.123900Z'::timestamptz, 'new')
    `);

    async function traverse(sort: 'newest' | 'oldest') {
      const visited: string[] = [];
      let cursor: string | undefined;

      do {
        const page = await items.findManyForReview({
          cursor,
          limit: 1,
          sort,
          userId: USER_A_ID
        });
        visited.push(...page.items.map((item) => item.id));
        cursor = page.nextCursor;
      } while (cursor);

      return visited;
    }

    await expect(traverse('newest')).resolves.toEqual([...ids].reverse());
    await expect(traverse('oldest')).resolves.toEqual(ids);
  });

  it('summarizes item states for one user-owned subscription', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    await seedUser(USER_B_ID, 'feed-items-b@example.com');
    const subscriptionA = await seedSubscription(USER_A_ID);
    const subscriptionB = await seedSubscription(USER_B_ID, 'https://other.example/feed.xml');

    await items.create({
      normalizedUrl: 'https://example.com/new',
      subscriptionId: subscriptionA.id,
      title: 'New item',
      url: 'https://example.com/new',
      userId: USER_A_ID
    });
    await items.create({
      normalizedUrl: 'https://example.com/saved',
      state: 'saved',
      subscriptionId: subscriptionA.id,
      title: 'Saved item',
      url: 'https://example.com/saved',
      userId: USER_A_ID
    });
    await items.create({
      normalizedUrl: 'https://example.com/dismissed',
      state: 'dismissed',
      subscriptionId: subscriptionA.id,
      title: 'Dismissed item',
      url: 'https://example.com/dismissed',
      userId: USER_A_ID
    });
    await items.create({
      normalizedUrl: 'https://other.example/new',
      subscriptionId: subscriptionB.id,
      title: 'Other user item',
      url: 'https://other.example/new',
      userId: USER_B_ID
    });

    await expect(items.summarizeBySubscription(subscriptionA.id, USER_A_ID)).resolves.toEqual({
      dismissed: 1,
      new: 1,
      saved: 1
    });
    await expect(items.summarizeBySubscription(subscriptionA.id, USER_B_ID)).resolves.toEqual({
      dismissed: 0,
      new: 0,
      saved: 0
    });
  });

  it('upserts by GUID or normalized URL within a subscription', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    const subscription = await seedSubscription(USER_A_ID);

    const created = await items.upsertByIdentity({
      guid: 'same-guid',
      normalizedUrl: 'https://example.com/original',
      subscriptionId: subscription.id,
      title: 'Original title',
      url: 'https://example.com/original',
      userId: USER_A_ID
    });
    const updatedByGuid = await items.upsertByIdentity({
      guid: 'same-guid',
      normalizedUrl: 'https://example.com/original',
      subscriptionId: subscription.id,
      title: 'Updated title',
      url: 'https://example.com/original',
      userId: USER_A_ID
    });
    const updatedByUrl = await items.upsertByIdentity({
      normalizedUrl: 'https://example.com/original',
      subscriptionId: subscription.id,
      title: 'Updated by URL',
      url: 'https://example.com/original?utm=ignored',
      userId: USER_A_ID
    });

    expect(created.created).toBe(true);
    expect(updatedByGuid.created).toBe(false);
    expect(updatedByUrl.created).toBe(false);
    expect(updatedByGuid.item.id).toBe(created.item.id);
    expect(updatedByGuid.item.title).toBe('Updated title');
    expect(updatedByUrl.item.id).toBe(created.item.id);
    expect(updatedByUrl.item.title).toBe('Updated by URL');
    await expect(items.findManyForReview({ userId: USER_A_ID })).resolves.toMatchObject({
      items: [expect.any(Object)],
      total: 1
    });
  });

  it('resolves concurrent identity inserts to one feed item', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    const subscription = await seedSubscription(USER_A_ID);
    const input = {
      guid: 'concurrent-guid',
      normalizedUrl: 'https://example.com/concurrent',
      subscriptionId: subscription.id,
      title: 'Concurrent item',
      url: 'https://example.com/concurrent',
      userId: USER_A_ID
    };

    const results = await Promise.all([
      items.upsertByIdentity(input),
      items.upsertByIdentity(input)
    ]);

    expect(results.filter(({ created }) => created)).toHaveLength(1);
    expect(new Set(results.map(({ item }) => item.id)).size).toBe(1);
    await expect(items.findManyForReview({ userId: USER_A_ID })).resolves.toMatchObject({
      total: 1
    });
  });

  it('resolves a GUID and URL bridge without overwriting either stored identity', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    const subscription = await seedSubscription(USER_A_ID);
    const guidItem = await items.create({
      guid: 'stable-guid',
      normalizedUrl: 'https://example.com/guid-item',
      subscriptionId: subscription.id,
      title: 'GUID item',
      url: 'https://example.com/guid-item',
      userId: USER_A_ID
    });
    const urlItem = await items.create({
      guid: 'other-guid',
      normalizedUrl: 'https://example.com/url-item',
      subscriptionId: subscription.id,
      title: 'URL item',
      url: 'https://example.com/url-item',
      userId: USER_A_ID
    });

    const result = await items.upsertByIdentity({
      guid: 'stable-guid',
      normalizedUrl: 'https://example.com/url-item',
      subscriptionId: subscription.id,
      title: 'Updated GUID item',
      url: 'https://example.com/url-item',
      userId: USER_A_ID
    });

    expect(result).toMatchObject({
      created: false,
      item: {
        id: guidItem.id,
        normalizedUrl: 'https://example.com/guid-item',
        title: 'Updated GUID item',
        url: 'https://example.com/guid-item'
      }
    });
    await expect(items.findById(urlItem.id, USER_A_ID)).resolves.toMatchObject({
      id: urlItem.id,
      normalizedUrl: 'https://example.com/url-item',
      title: 'URL item'
    });
  });

  it('rolls back every item in a failed identity batch', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    await seedUser(USER_B_ID, 'feed-items-b@example.com');
    const subscription = await seedSubscription(USER_A_ID);
    const existing = await items.create({
      guid: 'existing-guid',
      normalizedUrl: 'https://example.com/existing',
      subscriptionId: subscription.id,
      title: 'Original title',
      url: 'https://example.com/existing',
      userId: USER_A_ID
    });

    await expect(
      items.upsertManyByIdentity([
        {
          guid: 'existing-guid',
          normalizedUrl: 'https://example.com/existing',
          subscriptionId: subscription.id,
          title: 'Partially updated title',
          url: 'https://example.com/existing',
          userId: USER_A_ID
        },
        {
          normalizedUrl: 'https://example.com/cross-owner',
          subscriptionId: subscription.id,
          title: 'Cross-owner item',
          url: 'https://example.com/cross-owner',
          userId: USER_B_ID
        }
      ])
    ).rejects.toThrow();

    await expect(items.findById(existing.id, USER_A_ID)).resolves.toMatchObject({
      id: existing.id,
      title: 'Original title'
    });
    await expect(items.findManyForReview({ userId: USER_B_ID })).resolves.toMatchObject({
      total: 0
    });
  });

  it('marks items dismissed and saved only for the owning user', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    await seedUser(USER_B_ID, 'feed-items-b@example.com');
    const subscription = await seedSubscription(USER_A_ID);
    const linkId = await seedLink(USER_A_ID);

    const item = await items.create({
      guid: 'guid-a',
      normalizedUrl: 'https://example.com/post',
      subscriptionId: subscription.id,
      title: 'Item A',
      url: 'https://example.com/post',
      userId: USER_A_ID
    });

    await expect(items.dismiss(item.id, USER_B_ID)).resolves.toBeNull();
    const dismissed = await items.dismiss(item.id, USER_A_ID, new Date('2026-06-28T12:00:00Z'));
    expect(dismissed).toMatchObject({ id: item.id, state: 'dismissed' });
    expect(dismissed?.dismissedAt?.toISOString()).toBe('2026-06-28T12:00:00.000Z');

    await expect(items.save(item.id, USER_B_ID, linkId)).resolves.toBeNull();
    const saved = await items.save(item.id, USER_A_ID, linkId, new Date('2026-06-28T13:00:00Z'));
    expect(saved).toMatchObject({ id: item.id, linkId, state: 'saved' });
    expect(saved?.savedAt?.toISOString()).toBe('2026-06-28T13:00:00.000Z');
  });

  it('clears the feed item link reference when its saved article is deleted', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    const subscription = await seedSubscription(USER_A_ID);
    const linkId = await seedLink(USER_A_ID);
    const item = await items.create({
      linkId,
      normalizedUrl: 'https://example.com/post',
      state: 'saved',
      subscriptionId: subscription.id,
      title: 'Saved item',
      url: 'https://example.com/post',
      userId: USER_A_ID
    });

    await db.delete(linksTable).where(sql`${linksTable.id} = ${linkId}::uuid`);

    await expect(items.findById(item.id, USER_A_ID)).resolves.toMatchObject({
      id: item.id,
      linkId: null
    });
  });

  it('reconciles matching staged items to an existing saved link by normalized URL', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    await seedUser(USER_B_ID, 'feed-items-b@example.com');
    const subscriptionA = await seedSubscription(USER_A_ID);
    const subscriptionB = await seedSubscription(USER_B_ID, 'https://other.example/feed.xml');
    const linkId = await seedLink(USER_A_ID);

    const itemA = await items.create({
      normalizedUrl: 'https://example.com/post',
      subscriptionId: subscriptionA.id,
      title: 'Item A',
      url: 'https://example.com/post',
      userId: USER_A_ID
    });
    await items.create({
      normalizedUrl: 'https://example.com/post',
      subscriptionId: subscriptionB.id,
      title: 'Item B',
      url: 'https://example.com/post',
      userId: USER_B_ID
    });

    const reconciled = await items.reconcileSavedByUrl({
      linkId,
      normalizedUrl: 'https://example.com/post',
      savedAt: new Date('2026-06-28T12:00:00Z'),
      userId: USER_A_ID
    });

    expect(reconciled.map((item) => item.id)).toEqual([itemA.id]);
    expect(reconciled[0]).toMatchObject({ linkId, state: 'saved' });
    await expect(
      items.findManyForReview({ state: 'new', userId: USER_B_ID })
    ).resolves.toMatchObject({ items: [expect.any(Object)], total: 1 });
  });

  it('prunes old and excess unsaved items while keeping saved items', async () => {
    const items = createDrizzleFeedItemsAdapter(db);
    await seedUser(USER_A_ID, 'feed-items-a@example.com');
    const subscription = await seedSubscription(USER_A_ID);
    const linkId = await seedLink(USER_A_ID);

    const oldUnsaved = await items.create({
      discoveredAt: new Date('2026-01-01T00:00:00Z'),
      normalizedUrl: 'https://example.com/old-unsaved',
      subscriptionId: subscription.id,
      title: 'Old unsaved',
      url: 'https://example.com/old-unsaved',
      userId: USER_A_ID
    });
    const oldSaved = await items.create({
      discoveredAt: new Date('2026-01-02T00:00:00Z'),
      linkId,
      normalizedUrl: 'https://example.com/old-saved',
      state: 'saved',
      subscriptionId: subscription.id,
      title: 'Old saved',
      url: 'https://example.com/old-saved',
      userId: USER_A_ID
    });
    const newest = await items.create({
      discoveredAt: new Date('2026-06-28T00:00:00Z'),
      normalizedUrl: 'https://example.com/newest',
      subscriptionId: subscription.id,
      title: 'Newest',
      url: 'https://example.com/newest',
      userId: USER_A_ID
    });
    const secondNewest = await items.create({
      discoveredAt: new Date('2026-06-27T00:00:00Z'),
      normalizedUrl: 'https://example.com/second-newest',
      subscriptionId: subscription.id,
      title: 'Second newest',
      url: 'https://example.com/second-newest',
      userId: USER_A_ID
    });

    const removed = await items.pruneForSubscription({
      before: new Date('2026-04-01T00:00:00Z'),
      keepLatest: 1,
      subscriptionId: subscription.id,
      userId: USER_A_ID
    });

    expect(removed).toBe(2);
    await expect(items.findById(oldUnsaved.id, USER_A_ID)).resolves.toBeNull();
    await expect(items.findById(oldSaved.id, USER_A_ID)).resolves.toMatchObject({
      id: oldSaved.id
    });
    await expect(items.findById(newest.id, USER_A_ID)).resolves.toMatchObject({ id: newest.id });
    await expect(items.findById(secondNewest.id, USER_A_ID)).resolves.toBeNull();
  });
});
