import { BookmarksIcon, GearIcon, HouseIcon, RssIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { BottomNav, BottomNavItem } from './bottom-nav';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: '/' | '/articles' | '/feeds' | '/settings') => void;
  unreadCount?: number;
}

export const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const { t } = useTranslation();
  const navItems = [
    {
      icon: HouseIcon,
      id: '/' as const,
      label: t('nav.home'),
      onClick: () => onTabChange('/')
    },
    {
      icon: BookmarksIcon,
      id: '/articles' as const,
      label: t('nav.articles'),
      onClick: () => onTabChange('/articles')
    },
    {
      icon: RssIcon,
      id: '/feeds' as const,
      label: t('nav.feeds'),
      onClick: () => onTabChange('/feeds')
    },
    {
      icon: GearIcon,
      id: '/settings' as const,
      label: t('userMenu.settings'),
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
