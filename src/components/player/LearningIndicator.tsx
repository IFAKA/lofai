'use client';

import { memo, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getSongCount } from '@/lib/preferences/storage';
import { getExploitationRatio } from '@/lib/preferences/bandit';

interface LearningIndicatorProps {
  isVisible: boolean;
}

export const LearningIndicator = memo(function LearningIndicator({ isVisible }: LearningIndicatorProps) {
  const [songCount, setSongCount] = useState(0);
  const [learningProgress, setLearningProgress] = useState(0);

  const loadData = useCallback(async () => {
    const count = await getSongCount();
    const ratio = await getExploitationRatio();
    setSongCount(count);
    setLearningProgress(ratio);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!isVisible) return null;

  const getMessage = () => {
    if (songCount < 10) return 'learning...';
    if (songCount < 30) return 'adapting to you...';
    if (learningProgress < 0.5) return 'still exploring...';
    return 'personalized';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2.5 text-text-muted text-xs"
    >
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-accent"
        animate={{
          opacity: [0.3, 1, 0.3],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span>{getMessage()}</span>
      {songCount > 0 && (
        <span className="text-text-muted/80">({songCount} songs)</span>
      )}
    </motion.div>
  );
});
