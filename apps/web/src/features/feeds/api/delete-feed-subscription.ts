import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { feedKeys } from './query-keys';

type DeleteFeedSubscriptionVariables = {
  subscriptionId: string;
};

export const deleteFeedSubscription = async ({
  subscriptionId
}: DeleteFeedSubscriptionVariables): Promise<ApiResult<{ id: string }>> => {
  const response = await apiClient.delete(`feeds/subscriptions/${subscriptionId}`);

  return response.json();
};

type UseDeleteFeedSubscriptionOptions = {
  mutationConfig?: MutationConfig<typeof deleteFeedSubscription>;
};

export const useDeleteFeedSubscription = ({
  mutationConfig
}: UseDeleteFeedSubscriptionOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: deleteFeedSubscription,
    meta: { invalidates: [feedKeys.all] }
  });
