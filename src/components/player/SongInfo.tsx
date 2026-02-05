'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GenerationParams } from '@/lib/preferences/types';

interface SongInfoProps {
  params: GenerationParams | null;
  bpm: number;
  currentKey: string;
  isVisible: boolean;
}

export const SongInfo = memo(function SongInfo({ params, bpm, currentKey, isVisible }: SongInfoProps) {
  if (!params) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center space-y-2 md:space-y-3"
          >
            <div className="font-mono text-sm md:text-base flex items-center justify-center gap-2">
              <span className="inline-block w-16 h-4 bg-white/10 rounded animate-pulse" />
              <span className="text-text-muted">·</span>
              <span className="inline-block w-20 h-4 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="text-xs md:text-sm flex items-center justify-center gap-3 md:gap-4">
              <span className="inline-block w-20 h-3 bg-white/5 rounded animate-pulse" />
              <span className="text-text-muted">·</span>
              <span className="inline-block w-14 h-3 bg-white/5 rounded animate-pulse" />
              <span className="text-text-muted">·</span>
              <span className="inline-block w-14 h-3 bg-white/5 rounded animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={`${bpm}-${currentKey}-${params.mode}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-center space-y-2 md:space-y-3"
        >
          <div className="text-text font-mono text-sm md:text-base">
            {Math.round(bpm)} BPM · {currentKey} {params.mode}
          </div>
          <div className="text-text-muted text-xs md:text-sm flex items-center justify-center gap-3 md:gap-4">
            <span className="capitalize">{params.energy} energy</span>
            <span>·</span>
            <span className="capitalize">{params.valence}</span>
            <span>·</span>
            <span className="capitalize">{params.danceability}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
