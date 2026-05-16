import { createFileRoute } from '@tanstack/react-router';

import ImportArticlesPage from '@/pages/import-articles';

export const Route = createFileRoute('/_protected/_with-layout/settings/import-articles/')({
  head: () => ({ meta: [{ title: 'Import Articles | Loreo' }] }),
  component: ImportArticlesPage
});
