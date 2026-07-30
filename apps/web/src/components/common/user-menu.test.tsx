import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/tests/test-utils';

const navigate = vi.hoisted(() => vi.fn());
const setTheme = vi.hoisted(() => vi.fn());
const toggleTheme = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();

  return {
    ...actual,
    useNavigate: () => navigate
  };
});

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme, theme: 'light' })
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { init: vi.fn(), type: '3rdParty' },
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock('@/features/auth/api/get-user', () => ({
  useGetUser: () => ({
    data: {
      result: {
        avatar: null,
        displayName: 'Reader',
        email: 'reader@example.com',
        role: 'user'
      }
    }
  })
}));

vi.mock('@/features/auth/api/logout', () => ({
  useLogout: () => ({ mutate: vi.fn() })
}));

vi.mock('@/hooks/use-theme-config', () => ({
  useThemeConfig: (selector: (state: { toggleTheme: typeof toggleTheme }) => unknown) =>
    selector({ toggleTheme })
}));

vi.mock('../ui/dropdown-menu', () => {
  const Wrapper = ({ children }: { children?: ReactNode }) => <div>{children}</div>;

  return {
    DropdownMenu: Wrapper,
    DropdownMenuContent: Wrapper,
    DropdownMenuGroup: Wrapper,
    DropdownMenuItem: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) => (
      <button onClick={onClick} type="button">
        {children}
      </button>
    ),
    DropdownMenuLabel: Wrapper,
    DropdownMenuPortal: Wrapper,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuSub: Wrapper,
    DropdownMenuSubContent: Wrapper,
    DropdownMenuSubTrigger: Wrapper,
    DropdownMenuTrigger: ({ render }: { render: ReactNode }) => render
  };
});

import { UserMenu } from './user-menu';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UserMenu', () => {
  it('applies and persists theme changes from the menu', async () => {
    const user = userEvent.setup();

    render(<UserMenu trigger={<button type="button">Open user menu</button>} />);

    await user.click(screen.getByRole('button', { name: 'userMenu.themes.dark' }));

    expect(setTheme).toHaveBeenCalledWith('dark');
    expect(toggleTheme).toHaveBeenCalledWith('dark');
  });
});
