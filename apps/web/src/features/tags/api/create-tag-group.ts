import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { TagGroup } from '@/types/tags';

import { tagsKeys } from './query-keys';

export const createTagGroupBodySchema = z.object({
  name: z.string().min(1, 'Tag Group name is required'),
  description: z.string().min(1, 'Tag Group description is required'),
  color: z.string().optional()
});

export type CreateTagGroupBody = z.infer<typeof createTagGroupBodySchema>;
export type CreateTagGroupInput = CreateTagGroupBody;

export const createTagGroupInputSchema = createTagGroupBodySchema;

const createTagGroup = async (data: CreateTagGroupBody): Promise<ApiResult<TagGroup>> => {
  const response = await apiClient.post('tags/groups', data);

  return response.json();
};

type UseCreateTagGroupOptions = {
  mutationConfig?: MutationConfig<typeof createTagGroup>;
};

export const useCreateTagGroup = ({ mutationConfig }: UseCreateTagGroupOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: createTagGroup,
    meta: { invalidates: [tagsKeys.all] }
  });
