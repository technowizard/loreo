import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import { linkKeys } from './query-keys';

const deleteLink = async ({ id }: { id: string }) => {
  const response = await apiClient.delete(`links/${id}`);

  return response.json();
};

type UseDeleteLinkOptions = {
  deleteFromNavbar?: boolean;
  linkId?: string;
  mutationConfig?: MutationConfig<typeof deleteLink>;
};

export const useDeleteLink = ({
  deleteFromNavbar = false,
  linkId,
  mutationConfig
}: UseDeleteLinkOptions) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    ...restConfig,
    mutationFn: deleteLink,
    meta: { invalidates: [linkKeys.all] },
    onSuccess: (data, variables, ...args) => {
      if (deleteFromNavbar && (linkId ?? variables.id)) {
        queryClient.removeQueries({
          queryKey: linkKeys.detail(linkId ?? variables.id)
        });
      }

      onSuccess?.(data, variables, ...args);
    }
  });
};
