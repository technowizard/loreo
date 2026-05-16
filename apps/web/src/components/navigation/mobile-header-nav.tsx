import { UserIcon } from '@phosphor-icons/react';

import { UserMenu } from '../common/user-menu';
import { Button } from '../ui/button';

export function MobileHeaderNav() {
  return (
    <div className="sepia-theme:bg-background fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b border-zinc-300 bg-white px-4 py-2  sm:hidden dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-center gap-2">
        <img alt="Loreo Logo" className="h-8 w-8" src="/logo.svg" />
        <div className="text-foreground flex h-16 w-[10%] items-center text-xl font-bold">
          Loreo
        </div>
      </div>
      <nav className="flex h-16 items-center justify-end gap-4">
        <UserMenu
          align="end"
          contentClassName="w-full"
          trigger={
            <Button
              aria-label="More actions"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              variant="ghost"
            >
              <UserIcon className="size-8" />
            </Button>
          }
        />
      </nav>
    </div>
  );
}
