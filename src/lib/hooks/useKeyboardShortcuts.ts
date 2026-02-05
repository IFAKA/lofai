'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onTogglePlayback: () => void;
  onGenerate: () => void;
  onLike: () => void;
  onDislike: () => void;
  onCloseSettings: () => void;
  onCloseVolumeSlider: () => void;
  onExitFocusMode: () => void;
  isInFocusMode: boolean;
  isSettingsOpen: boolean;
  isVolumeSliderOpen: boolean;
}

export function useKeyboardShortcuts({
  onTogglePlayback,
  onGenerate,
  onLike,
  onDislike,
  onCloseSettings,
  onCloseVolumeSlider,
  onExitFocusMode,
  isInFocusMode,
  isSettingsOpen,
  isVolumeSliderOpen,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // ESC closes modals/overlays
      if (e.code === 'Escape') {
        if (isSettingsOpen) {
          onCloseSettings();
          return;
        }
        if (isVolumeSliderOpen) {
          onCloseVolumeSlider();
          return;
        }
      }

      // Any key exits focus mode (except modifier keys)
      if (isInFocusMode && !e.metaKey && !e.ctrlKey && !e.altKey) {
        onExitFocusMode();
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePlayback();
          break;
        case 'ArrowRight':
          onGenerate();
          break;
        case 'KeyL':
          onLike();
          break;
        case 'KeyD':
          onDislike();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onTogglePlayback,
    onGenerate,
    onLike,
    onDislike,
    onCloseSettings,
    onCloseVolumeSlider,
    onExitFocusMode,
    isInFocusMode,
    isSettingsOpen,
    isVolumeSliderOpen,
  ]);
}
