import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { mapUserResponse, type UserResponse, type UserResult } from './get-user';

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(6)
});
export type LoginBody = z.infer<typeof loginBodySchema>;
export type LoginInput = LoginBody;

export const login = async (body: LoginBody): Promise<UserResponse> => {
  const data = await apiClient.post('auth/login', body).json<ApiResult<UserResult>>();

  return mapUserResponse(data);
};

type UseLoginOptions = { mutationConfig?: MutationConfig<typeof login> };

export const useLogin = ({ mutationConfig }: UseLoginOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: login,
    retry: false
  });
