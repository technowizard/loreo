import { useArticleActions } from '@/features/articles/hooks/use-article-actions';
import type {
  ArticleActions,
  ArticleActionsConfig
} from '@/features/articles/hooks/use-article-actions';

import type { Highlight } from '@/types/highlights';

import { useCreateHighlight } from '../api/create-highlight';
import { useDeleteHighlight } from '../api/delete-highlight';
import { useUpdateHighlight } from '../api/update-highlight';

interface ReaderActions extends ArticleActions {
  createHighlight: (highlight: Omit<Highlight, 'id' | 'note'>) => void;
  updateHighlight: (payload: { highlight: Partial<Highlight>; id: string }) => void;
  removeHighlight: (id: string) => void;
}

export function useReaderActions(linkId: string, config?: ArticleActionsConfig): ReaderActions {
  const articleActions = useArticleActions(config);

  const createHighlightMutation = useCreateHighlight();
  const updateHighlightMutation = useUpdateHighlight({ linkId });
  const deleteHighlightMutation = useDeleteHighlight({ linkId });

  return {
    ...articleActions,
    createHighlight: (highlight) => createHighlightMutation.mutate({ body: highlight, linkId }),
    updateHighlight: ({ highlight, id }) => updateHighlightMutation.mutate({ ...highlight, id }),
    removeHighlight: (id) => deleteHighlightMutation.mutate({ id })
  };
}
