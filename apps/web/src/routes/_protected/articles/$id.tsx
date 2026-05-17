import { createFileRoute } from '@tanstack/react-router';

import { getLinkQueryOptions } from '@/features/articles/api/get-link';

import i18n from '@/lib/i18n';

import ArticleReaderPage from '@/pages/article-reader';

export const Route = createFileRoute('/_protected/articles/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(getLinkQueryOptions(params.id)),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.result.title
          ? `${loaderData.result.title} | Loreo`
          : i18n.t('routes.articleReader.fallbackMetaTitle')
      },
      ...(loaderData?.result.excerpt
        ? [{ name: 'description', content: loaderData.result.excerpt }]
        : [])
    ]
  }),
  component: ArticleReaderPage
});
