import { BookmarksIcon, GearIcon, HouseIcon } from '@phosphor-icons/react';

import { BottomNav, BottomNavItem } from './bottom-nav';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: '/' | '/articles' | '/settings') => void;
  unreadCount?: number;
}

export const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const navItems = [
    {
      icon: HouseIcon,
      id: '/' as const,
      label: 'Home',
      onClick: () => onTabChange('/')
    },
    {
      icon: BookmarksIcon,
      id: '/articles' as const,
      label: 'Articles',
      onClick: () => onTabChange('/articles')
    },
    {
      icon: GearIcon,
      id: '/settings' as const,
      label: 'Settings',
      onClick: () => onTabChange('/settings')
    }
  ];

  const isActiveTab = (itemId: string) => {
    if (itemId === '/') {
      return activeTab === '/';
    }

    return activeTab.startsWith(itemId);
  };

  return (
    <BottomNav>
      {navItems.map((item) => (
        <BottomNavItem
          active={isActiveTab(item.id)}
          icon={item.icon}
          key={item.id}
          label={item.label}
          onClick={item.onClick}
        />
      ))}
    </BottomNav>
  );
};
