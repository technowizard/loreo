import { createFileRoute } from '@tanstack/react-router';

import i18n from '@/lib/i18n';

import ManageTagsPage from '@/pages/manage-tags';

export const Route = createFileRoute('/_protected/_with-layout/manage-tags')({
  head: () => ({ meta: [{ title: i18n.t('routes.manageTags.metaTitle') }] }),
  component: ManageTagsPage
});
