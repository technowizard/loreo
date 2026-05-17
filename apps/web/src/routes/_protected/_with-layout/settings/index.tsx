import { createFileRoute } from '@tanstack/react-router';

import i18n from '@/lib/i18n';

import SettingsPage from '@/pages/settings';

export const Route = createFileRoute('/_protected/_with-layout/settings/')({
  head: () => ({ meta: [{ title: i18n.t('routes.settings.metaTitle') }] }),
  component: SettingsPage
});
