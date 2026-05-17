import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { tagsMutationMeta } from './query-keys';

const deleteTag = async ({
  groupId,
  id
}: {
  groupId: string;
  id: string;
}): Promise<ApiResult<void>> => {
  const response = await apiClient.delete(`tags/${id}/${groupId}`);

  return response.json();
};

type UseDeleteTagOptions = {
  mutationConfig?: MutationConfig<typeof deleteTag>;
};

export const useDeleteTag = ({ mutationConfig }: UseDeleteTagOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: deleteTag,
    meta: tagsMutationMeta
  });
