'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const VOLUME_SLIDER_TIMEOUT = 6000;

interface VolumeSliderOptions {
  isDesktop: boolean;
  resetControlsTimer: () => void;
}

export function useVolumeSlider({ isDesktop, resetControlsTimer }: VolumeSliderOptions) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVolumeToggle = useCallback(() => {
    setShowVolumeSlider((prev) => !prev);
  }, []);

  const handleVolumeInteraction = useCallback(() => {
    if (!isDesktop) {
      resetControlsTimer();
    }
    if (volumeHideTimer.current) {
      clearTimeout(volumeHideTimer.current);
    }
    volumeHideTimer.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, VOLUME_SLIDER_TIMEOUT);
  }, [isDesktop, resetControlsTimer]);

  useEffect(() => {
    if (showVolumeSlider) {
      handleVolumeInteraction();
    }
    return () => {
      if (volumeHideTimer.current) {
        clearTimeout(volumeHideTimer.current);
      }
    };
  }, [showVolumeSlider, handleVolumeInteraction]);

  const closeVolumeSlider = useCallback(() => {
    setShowVolumeSlider(false);
  }, []);

  return {
    showVolumeSlider,
    handleVolumeToggle,
    handleVolumeInteraction,
    closeVolumeSlider,
  };
}
