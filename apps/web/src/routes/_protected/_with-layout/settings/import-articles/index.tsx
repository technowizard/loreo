import { createFileRoute } from '@tanstack/react-router';

import i18n from '@/lib/i18n';

import ImportArticlesPage from '@/pages/import-articles';

export const Route = createFileRoute('/_protected/_with-layout/settings/import-articles/')({
  head: () => ({
    meta: [{ title: i18n.t('routes.importArticles.metaTitle') }]
  }),
  component: ImportArticlesPage
});
