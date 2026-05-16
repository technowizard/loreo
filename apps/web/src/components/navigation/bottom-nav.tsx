import { type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { type ReactNode } from 'react';

import { useMediaQuery } from '@/hooks/use-media-query';

import { cn } from '@/lib/utils';

interface BottomNavProps {
  children: ReactNode;
  className?: string;
}

interface BottomNavItemProps {
  active?: boolean;
  badge?: number;
  className?: string;
  icon: PhosphorIcon;
  label: string;
  onClick?: () => void;
}

export const BottomNav = ({ children, className }: BottomNavProps) => {
  const { isMobile } = useMediaQuery();

  if (!isMobile) {
    return null;
  }

  return (
    <div
      className={cn(
        'sepia-theme:bg-background/80 fixed right-0 bottom-0 left-0 z-50 border-t border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80',
        'safe-area-inset-bottom',
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-1">{children}</div>
    </div>
  );
};

export const BottomNavItem = ({
  active = false,
  badge,
  className,
  icon: Icon,
  label,
  onClick
}: BottomNavItemProps) => {
  return (
    <button
      className={cn(
        'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors duration-200',
        'focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 focus:outline-none',
        active
          ? 'text-primary-600 dark:text-primary-400 sepia-theme:text-primary'
          : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300',
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Icon
          className="size-6 transition-colors duration-200"
          weight={active ? 'fill' : 'regular'}
        />
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span
        className={cn(
          'text-xs font-medium transition-colors duration-200',
          active
            ? 'text-primary-600 dark:text-primary-400 sepia-theme:text-primary'
            : 'text-zinc-500 dark:text-zinc-400'
        )}
      >
        {label}
      </span>
    </button>
  );
};
