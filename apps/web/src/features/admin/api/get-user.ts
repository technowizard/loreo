import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { AdminUserResponse } from './types';

import { adminKeys } from './query-keys';

export const getAdminUser = async (id: string): Promise<AdminUserResponse> => {
  const response = await apiClient.get(`admin/users/${id}`);

  return response.json();
};

export const getAdminUserQueryOptions = (id: string) =>
  queryOptions({
    enabled: id.length > 0,
    queryFn: () => getAdminUser(id),
    queryKey: adminKeys.userDetail(id)
  });

type UseGetAdminUserOptions = {
  id: string;
  queryConfig?: QueryConfig<typeof getAdminUserQueryOptions>;
};

export const useGetAdminUser = ({ id, queryConfig }: UseGetAdminUserOptions) =>
  useQuery({
    ...getAdminUserQueryOptions(id),
    ...queryConfig
  });
