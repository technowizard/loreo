import pino from 'pino';
import pretty from 'pino-pretty';

import { env } from './env-config.js';

export const logger = pino(
  {
    level: env.isProduction ? 'info' : 'debug'
  },
  env.isProduction ? undefined : pretty()
);
