import { createRoute, z } from '@hono/zod-openapi';

import { jsonContent } from '@/lib/openapi.js';
import { errorResponseSchema, HttpStatus, successResponseSchema } from '@/lib/response.js';

import { adminUser } from '@/middlewares/admin-user.js';
import { currentUser } from '@/middlewares/current-user.js';

const tags = ['Admin'];

const adminSafeUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.string(),
  settings: z.record(z.string(), z.unknown()),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  articleCount: z.number().optional()
});

const userParamsSchema = z.object({ id: z.uuid() });
const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(['active', 'deleted', 'all']).default('active')
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['admin', 'user']).optional()
});

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8),
    confirmNewPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword']
  });

const connectionCheckSchema = z.object({
  id: z.string(),
  label: z.string(),
  latencyMs: z.number().optional(),
  message: z.string().optional(),
  status: z.enum(['ok', 'degraded', 'down'])
});

export const listUsers = createRoute({
  tags,
  method: 'get',
  path: '/admin/users',
  middleware: [currentUser, adminUser],
  request: {
    query: listUsersQuerySchema
  },
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

export const getUser = createRoute({
  tags,
  method: 'get',
  path: '/admin/users/{id}',
  middleware: [currentUser, adminUser],
  request: { params: userParamsSchema },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(adminSafeUserSchema),
      'User fetched successfully'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'User not found'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), 'Forbidden')
  }
});

export const updateUser = createRoute({
  tags,
  method: 'patch',
  path: '/admin/users/{id}',
  middleware: [currentUser, adminUser],
  request: {
    params: userParamsSchema,
    body: jsonContent(updateUserSchema, 'Update user')
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(adminSafeUserSchema),
      'User updated successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'User update failed'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'User not found'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), 'Forbidden'),
    [HttpStatus.UNPROCESSABLE_ENTITY]: jsonContent(
      errorResponseSchema(HttpStatus.UNPROCESSABLE_ENTITY),
      'Validation failed'
    )
  }
});

export const resetPassword = createRoute({
  tags,
  method: 'post',
  path: '/admin/users/{id}/reset-password',
  middleware: [currentUser, adminUser],
  request: {
    params: userParamsSchema,
    body: jsonContent(resetPasswordSchema, 'Reset user password')
  },
  responses: {
    [HttpStatus.OK]: jsonContent(successResponseSchema(z.null()), 'Password reset successfully'),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Password reset failed'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'User not found'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), 'Forbidden'),
    [HttpStatus.UNPROCESSABLE_ENTITY]: jsonContent(
      errorResponseSchema(HttpStatus.UNPROCESSABLE_ENTITY),
      'Validation failed'
    )
  }
});

export const softDeleteUser = createRoute({
  tags,
  method: 'delete',
  path: '/admin/users/{id}',
  middleware: [currentUser, adminUser],
  request: { params: userParamsSchema },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(adminSafeUserSchema),
      'User deleted successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'User delete failed'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'User not found'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), 'Forbidden')
  }
});

export const restoreUser = createRoute({
  tags,
  method: 'post',
  path: '/admin/users/{id}/restore',
  middleware: [currentUser, adminUser],
  request: { params: userParamsSchema },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(adminSafeUserSchema),
      'User restored successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'User restore failed'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'User not found'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), 'Forbidden')
  }
});

export const listConnections = createRoute({
  tags,
  method: 'get',
  path: '/admin/health/connections',
  middleware: [currentUser, adminUser],
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.array(connectionCheckSchema)),
      'Service connections fetched successfully'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), 'Forbidden')
  }
});

export type ListUsersRoute = typeof listUsers;
export type GetUserRoute = typeof getUser;
export type UpdateUserRoute = typeof updateUser;
export type ResetPasswordRoute = typeof resetPassword;
export type SoftDeleteUserRoute = typeof softDeleteUser;
export type RestoreUserRoute = typeof restoreUser;
export type ListConnectionsRoute = typeof listConnections;
