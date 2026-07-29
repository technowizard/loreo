import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { FeedSubscriptionSummary } from '@/types/feeds';

import { feedKeys } from './query-keys';

const getFeedSubscriptionSummary = async (
  subscriptionId: string
): Promise<ApiResult<FeedSubscriptionSummary>> => {
  const response = await apiClient.get(`feeds/subscriptions/${subscriptionId}/summary`);

  return response.json();
};

export const getFeedSubscriptionSummaryQueryOptions = (subscriptionId: string) =>
  queryOptions({
    queryKey: feedKeys.subscriptionSummary(subscriptionId),
    queryFn: () => getFeedSubscriptionSummary(subscriptionId)
  });

type UseFeedSubscriptionSummaryOptions = {
  queryConfig?: QueryConfig<typeof getFeedSubscriptionSummaryQueryOptions>;
  subscriptionId: string;
};

export const useFeedSubscriptionSummary = ({
  queryConfig,
  subscriptionId
}: UseFeedSubscriptionSummaryOptions) =>
  useQuery({
    ...getFeedSubscriptionSummaryQueryOptions(subscriptionId),
    ...queryConfig
  });
