'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '@/stores/audioStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useSleepTimer } from '@/lib/hooks/useSleepTimer';
import { useVolumeSlider } from '@/lib/hooks/useVolumeSlider';
import { LavaLamp } from './visualizer/LavaLamp';
import { FocusMode } from './ui/FocusMode';
import { FPSCounter } from './ui/FPSCounter';
import { PlayButton } from './player/PlayButton';
import { GenerateButton } from './player/GenerateButton';
import { FeedbackButtons } from './player/FeedbackButtons';
import { VolumeControl, VolumeSlider } from './player/VolumeControl';
import { SongInfo } from './player/SongInfo';
import { LearningIndicator } from './player/LearningIndicator';
import { Settings } from './player/Settings';
import { Onboarding } from './player/Onboarding';

export function Player() {
  const {
    isPlaying,
    isLoading,
    bpm,
    currentKey,
    currentParams,
    volume,
    error,
    songId,
    togglePlayback,
    generate,
    setVolume,
    like,
    dislike,
    pause,
    retry,
    clearError,
  } = useAudioStore();

  const {
    controlsVisible,
    settingsOpen,
    showOnboarding,
    showLearningIndicator,
    toggleControls,
    showControls: resetControlsTimer,
    setSettingsOpen,
    completeOnboarding,
    startOnboarding,
  } = useUIStore();

  const { sleepTimerEndTime, clearSleepTimer, backgroundEnabled } = useSettingsStore();
  const { isDesktop, isCompact } = useIsMobile();

  useSleepTimer({
    sleepTimerEndTime,
    onTimerExpired: pause,
    clearTimer: clearSleepTimer,
  });

  useKeyboardShortcuts({
    onTogglePlayback: togglePlayback,
    onGenerate: generate,
    onLike: like,
    onDislike: dislike,
    onCloseSettings: () => setSettingsOpen(false),
  });

  const {
    showVolumeSlider,
    handleVolumeToggle,
    handleVolumeInteraction,
    closeVolumeSlider,
  } = useVolumeSlider({ isDesktop, resetControlsTimer });

  const containerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('lofai-onboarding-complete') === 'true';
    if (!hasSeenOnboarding) {
      startOnboarding();
    }
  }, [startOnboarding]);

  const handleTap = useCallback(() => {
    if (!isDesktop) {
      if (showVolumeSlider) {
        closeVolumeSlider();
        return;
      }
      if (!isPlaying) {
        if (!controlsVisible) {
          resetControlsTimer();
        }
      } else {
        toggleControls();
      }
    }
  }, [toggleControls, isDesktop, controlsVisible, isPlaying, resetControlsTimer, showVolumeSlider, closeVolumeSlider]);


  useEffect(() => {
    if (!isDesktop && isPlaying) {
      resetControlsTimer();
    }
  }, [isDesktop, isPlaying, resetControlsTimer]);

  const handleMouseMove = useCallback(() => {
    if (isPlaying) {
      resetControlsTimer();
    }
  }, [isPlaying, resetControlsTimer]);

  const showControls = isDesktop || controlsVisible;

  return (
    <>
      <FPSCounter />

      <a href="#main-controls" className="skip-to-content">
        Skip to player controls
      </a>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg/95 flex flex-col items-center justify-center p-6"
          >
            <div className="text-center max-w-md">
              <div className="text-error text-4xl mb-4">:(</div>
              <h2 className="text-text-bright text-xl mb-2">Something went wrong</h2>
              <p className="text-text-muted text-sm mb-6">
                Failed to load the melody AI. This might be a network issue.
              </p>
              <button
                onClick={() => {
                  clearError();
                  retry();
                }}
                className="px-6 py-3 bg-accent/20 hover:bg-accent/30 text-accent rounded-full transition-colors"
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Onboarding
        isOpen={showOnboarding}
        onComplete={() => {
          completeOnboarding();
          togglePlayback();
        }}
      />

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div
        ref={containerRef}
        className="relative h-[100dvh] w-full overflow-hidden bg-bg select-none"
        onClick={handleTap}
        onMouseMove={isDesktop ? handleMouseMove : undefined}
      >
        {backgroundEnabled && <LavaLamp isPlaying={isPlaying} bpm={bpm} />}

        {!isDesktop && <FocusMode isActive={!controlsVisible && isPlaying} />}


        <div
          ref={mainContentRef}
          className={`
            relative z-10 h-full flex flex-col items-center justify-between
            safe-area-top safe-area-bottom safe-area-left safe-area-right
            py-12 px-6 md:py-16 md:px-8
          `}
        >
          <div className="w-full flex justify-between items-center py-2 px-4">
            <div className="flex-1" />
            <LearningIndicator isVisible={showLearningIndicator && showControls} />
            <div className="flex-1 flex justify-end">
              {isDesktop && !isCompact && showControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-text-muted text-xs hidden md:flex items-center gap-4"
                >
                  <span><kbd className="text-text font-mono">Space</kbd> play</span>
                  <span><kbd className="text-text font-mono">→</kbd> new</span>
                  <span><kbd className="text-text font-mono">L</kbd> like</span>
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showControls && (
              <motion.div
                id="main-controls"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-8 md:gap-10"
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
              >
                <SongInfo
                  params={currentParams}
                  bpm={bpm}
                  currentKey={currentKey}
                  isVisible={true}
                />

                <div className="flex items-center gap-6 md:gap-8">
                  <VolumeControl
                    volume={volume}
                    showSlider={showVolumeSlider}
                    onToggleSlider={handleVolumeToggle}
                  />
                  <PlayButton
                    isPlaying={isPlaying}
                    isLoading={isLoading}
                    loadingText={isPlaying ? undefined : 'Generating...'}
                    onClick={togglePlayback}
                  />
                  <GenerateButton onClick={generate} disabled={isLoading} />
                </div>

                <AnimatePresence mode="wait">
                  {showVolumeSlider ? (
                    <motion.div
                      key="volume-slider"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <VolumeSlider
                        volume={volume}
                        onChange={setVolume}
                        isVisible={true}
                        onInteraction={handleVolumeInteraction}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="feedback-buttons"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <FeedbackButtons onLike={like} onDislike={dislike} songId={songId} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full flex justify-center pb-4 md:pb-6">
            <AnimatePresence>
              {showControls && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsOpen(true);
                  }}
                  className="
                    flex items-center gap-2 text-text-muted hover:text-text
                    bg-white/5 hover:bg-white/10 active:bg-white/15
                    border border-white/10 hover:border-white/20
                    rounded-full transition-all
                    text-xs px-4 py-2 md:text-sm md:px-5 md:py-2.5
                  "
                >
                  <svg
                    className="w-4 h-4 md:w-[18px] md:h-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Settings
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
