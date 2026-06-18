import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { AdminUserResponse } from './types';

import { adminKeys, adminUserMutationMeta } from './query-keys';

export const deleteAdminUser = async ({ id }: { id: string }): Promise<AdminUserResponse> => {
  const response = await apiClient.delete(`admin/users/${id}`);

  return response.json();
};

type UseDeleteAdminUserOptions = {
  mutationConfig?: MutationConfig<typeof deleteAdminUser>;
};

export const useDeleteAdminUser = ({ mutationConfig }: UseDeleteAdminUserOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    ...restConfig,
    mutationFn: deleteAdminUser,
    meta: adminUserMutationMeta,
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(variables.id) });
      onSuccess?.(data, variables, ...args);
    }
  });
};
