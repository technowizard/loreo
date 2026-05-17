import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { Tag } from '@/types/tags';

import { tagsMutationMeta } from './query-keys';

export const moveTagBodySchema = z.object({
  tagId: z.string().min(1, 'Tag ID is required'),
  targetGroupId: z.string().min(1, 'Target group ID is required')
});

export type MoveTagBody = z.infer<typeof moveTagBodySchema>;
export type MoveTagInput = MoveTagBody;

export const moveTagInputSchema = moveTagBodySchema;

const moveTag = async ({ tagId, targetGroupId }: MoveTagBody): Promise<ApiResult<Tag>> => {
  const response = await apiClient.post(`tags/${tagId}/move`, {
    targetGroupId
  });

  return response.json<ApiResult<Tag>>();
};

type UseMoveTagOptions = {
  mutationConfig?: MutationConfig<typeof moveTag>;
};

export const useMoveTag = ({ mutationConfig }: UseMoveTagOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: moveTag,
    meta: tagsMutationMeta
  });
