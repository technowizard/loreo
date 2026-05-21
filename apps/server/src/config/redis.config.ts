import type { RedisOptions } from 'ioredis';

import { env } from '@/lib/env-config.js';

function parseRedisUrl(redisUrl: string): RedisOptions {
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    maxRetriesPerRequest: null, // required for bullmq
    password: url.password || undefined,
    port: url.port ? Number(url.port) : 6379,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    username: url.username || undefined
  };
}

const redisConfig: RedisOptions = env.REDIS_URL
  ? parseRedisUrl(env.REDIS_URL)
  : {
      host: env.REDIS_HOST,
      maxRetriesPerRequest: null, // required for bullmq
      port: env.REDIS_PORT ? Number(env.REDIS_PORT) : 6379
    };

export default redisConfig;
