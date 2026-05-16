import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { TagGroup } from '@/types/tags';

import { tagsKeys } from './query-keys';

export const updateTagGroupBodySchema = z.object({
  id: z.string().min(1, 'Tag group ID is required'),
  name: z.string().min(1, 'Tag group name is required').optional(),
  description: z.string().min(1, 'Tag group description is required').optional(),
  color: z.string().optional()
});

export type UpdateTagGroupBody = z.infer<typeof updateTagGroupBodySchema>;
export type UpdateTagGroupInput = UpdateTagGroupBody;

export const updateTagGroupInputSchema = updateTagGroupBodySchema;

const updateTagGroup = async (data: UpdateTagGroupBody): Promise<ApiResult<TagGroup>> => {
  const response = await apiClient.put(`tags/groups/${data.id}`, data);

  return response.json();
};

type UseUpdateTagGroupOptions = {
  mutationConfig?: MutationConfig<typeof updateTagGroup>;
};

export const useUpdateTagGroup = ({ mutationConfig }: UseUpdateTagGroupOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: updateTagGroup,
    meta: { invalidates: [tagsKeys.all] }
  });
