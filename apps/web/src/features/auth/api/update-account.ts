import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { mapUserResponse, type UserResponse, type UserResult } from './get-user';

export type UpdateAccountBody = {
  name?: string;
};

const updateAccount = async (body: UpdateAccountBody): Promise<UserResponse> => {
  const data = await apiClient.patch('auth/account', body).json<ApiResult<UserResult>>();
  return mapUserResponse(data);
};

type UseUpdateAccountOptions = { mutationConfig?: MutationConfig<typeof updateAccount> };

export const useUpdateAccount = ({ mutationConfig }: UseUpdateAccountOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: updateAccount
  });
