import type { RedisClient } from 'hono-rate-limiter';
import { RedisStore, rateLimiter } from 'hono-rate-limiter';
import { Redis } from 'ioredis';

import redisConfig from '@/config/redis.config.js';

const redisClient = new Redis(redisConfig);

// node-redis workaround using ioredis to adapt the redis client for hono-rate-limiter
const redisAdapter: RedisClient = {
  scriptLoad: (script: string) => redisClient.script('LOAD', script) as Promise<string>,
  evalsha: <TArgs extends unknown[], TData = unknown>(sha1: string, keys: string[], args: TArgs) =>
    redisClient.evalsha(sha1, keys.length, ...keys, ...(args as string[])) as Promise<TData>,
  decr: (key: string) => redisClient.decr(key),
  del: (key: string) => redisClient.del(key)
};

const ONE_HOUR_WINDOW = 60 * 60 * 1000;

function makeStore(prefix: string) {
  return new RedisStore({
    client: redisAdapter,
    prefix
  });
}

function keyByUser(c: any): string {
  return c.get('user')?.id ?? 'anon';
}

async function keyByIpAndEmail(c: any): Promise<string> {
  let email = 'unknown';

  try {
    const body = await c.req.json();
    email = typeof body?.email === 'string' ? body.email.toLowerCase() : email;
  } catch {
    // keep unknown email key for malformed requests
  }

  const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || c.req.header('x-real-ip') || 'unknown';

  return `${ip}:${email}`;
}

export const authRegisterRateLimit = rateLimiter({
  windowMs: ONE_HOUR_WINDOW,
  limit: 10,
  keyGenerator: keyByIpAndEmail,
  store: makeStore('rl:auth:register:')
});

export const authLoginRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: keyByIpAndEmail,
  store: makeStore('rl:auth:login:')
});

export const createLinkRateLimit = rateLimiter({
  windowMs: ONE_HOUR_WINDOW,
  limit: 50,
  keyGenerator: keyByUser,
  store: makeStore('rl:links:create:')
});

export const importUploadRateLimit = rateLimiter({
  windowMs: ONE_HOUR_WINDOW,
  limit: 10,
  keyGenerator: keyByUser,
  store: makeStore('rl:import:upload:')
});

export const importPreviewRateLimit = rateLimiter({
  windowMs: ONE_HOUR_WINDOW,
  limit: 50,
  keyGenerator: keyByUser,
  store: makeStore('rl:import:preview:')
});

export const importExecuteRateLimit = rateLimiter({
  windowMs: ONE_HOUR_WINDOW,
  limit: 5,
  keyGenerator: keyByUser,
  store: makeStore('rl:import:execute:')
});
