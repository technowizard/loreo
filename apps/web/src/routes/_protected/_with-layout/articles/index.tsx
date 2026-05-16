import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

import ArticlesPage from '@/pages/articles';

const searchSchema = z.object({
  groups: z.string().optional(),
  filter: z.string().optional(),
  priority: z.string().optional(),
  q: z.string().optional(),
  readLength: z.string().optional(),
  sort: z.string().optional(),
  tags: z.string().optional()
});

export const Route = createFileRoute('/_protected/_with-layout/articles/')({
  head: () => ({ meta: [{ title: 'Articles | Loreo' }] }),
  component: ArticlesPage,
  validateSearch: zodValidator(searchSchema)
});
