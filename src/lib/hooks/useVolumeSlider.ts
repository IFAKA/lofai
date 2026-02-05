'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const VOLUME_SLIDER_TIMEOUT = 6000;
const VOLUME_SLIDER_HISTORY_STATE = 'volume-slider-open';

interface VolumeSliderOptions {
  isDesktop: boolean;
  resetControlsTimer: () => void;
}

export function useVolumeSlider({ isDesktop, resetControlsTimer }: VolumeSliderOptions) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHistoryEntry = useRef(false);

  // Clean up history state when closing
  const cleanupHistoryState = useCallback(() => {
    if (hasHistoryEntry.current && window.history.state?.modal === VOLUME_SLIDER_HISTORY_STATE) {
      hasHistoryEntry.current = false;
      window.history.back();
    }
  }, []);

  const handleVolumeToggle = useCallback(() => {
    setShowVolumeSlider((prev) => {
      const next = !prev;
      if (next) {
        window.history.pushState({ modal: VOLUME_SLIDER_HISTORY_STATE }, '');
        hasHistoryEntry.current = true;
      } else {
        cleanupHistoryState();
      }
      return next;
    });
  }, [cleanupHistoryState]);

  const handleVolumeInteraction = useCallback(() => {
    if (!isDesktop) {
      resetControlsTimer();
    }
    if (volumeHideTimer.current) {
      clearTimeout(volumeHideTimer.current);
    }
    volumeHideTimer.current = setTimeout(() => {
      cleanupHistoryState();
      setShowVolumeSlider(false);
    }, VOLUME_SLIDER_TIMEOUT);
  }, [isDesktop, resetControlsTimer, cleanupHistoryState]);

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
    if (showVolumeSlider) {
      cleanupHistoryState();
    }
    setShowVolumeSlider(false);
  }, [showVolumeSlider, cleanupHistoryState]);

  // Handle browser back button
  useEffect(() => {
    const handlePopstate = () => {
      // The user pressed back, so the history entry is already gone
      hasHistoryEntry.current = false;
      if (showVolumeSlider) {
        setShowVolumeSlider(false);
      }
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [showVolumeSlider]);

  return {
    showVolumeSlider,
    handleVolumeToggle,
    handleVolumeInteraction,
    closeVolumeSlider,
  };
}
