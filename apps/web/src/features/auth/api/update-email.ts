import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { mapUserResponse, type UserResponse, type UserResult } from './get-user';

export type UpdateEmailBody = {
  currentPassword: string;
  newEmail: string;
};

const updateEmail = async (body: UpdateEmailBody): Promise<UserResponse> => {
  const data = await apiClient.patch('auth/email', body).json<ApiResult<UserResult>>();
  return mapUserResponse(data);
};

type UseUpdateEmailOptions = { mutationConfig?: MutationConfig<typeof updateEmail> };

export const useUpdateEmail = ({ mutationConfig }: UseUpdateEmailOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: updateEmail
  });
