import { useState, useEffect } from 'react';

interface ProgressIndicatorConfig {
  showFloating: boolean;
  hideTopBar: boolean;
  autoExpand: boolean;
  position: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export default function useProgressIndicator() {
  const [isMobile, setIsMobile] = useState(false);
  const [config, setConfig] = useState<ProgressIndicatorConfig>({
    showFloating: false,
    hideTopBar: false,
    autoExpand: false,
    position: 'bottom-right'
  });

  useEffect(() => {
    const checkMobile = () => {
      const isMobileViewport = window.innerWidth < 768; // md breakpoint

      setIsMobile(isMobileViewport);
      setConfig({
        showFloating: true, // Show on all devices - navigation buttons are useful everywhere
        hideTopBar: isMobileViewport && window.innerHeight < 500, // Only hide top bar on very small mobile screens
        autoExpand: false, // User controlled
        position: 'bottom-right'
      });
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);

    // Check on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobile, 100); // Slight delay for orientation change
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  const updateConfig = (updates: Partial<ProgressIndicatorConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return {
    isMobile,
    config,
    updateConfig,
    // Convenience methods
    shouldShowFloating: config.showFloating,
    shouldHideTopBar: config.hideTopBar
  };
}
