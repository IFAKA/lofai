'use client';

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioAnalyzer } from '@/lib/audio/useAudioAnalyzer';
import type { VisualizerProps } from './types';

const DOT_COUNT = 12;

export const MinimalDots = memo(function MinimalDots({ isPlaying }: VisualizerProps) {
  const { bass, mids, overall } = useAudioAnalyzer(isPlaying);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);

  useEffect(() => {
    if (isPlaying) setHasEverPlayed(true);
  }, [isPlaying]);

  return (
    <AnimatePresence>
      {hasEverPlayed && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="relative" style={{ width: '60vmin', height: '60vmin' }}>
            {Array.from({ length: DOT_COUNT }, (_, i) => {
              const angle = (i / DOT_COUNT) * Math.PI * 2 - Math.PI / 2;
              const audioInfluence = i % 3 === 0 ? bass : i % 3 === 1 ? mids : overall;
              const radius = 35 + audioInfluence * 15;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              const dotSize = 6 + audioInfluence * 8;
              const opacity = 0.3 + audioInfluence * 0.5;
              const hue = 265 + (i / DOT_COUNT) * 30;

              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: dotSize,
                    height: dotSize,
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: `hsla(${hue}, 65%, 60%, ${opacity})`,
                    boxShadow: `0 0 ${dotSize * 2}px ${dotSize}px hsla(${hue}, 65%, 60%, ${opacity * 0.3})`,
                    transition: 'all 120ms ease-out',
                  }}
                />
              );
            })}

            {/* Center pulse */}
            <div
              className="absolute rounded-full"
              style={{
                width: 16 + overall * 24,
                height: 16 + overall * 24,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: `hsla(275, 60%, 55%, ${0.2 + overall * 0.3})`,
                boxShadow: `0 0 ${20 + overall * 30}px ${10 + overall * 15}px hsla(275, 60%, 55%, 0.15)`,
                transition: 'all 120ms ease-out',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
