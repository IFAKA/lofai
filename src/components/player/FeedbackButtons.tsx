'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { GlassButton } from '../ui';

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
      <GlassButton
        variant="default"
        size="lg-responsive"
        onClick={handleDislike}
        className={disliked ? 'text-error' : 'text-text-muted hover:text-text'}
        aria-label="Dislike this song"
      >
        <ThumbsDown fill={disliked ? 'currentColor' : 'none'} />
      </GlassButton>

      <GlassButton
        variant="default"
        size="lg-responsive"
        onClick={handleLike}
        className={liked ? 'text-success' : 'text-text-muted hover:text-text'}
        aria-label="Like this song"
      >
        <ThumbsUp fill={liked ? 'currentColor' : 'none'} />
      </GlassButton>
    </div>
  );
});
