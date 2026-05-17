import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { Tag } from '@/types/tags';

import { tagsMutationMeta } from './query-keys';

export const updateTagBodySchema = z.object({
  id: z.string().min(1, 'Tag ID is required'),
  groupId: z.string().min(1, 'Group ID is required').optional(),
  name: z.string().min(1, 'Tag name is required').optional()
});

export type UpdateTagBody = z.infer<typeof updateTagBodySchema>;
export type UpdateTagInput = UpdateTagBody;

export const updateTagInputSchema = updateTagBodySchema;

const updateTag = async (data: UpdateTagBody): Promise<ApiResult<Tag>> => {
  const response = await apiClient.put(`tags/${data.id}`, {
    groupId: data.groupId,
    name: data.name
  });
  return response.json();
};

type UseUpdateTagOptions = {
  mutationConfig?: MutationConfig<typeof updateTag>;
};

export const useUpdateTag = ({ mutationConfig }: UseUpdateTagOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: updateTag,
    meta: tagsMutationMeta
  });
