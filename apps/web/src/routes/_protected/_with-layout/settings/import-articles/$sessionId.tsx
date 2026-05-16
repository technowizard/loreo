import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import ImportProgressPage from '@/pages/import-progress';

export const Route = createFileRoute(
  '/_protected/_with-layout/settings/import-articles/$sessionId'
)({
  head: () => ({ meta: [{ title: 'Import Progress | Loreo' }] }),
  component: ImportProgressPage,
  validateSearch: z.object({
    status: z.enum(['completed', 'failed']).optional()
  })
});
