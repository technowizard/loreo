import { createRoute, z } from '@hono/zod-openapi';

import { HttpStatus } from '@/lib/response.js';

import { currentUser } from '@/middlewares/current-user.js';

const tags = ['Files'];

export const getFileRoute = createRoute({
  tags,
  method: 'get',
  path: '/files/:key{.*}',
  middleware: [currentUser],
  request: {
    params: z.object({
      key: z.string().min(1, 'File key is required').openapi({
        description: 'File path (can contain slashes)',
        example: 'shared/articles/2026-01-06/filename.jpg'
      })
    })
  },
  responses: {
    [HttpStatus.OK]: {
      description: 'File content',
      content: {
        'application/octet-stream': {
          schema: z.any()
        }
      }
    },
    [HttpStatus.UNAUTHORIZED]: {
      description: 'Unauthorized'
    },
    [HttpStatus.FORBIDDEN]: {
      description: 'Forbidden - Access denied to this file'
    },
    [HttpStatus.NOT_FOUND]: {
      description: 'File not found'
    }
  }
});

export type GetFileRoute = typeof getFileRoute;
