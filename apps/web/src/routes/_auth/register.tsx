import { createFileRoute } from '@tanstack/react-router';

import i18n from '@/lib/i18n';

import RegisterPage from '@/pages/register';

export const Route = createFileRoute('/_auth/register')({
  head: () => ({ meta: [{ title: i18n.t('routes.register.metaTitle') }] }),
  component: RegisterPage
});
