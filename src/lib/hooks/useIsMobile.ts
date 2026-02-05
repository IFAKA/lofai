'use client';

import { useEffect, useState } from 'react';

const MD_BREAKPOINT = 768;

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE/Edge specific
    navigator.msMaxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

function detectPerformanceTier(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'medium';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'low';
  }

  const cores = navigator.hardwareConcurrency || 4;

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;

  const isTouch = isTouchDevice();

  const dpr = window.devicePixelRatio || 1;

  if (!isTouch && cores >= 4) {
    return 'high';
  }

  if (isTouch && cores >= 6 && memory >= 4 && dpr >= 2) {
    return 'high';
  }

  if (cores <= 2 || memory <= 2) {
    return 'low';
  }

  return 'medium';
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkTouch = () => setIsMobile(isTouchDevice());
    const checkSize = () => setIsCompact(window.innerWidth < MD_BREAKPOINT);

    checkTouch();
    checkSize();

    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return {
    isMobile,
    isDesktop: !isMobile,
    isCompact,
  };
}

export function usePerformanceTier(): 'high' | 'medium' | 'low' {
  const [tier, setTier] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    setTier(detectPerformanceTier());

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setTier(detectPerformanceTier());

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return tier;
}
