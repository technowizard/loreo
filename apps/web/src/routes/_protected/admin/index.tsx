import { createFileRoute } from '@tanstack/react-router';

import i18n from '@/lib/i18n';

import AdminPage from '@/pages/admin';

export const Route = createFileRoute('/_protected/admin/')({
  head: () => ({ meta: [{ title: i18n.t('routes.admin.metaTitle') }] }),
  component: AdminPage
});
