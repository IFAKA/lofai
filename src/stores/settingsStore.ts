import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  bpmMin: number;
  bpmMax: number;

  explorationLevel: number;

  sleepTimerMinutes: number | null;
  sleepTimerEndTime: number | null;

  backgroundEnabled: boolean;

  setBpmRange: (min: number, max: number) => void;
  setExplorationLevel: (level: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  clearSleepTimer: () => void;
  setBackgroundEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      bpmMin: 60,
      bpmMax: 72,

      explorationLevel: 0.5,

      sleepTimerMinutes: null,
      sleepTimerEndTime: null,

      backgroundEnabled: true,

      setBpmRange: (min, max) => {
        const clampedMin = Math.max(60, Math.min(100, min));
        const clampedMax = Math.max(clampedMin, Math.min(100, max));
        set({ bpmMin: clampedMin, bpmMax: clampedMax });
      },

      setExplorationLevel: (level) => {
        set({ explorationLevel: Math.max(0, Math.min(1, level)) });
      },

      setSleepTimer: (minutes) => {
        if (minutes === null) {
          set({ sleepTimerMinutes: null, sleepTimerEndTime: null });
        } else {
          set({
            sleepTimerMinutes: minutes,
            sleepTimerEndTime: Date.now() + minutes * 60 * 1000,
          });
        }
      },

      clearSleepTimer: () => {
        set({ sleepTimerMinutes: null, sleepTimerEndTime: null });
      },

      setBackgroundEnabled: (enabled) => {
        set({ backgroundEnabled: enabled });
      },
    }),
    {
      name: 'lofai-settings',
      partialize: (state) => ({
        bpmMin: state.bpmMin,
        bpmMax: state.bpmMax,
        explorationLevel: state.explorationLevel,
        backgroundEnabled: state.backgroundEnabled,
      }),
    }
  )
);

export function getAllowedTempoArms(bpmMin: number, bpmMax: number): string[] {
  const arms: string[] = [];

  if (bpmMin <= 72 && bpmMax >= 60) arms.push('focus');
  if (bpmMin <= 78 && bpmMax >= 70) arms.push('60-70');
  if (bpmMin <= 86 && bpmMax >= 78) arms.push('70-80');
  if (bpmMin <= 94 && bpmMax >= 86) arms.push('80-90');
  if (bpmMin <= 102 && bpmMax >= 94) arms.push('90-100');

  if (arms.length === 0) {
    if (bpmMax < 72) return ['focus'];
    if (bpmMin > 94) return ['90-100'];
    return ['70-80'];
  }

  return arms;
}
