import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { StreamlinedLink, UpdateLinkBody, Link } from '@/types/links';

import { linkKeys } from './query-keys';

const updateLink = async ({
  body,
  linkId
}: {
  body: UpdateLinkBody;
  linkId: string;
}): Promise<ApiResult<Link>> => {
  const response = await apiClient.patch(`links/${linkId}`, body);

  return response.json();
};

type UseUpdateLinkOptions = {
  mutationConfig?: MutationConfig<typeof updateLink>;
};

export const useUpdateLink = ({ mutationConfig }: UseUpdateLinkOptions = {}) => {
  const queryClient = useQueryClient();

  const { onError, onMutate, onSettled, onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation<
    ApiResult<Link>,
    Error,
    {
      body: UpdateLinkBody;
      linkId: string;
    },
    {
      previousData?: ApiResult<Link>;
    }
  >({
    onError: (error, variables, context, ...args) => {
      if (context?.previousData) {
        queryClient.setQueryData(linkKeys.detail(variables.linkId), context.previousData);
      }

      onError?.(error, variables, context, ...args);
    },
    onMutate: async ({ body, linkId }, mutationContext) => {
      // Cancel all links queries (with any filter parameters)
      await queryClient.cancelQueries({
        queryKey: linkKeys.all
      });
      await queryClient.cancelQueries({
        queryKey: linkKeys.detail(linkId)
      });

      const previousData = queryClient.getQueryData<ApiResult<Link>>(linkKeys.detail(linkId));

      // Update ALL links queries optimistically (regardless of filters)
      queryClient.setQueriesData<ApiResult<StreamlinedLink[]>>(
        { queryKey: linkKeys.all },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData.result)) {
            return oldData;
          }

          return {
            ...oldData,
            result: oldData.result.map(
              (link): StreamlinedLink => (link.id === linkId ? { ...link, ...body } : link)
            )
          };
        }
      );

      // Update individual link query
      queryClient.setQueryData<ApiResult<Link>>(linkKeys.detail(linkId), (oldData) => {
        if (!oldData || !oldData.result) {
          return oldData;
        }

        return {
          ...oldData,
          result: { ...oldData.result, ...body }
        };
      });

      await onMutate?.({ body, linkId }, mutationContext);

      return { previousData };
    },
    onSettled: (data, error, variables, onMutateResult, mutationContext) => {
      // Invalidate all links queries (with any filter parameters)
      queryClient.invalidateQueries({
        queryKey: linkKeys.all
      });

      queryClient.invalidateQueries({
        queryKey: linkKeys.detail(variables.linkId)
      });

      onSettled?.(data, error, variables, onMutateResult, mutationContext);
    },
    onSuccess: (data, ...args) => {
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: updateLink
  });
};
