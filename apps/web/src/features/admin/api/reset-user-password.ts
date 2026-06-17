import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { AdminEmptyResponse } from './types';

import { adminUserMutationMeta } from './query-keys';

export const resetAdminUserPasswordBodySchema = z
  .object({
    confirmNewPassword: z.string().min(8),
    newPassword: z.string().min(8)
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword']
  });

export type ResetAdminUserPasswordBody = z.infer<typeof resetAdminUserPasswordBodySchema>;

export const resetAdminUserPassword = async ({
  body,
  id
}: {
  body: ResetAdminUserPasswordBody;
  id: string;
}): Promise<AdminEmptyResponse> => {
  const response = await apiClient.post(`admin/users/${id}/reset-password`, body);

  return response.json();
};

type UseResetAdminUserPasswordOptions = {
  mutationConfig?: MutationConfig<typeof resetAdminUserPassword>;
};

export const useResetAdminUserPassword = ({
  mutationConfig
}: UseResetAdminUserPasswordOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: resetAdminUserPassword,
    meta: adminUserMutationMeta
  });
