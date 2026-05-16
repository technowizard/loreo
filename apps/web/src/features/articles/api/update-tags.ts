import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import { linkKeys } from './query-keys';

export const updateTagsBodySchema = z.array(
  z.object({
    groupId: z.string(),
    color: z.string().optional(),
    id: z.string(),
    name: z.string()
  })
);
export type UpdateTagsBody = z.infer<typeof updateTagsBodySchema>;

const updateTags = async ({ id, tags }: { id: string; tags: UpdateTagsBody }) => {
  const response = await apiClient.put(`links/${id}/tags`, { tags });

  return response.json();
};

type UseUpdateTagsOptions = {
  mutationConfig?: MutationConfig<typeof updateTags>;
};

export const useUpdateTags = ({ mutationConfig }: UseUpdateTagsOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: updateTags,
    meta: { invalidates: [linkKeys.all] }
  });
