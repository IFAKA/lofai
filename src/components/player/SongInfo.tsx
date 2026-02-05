'use client';

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SongInfoProps {
  focusSessionStart: number | null;
  isVisible: boolean;
  isPlaying: boolean;
}

export const SongInfo = memo(function SongInfo({
  focusSessionStart,
  isVisible,
  isPlaying,
}: SongInfoProps) {
  const [focusMinutes, setFocusMinutes] = useState(0);

  useEffect(() => {
    if (!focusSessionStart || !isPlaying) {
      setFocusMinutes(0);
      return;
    }

    const updateFocusTime = () => {
      const elapsed = Date.now() - focusSessionStart;
      setFocusMinutes(Math.floor(elapsed / 60000));
    };

    updateFocusTime();
    const interval = setInterval(updateFocusTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [focusSessionStart, isPlaying]);

  // Don't show anything if not playing or no session
  if (!isPlaying || !focusSessionStart) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center h-8"
          >
            {/* Empty placeholder to maintain layout */}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="focus-time"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-center"
        >
          <div className="text-text text-sm md:text-base">
            Focused: {focusMinutes} min
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
