import { setCookie } from 'hono/cookie';

import { defaultUserSettings, userSettingsSchema } from '@/db/schemas/user-settings.js';

import type { AppRouteHandler } from '../../lib/types.js';
import { env } from '@/lib/env-config.js';
import { generateToken } from '@/lib/jwt.js';
import { passwordManager } from '@/lib/password-manager.js';
import { errorResponse, HttpStatus, successResponse } from '@/lib/response.js';

import { authService } from '@/services/auth.service.js';
import { storageService } from '@/services/storage.service.js';

import type {
  ChangePasswordRoute,
  CreateRoute,
  GetSettingsRoute,
  GetUserRoute,
  LoginRoute,
  LogoutRoute,
  UpdateAccountRoute,
  UpdateEmailRoute,
  UpdateSettingsRoute,
  UploadAvatarRoute
} from './auth.routes.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: env.isProduction ? 'strict' : 'lax',
  secure: env.isProduction,
  path: '/'
} as const;

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const { email, password, confirmPassword, name } = c.req.valid('json');
  const { auth } = c.get('repos');

  if (password !== confirmPassword) {
    const response = errorResponse('Passwords do not match', HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }

  const existingUser = await auth.findByEmail(email);

  if (existingUser) {
    const response = errorResponse('User already exists', HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }

  const hashedPassword = await passwordManager.hash(password);

  const userCount = await auth.countUsers();
  const isFirstUser = userCount === 0;

  const createdUser = await auth.create({
    email,
    passwordHash: hashedPassword,
    name: name || null,
    settings: defaultUserSettings,
    ...(isFirstUser && { role: 'admin' as const })
  });

  const { tags } = c.get('repos');
  await tags.createGroup({
    name: 'General',
    color: '#3B82F6',
    description: 'A catch-all for your articles and links',
    userId: createdUser.id
  });

  const token = await generateToken(createdUser.id, createdUser.email);
  setCookie(c, 'token', token, cookieOptions);

  const response = successResponse(
    {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      avatar: createdUser.avatar,
      settings: createdUser.settings
    },
    'User created successfully',
    HttpStatus.CREATED
  );

  return c.json(response, HttpStatus.CREATED);
};

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const { email, password } = c.req.valid('json');
  const { auth } = c.get('repos');

  const user = await auth.findByEmail(email);

  if (!user) {
    const response = errorResponse('Invalid email or password', HttpStatus.UNAUTHORIZED);
    return c.json(response, response.status);
  }

  const passwordValid = await passwordManager.compare(user.passwordHash, password);

  if (!passwordValid) {
    const response = errorResponse('Invalid email or password', HttpStatus.UNAUTHORIZED);
    return c.json(response, response.status);
  }

  const token = await generateToken(user.id, user.email);
  setCookie(c, 'token', token, cookieOptions);

  const response = successResponse(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      settings: user.settings
    },
    'User logged in successfully'
  );

  return c.json(response, response.status);
};

export const logout: AppRouteHandler<LogoutRoute> = async (c) => {
  setCookie(c, 'token', '', {
    ...cookieOptions,
    maxAge: 0
  });

  const response = successResponse(null, 'User logged out successfully');
  return c.json(response, response.status);
};

export const getUser: AppRouteHandler<GetUserRoute> = async (c) => {
  const user = c.get('user');

  if (!user) {
    const response = errorResponse('User not found', HttpStatus.NOT_FOUND);
    return c.json(response, response.status);
  }

  const settings = userSettingsSchema.parse(user.settings ?? {});

  const response = successResponse(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      settings
    },
    'User fetched successfully'
  );

  return c.json(response, response.status);
};

export const updateEmail: AppRouteHandler<UpdateEmailRoute> = async (c) => {
  const user = c.get('user');
  const { currentPassword, newEmail } = c.req.valid('json');

  if (!user) {
    const response = errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    return c.json(response, response.status);
  }

  try {
    const updated = await authService.updateOwnEmail(user.id, currentPassword, newEmail);

    if (!updated) {
      const response = errorResponse('Failed to update email', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const response = successResponse(
      {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        avatar: updated.avatar,
        settings: updated.settings
      },
      'Email updated successfully',
      HttpStatus.OK
    );

    return c.json(response, HttpStatus.OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response = errorResponse(errorMessage, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const changePassword: AppRouteHandler<ChangePasswordRoute> = async (c) => {
  const user = c.get('user');
  const { currentPassword, newPassword, confirmNewPassword } = c.req.valid('json');

  if (!user) {
    const response = errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    return c.json(response, response.status);
  }

  try {
    await authService.changeOwnPassword(user.id, currentPassword, newPassword, confirmNewPassword);

    const response = successResponse(null, 'Password changed successfully', HttpStatus.OK);
    return c.json(response, HttpStatus.OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response = errorResponse(errorMessage, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const getSettings: AppRouteHandler<GetSettingsRoute> = async (c) => {
  const user = c.get('user');

  if (!user) {
    const response = errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    return c.json(response, response.status);
  }

  const settings = await authService.getOwnSettings(user.id);
  return c.json(settings, HttpStatus.OK);
};

export const updateSettings: AppRouteHandler<UpdateSettingsRoute> = async (c) => {
  const user = c.get('user');
  const settings = c.req.valid('json');

  if (!user) {
    const response = errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    return c.json(response, response.status);
  }

  try {
    const updated = await authService.updateOwnSettings(user.id, settings);
    return c.json(updated, HttpStatus.OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response = errorResponse(errorMessage, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const uploadAvatar: AppRouteHandler<UploadAvatarRoute> = async (c) => {
  const user = c.get('user');

  if (!user) {
    const response = errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    return c.json(response, response.status);
  }

  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      const response = errorResponse('File is required', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    if (!file.type.startsWith('image/')) {
      const response = errorResponse('File must be an image', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    if (file.size > 2 * 1024 * 1024) {
      const response = errorResponse('File size must be less than 2MB', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await storageService.uploadImage(buffer, file.name, user.id, 'avatars');

    const { auth } = c.get('repos');
    await auth.update(user.id, { avatar: result.url });

    return c.json({ avatar: result.key, url: result.url }, HttpStatus.OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';
    const response = errorResponse(errorMessage, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const updateAccount: AppRouteHandler<UpdateAccountRoute> = async (c) => {
  const user = c.get('user');
  const { name } = c.req.valid('json');

  if (!user) {
    const response = errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    return c.json(response, response.status);
  }

  if (name === undefined) {
    const response = errorResponse('No fields to update', HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }

  const { auth } = c.get('repos');
  const updated = await auth.update(user.id, { name });

  if (!updated) {
    const response = errorResponse('Failed to update account', HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }

  const response = successResponse(
    {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatar: updated.avatar,
      settings: updated.settings
    },
    'Account updated successfully',
    HttpStatus.OK
  );
  return c.json(response, HttpStatus.OK);
};
