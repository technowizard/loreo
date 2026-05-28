import process from 'node:process';

import { serve } from '@hono/node-server';
import { showRoutes } from 'hono/dev';

import { env } from './lib/env-config.js';
import { logger } from './lib/logger.js';

import { browserService } from './services/browser.service.js';

import app from './app.js';
import { enqueueContentExtraction } from './queues/content-extraction.queue.js';
import contentExtractionWorker from './workers/content-extraction.worker.js';
import csvImportWorker from './workers/csv-import.worker.js';

if (env.isDevelopment) {
  logger.info('Available routes:');
  showRoutes(app);
}

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT
  },
  (info) => {
    logger.info(`Server is running on http://${env.HOST}:${info.port}`);
  }
);

let isShuttingDown = false;

function onCloseSignal() {
  logger.info('sigint or sigterm received, closing server...');

  isShuttingDown = true;

  server.close(async () => {
    logger.info('server closed');

    await Promise.all([
      contentExtractionWorker.close(),
      csvImportWorker.close(),
      enqueueContentExtraction.close(),
      browserService.close()
    ]);

    process.exit();
  });

  setTimeout(() => {
    logger.info('server not closed in 10 seconds. forcing shutdown');
    process.exit(1);
  }, 10_000).unref();
}

export function getIsShuttingDown() {
  return isShuttingDown;
}

process.on('SIGINT', onCloseSignal);
process.on('SIGTERM', onCloseSignal);
