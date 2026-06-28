import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { CreateFeedSubscriptionBody, CreateFeedSubscriptionResult } from '@/types/feeds';

import { feedKeys } from './query-keys';

export const createFeedSubscriptionBodySchema = z.object({
  autoSave: z.boolean().optional(),
  feedUrl: z.url()
});

export const createFeedSubscription = async (
  body: CreateFeedSubscriptionBody
): Promise<ApiResult<CreateFeedSubscriptionResult>> => {
  const response = await apiClient.post('feeds/subscriptions', body);

  return response.json();
};

type UseCreateFeedSubscriptionOptions = {
  mutationConfig?: MutationConfig<typeof createFeedSubscription>;
};

export const useCreateFeedSubscription = ({
  mutationConfig
}: UseCreateFeedSubscriptionOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: createFeedSubscription,
    meta: { invalidates: [feedKeys.all] }
  });
