import { createFileRoute } from '@tanstack/react-router';

import ManageTagsPage from '@/pages/manage-tags';

export const Route = createFileRoute('/_protected/_with-layout/manage-tags')({
  head: () => ({ meta: [{ title: 'Manage Tags | Loreo' }] }),
  component: ManageTagsPage
});
