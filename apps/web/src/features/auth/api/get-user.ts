import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import type { ApiResult } from '@/types/api';
import type { UserSettings } from '@/types/settings';

import { authKeys } from './query-keys';

export type UserResult = {
  avatar?: string | null;
  email: string;
  name?: string | null;
  settings?: UserSettings;
};

export type AuthUser = {
  avatar: string | null;
  displayName: string;
  email: string;
  name: string;
  settings?: UserSettings;
};

export type UserResponse = ApiResult<AuthUser>;

export const getDisplayName = ({ email, name }: UserResult) => name ?? email.split('@')[0] ?? email;

export const mapUserResponse = (data: ApiResult<UserResult>): UserResponse => ({
  ...data,
  result: {
    avatar: data.result.avatar ?? null,
    displayName: getDisplayName(data.result),
    email: data.result.email,
    name: getDisplayName(data.result),
    settings: data.result.settings
  }
});

export const getUser = async (): Promise<UserResponse | undefined> => {
  try {
    const data = await apiClient.get('auth/user').json<ApiResult<UserResult>>();

    return mapUserResponse(data);
  } catch {
    return undefined;
  }
};

export const getUserQueryOptions = () =>
  queryOptions({
    queryFn: getUser,
    queryKey: authKeys.user(),
    retry: false,
    staleTime: Infinity
  });

export const useGetUser = () => useQuery(getUserQueryOptions());
