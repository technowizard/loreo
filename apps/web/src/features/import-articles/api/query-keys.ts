export const importArticleKeys = {
  all: ['importArticles'] as const,
  list: () => [...importArticleKeys.all, 'list'] as const,
  details: () => [...importArticleKeys.all, 'details'] as const,
  detail: (id: string) => [...importArticleKeys.all, 'detail', id] as const
};
