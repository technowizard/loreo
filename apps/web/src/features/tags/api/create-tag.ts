import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { CreateTagResponse } from '@/types/tags';

import { tagsKeys } from './query-keys';

export const createTagBodySchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  name: z.string().min(1, 'Tag name is required')
});

export type CreateTagBody = z.infer<typeof createTagBodySchema>;

export const createTag = async (body: CreateTagBody): Promise<ApiResult<CreateTagResponse>> => {
  const response = await apiClient.post('tags', body);

  return response.json();
};

type UseCreateTagOptions = {
  mutationConfig?: MutationConfig<typeof createTag>;
};

export const useCreateTag = ({ mutationConfig }: UseCreateTagOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: createTag,
    meta: { invalidates: [tagsKeys.all] }
  });
