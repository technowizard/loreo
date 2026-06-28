import { useMutation } from '@tanstack/react-query';

import { homeKeys } from '@/features/home/api/query-keys';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { SaveFeedItemResult } from '@/types/feeds';

import { feedKeys } from './query-keys';

export const saveFeedItem = async (itemId: string): Promise<ApiResult<SaveFeedItemResult>> => {
  const response = await apiClient.post(`feeds/items/${itemId}/save`);

  return response.json();
};

type UseSaveFeedItemOptions = {
  mutationConfig?: MutationConfig<typeof saveFeedItem>;
};

export const useSaveFeedItem = ({ mutationConfig }: UseSaveFeedItemOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: saveFeedItem,
    meta: { invalidates: [feedKeys.all, homeKeys.all] }
  });
