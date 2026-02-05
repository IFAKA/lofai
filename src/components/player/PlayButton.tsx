'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Loader2 } from 'lucide-react';
import { GlassButton } from '../ui';

interface PlayButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  loadingText?: string;
  onClick: () => void;
}

export const PlayButton = memo(function PlayButton({ isPlaying, isLoading, loadingText, onClick }: PlayButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <GlassButton
        variant="primary"
        size="2xl-responsive"
        onClick={onClick}
        disabled={isLoading}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 text-text-bright animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-6 h-6 text-text-bright" fill="currentColor" />
        ) : (
          <Play className="w-6 h-6 text-text-bright ml-1" fill="currentColor" />
        )}
      </GlassButton>
      {isLoading && loadingText && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-text-muted text-xs"
        >
          {loadingText}
        </motion.span>
      )}
    </div>
  );
});
