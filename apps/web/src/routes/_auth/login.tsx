import { createFileRoute } from '@tanstack/react-router';

import LoginPage from '@/pages/login';

export const Route = createFileRoute('/_auth/login')({
  head: () => ({ meta: [{ title: 'Login | Loreo' }] }),
  component: LoginPage
});
