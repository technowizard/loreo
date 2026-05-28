import { QueryClientProvider } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router';

import { ErrorFallback } from '@/components/common/error';
import { NotFound } from '@/components/common/not-found';
import { Notifications } from '@/components/common/notifications';
import { TanstackQueryDevTools } from '@/components/devtools/ts-query';
import { TanstackRouterDevTools } from '@/components/devtools/ts-router';

import type { queryClient } from '@/lib/react-query';
import type { AuthContext } from '@/lib/router';

type RouterContext = {
  auth: AuthContext;
  queryClient: typeof queryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [{ title: 'Loreo' }]
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => <ErrorFallback error={error} />
});

function RootComponent() {
  const { queryClient: client } = Route.useRouteContext();

  return (
    <QueryClientProvider client={client}>
      <HeadContent />
      <Outlet />
      <Notifications />
      <TanstackQueryDevTools position="bottom" />
      <TanstackRouterDevTools position="bottom-left" />
    </QueryClientProvider>
  );
}
