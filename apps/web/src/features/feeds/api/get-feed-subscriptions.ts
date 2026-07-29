import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { FeedSubscription } from '@/types/feeds';

import { feedKeys } from './query-keys';

const getFeedSubscriptions = async (): Promise<ApiResult<FeedSubscription[]>> => {
  const response = await apiClient.get('feeds/subscriptions');

  return response.json();
};

export const getFeedSubscriptionsQueryOptions = () =>
  queryOptions({
    queryKey: feedKeys.subscriptions(),
    queryFn: getFeedSubscriptions
  });

type UseFeedSubscriptionsOptions = {
  queryConfig?: QueryConfig<typeof getFeedSubscriptionsQueryOptions>;
};

export const useFeedSubscriptions = ({ queryConfig }: UseFeedSubscriptionsOptions = {}) =>
  useQuery({
    ...getFeedSubscriptionsQueryOptions(),
    ...queryConfig
  });
