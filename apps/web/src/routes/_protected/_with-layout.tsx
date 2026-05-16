import { createFileRoute, Outlet } from '@tanstack/react-router';

import MainLayout from '@/components/layouts/main';

export const Route = createFileRoute('/_protected/_with-layout')({
  component: WithLayoutRoute
});

function WithLayoutRoute() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
