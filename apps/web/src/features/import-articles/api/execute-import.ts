import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

export const executeImportInputSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  mapping: z.object({
    tags: z.string().optional(),
    timeAdded: z.string().optional(),
    title: z.string(),
    url: z.string()
  }),
  options: z
    .object({
      skipDuplicates: z.boolean().default(true)
    })
    .optional()
});

export type ExecuteImportInput = z.infer<typeof executeImportInputSchema>;

const executeImport = async (data: ExecuteImportInput) => {
  const response = await apiClient.post('imports/execute', data);

  return response.json<
    ApiResult<{
      estimatedCount: number;
      importSessionId: string;
      jobId: string;
      message: string;
    }>
  >();
};

type UseExecuteImportOptions = {
  mutationConfig?: MutationConfig<typeof executeImport>;
};

export const useExecuteImport = ({ mutationConfig }: UseExecuteImportOptions = {}) => {
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: executeImport,
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig
  });
};
