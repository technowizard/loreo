import { useEffect, useState } from 'react';

export const useMediaQuery = () => {
  const [deviceType, setDeviceType] = useState({
    isDesktop: false,
    isMobile: false,
    isTablet: false
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    const updateDeviceType = () => {
      setDeviceType({
        isDesktop: desktopQuery.matches,
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches
      });
    };

    updateDeviceType();

    mobileQuery.addEventListener('change', updateDeviceType);
    tabletQuery.addEventListener('change', updateDeviceType);
    desktopQuery.addEventListener('change', updateDeviceType);

    return () => {
      mobileQuery.removeEventListener('change', updateDeviceType);
      tabletQuery.removeEventListener('change', updateDeviceType);
      desktopQuery.removeEventListener('change', updateDeviceType);
    };
  }, []);

  return deviceType;
};
