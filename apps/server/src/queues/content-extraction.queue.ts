import type { Job } from 'bullmq';

import { createQueue } from '@/lib/job-queue.js';
import { logger } from '@/lib/logger.js';

import type { UserIdentity } from '@/types/auth.js';

export interface ContentExtractionJobData {
  linkId: string;
  url: string;
  user: UserIdentity;
  importSessionId?: string; // optional reference to import session for sequential processing
}

const enqueueContentExtraction = createQueue('content-extraction');

enqueueContentExtraction.on('waiting', (job: Job<ContentExtractionJobData>) => {
  logger.info(`[Queue] Content extraction job ${job.id} is waiting`);
});

enqueueContentExtraction.on('error', (error: Error) => {
  logger.error(`[Queue] Content extraction queue error: ${JSON.stringify(error)}`);
});

export { enqueueContentExtraction };
