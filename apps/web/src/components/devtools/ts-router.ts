import { lazy } from 'react';

import { env } from '@/lib/env';

export const TanstackRouterDevTools = env.isProduction
  ? (): null => null
  : lazy(() =>
      import('@tanstack/react-router-devtools').then((result) => ({
        default: result.TanStackRouterDevtools
      }))
    );
