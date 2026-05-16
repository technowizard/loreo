import type { Job } from 'bullmq';

import { createQueue } from '@/lib/job-queue.js';
import { logger } from '@/lib/logger.js';

export interface CsvImportJobData {
  importSessionId: string;
  userId: string;
  filePath: string;
  fieldMapping: {
    url: string;
    title?: string;
    tags?: string;
    timeAdded?: string;
  };
  tagName: string; // e.g., "Imported from CSV", "Imported from CSV (2)"
  skipDuplicates: boolean;
}

const enqueueCsvImport = createQueue('csv-import');

enqueueCsvImport.on('waiting', (job: Job<CsvImportJobData>) => {
  logger.info(`[Queue] CSV import job ${job.id} is waiting`);
});

enqueueCsvImport.on('error', (error: Error) => {
  logger.error(`[Queue] CSV import queue error: ${JSON.stringify(error)}`);
});

export { enqueueCsvImport };
