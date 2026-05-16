import {
  CheckIcon,
  CircleHalfIcon,
  GearIcon,
  MonitorIcon,
  MoonIcon,
  SignOutIcon,
  SunIcon
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useTheme } from 'next-themes';
import { type ReactElement, useCallback } from 'react';

import { useGetUser } from '@/features/auth/api/get-user';
import { useLogout } from '@/features/auth/api/logout';

import { cn } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';

interface UserMenuProps {
  align?: 'end' | 'start';
  contentClassName?: string;
  trigger: ReactElement;
}

const themes = [
  { icon: MonitorIcon, label: 'System', value: 'system' },
  { icon: SunIcon, label: 'Light', value: 'light' },
  { icon: SunIcon, label: 'Sepia', value: 'sepia-theme' },
  { icon: MoonIcon, label: 'Dark', value: 'dark' }
] as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserMenu({ align = 'end', contentClassName, trigger }: UserMenuProps) {
  const { data: user } = useGetUser();
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useLogout({
    mutationConfig: {
      onSuccess: () => {
        queryClient.clear();
        navigate({ to: '/login' });
      }
    }
  });

  const handleLogout = useCallback(() => logoutMutation.mutate(undefined), [logoutMutation]);

  const displayName = user?.result?.displayName ?? 'User';
  const email = user?.result?.email ?? '';
  const avatarPreview = user?.result?.avatar ?? null;
  const initials = getInitials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align={align} className={cn('w-56', contentClassName)}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3">
            <Avatar className="size-9">
              {avatarPreview && <AvatarImage src={avatarPreview} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <span className="text-foreground block truncate font-medium">{displayName}</span>
              <span className="text-foreground block truncate text-xs font-normal">{email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="h-11 sm:h-8">
            <CircleHalfIcon className="mr-2 size-4" weight="fill" />
            Switch theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {themes.map(({ icon: Icon, label, value }) => (
                <DropdownMenuItem
                  className="h-11 sm:h-8"
                  key={value}
                  onClick={() => setTheme(value)}
                >
                  <Icon className="mr-2 size-4" weight="bold" />
                  {label}
                  {theme === value && (
                    <span className="ml-4 text-xs">
                      <CheckIcon className="size-4" />
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="h-11 sm:h-8" onClick={() => navigate({ to: '/settings' })}>
          <GearIcon className="mr-2 size-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="h-11 sm:h-8" onClick={handleLogout}>
          <SignOutIcon className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
