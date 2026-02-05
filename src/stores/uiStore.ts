import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  controlsVisible: boolean;
  controlsTimeout: ReturnType<typeof setTimeout> | null;
  settingsOpen: boolean;
  showOnboarding: boolean;
  showLearningIndicator: boolean;
  showControls: (autoHide?: boolean) => void;
  hideControls: () => void;
  toggleControls: () => void;
  setSettingsOpen: (open: boolean) => void;
  completeOnboarding: () => void;
  startOnboarding: () => void;
  setShowLearningIndicator: (show: boolean) => void;
}

const CONTROLS_HIDE_DELAY = 8000;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      controlsVisible: true,
      controlsTimeout: null,
      settingsOpen: false,
      showOnboarding: false,
      showLearningIndicator: true,

      showControls: (autoHide = true) => {
        const { controlsTimeout } = get();
        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
        }

        if (autoHide) {
          const timeout = setTimeout(() => {
            set({ controlsVisible: false, controlsTimeout: null });
          }, CONTROLS_HIDE_DELAY);

          set({ controlsVisible: true, controlsTimeout: timeout });
        } else {
          set({ controlsVisible: true, controlsTimeout: null });
        }
      },

      hideControls: () => {
        const { controlsTimeout } = get();
        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
        }
        set({ controlsVisible: false, controlsTimeout: null });
      },

      toggleControls: () => {
        const { controlsVisible } = get();
        if (controlsVisible) {
          get().hideControls();
        } else {
          get().showControls();
        }
      },

      setSettingsOpen: (open: boolean) => {
        set({ settingsOpen: open });
        if (open) {
          const { controlsTimeout } = get();
          if (controlsTimeout) {
            clearTimeout(controlsTimeout);
          }
          set({ controlsVisible: true, controlsTimeout: null });
        }
      },

      completeOnboarding: () => {
        localStorage.setItem('lofai-onboarding-complete', 'true');
        set({ showOnboarding: false });
      },

      startOnboarding: () => {
        set({ showOnboarding: true });
      },

      setShowLearningIndicator: (show: boolean) => {
        set({ showLearningIndicator: show });
      },
    }),
    {
      name: 'lofai-ui',
      partialize: (state) => ({
        showLearningIndicator: state.showLearningIndicator,
      }),
    }
  )
);
