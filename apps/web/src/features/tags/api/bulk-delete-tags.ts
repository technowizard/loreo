import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { tagsKeys } from './query-keys';

export const bulkDeleteTagsBodySchema = z.object({
  tagIds: z.array(z.string()).min(1, 'At least one tag ID is required')
});

export type BulkDeleteTagsBody = z.infer<typeof bulkDeleteTagsBodySchema>;
export type BulkDeleteTagsInput = BulkDeleteTagsBody;

export const bulkDeleteTagsInputSchema = bulkDeleteTagsBodySchema;

type BulkDeleteTagsResult = {
  affectedLinks: number;
  deletedTags: number;
};

const bulkDeleteTags = async ({
  tagIds
}: BulkDeleteTagsBody): Promise<ApiResult<BulkDeleteTagsResult>> => {
  const response = await apiClient.delete('tags/bulk', {
    tagIds
  });
  return response.json<ApiResult<BulkDeleteTagsResult>>();
};

type UseBulkDeleteTagsOptions = {
  mutationConfig?: MutationConfig<typeof bulkDeleteTags>;
};

export const useBulkDeleteTags = ({ mutationConfig }: UseBulkDeleteTagsOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: bulkDeleteTags,
    meta: { invalidates: [tagsKeys.all] }
  });
