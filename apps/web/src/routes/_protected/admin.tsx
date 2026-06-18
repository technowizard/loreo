import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import AdminLayout from '@/components/layouts/admin';

export const Route = createFileRoute('/_protected/admin')({
  beforeLoad: async ({ context }) => {
    try {
      const auth = await context.auth.ensureData();
      if (!auth || auth.result.role !== 'admin') {
        throw redirect({ to: '/' });
      }
    } catch (error) {
      if (error instanceof Response) throw error;
      throw redirect({ to: '/login' });
    }
  },
  component: AdminLayoutRoute
});

function AdminLayoutRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
