import { existsSync, readFileSync } from 'node:fs';

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

dotenv.config({ path: '.env.test' });

// Import after dotenv so env-config picks up .env.test values
const { env } = await import('../src/lib/env-config.js');

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle({ client: pool });

if (env.NODE_ENV !== 'test') {
  throw new Error('Refusing to reset database outside NODE_ENV=test.');
}

if (!env.DATABASE_DB.includes('test')) {
  throw new Error(`Refusing to reset non-test database: ${env.DATABASE_DB}`);
}

console.log('Resetting test database schema...');
await pool.query('DROP SCHEMA IF EXISTS public CASCADE;');
await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');
await pool.query('CREATE SCHEMA public;');
console.log('Test database schema reset complete.');

const initSqlPath = 'scripts/init-db.sql';
if (existsSync(initSqlPath)) {
  console.log('Running init-db.sql...');
  const initSql = readFileSync(initSqlPath, 'utf-8');
  await pool.query(initSql);
  console.log('init-db.sql complete.');
}

const migrationsFolder = existsSync('src/db/migrations') ? 'src/db/migrations' : 'migrations';

console.log('Running test migrations...');

await migrate(db, { migrationsFolder });
await pool.end();

console.log('Test migrations complete.');
