import { ShieldIcon, UserIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import type { AdminUser } from '@/features/admin/api/types';

import { cn } from '@/lib/utils';

interface AdminUserListProps {
  onEditUser: (id: string) => void;
  status: 'active' | 'deleted' | 'all';
  users: AdminUser[];
}

function UserRoleBadge({ role }: { role: AdminUser['role'] }) {
  return (
    <Badge className="capitalize" variant={role === 'admin' ? 'default' : 'secondary'}>
      {role === 'admin' ? <ShieldIcon className="size-3" /> : <UserIcon className="size-3" />}
      {role}
    </Badge>
  );
}

export function AdminUserList({ onEditUser, status, users }: AdminUserListProps) {
  const { t } = useTranslation();

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          {status === 'deleted' ? t('admin.page.emptyDeleted') : t('admin.page.emptyActive')}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="border-border hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.user.name')}</TableHead>
              <TableHead>{t('admin.user.email')}</TableHead>
              <TableHead>{t('admin.user.role')}</TableHead>
              <TableHead className="text-right">{t('admin.user.articles')}</TableHead>
              <TableHead>{t('admin.user.created')}</TableHead>
              <TableHead className="text-right">{t('admin.user.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow className={cn(user.deletedAt && 'opacity-60')} key={user.id}>
                <TableCell className="font-medium">{user.name ?? t('admin.user.noName')}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <UserRoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{user.articleCount ?? 0}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => onEditUser(user.id)} size="sm" variant="ghost">
                    {t('admin.user.edit')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {users.map((user) => (
          <div
            className={cn(
              'bg-card border-border rounded-xl border p-4',
              user.deletedAt && 'opacity-60'
            )}
            key={user.id}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{user.name ?? t('admin.user.noName')}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
              <UserRoleBadge role={user.role} />
            </div>
            <div className="text-muted-foreground mt-2 text-xs">
              {t('admin.user.created')}: {new Date(user.createdAt).toLocaleDateString()}
              {' · '}
              {t('admin.user.articlesCount', { count: user.articleCount ?? 0 })}
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={() => onEditUser(user.id)} size="sm" variant="outline">
                {t('admin.user.edit')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
