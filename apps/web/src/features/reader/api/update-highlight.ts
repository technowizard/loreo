import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { linkKeys } from '@/features/articles/api/query-keys';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { Highlight } from '@/types/highlights';

export const updateHighlightBodySchema = z.object({
  id: z.string(),
  color: z.string().optional(),
  endOffset: z.number().optional(),
  note: z.string().nullable().optional(),
  startOffset: z.number().optional(),
  text: z.string().optional()
});

export type UpdateHighlightBody = z.infer<typeof updateHighlightBodySchema>;

const updateHighlight = async ({
  id,
  ...body
}: UpdateHighlightBody): Promise<ApiResult<Highlight>> => {
  const response = await apiClient.put(`highlights/${id}`, body);

  return response.json();
};

type UseUpdateHighlightOptions = {
  linkId: string;
  mutationConfig?: MutationConfig<typeof updateHighlight>;
};

export const useUpdateHighlight = ({ linkId, mutationConfig }: UseUpdateHighlightOptions) => {
  void linkId;

  return useMutation({
    ...mutationConfig,
    mutationFn: updateHighlight,
    meta: { invalidates: [linkKeys.all] }
  });
};
