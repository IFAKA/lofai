'use client';

import { useEffect } from 'react';

interface SleepTimerOptions {
  sleepTimerEndTime: number | null;
  onTimerExpired: () => void;
  clearTimer: () => void;
}

export function useSleepTimer({
  sleepTimerEndTime,
  onTimerExpired,
  clearTimer,
}: SleepTimerOptions) {
  useEffect(() => {
    if (!sleepTimerEndTime) return;

    const checkTimer = () => {
      if (Date.now() >= sleepTimerEndTime) {
        onTimerExpired();
        clearTimer();
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEndTime, onTimerExpired, clearTimer]);
}
