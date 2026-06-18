import { demoModeForbiddenResponse, isDemoMode } from '@/lib/demo-mode.js';
import { errorResponse, HttpStatus, successResponse } from '@/lib/response.js';
import type { AppRouteHandler } from '@/lib/types.js';

import { adminHealthService } from '@/services/admin-health.service.js';
import { AdminService, AdminServiceError } from '@/services/admin.service.js';

import type {
  GetUserRoute,
  ListConnectionsRoute,
  ListUsersRoute,
  ResetPasswordRoute,
  RestoreUserRoute,
  SoftDeleteUserRoute,
  UpdateUserRoute
} from './admin.routes.js';

export const listUsers: AppRouteHandler<ListUsersRoute> = async (c) => {
  const service = new AdminService(c.get('repos').auth);
  const query = c.req.valid('query');
  const users = await service.listUsers(query);
  const response = successResponse(users, 'Users fetched successfully');

  return c.json(response, response.status);
};

export const getUser: AppRouteHandler<GetUserRoute> = async (c) => {
  const service = new AdminService(c.get('repos').auth);
  const { id } = c.req.valid('param');
  const user = await service.getUserIncludingDeleted(id);

  if (!user) {
    const response = errorResponse('User not found', HttpStatus.NOT_FOUND);
    return c.json(response, response.status);
  }

  const response = successResponse(user, 'User fetched successfully');
  return c.json(response, response.status);
};

export const updateUser: AppRouteHandler<UpdateUserRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const service = new AdminService(c.get('repos').auth);
  const { id } = c.req.valid('param');
  const data = c.req.valid('json');

  try {
    const user = await service.updateUser(id, data);
    const response = successResponse(user, 'User updated successfully');
    return c.json(response, response.status);
  } catch (error) {
    if (error instanceof AdminServiceError && error.status === HttpStatus.NOT_FOUND) {
      const response = errorResponse(error.message, HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const message = error instanceof Error ? error.message : 'Failed to update user';
    const response = errorResponse(message, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const resetPassword: AppRouteHandler<ResetPasswordRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const service = new AdminService(c.get('repos').auth);
  const { id } = c.req.valid('param');
  const { newPassword, confirmNewPassword } = c.req.valid('json');

  try {
    await service.resetUserPassword(id, newPassword, confirmNewPassword);
    const response = successResponse(null, 'Password reset successfully');
    return c.json(response, response.status);
  } catch (error) {
    if (error instanceof AdminServiceError && error.status === HttpStatus.NOT_FOUND) {
      const response = errorResponse(error.message, HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const message = error instanceof Error ? error.message : 'Failed to reset password';
    const response = errorResponse(message, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const softDeleteUser: AppRouteHandler<SoftDeleteUserRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const service = new AdminService(c.get('repos').auth);
  const { id } = c.req.valid('param');

  try {
    const user = await service.softDeleteUser(id);
    const response = successResponse(user, 'User deleted successfully');
    return c.json(response, response.status);
  } catch (error) {
    if (error instanceof AdminServiceError && error.status === HttpStatus.NOT_FOUND) {
      const response = errorResponse(error.message, HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const message = error instanceof Error ? error.message : 'Failed to delete user';
    const response = errorResponse(message, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const restoreUser: AppRouteHandler<RestoreUserRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const service = new AdminService(c.get('repos').auth);
  const { id } = c.req.valid('param');

  try {
    const user = await service.restoreUser(id);
    const response = successResponse(user, 'User restored successfully');
    return c.json(response, response.status);
  } catch (error) {
    if (error instanceof AdminServiceError && error.status === HttpStatus.NOT_FOUND) {
      const response = errorResponse(error.message, HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const message = error instanceof Error ? error.message : 'Failed to restore user';
    const response = errorResponse(message, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const listConnections: AppRouteHandler<ListConnectionsRoute> = async (c) => {
  const connections = await adminHealthService.checkConnections();
  const response = successResponse(connections, 'Service connections fetched successfully');
  return c.json(response, response.status);
};
