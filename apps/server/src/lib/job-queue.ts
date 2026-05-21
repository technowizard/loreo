import { Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq';

import redisConfig from '@/config/redis.config.js';

import { isDemoMode } from '@/lib/demo-mode.js';

type NoopJob = {
  id: string;
};

class NoopQueue {
  constructor(private readonly name: string) {}

  add(): Promise<NoopJob> {
    return Promise.resolve({ id: `${this.name}:demo-job` });
  }

  async close(): Promise<void> {}

  async getJob(): Promise<null> {
    return null;
  }

  on(): this {
    return this;
  }
}

class NoopWorker {
  async close(): Promise<void> {}

  on(): this {
    return this;
  }
}

export function createQueue(name: string, options?: QueueOptions) {
  if (isDemoMode()) return new NoopQueue(name) as unknown as Queue;

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
  if (isDemoMode()) return new NoopWorker() as unknown as Worker;

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
