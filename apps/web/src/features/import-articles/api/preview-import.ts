import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

export const previewImportInputSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  mapping: z.object({
    tags: z.string().optional(),
    timeAdded: z.string().optional(),
    title: z.string(),
    url: z.string()
  })
});

export type PreviewImportInput = z.infer<typeof previewImportInputSchema>;

const previewImport = async (data: PreviewImportInput) => {
  const response = await apiClient.post('imports/preview', data);
  return response.json<
    ApiResult<{
      estimatedTime: string;
      preview: {
        isValid: boolean;
        tags?: string[];
        title: string;
        url: string;
      }[];
    }>
  >();
};

type UsePreviewImportOptions = {
  mutationConfig?: MutationConfig<typeof previewImport>;
};

export const usePreviewImport = ({ mutationConfig }: UsePreviewImportOptions = {}) => {
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: previewImport,
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig
  });
};
