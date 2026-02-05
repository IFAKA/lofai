import { create } from 'zustand';
import {
  getListeningStats,
  getSongCount,
} from '@/lib/preferences/storage';
import {
  getExploitationRatio,
  getCurrentBestParams,
  resetArms,
} from '@/lib/preferences/bandit';
import type { GenerationParams } from '@/lib/preferences/types';

interface PreferenceStore {
  totalSongs: number;
  likeCount: number;
  skipCount: number;
  averageListenRatio: number;

  exploitationRatio: number;
  bestParams: GenerationParams | null;

  isLoading: boolean;

  loadStats: () => Promise<void>;
  resetPreferences: () => Promise<void>;
}

export const usePreferenceStore = create<PreferenceStore>((set) => ({
  totalSongs: 0,
  likeCount: 0,
  skipCount: 0,
  averageListenRatio: 0,
  exploitationRatio: 0,
  bestParams: null,
  isLoading: false,

  loadStats: async () => {
    set({ isLoading: true });
    try {
      const [stats, songCount, exploitRatio, best] = await Promise.all([
        getListeningStats(),
        getSongCount(),
        getExploitationRatio(),
        getCurrentBestParams(),
      ]);

      set({
        totalSongs: songCount,
        likeCount: stats.likeCount,
        skipCount: stats.skipCount,
        averageListenRatio: stats.averageListenRatio,
        exploitationRatio: exploitRatio,
        bestParams: best,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  resetPreferences: async () => {
    set({ isLoading: true });
    try {
      await resetArms();
      await usePreferenceStore.getState().loadStats();
    } finally {
      set({ isLoading: false });
    }
  },
}));
