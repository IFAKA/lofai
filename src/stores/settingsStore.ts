import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VisualizerType } from '@/components/visualizer/types';
import type { GenreId } from '@/lib/audio/generative/genreConfig';
import { getGenreConfig } from '@/lib/audio/generative/genreConfig';

export type NoiseType = 'off' | 'white' | 'pink' | 'brown';

interface SettingsStore {
  genre: GenreId;
  bpmMin: number;
  bpmMax: number;

  explorationLevel: number;

  sleepTimerMinutes: number | null;
  sleepTimerEndTime: number | null;

  backgroundEnabled: boolean;

  // Focus/ADHD features
  noiseType: NoiseType;
  noiseVolume: number;
  focusTimerMinutes: number | null;
  focusTimerEndTime: number | null;
  focusSessionStart: number | null;
  focusElapsedMs: number; // Accumulated focus time across pause/resume
  showAdvancedSettings: boolean;
  visualizerType: VisualizerType;

  setGenre: (genre: GenreId) => void;
  setBpmRange: (min: number, max: number) => void;
  setExplorationLevel: (level: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  clearSleepTimer: () => void;
  setBackgroundEnabled: (enabled: boolean) => void;

  // Focus/ADHD actions
  setNoiseType: (type: NoiseType) => void;
  setNoiseVolume: (volume: number) => void;
  setFocusTimer: (minutes: number | null) => void;
  clearFocusTimer: () => void;
  startFocusSession: () => void;
  pauseFocusSession: () => void;
  resetFocusSession: () => void;
  setShowAdvancedSettings: (show: boolean) => void;
  setVisualizerType: (type: VisualizerType) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      genre: 'lofi' as GenreId,
      bpmMin: 60,
      bpmMax: 72,

      explorationLevel: 0.5,

      sleepTimerMinutes: null,
      sleepTimerEndTime: null,

      backgroundEnabled: true, // ON by default for desktop

      // Focus/ADHD defaults
      noiseType: 'pink',
      noiseVolume: 0.3,
      focusTimerMinutes: null,
      focusTimerEndTime: null,
      focusSessionStart: null,
      focusElapsedMs: 0,
      showAdvancedSettings: false,
      visualizerType: 'lava' as VisualizerType,

      setGenre: (genre) => {
        const config = getGenreConfig(genre);
        set({
          genre,
          bpmMin: config.bpmSliderRange.min,
          bpmMax: config.bpmSliderRange.max,
        });
      },

      setBpmRange: (min, max) => set((state) => {
        const config = getGenreConfig(state.genre);
        const range = config.bpmSliderRange;
        const clampedMin = Math.max(range.min, Math.min(range.max, min));
        const clampedMax = Math.max(clampedMin, Math.min(range.max, max));
        return { bpmMin: clampedMin, bpmMax: clampedMax };
      }),

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

      // Focus/ADHD actions
      setNoiseType: (type) => {
        set({ noiseType: type });
      },

      setNoiseVolume: (volume) => {
        set({ noiseVolume: Math.max(0, Math.min(1, volume)) });
      },

      setFocusTimer: (minutes) => {
        if (minutes === null) {
          set({ focusTimerMinutes: null, focusTimerEndTime: null });
        } else {
          set({
            focusTimerMinutes: minutes,
            focusTimerEndTime: Date.now() + minutes * 60 * 1000,
          });
        }
      },

      clearFocusTimer: () => {
        set({ focusTimerMinutes: null, focusTimerEndTime: null });
      },

      startFocusSession: () => {
        set({ focusSessionStart: Date.now() });
      },

      pauseFocusSession: () => {
        set((state) => {
          if (!state.focusSessionStart) return state;
          const elapsed = Date.now() - state.focusSessionStart;
          return {
            focusSessionStart: null,
            focusElapsedMs: state.focusElapsedMs + elapsed,
          };
        });
      },

      resetFocusSession: () => {
        set({ focusSessionStart: null, focusElapsedMs: 0 });
      },

      setShowAdvancedSettings: (show) => {
        set({ showAdvancedSettings: show });
      },

      setVisualizerType: (type) => {
        set({ visualizerType: type });
      },
    }),
    {
      name: 'lofai-settings',
      version: 1,
      partialize: (state) => ({
        genre: state.genre,
        bpmMin: state.bpmMin,
        bpmMax: state.bpmMax,
        explorationLevel: state.explorationLevel,
        backgroundEnabled: state.backgroundEnabled,
        // Persist noise preferences (not timers)
        noiseType: state.noiseType,
        noiseVolume: state.noiseVolume,
        showAdvancedSettings: state.showAdvancedSettings,
        visualizerType: state.visualizerType,
      }),
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>;
        // Reset any non-lofi genre to lofi
        if (state.genre && state.genre !== 'lofi') {
          state.genre = 'lofi';
          const config = getGenreConfig('lofi');
          state.bpmMin = config.bpmSliderRange.min;
          state.bpmMax = config.bpmSliderRange.max;
        }
        return state as unknown as SettingsStore;
      },
    }
  )
);

export function getAllowedTempoArms(bpmMin: number, bpmMax: number, genre?: GenreId): string[] {
  const config = getGenreConfig(genre ?? 'lofi');
  const ranges = config.tempo.ranges;
  const arms: string[] = [];
  const armKeys = Object.keys(ranges) as string[];

  for (const arm of armKeys) {
    const range = ranges[arm as keyof typeof ranges];
    if (bpmMin <= range.max && bpmMax >= range.min) {
      arms.push(arm);
    }
  }

  if (arms.length === 0) {
    // Find the closest arm
    const firstArm = armKeys[0];
    const lastArm = armKeys[armKeys.length - 1];
    const firstRange = ranges[firstArm as keyof typeof ranges];
    const lastRange = ranges[lastArm as keyof typeof ranges];
    if (bpmMax < firstRange.min) return [firstArm];
    if (bpmMin > lastRange.max) return [lastArm];
    return [armKeys[Math.floor(armKeys.length / 2)]];
  }

  return arms;
}
