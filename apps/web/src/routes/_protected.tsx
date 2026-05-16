import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { useSettingsSync } from '@/hooks/use-settings-sync';

const ProtectedRoute = () => {
  useSettingsSync(true);
  return <Outlet />;
};

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context, location }) => {
    try {
      await context.auth.ensureData();
    } catch {
      throw redirect({ search: { redirect: location.href }, to: '/login' });
    }
  },
  component: ProtectedRoute
});
