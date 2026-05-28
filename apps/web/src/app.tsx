import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

import { getUserQueryOptions, useGetUser } from '@/features/auth/api/get-user';

import { useThemeConfig } from '@/hooks/use-theme-config';

import { queryClient } from '@/lib/react-query';
import { type AuthContext, router } from '@/lib/router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        themes={['system', 'light', 'dark', 'sepia-theme']}
      >
        <TooltipProvider>
          <RouterProviderWithContext />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RouterProviderWithContext() {
  const { data: user, status } = useGetUser();
  const userData = user?.result;
  const { setTheme } = useTheme();
  const hydratedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userData?.settings) return;
    const userId = userData.email;
    if (hydratedRef.current === userId) return;
    hydratedRef.current = userId;

    // use getState() to avoid subscribing this component to store changes
    useThemeConfig.getState().hydrate(userData.settings);
    if (userData.settings.theme) {
      setTheme(userData.settings.theme);
    }
  }, [userData, setTheme]);

  const auth: AuthContext = {
    user: userData,
    status: status === 'pending' ? 'pending' : !user ? 'unauthenticated' : 'authenticated',
    ensureData: () => queryClient.ensureQueryData(getUserQueryOptions())
  };

  return <RouterProvider router={router} context={{ auth, queryClient }} />;
}
