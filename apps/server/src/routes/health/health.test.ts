import { testClient } from 'hono/testing';
import { describe, expect, it } from 'vitest';

import { createTestApp } from '@/lib/create-app.js';
import { HttpStatus } from '@/lib/response.js';

import router from './health.index.js';

const client = testClient(createTestApp(router));

describe('health routes', () => {
  it('get /health returns 200 with ok status', async () => {
    const response = await client.health.$get();

    expect(response.status).toBe(HttpStatus.OK);

    const body = await response.json();

    expect(body).toMatchObject({
      status: 'ok',
      db: 'ok',
      uptime: expect.any(Number)
    });
  });
});
