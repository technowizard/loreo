import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import i18n from '@/lib/i18n';

import ImportProgressPage from '@/pages/import-progress';

export const Route = createFileRoute(
  '/_protected/_with-layout/settings/import-articles/$sessionId'
)({
  head: () => ({
    meta: [{ title: i18n.t('routes.importProgress.metaTitle') }]
  }),
  component: ImportProgressPage,
  validateSearch: z.object({
    status: z.enum(['completed', 'failed']).optional()
  })
});
