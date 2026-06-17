import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { useGetAdminUsers } from '@/features/admin/api/get-users';
import { AdminUserDialog } from '@/features/admin/components/admin-user-dialog';
import { AdminUserList } from '@/features/admin/components/admin-user-list';

function AdminPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'active' | 'deleted' | 'all'>('active');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetAdminUsers({
    params: { limit: 50, status }
  });

  const users = data?.result ?? [];

  return (
    <div className="flex flex-col space-y-6">
      <header className="mb-8 border-b pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.page.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('admin.page.description')}</p>
      </header>

      <div className="flex items-center gap-2">
        {(['active', 'deleted', 'all'] as const).map((s) => (
          <Button
            className="rounded-full"
            key={s}
            onClick={() => setStatus(s)}
            size="sm"
            variant={status === s ? 'default' : 'outline'}
          >
            {t(`admin.page.status.${s}`)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <p className="text-muted-foreground text-sm">{t('admin.page.error')}</p>
          <Button onClick={() => refetch()} variant="outline">
            {t('admin.page.tryAgain')}
          </Button>
        </div>
      ) : (
        <AdminUserList onEditUser={setSelectedUserId} status={status} users={users} />
      )}

      <AdminUserDialog onClose={() => setSelectedUserId(null)} userId={selectedUserId} />
    </div>
  );
}

export default AdminPage;
