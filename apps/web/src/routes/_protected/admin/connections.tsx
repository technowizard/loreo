import { createFileRoute } from '@tanstack/react-router';

import { AdminConnectionsPanel } from '@/features/admin/components/admin-connections-panel';

import i18n from '@/lib/i18n';

export const Route = createFileRoute('/_protected/admin/connections')({
  head: () => ({ meta: [{ title: i18n.t('routes.admin.metaTitle') }] }),
  component: AdminConnectionsPanel
});
