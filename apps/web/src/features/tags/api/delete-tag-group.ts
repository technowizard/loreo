import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { tagsKeys } from './query-keys';

const deleteTagGroup = async ({ id }: { id: string }): Promise<ApiResult<void>> => {
  const response = await apiClient.delete(`tags/groups/${id}`);

  return response.json();
};

type UseDeleteTagGroupOptions = {
  mutationConfig?: MutationConfig<typeof deleteTagGroup>;
};

export const useDeleteTagGroup = ({ mutationConfig }: UseDeleteTagGroupOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: deleteTagGroup,
    meta: { invalidates: [tagsKeys.all] }
  });
