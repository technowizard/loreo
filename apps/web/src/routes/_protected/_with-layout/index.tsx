import { createFileRoute, redirect } from '@tanstack/react-router';

import { getHomeSuggestionsQueryOptions } from '@/features/home/api/get-home-suggestions';

import HomePage from '@/pages/home';

export const Route = createFileRoute('/_protected/_with-layout/')({
  head: () => ({ meta: [{ title: 'Home | Loreo' }] }),
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
