import { createRoute, z } from '@hono/zod-openapi';

import { jsonContent } from '@/lib/openapi.js';
import { errorResponseSchema, HttpStatus, successResponseSchema } from '@/lib/response.js';

import { adminUser } from '@/middlewares/admin-user.js';
import { currentUser } from '@/middlewares/current-user.js';

const tags = ['Admin'];

const adminSafeUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.string(),
  settings: z.record(z.string(), z.unknown()),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const listUsers = createRoute({
  tags,
  method: 'get',
  path: '/admin/users',
  middleware: [currentUser, adminUser],
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.array(adminSafeUserSchema)),
      'Users fetched successfully'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), 'Forbidden')
  }
});

export type ListUsersRoute = typeof listUsers;
