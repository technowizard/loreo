import { createFileRoute } from '@tanstack/react-router';

import { getLinkQueryOptions } from '@/features/articles/api/get-link';

import ArticleReaderPage from '@/pages/article-reader';

export const Route = createFileRoute('/_protected/articles/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(getLinkQueryOptions(params.id)),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.result.title ? `${loaderData.result.title} | Loreo` : 'Loreo' },
      ...(loaderData?.result.excerpt
        ? [{ name: 'description', content: loaderData.result.excerpt }]
        : [])
    ]
  }),
  component: ArticleReaderPage
});
