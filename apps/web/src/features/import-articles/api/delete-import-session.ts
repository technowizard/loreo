import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { importArticleKeys } from './query-keys';

const deleteImportSession = async (
  importSessionId: string
): Promise<ApiResult<{ message: string }>> => {
  const response = await apiClient.delete(`imports/sessions/${importSessionId}`);

  return response.json();
};

type DeleteImportSessionOptions = {
  mutationConfig?: MutationConfig<typeof deleteImportSession>;
};

export const useDeleteImportSession = ({ mutationConfig }: DeleteImportSessionOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: deleteImportSession,
    meta: { invalidates: [importArticleKeys.all] }
  });
