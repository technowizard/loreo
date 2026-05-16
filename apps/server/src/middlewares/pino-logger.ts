import { pinoLogger as logger } from 'hono-pino';
import pino from 'pino';
import pretty from 'pino-pretty';

import { env } from '../lib/env-config.js';

export function pinoLogger() {
  return logger({
    pino: pino(
      {
        level: 'info'
      },
      env.isProduction ? undefined : pretty()
    )
  });
}
