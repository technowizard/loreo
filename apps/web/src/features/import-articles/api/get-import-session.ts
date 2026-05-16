import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { ImportSessionResponse } from '@/types/import-articles';

import { importArticleKeys } from './query-keys';

const getImportSession = async (
  importSessionId: string
): Promise<ApiResult<ImportSessionResponse>> => {
  const response = await apiClient.get(`imports/sessions/${importSessionId}`);

  return response.json();
};

export const getImportSessionQueryOptions = (importSessionId: string) => {
  return queryOptions({
    queryKey: importArticleKeys.detail(importSessionId),
    queryFn: () => getImportSession(importSessionId)
  });
};

type UseGetImportSessionOptions = {
  importSessionId: string;
  queryConfig?: QueryConfig<typeof getImportSessionQueryOptions>;
};

export const useGetImportSession = ({
  importSessionId,
  queryConfig
}: UseGetImportSessionOptions) => {
  return useQuery({
    ...getImportSessionQueryOptions(importSessionId),
    ...queryConfig,
    refetchInterval: (query) => {
      const data = query.state.data;

      if (!data) {
        return false;
      }

      const isCompleted =
        data.result?.status === 'completed' && data.result?.extractionStatus === 'completed';

      return isCompleted ? false : 3000;
    }
  });
};
