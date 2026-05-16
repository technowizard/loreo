import { sql } from 'drizzle-orm';

import { db } from '@/db/index.js';

import { HttpStatus } from '@/lib/response.js';
import type { AppRouteHandler } from '@/lib/types.js';

import type { GetHealthRoute } from './health.routes.js';

export const getHealth: AppRouteHandler<GetHealthRoute> = async (c) => {
  try {
    await db.execute(sql`SELECT 1`);

    return c.json({ status: 'ok', db: 'ok', uptime: process.uptime() }, HttpStatus.OK);
  } catch {
    return c.json(
      { status: 'degraded', db: 'error', uptime: process.uptime() },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
};
