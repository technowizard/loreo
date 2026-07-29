import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

import i18n from '@/lib/i18n';

import FeedsPage from '@/pages/feeds';

const searchSchema = z.object({
  feed: z.string().optional(),
  manage: z.boolean().optional(),
  manageQuery: z.string().optional(),
  manageStatus: z.enum(['all', 'active', 'paused', 'attention']).optional(),
  sort: z.enum(['newest', 'oldest']).optional(),
  subscriptionId: z.string().optional(),
  tab: z.enum(['new', 'saved', 'dismissed', 'feeds']).optional()
});

export const Route = createFileRoute('/_protected/_with-layout/feeds/')({
  head: () => ({ meta: [{ title: i18n.t('routes.feeds.metaTitle') }] }),
  component: FeedsPage,
  validateSearch: zodValidator(searchSchema)
});
