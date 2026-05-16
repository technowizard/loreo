import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import { linkKeys } from './query-keys';

const refetchLink = async ({ id }: { id: string }) => {
  const response = await apiClient.post(`links/refetch/${id}`);

  return response.json();
};

type UseRefetchLinkOptions = {
  mutationConfig?: MutationConfig<typeof refetchLink>;
};

export const useRefetchLink = ({ mutationConfig }: UseRefetchLinkOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: refetchLink,
    meta: { invalidates: [linkKeys.all] }
  });
