import { createRoute, z } from '@hono/zod-openapi';

import { HttpStatus } from '@/lib/response.js';

const tags = ['Health'];

const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  db: z.enum(['ok', 'error']),
  uptime: z.number()
});

export const getHealth = createRoute({
  tags,
  method: 'get',
  path: '/health',
  responses: {
    [HttpStatus.OK]: {
      content: { 'application/json': { schema: healthResponseSchema } },
      description: 'Service is healthy'
    },
    [HttpStatus.SERVICE_UNAVAILABLE]: {
      content: { 'application/json': { schema: healthResponseSchema } },
      description: 'Service is degraded'
    }
  }
});

export type GetHealthRoute = typeof getHealth;
