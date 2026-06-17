import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { AdminUserResponse } from './types';

import { adminKeys, adminUserMutationMeta } from './query-keys';

export const restoreAdminUser = async ({ id }: { id: string }): Promise<AdminUserResponse> => {
  const response = await apiClient.post(`admin/users/${id}/restore`);

  return response.json();
};

type UseRestoreAdminUserOptions = {
  mutationConfig?: MutationConfig<typeof restoreAdminUser>;
};

export const useRestoreAdminUser = ({ mutationConfig }: UseRestoreAdminUserOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    ...restConfig,
    mutationFn: restoreAdminUser,
    meta: adminUserMutationMeta,
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(variables.id) });
      onSuccess?.(data, variables, ...args);
    }
  });
};
