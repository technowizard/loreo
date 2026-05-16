import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

export const uploadCSVInputSchema = z.object({
  file: z.instanceof(File)
});

export type UploadCSVInput = z.infer<typeof uploadCSVInputSchema>;

const uploadCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('imports/upload', formData);

  return response.json<
    ApiResult<{
      columns: string[];
      fileId: string;
      rowCount: number;
    }>
  >();
};

type UseUploadCSVOptions = {
  mutationConfig?: MutationConfig<typeof uploadCSV>;
};

export const useUploadCSV = ({ mutationConfig }: UseUploadCSVOptions = {}) => {
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: uploadCSV
  });
};
