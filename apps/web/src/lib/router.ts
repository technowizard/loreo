import { createRouter } from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';

import type { UserResponse } from '@/features/auth/api/get-user';

import { queryClient } from './react-query';

export const router = createRouter({
  context: {
    auth: null as unknown as AuthContext,
    queryClient
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultStructuralSharing: true,
  routeTree,
  scrollRestoration: true
});

export type AuthContext = {
  user: UserResponse['result'] | undefined;
  status: 'pending' | 'unauthenticated' | 'authenticated';
  ensureData: () => Promise<UserResponse | undefined>;
};

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
