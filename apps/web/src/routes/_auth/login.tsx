import { createFileRoute } from '@tanstack/react-router';

import i18n from '@/lib/i18n';

import LoginPage from '@/pages/login';

export const Route = createFileRoute('/_auth/login')({
  head: () => ({ meta: [{ title: i18n.t('routes.login.metaTitle') }] }),
  component: LoginPage
});
