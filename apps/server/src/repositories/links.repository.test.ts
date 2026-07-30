import { describe, expect, it } from 'vitest';

import { db } from '@/db/index.js';
import { highlightsTable, linksTable, usersTable } from '@/db/schemas/index.js';

import { createDrizzleLinksAdapter } from './links.repository.js';

const USER_A_ID = '10000000-0000-0000-0000-000000000021';
const USER_B_ID = '10000000-0000-0000-0000-000000000022';
const HOME_USER_ID = '10000000-0000-0000-0000-000000000031';

async function seedUser(id: string, email: string) {
  await db.insert(usersTable).values({
    id,
    email,
    passwordHash: 'hashed-password',
    name: email,
    settings: {}
  });
}

describe('links repository ownership', () => {
  it('only returns the requesting user highlights in upcoming and search results', async () => {
    await seedUser(USER_A_ID, 'links-a@example.com');
    await seedUser(USER_B_ID, 'links-b@example.com');

    const [candidate] = await db
      .insert(linksTable)
      .values({
        createdAt: '2020-01-01T00:00:00.000Z',
        readingTime: 5,
        title: 'Scoped candidate article',
        url: 'https://example.com/scoped-candidate',
        userId: USER_A_ID
      })
      .returning({ id: linksTable.id });
    const [current] = await db
      .insert(linksTable)
      .values({
        createdAt: '2020-01-02T00:00:00.000Z',
        readingTime: 5,
        title: 'Current article',
        url: 'https://example.com/current',
        userId: USER_A_ID
      })
      .returning({ id: linksTable.id });

    if (!candidate || !current) throw new Error('Expected article fixtures');

    await db.insert(highlightsTable).values([
      {
        color: '#000000',
        endOffset: 12,
        linkId: candidate.id,
        startOffset: 0,
        text: 'User A highlight',
        userId: USER_A_ID
      },
      {
        color: '#ffffff',
        endOffset: 24,
        linkId: candidate.id,
        startOffset: 12,
        text: 'User B highlight',
        userId: USER_B_ID
      }
    ]);

    const repo = createDrizzleLinksAdapter(db);
    const upcoming = await repo.findUpcoming(USER_A_ID, current.id);
    const search = await repo.search(USER_A_ID, 'Scoped candidate');

    expect(upcoming[0]?.highlights?.map(({ text }) => text)).toEqual(['User A highlight']);
    expect(search.items[0]?.highlights?.map(({ text }) => text)).toEqual(['User A highlight']);
  });
});

describe('links repository home suggestions', () => {
  it('collapses short/long counts correctly and excludes archived/pending/unread-mismatched rows', async () => {
    await seedUser(HOME_USER_ID, 'home@example.com');

    const base = { userId: HOME_USER_ID, processingStatus: 'completed' as const };
    // Counted as short reads (unread, unarchived, completed).
    await db.insert(linksTable).values([
      { ...base, readingTime: 5, title: 'Short 5', url: 'https://example.com/short-5' },
      { ...base, readingTime: 8, title: 'Short 8', url: 'https://example.com/short-8' }
    ]);
    // Counted as a long read.
    await db
      .insert(linksTable)
      .values({ ...base, readingTime: 20, title: 'Long 20', url: 'https://example.com/long-20' });
    // Excluded: archived.
    await db.insert(linksTable).values({
      ...base,
      isArchived: true,
      readingTime: 2,
      title: 'Archived short',
      url: 'https://example.com/archived'
    });
    // Excluded: still pending processing.
    await db.insert(linksTable).values({
      ...base,
      processingStatus: 'pending',
      readingTime: 4,
      title: 'Pending short',
      url: 'https://example.com/pending'
    });
    // Excluded from counts (already read) but flips hasReadArticle.
    await db.insert(linksTable).values({
      ...base,
      isRead: true,
      readingTime: 30,
      title: 'Read long',
      url: 'https://example.com/read-long'
    });

    const repo = createDrizzleLinksAdapter(db);
    const suggestions = await repo.getHomeSuggestions(HOME_USER_ID);

    expect(suggestions.shortReads).toEqual({ totalArticles: 2, totalReadingTime: 13 });
    expect(suggestions.longReads).toEqual({ totalArticles: 1, totalReadingTime: 20 });
    expect(suggestions.hasReadArticle).toBe(true);
  });
});
