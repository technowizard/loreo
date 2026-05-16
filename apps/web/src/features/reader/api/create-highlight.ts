import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { linkKeys } from '@/features/articles/api/query-keys';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { Highlight } from '@/types/highlights';

export const createHighlightBodySchema = z.object({
  color: z.string(),
  endOffset: z.number(),
  note: z.string().nullable().optional(),
  startOffset: z.number(),
  text: z.string()
});

export type CreateHighlightBody = z.infer<typeof createHighlightBodySchema>;

const createHighlight = async ({ body, linkId }: { body: CreateHighlightBody; linkId: string }) =>
  apiClient.post(`highlights/${linkId}`, body).json<ApiResult<Highlight>>();

type UseCreateHighlightOptions = {
  mutationConfig?: MutationConfig<typeof createHighlight>;
};

export const useCreateHighlight = ({ mutationConfig }: UseCreateHighlightOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: createHighlight,
    meta: { invalidates: [linkKeys.all] }
  });
