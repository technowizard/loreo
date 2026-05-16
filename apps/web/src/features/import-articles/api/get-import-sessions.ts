import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { ImportSessionsResponse } from '@/types/import-articles';

import { importArticleKeys } from './query-keys';

const getImportSessions = async (): Promise<ApiResult<ImportSessionsResponse>> => {
  const response = await apiClient.get('imports/sessions');

  return response.json();
};

export const getImportSessionsQueryOptions = () => {
  return queryOptions({
    queryKey: importArticleKeys.list(),
    queryFn: getImportSessions
  });
};

type UseImportSessionsOptions = {
  queryConfig?: QueryConfig<typeof getImportSessionsQueryOptions>;
};

export const useImportSessions = ({ queryConfig }: UseImportSessionsOptions = {}) => {
  return useQuery({
    ...getImportSessionsQueryOptions(),
    ...queryConfig
  });
};
