import type { ApiResult } from '@/types/api';

export type AdminUserRole = 'admin' | 'user';
export type AdminUserStatus = 'active' | 'deleted' | 'all';

export type AdminUser = {
  avatar: string | null;
  createdAt: string;
  deletedAt: string | null;
  email: string;
  id: string;
  name: string | null;
  role: AdminUserRole;
  settings: Record<string, unknown>;
  updatedAt: string;
  articleCount?: number;
};

export type AdminUsersResponse = ApiResult<AdminUser[]>;
export type AdminUserResponse = ApiResult<AdminUser>;
export type AdminEmptyResponse = ApiResult<null>;
