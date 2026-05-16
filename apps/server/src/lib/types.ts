import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { Schema } from 'hono';
import type { PinoLogger } from 'hono-pino';

import type { AuthRepository } from '@/repositories/auth.repository.js';
import type { HighlightsRepository } from '@/repositories/highlights.repository.js';
import type { ImportSessionsRepository } from '@/repositories/import-sessions.repository.js';
import type { LinksRepository } from '@/repositories/links.repository.js';
import type { TagsRepository } from '@/repositories/tags.repository.js';

import type { UserWithoutPassword } from '@/types/auth.js';

export interface Repos {
  auth: AuthRepository;
  highlights: HighlightsRepository;
  importSessions: ImportSessionsRepository;
  links: LinksRepository;
  tags: TagsRepository;
}

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    user: UserWithoutPassword;
    repos: Repos;
  };
}

export type AppOpenAPI<S extends Schema = Schema> = OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;
