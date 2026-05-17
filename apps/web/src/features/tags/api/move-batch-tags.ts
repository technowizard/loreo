import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { tagsMutationMeta } from './query-keys';

export const moveBatchTagsBodySchema = z.object({
  fromGroupId: z.string().optional(),
  toGroupId: z.string().min(1, 'Target group ID is required'),
  tagIds: z.array(z.string()).optional()
});

export type MoveBatchTagsBody = z.infer<typeof moveBatchTagsBodySchema>;
export type MoveBatchTagsInput = MoveBatchTagsBody;

export const moveBatchTagsInputSchema = moveBatchTagsBodySchema;

type MoveBatchTagsResponse = {
  movedTags: number;
};

const moveBatchTags = async (
  data: MoveBatchTagsBody
): Promise<ApiResult<MoveBatchTagsResponse>> => {
  const response = await apiClient.post('tags/move-batch', data);

  return response.json<ApiResult<MoveBatchTagsResponse>>();
};

type UseMoveBatchTagsOptions = {
  mutationConfig?: MutationConfig<typeof moveBatchTags>;
};

export const useMoveBatchTags = ({ mutationConfig }: UseMoveBatchTagsOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: moveBatchTags,
    meta: tagsMutationMeta
  });
