import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, search }) => {
    try {
      await context.auth.ensureData();
    } catch {
      return;
    }

    throw redirect({ to: search.redirect || '/' });
  },
  validateSearch: z.object({
    redirect: z.string().optional()
  })
});
