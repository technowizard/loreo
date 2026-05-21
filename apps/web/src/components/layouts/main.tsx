import { useRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { MobileBottomNav } from '../navigation/mobile-bottom-nav';
import { MobileHeaderNav } from '../navigation/mobile-header-nav';

import { DemoModeBanner } from './demo-banner';
import { Header } from './header';

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();

  return (
    <div className="bg-background min-h-screen transition-colors duration-300">
      <Header />
      <MobileHeaderNav />
      <DemoModeBanner />
      <div className="mx-auto my-12 max-w-350 px-4 py-8 sm:my-0 sm:mt-0 sm:px-6 lg:px-8">
        {children}
      </div>
      <MobileBottomNav
        activeTab={router.latestLocation.pathname}
        onTabChange={(tab) => router.navigate({ to: tab })}
      />
    </div>
  );
}

export default MainLayout;
