import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';

import { mapUserResponse, type UserResponse, type UserResult } from './get-user';

export const registerBodySchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
});
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type RegisterInput = RegisterBody;

export const registerInputSchema = registerBodySchema;

export const register = async (body: RegisterBody): Promise<UserResponse> => {
  const data = await apiClient.post('auth/register', body).json<ApiResult<UserResult>>();

  return mapUserResponse(data);
};

type UseRegisterOptions = { mutationConfig?: MutationConfig<typeof register> };

export const useRegister = ({ mutationConfig }: UseRegisterOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: register
  });
