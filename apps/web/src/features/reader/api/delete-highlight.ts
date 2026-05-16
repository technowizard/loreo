import { useMutation } from '@tanstack/react-query';

import { linkKeys } from '@/features/articles/api/query-keys';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { Highlight } from '@/types/highlights';

const deleteHighlight = async ({ id }: { id: string }) =>
  apiClient.delete(`highlights/${id}`).json<ApiResult<Highlight>>();

type UseDeleteHighlightOptions = {
  linkId: string;
  mutationConfig?: MutationConfig<typeof deleteHighlight>;
};

export const useDeleteHighlight = ({ linkId, mutationConfig }: UseDeleteHighlightOptions) => {
  void linkId;

  return useMutation({
    ...mutationConfig,
    mutationFn: deleteHighlight,
    meta: { invalidates: [linkKeys.all] }
  });
};
