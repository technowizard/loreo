import { createFileRoute } from '@tanstack/react-router';

import SettingsPage from '@/pages/settings';

export const Route = createFileRoute('/_protected/_with-layout/settings/')({
  head: () => ({ meta: [{ title: 'Settings | Loreo' }] }),
  component: SettingsPage
});
