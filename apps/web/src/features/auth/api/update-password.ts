import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

export type UpdatePasswordBody = {
  confirmNewPassword: string;
  currentPassword: string;
  newPassword: string;
};

const updatePassword = async (body: UpdatePasswordBody): Promise<void> => {
  await apiClient.post('auth/change-password', body).json();
};

type UseUpdatePasswordOptions = { mutationConfig?: MutationConfig<typeof updatePassword> };

export const useUpdatePassword = ({ mutationConfig }: UseUpdatePasswordOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: updatePassword
  });
