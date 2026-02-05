'use client';

import { useState, useEffect, useRef } from 'react';
import { audioAnalyzer, type FrequencyBands } from './analyzer';
import { usePerformanceTier } from '../hooks/useIsMobile';

const defaultBands: FrequencyBands = {
  bass: 0,
  mids: 0,
  highs: 0,
  overall: 0,
};

export function useAudioAnalyzer(isPlaying: boolean): FrequencyBands {
  const [bands, setBands] = useState<FrequencyBands>(defaultBands);
  const initializedRef = useRef(false);
  const performanceTier = usePerformanceTier();

  useEffect(() => {
    if (!isPlaying) {
      setBands(prev => ({
        bass: prev.bass * 0.9,
        mids: prev.mids * 0.9,
        highs: prev.highs * 0.9,
        overall: prev.overall * 0.9,
      }));
      return;
    }

    if (!initializedRef.current) {
      audioAnalyzer.initialize();
      initializedRef.current = true;
    }

    const throttleInterval = performanceTier === 'high' ? 0 : performanceTier === 'medium' ? 33 : 50;
    audioAnalyzer.setThrottleInterval(throttleInterval);

    const unsubscribe = audioAnalyzer.subscribe(setBands);

    return () => {
      unsubscribe();
    };
  }, [isPlaying, performanceTier]);

  return bands;
}
