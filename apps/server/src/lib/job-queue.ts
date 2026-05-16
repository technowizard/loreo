import { Queue, Worker, type QueueOptions, type WorkerOptions } from 'bullmq';

import redisConfig from '@/config/redis.config.js';

export function createQueue(name: string, options?: QueueOptions) {
  return new Queue(name, {
    connection: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        delay: 1000,
        type: 'exponential'
      },
      removeOnComplete: {
        age: 60 * 60 * 24 * 7, // 7 days
        count: 1000
      },
      removeOnFail: {
        age: 60 * 60 * 24 * 30, // 30 days
        count: 5000
      }
    },
    ...options
  });
}

export function createWorker(
  name: string,
  processor: any,
  options?: Omit<WorkerOptions, 'connection'>
) {
  return new Worker(name, processor, {
    connection: redisConfig,
    concurrency: 1,
    limiter: {
      duration: 10_000,
      max: 20
    },
    ...options
  });
}
