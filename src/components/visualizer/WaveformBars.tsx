'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioAnalyzer } from '@/lib/audio/useAudioAnalyzer';
import type { VisualizerProps } from './types';

const BAR_COUNT = 32;

export const WaveformBars = memo(function WaveformBars({ isPlaying }: VisualizerProps) {
  const { bass, mids, highs, overall } = useAudioAnalyzer(isPlaying);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const barsRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (isPlaying) setHasEverPlayed(true);
  }, [isPlaying]);

  // Generate bar heights based on audio
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const pos = i / BAR_COUNT;
    // Create a wave pattern across bars
    const wave = Math.sin(pos * Math.PI * 2 + Date.now() * 0.001) * 0.2;
    // Bass affects lower bars, highs affect upper bars
    const bassInfluence = Math.max(0, 1 - pos * 2) * bass;
    const midsInfluence = (1 - Math.abs(pos - 0.5) * 2) * mids;
    const highsInfluence = Math.max(0, pos * 2 - 1) * highs;
    const height = 0.1 + (bassInfluence + midsInfluence + highsInfluence) * 0.6 + overall * 0.2 + wave * 0.1;
    return Math.min(1, Math.max(0.05, height));
  });

  return (
    <AnimatePresence>
      {hasEverPlayed && (
        <motion.div
          className="absolute inset-0 flex items-end justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <svg
            ref={barsRef}
            className="w-full h-1/2 max-h-64"
            viewBox={`0 0 ${BAR_COUNT * 12} 100`}
            preserveAspectRatio="xMidYMax meet"
          >
            {bars.map((h, i) => {
              const barHeight = h * 90;
              const hue = 265 + (i / BAR_COUNT) * 30;
              const opacity = 0.3 + h * 0.5;
              return (
                <rect
                  key={i}
                  x={i * 12 + 2}
                  y={100 - barHeight}
                  width={8}
                  height={barHeight}
                  rx={4}
                  fill={`hsla(${hue}, 70%, 60%, ${opacity})`}
                  style={{ transition: 'height 80ms ease-out, y 80ms ease-out' }}
                />
              );
            })}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
