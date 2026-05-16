import { db } from './db/index.js';

import configureOpenAPI from './lib/configure-open-api.js';
import createApp from './lib/create-app.js';
import type { Repos } from './lib/types.js';

import { createDrizzleAuthAdapter } from './repositories/auth.repository.js';
import { createDrizzleHighlightsAdapter } from './repositories/highlights.repository.js';
import { createDrizzleImportSessionsAdapter } from './repositories/import-sessions.repository.js';
import { createDrizzleLinksAdapter } from './repositories/links.repository.js';
import { createDrizzleTagsAdapter } from './repositories/tags.repository.js';

import auth from './routes/auth/auth.index.js';
import files from './routes/files/files.index.js';
import health from './routes/health/health.index.js';
import highlights from './routes/highlights/highlights.index.js';
import home from './routes/home/home.index.js';
import imports from './routes/imports/imports.index.js';
import links from './routes/links/links.index.js';
import tags from './routes/tags/tags.index.js';

const app = createApp();

const repos: Repos = {
  auth: createDrizzleAuthAdapter(db),
  highlights: createDrizzleHighlightsAdapter(db),
  importSessions: createDrizzleImportSessionsAdapter(db),
  links: createDrizzleLinksAdapter(db),
  tags: createDrizzleTagsAdapter(db)
};

app.use('*', async (c, next) => {
  c.set('repos', repos);
  return next();
});

configureOpenAPI(app);

const router = app
  .route('/', health)
  .route('/', auth)
  .route('/', home)
  .route('/', links)
  .route('/', highlights)
  .route('/', tags)
  .route('/', files)
  .route('/', imports);

export type AppType = typeof router;

export default app;
