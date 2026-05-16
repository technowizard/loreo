import type { RedisOptions } from 'ioredis';

import { env } from '@/lib/env-config.js';

const redisConfig: RedisOptions = {
  host: env.REDIS_HOST,
  maxRetriesPerRequest: null, // required for bullmq
  port: env.REDIS_PORT ? Number(env.REDIS_PORT) : 6379
};

export default redisConfig;
