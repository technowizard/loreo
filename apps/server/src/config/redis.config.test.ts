import { describe, expect, it } from 'vitest';

import { importWithEnv } from '@/tests/env.js';

describe('redis.config', () => {
  it('parses a rediss redis url for upstash', async () => {
    const { default: redisConfig } = await importWithEnv(
      {
        JWT_SECRET: 'secret',
        REDIS_URL: 'rediss://default:upstash-token@demo.upstash.io:6380'
      },
      () => import('./redis.config.js')
    );

    expect(redisConfig.host).toBe('demo.upstash.io');
    expect(redisConfig.port).toBe(6380);
    expect(redisConfig.username).toBe('default');
    expect(redisConfig.password).toBe('upstash-token');
    expect(redisConfig.tls).toBeTruthy();
  });
});
