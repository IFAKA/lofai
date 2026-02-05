'use client';

import { useEffect, useState } from 'react';

interface FocusTimerOptions {
  focusTimerEndTime: number | null;
  onTimerComplete: () => void;
  clearTimer: () => void;
}

interface FocusTimerReturn {
  timeRemaining: string | null;
  isComplete: boolean;
}

export function useFocusTimer({
  focusTimerEndTime,
  onTimerComplete,
  clearTimer,
}: FocusTimerOptions): FocusTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!focusTimerEndTime) {
      setTimeRemaining(null);
      setIsComplete(false);
      return;
    }

    const checkTimer = () => {
      const remaining = focusTimerEndTime - Date.now();

      if (remaining <= 0) {
        setTimeRemaining(null);
        setIsComplete(true);
        onTimerComplete();
        clearTimer();
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [focusTimerEndTime, onTimerComplete, clearTimer]);

  return { timeRemaining, isComplete };
}
