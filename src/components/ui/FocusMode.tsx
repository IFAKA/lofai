'use client';

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FocusModeProps {
  isActive: boolean;
  focusTimerEndTime: number | null;
}

export const FocusMode = memo(function FocusMode({
  isActive,
  focusTimerEndTime,
}: FocusModeProps) {
  const [time, setTime] = useState<string>('');
  const [timerRemaining, setTimerRemaining] = useState<string | null>(null);

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update focus timer countdown
  useEffect(() => {
    if (!focusTimerEndTime) {
      setTimerRemaining(null);
      return;
    }

    const updateRemaining = () => {
      const remaining = focusTimerEndTime - Date.now();
      if (remaining <= 0) {
        setTimerRemaining(null);
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimerRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [focusTimerEndTime]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none gap-4"
        >
          {/* Current time */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-text-muted/70 text-6xl font-light tracking-widest"
          >
            {time}
          </motion.div>

          {/* Focus timer countdown */}
          {timerRemaining && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-text-muted/50 text-xl"
            >
              Focus: {timerRemaining}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
