import { infiniteQueryOptions, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { importArticleKeys } from './query-keys';

const getLinksFromImportSession = async ({
  cursor,
  extractionStatus,
  importSessionId
}: {
  cursor?: string;
  extractionStatus?: string;
  importSessionId: string;
}) => {
  const params = new URLSearchParams();

  if (extractionStatus) {
    params.append('status', extractionStatus);
  }

  if (cursor) {
    params.append('cursor', cursor);
  }

  const url = `imports/sessions/${importSessionId}/links?${params.toString()}`;

  const response = await apiClient.get(url);

  return response.json<
    ApiResult<{
      hasMore: boolean;
      items: {
        errorMessage: string | null;
        id: string;
        status: 'pending' | 'in_progress' | 'completed' | 'failed';
        title: string;
        url: string;
      }[];
      nextCursor: string | null;
    }>
  >();
};

export const getLinksFromImportSessionQueryOptions = (
  importSessionId: string,
  extractionStatus?: string
) => {
  return infiniteQueryOptions({
    getNextPageParam: (lastPage: { result?: { hasMore: boolean; nextCursor: string | null } }) =>
      lastPage.result?.hasMore ? lastPage.result.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getLinksFromImportSession({
        cursor: pageParam,
        extractionStatus,
        importSessionId
      }),
    queryKey: ['linksFromImportSession', importSessionId, extractionStatus || 'all']
  });
};

type UseGetLinksFromImportSessionOptions = {
  extractionStatus?: string;
  importSessionId: string;
  queryConfig?: QueryConfig<typeof getLinksFromImportSessionQueryOptions>;
};

export const useGetLinksFromImportSession = ({
  extractionStatus,
  importSessionId,
  queryConfig
}: UseGetLinksFromImportSessionOptions) => {
  const queryClient = useQueryClient();

  const infiniteQuery = useInfiniteQuery({
    ...getLinksFromImportSessionQueryOptions(importSessionId, extractionStatus),
    ...queryConfig,
    refetchInterval: (query) => {
      const data = query.state.data;

      if (!data) {
        return false;
      }

      const sessionData = queryClient.getQueryData<ApiResult<{ extractionStatus: string }>>(
        importArticleKeys.detail(importSessionId)
      );

      const { extractionStatus: sessionExtractionStatus } = sessionData?.result || {};

      if (sessionExtractionStatus === 'in_progress') {
        return 3000;
      }

      return false;
    }
  });

  return {
    data: infiniteQuery.data,
    error: infiniteQuery.error,
    fetchNextPage: async () => {
      try {
        await infiniteQuery.fetchNextPage();
      } catch {
        toast.error('Failed to load more items', {
          position: 'bottom-right',
          richColors: true
        });
      }
    },
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isLoading: infiniteQuery.isLoading
  };
};
