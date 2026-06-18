import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { AdminUserResponse } from './types';

import { adminKeys, adminUserMutationMeta } from './query-keys';

export const updateAdminUserBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    role: z.enum(['admin', 'user']).optional()
  })
  .refine((value) => value.name !== undefined || value.role !== undefined, {
    message: 'Provide at least one field to update'
  });

export type UpdateAdminUserBody = z.infer<typeof updateAdminUserBodySchema>;

export const updateAdminUser = async ({
  body,
  id
}: {
  body: UpdateAdminUserBody;
  id: string;
}): Promise<AdminUserResponse> => {
  const response = await apiClient.patch(`admin/users/${id}`, body);

  return response.json();
};

type UseUpdateAdminUserOptions = {
  mutationConfig?: MutationConfig<typeof updateAdminUser>;
};

export const useUpdateAdminUser = ({ mutationConfig }: UseUpdateAdminUserOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    ...restConfig,
    mutationFn: updateAdminUser,
    meta: adminUserMutationMeta,
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(variables.id) });
      onSuccess?.(data, variables, ...args);
    }
  });
};
