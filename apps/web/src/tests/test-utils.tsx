import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { type RenderOptions, render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { routeTree } from '@/routeTree.gen';

import { createQueryClient } from '@/lib/react-query';
import type { AuthContext } from '@/lib/router';

function makeQueryClient() {
  const client = createQueryClient();

  client.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false }
  });

  return client;
}

function Providers({ children }: { children: ReactNode }) {
  const queryClient = makeQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const authContext: AuthContext = {
  user: undefined,
  status: 'unauthenticated',
  ensureData: async () => undefined
};

function customRender(ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options });
}

export function renderHookWithProviders<Result, Props>(
  callback: (initialProps: Props) => Result,
  options?: Parameters<typeof renderHook<Result, Props>>[1]
) {
  return renderHook(callback, { wrapper: Providers, ...options });
}

/**
 * renders the full route tree via RouterProvider
 * use this for page-level tests that rely on routing hooks (Route.useSearch, useNavigate)
 * the router's context.queryClient is a fresh isolated instance per call
 */
export function renderPage(options: { initialPath?: string } = {}) {
  const queryClient = makeQueryClient();
  const history = createMemoryHistory({
    initialEntries: [options.initialPath ?? '/']
  });
  const router = createRouter({
    routeTree,
    history,
    context: { auth: authContext, queryClient },
    defaultStructuralSharing: true
  });

  return render(<RouterProvider router={router} />);
}

export * from '@testing-library/react';
export { customRender as render };
