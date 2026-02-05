'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onTogglePlayback: () => void;
  onGenerate: () => void;
  onLike: () => void;
  onDislike: () => void;
  onCloseSettings: () => void;
}

export function useKeyboardShortcuts({
  onTogglePlayback,
  onGenerate,
  onLike,
  onDislike,
  onCloseSettings,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
        case 'Escape':
          onCloseSettings();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlayback, onGenerate, onLike, onDislike, onCloseSettings]);
}
