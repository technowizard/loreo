import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { AdminUserStatus, AdminUsersResponse } from './types';

import { adminKeys } from './query-keys';

export type GetAdminUsersParams = {
  limit?: number;
  offset?: number;
  status?: AdminUserStatus;
};

const toSearchParams = (params: GetAdminUsersParams): Record<string, string> => {
  const searchParams: Record<string, string> = {};

  if (params.limit !== undefined) searchParams.limit = String(params.limit);
  if (params.offset !== undefined) searchParams.offset = String(params.offset);
  if (params.status !== undefined) searchParams.status = params.status;

  return searchParams;
};

export const getAdminUsers = async (
  params: GetAdminUsersParams = {}
): Promise<AdminUsersResponse> => {
  const response = await apiClient.get('admin/users', {}, toSearchParams(params));

  return response.json();
};

export const getAdminUsersQueryOptions = (params: GetAdminUsersParams = {}) =>
  queryOptions({
    queryFn: () => getAdminUsers(params),
    queryKey: adminKeys.userList(params)
  });

type UseGetAdminUsersOptions = {
  params?: GetAdminUsersParams;
  queryConfig?: QueryConfig<typeof getAdminUsersQueryOptions>;
};

export const useGetAdminUsers = ({ params = {}, queryConfig }: UseGetAdminUsersOptions = {}) =>
  useQuery({
    ...getAdminUsersQueryOptions(params),
    ...queryConfig
  });
