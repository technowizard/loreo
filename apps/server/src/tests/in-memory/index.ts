import type { Repos } from '@/lib/types.js';

import type { Tag } from '@/types/tags.js';

import { createInMemoryAuthAdapter } from './auth.js';
import { createInMemoryHighlightsAdapter } from './highlights.js';
import { createInMemoryImportSessionsAdapter } from './import-sessions.js';
import { createInMemoryLinksAdapter } from './links.js';
import { createInMemoryTagsAdapter } from './tags.js';

/**
 * Builds all in-memory repo adapters. Each call returns fresh stores,
 * so call this inside buildClient() (or beforeEach) for test isolation.
 *
 * tagLinkRelations is shared between the links and tags adapters — it is the
 * in-memory equivalent of the link_tags join table that both repos touch.
 *
 * When adding a new repository:
 *   1. Create src/tests/in-memory/<resource>.ts
 *   2. Import createInMemoryXxxAdapter here
 *   3. Add xxx: createInMemoryXxxAdapter() below
 */
export function createInMemoryRepos(): Repos {
  const tagLinkRelations = new Map<string, Tag[]>();

  return {
    auth: createInMemoryAuthAdapter(),
    highlights: createInMemoryHighlightsAdapter(),
    importSessions: createInMemoryImportSessionsAdapter().repo,
    links: createInMemoryLinksAdapter(tagLinkRelations),
    tags: createInMemoryTagsAdapter(tagLinkRelations).repo
  };
}
