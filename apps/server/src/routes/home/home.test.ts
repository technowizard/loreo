import { testClient } from 'hono/testing';
import { describe, expect, it } from 'vitest';

import { createInMemoryRepos } from '@/tests/in-memory/index.js';

import { DEMO_LINKS } from '@/db/fixtures.js';

import { createTestApp } from '@/lib/create-app.js';
import { generateToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';

import type { UserWithoutPassword } from '@/types/auth.js';
import type { HomeSuggestions } from '@/types/links.js';

import router from './home.index.js';

const TEST_USER: UserWithoutPassword = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'home-test@example.com',
  name: 'Test User',
  avatar: null,
  role: 'user',
  settings: {},
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const authCookie = `token=${await generateToken(TEST_USER.id, TEST_USER.email)}`;

const SHORT_LINKS = DEMO_LINKS.filter(
  (l) => !l.isRead && !l.isArchived && l.processingStatus === 'completed' && l.readingTime < 10
);
const LONG_LINKS = DEMO_LINKS.filter(
  (l) => !l.isRead && !l.isArchived && l.processingStatus === 'completed' && l.readingTime >= 10
);
const IN_PROGRESS = DEMO_LINKS.find(
  (l) => !l.isRead && l.processingStatus === 'completed' && (l.readingProgress ?? 0) > 0
);

const emptySuggestions: HomeSuggestions = {
  continueReading: null,
  recentlySaved: [],
  longReads: { totalArticles: 0, totalReadingTime: 0 },
  shortReads: { totalArticles: 0, totalReadingTime: 0 },
  hasReadArticle: true
};

const seededSuggestions: HomeSuggestions = {
  continueReading: IN_PROGRESS
    ? {
        id: 'in-progress-link-id',
        title: IN_PROGRESS.title,
        progress: IN_PROGRESS.readingProgress ?? 0,
        readingTime: IN_PROGRESS.readingTime,
        coverImage: null,
        lastReadAt: new Date().toISOString()
      }
    : null,
  recentlySaved: DEMO_LINKS.slice(0, 3).map((l) => ({
    id: crypto.randomUUID(),
    url: l.url,
    title: l.title,
    author: l.author ?? null,
    excerpt: l.excerpt ?? null,
    content: null,
    favicon: null,
    coverImage: l.coverImage ?? null,
    readingTime: l.readingTime,
    processingStatus: l.processingStatus ?? 'pending',
    priority: l.priority ?? 'none',
    isRead: l.isRead ?? false,
    isArchived: l.isArchived ?? false,
    isFavorite: l.isFavorite ?? false,
    isPaywalled: false,
    readingProgress: l.readingProgress ?? 0,
    publishedAt: null,
    textContent: null,
    timeSpentReading: 0,
    processingStartedAt: null,
    highlights: undefined,
    tags: undefined,
    createdAt: new Date().toISOString(),
    importSessionId: null
  })),
  longReads: {
    totalArticles: LONG_LINKS.length,
    totalReadingTime: LONG_LINKS.reduce((sum, l) => sum + l.readingTime, 0)
  },
  shortReads: {
    totalArticles: SHORT_LINKS.length,
    totalReadingTime: SHORT_LINKS.reduce((sum, l) => sum + l.readingTime, 0)
  },
  hasReadArticle: true
};

function buildClient(suggestions: HomeSuggestions) {
  const repos = createInMemoryRepos();
  repos.auth.findById = async (id) => (id === TEST_USER.id ? TEST_USER : null);
  repos.links.getHomeSuggestions = async () => suggestions;

  return testClient(
    createTestApp(router, (app) => {
      app.use('*', async (c, next) => {
        c.set('repos', repos);
        return next();
      });
    })
  );
}

describe('GET /api/home/suggestions', () => {
  it('returns 401 without auth', async () => {
    const client = buildClient(emptySuggestions);
    const response = await client.home.suggestions.$get();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('returns empty suggestions for a new user with no links', async () => {
    const client = buildClient(emptySuggestions);
    const response = await client.home.suggestions.$get({}, { headers: { Cookie: authCookie } });
    expect(response.status).toBe(HttpStatus.OK);
    if (response.status === HttpStatus.OK) {
      const json = await response.json();
      expect(json.result.continueReading).toBeNull();
      expect(json.result.recentlySaved).toEqual([]);
      expect(json.result.shortReads).toEqual({
        totalArticles: 0,
        totalReadingTime: 0
      });
      expect(json.result.longReads).toEqual({
        totalArticles: 0,
        totalReadingTime: 0
      });
    }
  });

  describe('with seeded links', () => {
    it('counts short reads correctly', async () => {
      const client = buildClient(seededSuggestions);
      const response = await client.home.suggestions.$get({}, { headers: { Cookie: authCookie } });
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const { result } = await response.json();
        expect(result.shortReads.totalArticles).toBe(SHORT_LINKS.length);
        expect(result.shortReads.totalReadingTime).toBe(
          SHORT_LINKS.reduce((sum, l) => sum + l.readingTime, 0)
        );
      }
    });

    it('counts long reads correctly', async () => {
      const client = buildClient(seededSuggestions);
      const response = await client.home.suggestions.$get({}, { headers: { Cookie: authCookie } });
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const { result } = await response.json();
        expect(result.longReads.totalArticles).toBe(LONG_LINKS.length);
        expect(result.longReads.totalReadingTime).toBe(
          LONG_LINKS.reduce((sum, l) => sum + l.readingTime, 0)
        );
      }
    });

    it('returns the in-progress article as continueReading', async () => {
      const client = buildClient(seededSuggestions);
      const response = await client.home.suggestions.$get({}, { headers: { Cookie: authCookie } });
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const { result } = await response.json();
        expect(result.continueReading).not.toBeNull();
        expect(result.continueReading?.title).toBe(IN_PROGRESS?.title);
        expect(result.continueReading?.progress).toBe(IN_PROGRESS?.readingProgress);
      }
    });

    it('returns recently saved links (capped at 3)', async () => {
      const client = buildClient(seededSuggestions);
      const response = await client.home.suggestions.$get({}, { headers: { Cookie: authCookie } });
      expect(response.status).toBe(HttpStatus.OK);
      if (response.status === HttpStatus.OK) {
        const { result } = await response.json();
        expect(result.recentlySaved.length).toBe(3);
      }
    });
  });
});
