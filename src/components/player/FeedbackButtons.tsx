'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  onLike: () => void;
  onDislike: () => void;
  songId?: string | null;
}

export const FeedbackButtons = memo(function FeedbackButtons({ onLike, onDislike, songId }: FeedbackButtonsProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  useEffect(() => {
    setLiked(false);
    setDisliked(false);
  }, [songId]);

  const handleLike = useCallback(() => {
    if (!liked) {
      setLiked(true);
      setDisliked(false);
      onLike();
    }
  }, [liked, onLike]);

  const handleDislike = useCallback(() => {
    if (!disliked) {
      setDisliked(true);
      setLiked(false);
      onDislike();
    }
  }, [disliked, onDislike]);

  return (
    <div className="flex items-center gap-6 md:gap-8">
      <motion.button
        onClick={handleDislike}
        className={`
          p-3 md:p-4 rounded-full transition-colors
          ${disliked ? 'text-error' : 'text-text-muted hover:text-text'}
        `}
        whileTap={{ scale: 0.9 }}
        aria-label="Dislike this song"
      >
        <ThumbsDown className="w-6 h-6 md:w-7 md:h-7" fill={disliked ? 'currentColor' : 'none'} />
      </motion.button>

      <motion.button
        onClick={handleLike}
        className={`
          p-3 md:p-4 rounded-full transition-colors
          ${liked ? 'text-success' : 'text-text-muted hover:text-text'}
        `}
        whileTap={{ scale: 0.9 }}
        aria-label="Like this song"
      >
        <ThumbsUp className="w-6 h-6 md:w-7 md:h-7" fill={liked ? 'currentColor' : 'none'} />
      </motion.button>
    </div>
  );
});
