import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '@/lib/env-config.js';

import * as schema from './schemas/index.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000
});

export const db = drizzle({
  client: pool,
  casing: 'snake_case',
  schema
});
