import { successResponse } from '@/lib/response.js';
import type { AppRouteHandler } from '@/lib/types.js';

import { adminService } from '@/services/admin.service.js';

import type { ListUsersRoute } from './admin.routes.js';

export const listUsers: AppRouteHandler<ListUsersRoute> = async (c) => {
  const users = await adminService.listUsers();
  const response = successResponse(users, 'Users fetched successfully');

  return c.json(response, response.status);
};
