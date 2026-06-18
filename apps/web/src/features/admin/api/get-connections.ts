import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import { adminKeys } from './query-keys';

export type ConnectionStatus = 'ok' | 'degraded' | 'down';

export type ConnectionCheck = {
  id: string;
  label: string;
  latencyMs?: number;
  message?: string;
  status: ConnectionStatus;
};

export type AdminConnectionsResponse = {
  message: string;
  result: ConnectionCheck[];
  status: number;
};

export const getAdminConnections = async (): Promise<AdminConnectionsResponse> => {
  const response = await apiClient.get('admin/health/connections');

  return response.json();
};

export const getAdminConnectionsQueryOptions = () =>
  queryOptions({
    queryFn: getAdminConnections,
    queryKey: [...adminKeys.all, 'connections'],
    refetchInterval: 30_000
  });

type UseGetAdminConnectionsOptions = {
  queryConfig?: QueryConfig<typeof getAdminConnectionsQueryOptions>;
};

export const useGetAdminConnections = ({ queryConfig }: UseGetAdminConnectionsOptions = {}) =>
  useQuery({
    ...getAdminConnectionsQueryOptions(),
    ...queryConfig
  });
