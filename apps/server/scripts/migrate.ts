import { existsSync } from 'node:fs';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import { env } from '../src/lib/env-config.js';

// dev: src/db/migrations  |  prod (Dockerfile.prod copies to): ./migrations
const migrationsFolder = existsSync('src/db/migrations') ? 'src/db/migrations' : 'migrations';

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle({ client: pool });

console.log('Running migrations...');

await migrate(db, { migrationsFolder });
await pool.end();

console.log('Migrations complete.');
