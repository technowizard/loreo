import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

import { useDeleteAdminUser } from '@/features/admin/api/delete-user';
import { useGetAdminUser } from '@/features/admin/api/get-user';
import { useResetAdminUserPassword } from '@/features/admin/api/reset-user-password';
import { useRestoreAdminUser } from '@/features/admin/api/restore-user';
import { useUpdateAdminUser } from '@/features/admin/api/update-user';

import { cn } from '@/lib/utils';

const ROLE_VALUES = ['admin', 'user'] as const;
type RoleValue = (typeof ROLE_VALUES)[number];

interface AdminUserDialogProps {
  onClose: () => void;
  userId: string | null;
}

export function AdminUserDialog({ onClose, userId }: AdminUserDialogProps) {
  const { t } = useTranslation();
  const isOpen = userId !== null;

  const { data: userData, isLoading: isUserLoading } = useGetAdminUser({
    id: userId ?? ''
  });

  const user = userData?.result;

  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleValue>('user');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showReset, setShowReset] = useState(false);

  const updateMutation = useUpdateAdminUser({
    mutationConfig: {
      onSuccess: () => {
        onClose();
      }
    }
  });

  const resetMutation = useResetAdminUserPassword({
    mutationConfig: {
      onSuccess: () => {
        setShowReset(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    }
  });

  const deleteMutation = useDeleteAdminUser({
    mutationConfig: {
      onSuccess: () => {
        onClose();
      }
    }
  });

  const restoreMutation = useRestoreAdminUser({
    mutationConfig: {
      onSuccess: () => {
        onClose();
      }
    }
  });

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setRole(user.role);
      setShowReset(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [user]);

  const isAdminTarget = user?.role === 'admin';
  const nameChanged = name.trim() !== (user?.name ?? '').trim();
  const roleChanged = role !== user?.role;
  const canSave = (nameChanged || roleChanged) && !isAdminTarget;

  const handleUpdate = () => {
    if (!userId || !canSave) return;
    const body: { name?: string; role?: RoleValue } = {};
    if (nameChanged) body.name = name.trim();
    if (roleChanged) body.role = role;
    updateMutation.mutate({ body, id: userId });
  };

  const handleResetPassword = () => {
    if (!userId || !newPassword || !confirmPassword) return;
    resetMutation.mutate({
      body: { confirmNewPassword: confirmPassword, newPassword },
      id: userId
    });
  };

  const handleDelete = () => {
    if (!userId) return;
    deleteMutation.mutate({ id: userId });
  };

  const handleRestore = () => {
    if (!userId) return;
    restoreMutation.mutate({ id: userId });
  };

  const isMutating =
    updateMutation.isPending ||
    resetMutation.isPending ||
    deleteMutation.isPending ||
    restoreMutation.isPending;

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('admin.dialog.editTitle')}</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>

        {isUserLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : user ? (
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-user-name">{t('admin.user.name')}</Label>
              <Input
                disabled={isMutating || isAdminTarget}
                id="admin-user-name"
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-user-role">{t('admin.user.role')}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={isMutating || isAdminTarget}
                  render={
                    <Button
                      aria-label={t('admin.user.role')}
                      className="w-full justify-between"
                      id="admin-user-role"
                      variant="outline"
                    />
                  }
                >
                  {t(`admin.role.${role}`)}
                  <CaretDownIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-40">
                  {ROLE_VALUES.map((value) => (
                    <DropdownMenuItem key={value} onClick={() => setRole(value)}>
                      {t(`admin.role.${value}`)}
                      {role === value && <CheckIcon className="ml-auto size-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isAdminTarget ? (
              <p className="text-muted-foreground text-sm">{t('admin.user.adminProtected')}</p>
            ) : showReset ? (
              <div className="bg-muted/50 rounded-lg border p-3 space-y-3">
                <p className="font-medium text-sm">{t('admin.dialog.resetPassword')}</p>
                <div className="space-y-2">
                  <Label htmlFor="admin-new-password">{t('admin.dialog.newPassword')}</Label>
                  <Input
                    disabled={isMutating}
                    id="admin-new-password"
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    value={newPassword}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-confirm-password">
                    {t('admin.dialog.confirmPassword')}
                  </Label>
                  <Input
                    disabled={isMutating}
                    id="admin-confirm-password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    value={confirmPassword}
                  />
                </div>
                {resetMutation.isError && (
                  <p className="text-danger text-sm">
                    {resetMutation.error?.message ?? t('admin.dialog.resetError')}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    disabled={isMutating || !newPassword || !confirmPassword}
                    onClick={handleResetPassword}
                    size="sm"
                  >
                    {resetMutation.isPending ? (
                      <Spinner className="size-4" />
                    ) : (
                      t('admin.dialog.savePassword')
                    )}
                  </Button>
                  <Button
                    disabled={isMutating}
                    onClick={() => setShowReset(false)}
                    size="sm"
                    variant="outline"
                  >
                    {t('common.error.retry')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-fit"
                onClick={() => setShowReset(true)}
                size="sm"
                variant="outline"
              >
                {t('admin.dialog.resetPassword')}
              </Button>
            )}

            {updateMutation.isError && (
              <p className="text-danger text-sm">
                {updateMutation.error?.message ?? t('admin.dialog.updateError')}
              </p>
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          {user?.deletedAt ? (
            <Button disabled={isMutating} onClick={handleRestore} variant="outline">
              {restoreMutation.isPending ? <Spinner className="size-4" /> : t('admin.user.restore')}
            </Button>
          ) : (
            <Button
              className={cn('text-destructive hover:bg-destructive/10')}
              disabled={isMutating || isAdminTarget}
              onClick={handleDelete}
              variant="ghost"
            >
              {deleteMutation.isPending ? <Spinner className="size-4" /> : t('admin.user.delete')}
            </Button>
          )}

          <Button disabled={isMutating || !canSave} onClick={handleUpdate}>
            {updateMutation.isPending ? <Spinner className="size-4" /> : t('common.dialog.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
