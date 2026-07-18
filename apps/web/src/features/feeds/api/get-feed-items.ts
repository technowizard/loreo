import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { PaginatedResponseOptions } from '@/types/api';
import type { FeedItem, FeedItemFilters } from '@/types/feeds';

import { feedKeys } from './query-keys';

const DEFAULT_PAGE_SIZE = 24;

const getFeedItems = async (
  filters: FeedItemFilters = {},
  cursor?: string
): Promise<PaginatedResponseOptions<FeedItem[]>> => {
  const params = Object.fromEntries(
    Object.entries({ ...filters, cursor, limit: String(DEFAULT_PAGE_SIZE) }).filter(
      (entry): entry is [string, string] => Boolean(entry[1])
    )
  );
  const response = await apiClient.get('feeds/items', {}, params);

  return response.json();
};

export const getFeedItemsQueryOptions = (filters: FeedItemFilters = {}) =>
  infiniteQueryOptions({
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedResponseOptions<FeedItem[]>) =>
      lastPage.pagination.nextCursor,
    queryKey: feedKeys.itemList(filters),
    queryFn: ({ pageParam }) => getFeedItems(filters, pageParam)
  });

type UseFeedItemsOptions = {
  filters?: FeedItemFilters;
  queryConfig?: QueryConfig<typeof getFeedItemsQueryOptions>;
};

export const useFeedItems = ({ filters = {}, queryConfig }: UseFeedItemsOptions = {}) => {
  const infiniteQuery = useInfiniteQuery({
    ...getFeedItemsQueryOptions(filters),
    ...queryConfig
  });

  return {
    data: infiniteQuery.data?.pages.flatMap((page) => page.result),
    error: infiniteQuery.error,
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    isError: infiniteQuery.isError,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isLoading: infiniteQuery.isLoading,
    total: infiniteQuery.data?.pages[0]?.pagination.total ?? 0
  };
};
