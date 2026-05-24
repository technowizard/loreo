import type { Hook } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Schema } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';

import { notFound, onError } from '../middlewares/common.js';
import { pinoLogger } from '../middlewares/pino-logger.js';
import { rateLimit } from '../middlewares/rate-limit.js';

import { env } from './env-config.js';
import { errorResponse, HttpStatus } from './response.js';
import type { AppBindings, AppOpenAPI } from './types.js';

const defaultHook: Hook<unknown, AppBindings, string, unknown> = (result, c) => {
  if (!result.success) {
    return c.json(
      errorResponse('Validation failed', HttpStatus.UNPROCESSABLE_ENTITY, result.error),
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
};

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook
  });
}

export default function createApp() {
  const app = createRouter();

  const corsOptions = env.isDevelopment
    ? {
        credentials: true,
        origin: (_origin: string) => _origin
      }
    : {
        credentials: true,
        origin: env.CORS_ORIGINS
      };

  app
    .use('*', cors(corsOptions))
    .use('*', requestId())
    .use('*', pinoLogger())
    .use(
      '*',
      bodyLimit({
        maxSize: env.BODY_SIZE_LIMIT,
        onError: (c) =>
          c.json(
            errorResponse('Request body too large', HttpStatus.REQUEST_TOO_LONG),
            HttpStatus.REQUEST_TOO_LONG
          )
      })
    )
    .use(
      secureHeaders(
        env.isDevelopment
          ? {
              crossOriginResourcePolicy: false,
              crossOriginOpenerPolicy: false
            }
          : {}
      )
    );

  if (!env.isTest) {
    app.use('*', async (c, next) => {
      if (c.req.path === '/health') {
        return next();
      }

      return rateLimit(c, next);
    });
  }

  app.notFound(notFound);
  app.onError(onError);

  return app;
}

export function createTestApp<S extends Schema>(
  router: AppOpenAPI<S>,
  setup?: (app: ReturnType<typeof createApp>) => void
) {
  const app = createApp();

  setup?.(app);

  return app.route('/', router);
}
