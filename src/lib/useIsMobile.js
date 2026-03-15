'use client';
import { useState, useEffect } from 'react';

/**
 * Detects mobile/touch devices for performance adaptation.
 * Returns true on phones and small tablets.
 * Returns undefined until determination is complete to avoid hydration freeze.
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(undefined);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
    setIsMobile(Boolean(isTouchDevice && isSmallScreen));
  }, []);

  return isMobile;
}
