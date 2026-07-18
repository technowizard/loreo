import { BookmarksIcon, HouseIcon, RssIcon, UserIcon } from '@phosphor-icons/react';
import { Link, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { UserMenu } from '../common/user-menu';

export function Header() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <header className="bg-background/80 dark:bg-card border-border sticky top-0 z-50 hidden border-b backdrop-blur-md md:block">
      <div className="mx-auto max-w-350 px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <img alt="Loreo Logo" className="h-8 w-8" src="/logo.svg" />
              <div className="text-foreground flex h-16 w-[10%] items-center text-xl font-bold">
                Loreo
              </div>
            </div>
            <nav className="flex items-center space-x-2">
              <Link to="/">
                <div
                  className={cn(
                    'hover:bg-primary-50 dark:hover:bg-primary-400/20 hover:text-primary-700 dark:hover:text-primary-400 sepia-theme:hover:bg-sepia-100 sepia-theme:hover:text-sepia-700 flex items-center gap-1 rounded-full px-3 py-2 transition-colors',
                    pathname === '/' &&
                      'bg-primary-50 text-primary-700 sepia-theme:text-sepia-700 dark:bg-primary-400/20 dark:text-primary-400 sepia-theme:bg-sepia-100'
                  )}
                >
                  <HouseIcon className="size-5" weight={pathname === '/' ? 'fill' : 'regular'} />
                  <span className="font-medium">{t('nav.home')}</span>
                </div>
              </Link>
              <Link to="/articles">
                <div
                  className={cn(
                    'hover:bg-primary-50 dark:hover:bg-primary-400/20 hover:text-primary-700 dark:hover:text-primary-400 sepia-theme:hover:bg-sepia-100 sepia-theme:hover:text-sepia-700 flex items-center gap-1 rounded-full px-3 py-2 transition-colors',
                    pathname === '/articles' &&
                      'bg-primary-50 text-primary-700 sepia-theme:text-sepia-700 dark:bg-primary-400/20 dark:text-primary-400 sepia-theme:bg-sepia-100'
                  )}
                >
                  <BookmarksIcon
                    className="size-5"
                    weight={pathname === '/articles' ? 'fill' : 'regular'}
                  />
                  <span className="font-medium">{t('nav.articles')}</span>
                </div>
              </Link>
              <Link to="/feeds">
                <div
                  className={cn(
                    'hover:bg-primary-50 dark:hover:bg-primary-400/20 hover:text-primary-700 dark:hover:text-primary-400 sepia-theme:hover:bg-sepia-100 sepia-theme:hover:text-sepia-700 flex items-center gap-1 rounded-full px-3 py-2 transition-colors',
                    pathname.startsWith('/feeds') &&
                      'bg-primary-50 text-primary-700 sepia-theme:text-sepia-700 dark:bg-primary-400/20 dark:text-primary-400 sepia-theme:bg-sepia-100'
                  )}
                >
                  <RssIcon
                    className="size-5"
                    weight={pathname.startsWith('/feeds') ? 'fill' : 'regular'}
                  />
                  <span className="font-medium">{t('nav.feeds')}</span>
                </div>
              </Link>
            </nav>
          </div>

          <nav className="flex h-16 items-center justify-end gap-4">
            <UserMenu
              align="end"
              trigger={
                <button>
                  <UserIcon className="size-8" />
                </button>
              }
            />
          </nav>
        </div>
      </div>
    </header>
  );
}
