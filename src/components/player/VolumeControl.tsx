'use client';

import { memo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { VolumeX, Volume1, Volume2, Volume } from 'lucide-react';
import { GlassButton } from '../ui';
import { fadeInUp } from '@/lib/animations';

interface VolumeControlProps {
  volume: number;
  showSlider: boolean;
  onToggleSlider: () => void;
}

export const VolumeControl = memo(function VolumeControl({ volume, showSlider, onToggleSlider }: VolumeControlProps) {
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <GlassButton
      variant="default"
      size="lg-responsive"
      onClick={onToggleSlider}
      aria-label="Volume control"
      aria-expanded={showSlider}
    >
      <VolumeIcon className="w-6 h-6 text-text-bright" />
    </GlassButton>
  );
});

interface VolumeSliderProps {
  volume: number;
  onChange: (volume: number) => void;
  isVisible: boolean;
  onInteraction: () => void;
}

export const VolumeSlider = memo(function VolumeSlider({ volume, onChange, isVisible, onInteraction }: VolumeSliderProps) {
  const handleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(0);
    onInteraction();
  }, [onChange, onInteraction]);

  const handleMax = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(1);
    onInteraction();
  }, [onChange, onInteraction]);

  const handleSliderClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, x / rect.width));
    onChange(newVolume);
    onInteraction();
  }, [onChange, onInteraction]);

  const handleSliderDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, x / rect.width));
    onChange(newVolume);
    onInteraction();
  }, [onChange, onInteraction]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, x / rect.width));
    onChange(newVolume);
    onInteraction();
  }, [onChange, onInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, x / rect.width));
    onChange(newVolume);
    onInteraction();
  }, [onChange, onInteraction]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction();
  }, [onInteraction]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...fadeInUp}
          className="glass rounded-full px-5 py-4 flex items-center gap-4"
          onClick={handleContainerClick}
        >
          <button
            onClick={handleMute}
            className="text-text-muted hover:text-text transition-colors flex-shrink-0 flex items-center justify-center"
            aria-label="Mute"
          >
            <Volume className="w-4 h-4" />
          </button>

          <div
            className="w-32 md:w-40 h-6 flex items-center cursor-pointer"
            style={{ touchAction: 'none' }}
            onClick={handleSliderClick}
            onMouseMove={handleSliderDrag}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            role="slider"
            aria-label="Volume slider"
            aria-valuenow={Math.round(volume * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="relative w-full h-1.5 bg-white/20 rounded-full">
              <div
                className="absolute top-0 left-0 h-full bg-accent rounded-full"
                style={{ width: `${volume * 100}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full shadow-lg"
                style={{ left: `calc(${volume * 100}% - 8px)` }}
              />
            </div>
          </div>

          <button
            onClick={handleMax}
            className="text-text-muted hover:text-text transition-colors flex-shrink-0 flex items-center justify-center"
            aria-label="Max volume"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
