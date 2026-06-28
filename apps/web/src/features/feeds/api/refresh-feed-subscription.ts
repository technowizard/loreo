import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { RefreshFeedSubscriptionResult } from '@/types/feeds';

import { feedKeys } from './query-keys';

export const refreshFeedSubscription = async (
  subscriptionId: string
): Promise<ApiResult<RefreshFeedSubscriptionResult>> => {
  const response = await apiClient.post(`feeds/subscriptions/${subscriptionId}/refresh`);

  return response.json();
};

type UseRefreshFeedSubscriptionOptions = {
  mutationConfig?: MutationConfig<typeof refreshFeedSubscription>;
};

export const useRefreshFeedSubscription = ({
  mutationConfig
}: UseRefreshFeedSubscriptionOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: refreshFeedSubscription,
    meta: { invalidates: [feedKeys.all] }
  });
