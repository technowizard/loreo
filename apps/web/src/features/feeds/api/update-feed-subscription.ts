import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { FeedSubscription, UpdateFeedSubscriptionBody } from '@/types/feeds';

import { feedKeys } from './query-keys';

type UpdateFeedSubscriptionVariables = {
  body: UpdateFeedSubscriptionBody;
  subscriptionId: string;
};

export const updateFeedSubscription = async ({
  body,
  subscriptionId
}: UpdateFeedSubscriptionVariables): Promise<ApiResult<FeedSubscription>> => {
  const response = await apiClient.patch(`feeds/subscriptions/${subscriptionId}`, body);

  return response.json();
};

type UseUpdateFeedSubscriptionOptions = {
  mutationConfig?: MutationConfig<typeof updateFeedSubscription>;
};

export const useUpdateFeedSubscription = ({
  mutationConfig
}: UseUpdateFeedSubscriptionOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: updateFeedSubscription,
    meta: { invalidates: [feedKeys.all] }
  });
