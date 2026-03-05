import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

function getDevice(w: number): DeviceType {
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function useDevice() {
  const [device, setDevice] = useState<DeviceType>(() =>
    getDevice(typeof window !== 'undefined' ? window.innerWidth : 1280)
  );

  useEffect(() => {
    const handle = () => setDevice(getDevice(window.innerWidth));
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  return {
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isSmall: device !== 'desktop',
  };
}
