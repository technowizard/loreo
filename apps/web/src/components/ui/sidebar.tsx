import { type MouseEventHandler, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

interface SidebarTitleProps {
  children: ReactNode;
  className?: string;
}

interface SidebarSectionProps {
  children: ReactNode;
  className?: string;
}

interface SidebarItemProps {
  active?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler;
}

export const Sidebar = ({ children, className }: SidebarProps) => {
  return (
    <div className={cn('hidden min-h-svh min-w-56 flex-col md:block', className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-y-4">{children}</div>
    </div>
  );
};

export const SidebarTitle = ({ children, className }: SidebarTitleProps) => {
  return <div className={cn('text-foreground text-lg font-semibold', className)}>{children}</div>;
};

export const SidebarSection = ({ children, className }: SidebarSectionProps) => {
  return <div className={cn('flex flex-col gap-y-2', className)}>{children}</div>;
};

export const SidebarItem = ({ active = false, children, className, onClick }: SidebarItemProps) => {
  return (
    <button
      className={cn(
        'focus-visible:ring-ring cursor-pointer rounded-4xl border border-transparent px-3 py-2 text-left text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
        active
          ? 'bg-secondary text-foreground border-border dark:border-transparent'
          : 'hover:bg-secondary hover:border-border',
        className
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};
