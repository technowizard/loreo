import type { QueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { getLinkQueryOptions } from '@/features/articles/api/get-link';

import i18n from '@/lib/i18n';

import ArticleReaderPage from '@/pages/article-reader';

type ArticleLoaderArgs = {
  context: {
    queryClient: Pick<QueryClient, 'fetchQuery'>;
  };
  params: {
    id: string;
  };
};

export const articleLoader = ({ context, params }: ArticleLoaderArgs) =>
  context.queryClient.fetchQuery(getLinkQueryOptions(params.id));

export const Route = createFileRoute('/_protected/articles/$id')({
  loader: articleLoader,
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
