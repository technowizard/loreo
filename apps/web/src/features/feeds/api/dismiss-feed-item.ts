import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { FeedItem } from '@/types/feeds';

import { feedKeys } from './query-keys';

export const dismissFeedItem = async (itemId: string): Promise<ApiResult<FeedItem>> => {
  const response = await apiClient.post(`feeds/items/${itemId}/dismiss`);

  return response.json();
};

type UseDismissFeedItemOptions = {
  mutationConfig?: MutationConfig<typeof dismissFeedItem>;
};

export const useDismissFeedItem = ({ mutationConfig }: UseDismissFeedItemOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: dismissFeedItem,
    meta: { invalidates: [feedKeys.all] }
  });
