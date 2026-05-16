import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

const logout = async () => apiClient.post('auth/logout').json();

type UseLogoutOptions = { mutationConfig?: MutationConfig<typeof logout> };

export const useLogout = ({ mutationConfig }: UseLogoutOptions = {}) =>
  useMutation({ ...mutationConfig, mutationFn: logout });
