import { ArrowLeftIcon, ShieldIcon } from '@phosphor-icons/react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetUser } from '@/features/auth/api/get-user';

import { cn } from '@/lib/utils';

import { UserMenu } from '../common/user-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface AdminLayoutProps {
  children?: ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { data: user } = useGetUser();

  const displayName = user?.result?.displayName ?? t('userMenu.fallbackName');
  const avatarPreview = user?.result?.avatar ?? null;
  const initials = getInitials(displayName);

  const navItems = [
    { label: t('admin.nav.accounts'), to: '/admin' },
    { label: t('admin.nav.connections'), to: '/admin/connections' }
  ] as const;

  return (
    <div className="bg-background min-h-screen transition-colors duration-300">
      <header className="bg-background/80 border-border sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto max-w-350 px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 flex size-9 shrink-0 items-center justify-center rounded-xl">
                <ShieldIcon className="size-5" weight="fill" />
              </div>
              <div className="min-w-0">
                <h1 className="text-foreground truncate text-base leading-tight font-semibold">
                  {t('admin.layout.title')}
                </h1>
                <p className="text-muted-foreground truncate text-xs">
                  {t('admin.layout.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/">
                <Button size="sm" variant="ghost">
                  <ArrowLeftIcon className="size-4" />
                  <span className="hidden sm:inline">{t('admin.layout.backToApp')}</span>
                </Button>
              </Link>
              <UserMenu
                align="end"
                trigger={
                  <button
                    aria-label={t('userMenu.open', { name: displayName })}
                    className="rounded-full"
                  >
                    <Avatar className="size-9">
                      {avatarPreview && <AvatarImage src={avatarPreview} />}
                      <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                }
              />
            </div>
          </div>

          <nav
            aria-label={t('admin.layout.navLabel')}
            className="flex items-center gap-1 overflow-x-auto pb-2"
          >
            {navItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <div
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      active &&
                        'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    )}
                  >
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-350 px-4 py-8 sm:px-6 lg:px-8">{children ?? <Outlet />}</main>
    </div>
  );
}

export default AdminLayout;
