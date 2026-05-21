import { useCallback } from 'react';

import type { UpdateLinkBody } from '@/types/links';

import { useDeleteLink } from '../api/delete-link';
import { useRefetchLink } from '../api/refetch-link';
import { useUpdateLink } from '../api/update-link';

export interface ArticleActions {
  updateLink: (linkId: string, body: UpdateLinkBody) => void;
  deleteLink: (linkId: string) => void;
  refetchLink: (id: string) => void;
}

export interface ArticleActionsConfig {
  deleteFromNavbar?: boolean;
  disabled?: boolean;
  onDeleteSuccess?: () => void;
  formatUpdateMessage?: (body: UpdateLinkBody) => string | false;
}

export function useArticleActions(config: ArticleActionsConfig = {}): ArticleActions {
  const {
    deleteFromNavbar = false,
    disabled = false,
    onDeleteSuccess,
    formatUpdateMessage
  } = config;

  const updateMutation = useUpdateLink({
    mutationConfig: {
      onSuccess: (_, { body }) => {
        const message = formatUpdateMessage ? formatUpdateMessage(body) : 'Link updated';

        if (message) {
          // TODO: Show toast
          console.log(message);
        }
      }
    }
  });

  const deleteMutation = useDeleteLink({
    deleteFromNavbar,
    mutationConfig: { onSuccess: onDeleteSuccess }
  });

  const refetchMutation = useRefetchLink();

  const updateLink = useCallback(
    (id: string, data: UpdateLinkBody) => {
      if (disabled) return;

      updateMutation.mutate({ body: data, linkId: id });
    },
    [disabled, updateMutation]
  );

  const deleteLink = useCallback(
    (linkId: string) => {
      if (disabled) return;

      deleteMutation.mutate({ id: linkId });
    },
    [disabled, deleteMutation]
  );

  const refetchLink = useCallback(
    (id: string) => {
      if (disabled) return;

      refetchMutation.mutate({ id });
    },
    [disabled, refetchMutation]
  );

  return {
    updateLink,
    deleteLink,
    refetchLink
  };
}
