import { createFileRoute, redirect } from '@tanstack/react-router';

import { getHomeSuggestionsQueryOptions } from '@/features/home/api/get-home-suggestions';

import i18n from '@/lib/i18n';

import HomePage from '@/pages/home';

export const Route = createFileRoute('/_protected/_with-layout/')({
  head: () => ({ meta: [{ title: i18n.t('routes.home.metaTitle') }] }),
  beforeLoad: async ({ context }) => {
    try {
      await context.auth.ensureData();
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(getHomeSuggestionsQueryOptions()),
  component: HomePage
});
