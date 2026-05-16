import { lazy } from 'react';

import { env } from '@/lib/env';

export const TanstackQueryDevTools = env.isProduction
  ? (): null => null
  : lazy(() =>
      import('@tanstack/react-query-devtools').then((result) => ({
        default: result.ReactQueryDevtools
      }))
    );
