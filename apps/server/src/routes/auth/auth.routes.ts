import { createRoute, z } from '@hono/zod-openapi';

import { selectUsersSchema } from '@/db/schemas/index.js';
import { userSettingsSchema } from '@/db/schemas/user-settings.js';

import { createMessageObjectSchema, jsonContent, jsonContentRequired } from '@/lib/openapi.js';
import { errorResponseSchema, HttpStatus, successResponseSchema } from '@/lib/response.js';

import { currentUser } from '@/middlewares/current-user.js';
import { authLoginRateLimit, authRegisterRateLimit } from '@/middlewares/rate-limit.js';

const tags = ['Auth'];

export const create = createRoute({
  tags,
  method: 'post',
  path: '/auth/register',
  middleware: [authRegisterRateLimit],
  request: {
    body: jsonContentRequired(
      z
        .object({
          email: z.email(),
          password: z.string().min(8),
          confirmPassword: z.string(),
          name: z.string().min(1).max(255).optional()
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: 'Passwords do not match',
          path: ['confirmPassword']
        }),
      ''
    )
  },
  responses: {
    [HttpStatus.CREATED]: jsonContent(
      successResponseSchema(selectUsersSchema, HttpStatus.CREATED),
      'User Registration Success'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Registration failed'
    )
  }
});

export const login = createRoute({
  tags,
  method: 'post',
  path: '/auth/login',
  middleware: [authLoginRateLimit],
  request: {
    body: jsonContentRequired(z.object({ email: z.string(), password: z.string() }), '')
  },
  responses: {
    [HttpStatus.OK]: jsonContent(successResponseSchema(selectUsersSchema), 'Login Success'),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Invalid credentials'
    )
  }
});

export const logout = createRoute({
  tags,
  method: 'post',
  path: '/auth/logout',
  responses: {
    [HttpStatus.OK]: jsonContent(
      createMessageObjectSchema('User logged out successfully'),
      'Logout Success'
    )
  }
});

export const getUser = createRoute({
  tags,
  method: 'get',
  path: '/auth/user',
  middleware: [currentUser],
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(selectUsersSchema),
      'User retrieved successfully'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'User not found'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export type CreateRoute = typeof create;
export type LoginRoute = typeof login;
export type LogoutRoute = typeof logout;
export type GetUserRoute = typeof getUser;

// User Profile Endpoints

export const updateEmail = createRoute({
  tags,
  method: 'patch',
  path: '/auth/email',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(
      z.object({
        currentPassword: z.string(),
        newEmail: z.email()
      }),
      'Update email'
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(selectUsersSchema, HttpStatus.OK),
      'Email updated successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Email update failed'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    )
  }
});

export const changePassword = createRoute({
  tags,
  method: 'post',
  path: '/auth/change-password',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string(),
        confirmNewPassword: z.string()
      }),
      'Change password'
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      createMessageObjectSchema('Password changed successfully'),
      'Password changed'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Password change failed'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    )
  }
});

export const getSettings = createRoute({
  tags,
  method: 'get',
  path: '/auth/settings',
  middleware: [currentUser],
  responses: {
    [HttpStatus.OK]: jsonContent(userSettingsSchema, 'Settings retrieved successfully'),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    )
  }
});

export const updateSettings = createRoute({
  tags,
  method: 'patch',
  path: '/auth/settings',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(userSettingsSchema.partial(), 'Update settings')
  },
  responses: {
    [HttpStatus.OK]: jsonContent(userSettingsSchema, 'Settings updated successfully'),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Settings update failed'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    )
  }
});

export const uploadAvatar = createRoute({
  tags,
  method: 'post',
  path: '/auth/avatar',
  middleware: [currentUser],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: { type: 'string', format: 'binary' }
            }
          }
        }
      },
      required: true
    }
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      z.object({
        avatar: z.string(),
        url: z.string()
      }),
      'Avatar uploaded successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Avatar upload failed'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    )
  }
});

export const updateAccount = createRoute({
  tags,
  method: 'patch',
  path: '/auth/account',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(
      z.object({
        name: z.string().min(1).max(255).optional()
      }),
      'Update account'
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(selectUsersSchema, HttpStatus.OK),
      'Account updated successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Account update failed'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    )
  }
});

export type UpdateEmailRoute = typeof updateEmail;
export type ChangePasswordRoute = typeof changePassword;
export type GetSettingsRoute = typeof getSettings;
export type UpdateSettingsRoute = typeof updateSettings;
export type UploadAvatarRoute = typeof uploadAvatar;
export type UpdateAccountRoute = typeof updateAccount;
