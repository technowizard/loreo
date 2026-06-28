import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { FeedItem, FeedItemFilters } from '@/types/feeds';

import { feedKeys } from './query-keys';

const getFeedItems = async (filters: FeedItemFilters = {}): Promise<ApiResult<FeedItem[]>> => {
  const params = Object.fromEntries(
    Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
  const response = await apiClient.get('feeds/items', {}, params);

  return response.json();
};

export const getFeedItemsQueryOptions = (filters: FeedItemFilters = {}) =>
  queryOptions({
    queryKey: feedKeys.itemList(filters),
    queryFn: () => getFeedItems(filters)
  });

type UseFeedItemsOptions = {
  filters?: FeedItemFilters;
  queryConfig?: QueryConfig<typeof getFeedItemsQueryOptions>;
};

export const useFeedItems = ({ filters = {}, queryConfig }: UseFeedItemsOptions = {}) =>
  useQuery({
    ...getFeedItemsQueryOptions(filters),
    ...queryConfig
  });
