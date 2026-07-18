import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/index.js';
import { feedItemsTable, linksTable, usersTable } from '@/db/schemas/index.js';

import { createDrizzleFeedSubscriptionsAdapter } from './feed-subscriptions.repository.js';

const USER_A_ID = '10000000-0000-0000-0000-000000000001';
const USER_B_ID = '10000000-0000-0000-0000-000000000002';

async function seedUser(id: string, email: string) {
  await db.insert(usersTable).values({
    id,
    email,
    passwordHash: 'hashed-password',
    name: email,
    settings: {}
  });
}

describe('feed subscriptions repository', () => {
  it('creates and scopes subscriptions by user', async () => {
    const repo = createDrizzleFeedSubscriptionsAdapter(db);
    await seedUser(USER_A_ID, 'feeds-a@example.com');
    await seedUser(USER_B_ID, 'feeds-b@example.com');

    const subscription = await repo.create({
      feedUrl: 'https://example.com/feed.xml',
      normalizedFeedUrl: 'https://example.com/feed.xml',
      siteUrl: 'https://example.com',
      title: 'Example Feed',
      userId: USER_A_ID
    });

    expect(subscription.id).toBeTruthy();
    expect(subscription.autoSave).toBe(false);
    expect(subscription.status).toBe('active');
    await expect(repo.findById(subscription.id, USER_A_ID)).resolves.toMatchObject({
      id: subscription.id,
      title: 'Example Feed'
    });
    await expect(repo.findById(subscription.id, USER_B_ID)).resolves.toBeNull();
  });

  it('deletes feed item history while preserving saved library articles', async () => {
    const repo = createDrizzleFeedSubscriptionsAdapter(db);
    await seedUser(USER_A_ID, 'feeds-a@example.com');

    const subscription = await repo.create({
      feedUrl: 'https://example.com/feed.xml',
      normalizedFeedUrl: 'https://example.com/feed.xml',
      title: 'Example Feed',
      userId: USER_A_ID
    });
    const [link] = await db
      .insert(linksTable)
      .values({
        readingTime: 0,
        title: 'Saved Article',
        url: 'https://example.com/article',
        userId: USER_A_ID
      })
      .returning({ id: linksTable.id });
    if (!link) throw new Error('Expected saved article fixture');

    await db.insert(feedItemsTable).values({
      linkId: link.id,
      normalizedUrl: 'https://example.com/article',
      state: 'saved',
      subscriptionId: subscription.id,
      title: 'Saved Article',
      url: 'https://example.com/article',
      userId: USER_A_ID
    });

    await expect(repo.delete(subscription.id, USER_A_ID)).resolves.toBe(true);

    const feedItems = await db
      .select({ id: feedItemsTable.id })
      .from(feedItemsTable)
      .where(eq(feedItemsTable.subscriptionId, subscription.id));
    const savedLinks = await db
      .select({ id: linksTable.id })
      .from(linksTable)
      .where(eq(linksTable.id, link.id));

    expect(feedItems).toHaveLength(0);
    expect(savedLinks).toEqual([{ id: link.id }]);
  });

  it('finds duplicate normalized feed URLs per user while allowing another user', async () => {
    const repo = createDrizzleFeedSubscriptionsAdapter(db);
    await seedUser(USER_A_ID, 'feeds-a@example.com');
    await seedUser(USER_B_ID, 'feeds-b@example.com');

    await repo.create({
      feedUrl: 'https://example.com/feed.xml',
      normalizedFeedUrl: 'https://example.com/feed.xml',
      title: 'Example Feed',
      userId: USER_A_ID
    });
    await repo.create({
      feedUrl: 'https://example.com/feed.xml',
      normalizedFeedUrl: 'https://example.com/feed.xml',
      title: 'Example Feed For B',
      userId: USER_B_ID
    });

    const duplicateForA = await repo.findByNormalizedUrl('https://example.com/feed.xml', USER_A_ID);
    const duplicateForB = await repo.findByNormalizedUrl('https://example.com/feed.xml', USER_B_ID);

    expect(duplicateForA?.title).toBe('Example Feed');
    expect(duplicateForB?.title).toBe('Example Feed For B');
    await expect(
      repo.create({
        feedUrl: 'https://example.com/feed.xml',
        normalizedFeedUrl: 'https://example.com/feed.xml',
        title: 'Duplicate Feed',
        userId: USER_A_ID
      })
    ).rejects.toThrow();
  });

  it('returns active due subscriptions and skips paused or future subscriptions', async () => {
    const repo = createDrizzleFeedSubscriptionsAdapter(db);
    await seedUser(USER_A_ID, 'feeds-a@example.com');

    const now = new Date('2026-06-28T12:00:00Z');
    const due = await repo.create({
      feedUrl: 'https://due.example/feed.xml',
      normalizedFeedUrl: 'https://due.example/feed.xml',
      nextFetchAfter: new Date('2026-06-28T11:00:00Z'),
      title: 'Due Feed',
      userId: USER_A_ID
    });
    const neverFetched = await repo.create({
      feedUrl: 'https://new.example/feed.xml',
      normalizedFeedUrl: 'https://new.example/feed.xml',
      title: 'New Feed',
      userId: USER_A_ID
    });
    const future = await repo.create({
      feedUrl: 'https://future.example/feed.xml',
      normalizedFeedUrl: 'https://future.example/feed.xml',
      nextFetchAfter: new Date('2026-06-28T13:00:00Z'),
      title: 'Future Feed',
      userId: USER_A_ID
    });
    const paused = await repo.create({
      feedUrl: 'https://paused.example/feed.xml',
      normalizedFeedUrl: 'https://paused.example/feed.xml',
      title: 'Paused Feed',
      userId: USER_A_ID
    });
    await repo.update(paused.id, USER_A_ID, { status: 'paused' });

    const dueFeeds = await repo.findDue(now);
    const dueIds = dueFeeds.map((feed) => feed.id);

    expect(dueIds).toContain(due.id);
    expect(dueIds).toContain(neverFetched.id);
    expect(dueIds).not.toContain(future.id);
    expect(dueIds).not.toContain(paused.id);
  });

  it('updates fetch metadata only for the owning user', async () => {
    const repo = createDrizzleFeedSubscriptionsAdapter(db);
    await seedUser(USER_A_ID, 'feeds-a@example.com');
    await seedUser(USER_B_ID, 'feeds-b@example.com');

    const subscription = await repo.create({
      feedUrl: 'https://example.com/feed.xml',
      normalizedFeedUrl: 'https://example.com/feed.xml',
      title: 'Example Feed',
      userId: USER_A_ID
    });

    await expect(
      repo.updateFetchMetadata(subscription.id, USER_B_ID, {
        failureCount: 1,
        lastError: 'Wrong user'
      })
    ).resolves.toBeNull();

    const updated = await repo.updateFetchMetadata(subscription.id, USER_A_ID, {
      etag: 'abc123',
      failureCount: 0,
      lastError: null,
      lastFetchedAt: new Date('2026-06-28T12:00:00Z'),
      lastModified: 'Sun, 28 Jun 2026 12:00:00 GMT',
      lastSuccessfulFetchAt: new Date('2026-06-28T12:00:00Z'),
      nextFetchAfter: new Date('2026-06-28T18:00:00Z')
    });

    expect(updated).toMatchObject({
      etag: 'abc123',
      failureCount: 0,
      lastError: null,
      lastModified: 'Sun, 28 Jun 2026 12:00:00 GMT'
    });
  });
});
