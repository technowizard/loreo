import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { PaginatedResponseOptions } from '@/types/api';
import type { StreamlinedLink } from '@/types/links';

import { linkKeys } from './query-keys';

export type ActiveFilters = {
  groups?: string;
  cursor?: string;
  filter?: string;
  limit?: string;
  priority?: string;
  q?: string;
  readLength?: string;
  sort?: string;
  tags?: string;
};

const getPaginatedLinks = async (
  params: ActiveFilters
): Promise<PaginatedResponseOptions<StreamlinedLink[]>> =>
  apiClient
    .get('links', {}, params as Record<string, string>)
    .json<PaginatedResponseOptions<StreamlinedLink[]>>();

export const getLinksQueryOptions = (filters: ActiveFilters) =>
  infiniteQueryOptions({
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedResponseOptions<StreamlinedLink[]>) =>
      lastPage.pagination?.nextCursor,
    queryFn: ({ pageParam }) => getPaginatedLinks({ ...filters, cursor: pageParam }),
    queryKey: linkKeys.infinite(filters)
  });

type UseLinksOptions = {
  filters: ActiveFilters;
  queryConfig?: QueryConfig<typeof getLinksQueryOptions>;
};

export const useGetLinks = ({ filters, queryConfig }: UseLinksOptions) => {
  const infiniteQuery = useInfiniteQuery({
    ...getLinksQueryOptions(filters),
    ...queryConfig,
    refetchInterval: (query) => {
      const data = query.state.data;

      if (!data) {
        return false;
      }

      const hasPendingItems = data.pages.some((page) =>
        page.result?.some(
          (link) => link.processingStatus === 'pending' || link.processingStatus === 'processing'
        )
      );

      return hasPendingItems ? 5000 : false;
    }
  });

  return {
    data: infiniteQuery.data?.pages.flatMap((page) => page.result ?? []),
    error: infiniteQuery.error,
    fetchNextPage: async () => {
      try {
        await infiniteQuery.fetchNextPage();
      } catch {
        throw new Error('Failed to load more items');
      }
    },
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isLoading: infiniteQuery.isLoading
  };
};
