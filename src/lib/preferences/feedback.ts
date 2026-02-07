import {
  SongLog,
  FeedbackEvent,
  GenerationParams,
  REWARD_WEIGHTS,
} from './types';
import {
  saveSongLog,
  saveFeedbackEvent,
  getSessionStartTime,
  setSessionStartTime,
  clearSessionStartTime,
} from './storage';
import { updateArmsForSong } from './bandit';
import type { GenreId } from '@/lib/audio/generative/genreConfig';

function generateSongId(): string {
  return `song_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

class FeedbackTracker {
  private currentSong: (SongLog & { genre?: GenreId }) | null = null;

  getCurrentSong(): SongLog | null {
    return this.currentSong ? { ...this.currentSong } : null;
  }

  isTracking(): boolean {
    return this.currentSong !== null;
  }

  async startTracking(params: GenerationParams, estimatedDuration: number, genre?: GenreId): Promise<string> {
    const songId = generateSongId();
    const now = Date.now();

    this.currentSong = {
      id: songId,
      params,
      startTime: now,
      listenDuration: 0,
      totalDuration: estimatedDuration,
      skipped: false,
      genre,
    };

    const sessionStart = await getSessionStartTime();
    if (!sessionStart) {
      await setSessionStartTime(now);
    }

    return songId;
  }

  updateDuration(duration: number): void {
    if (this.currentSong) {
      this.currentSong.listenDuration = duration;
    }
  }

  async endPlayback(skipped: boolean = false): Promise<number> {
    if (!this.currentSong) {
      throw new Error('No song being tracked');
    }

    const now = Date.now();
    this.currentSong.endTime = now;
    this.currentSong.skipped = skipped;

    const listenRatio = this.currentSong.totalDuration > 0
      ? this.currentSong.listenDuration / this.currentSong.totalDuration
      : 0;

    let reward = 0;
    if (skipped && this.currentSong.listenDuration < 10) {
      reward = REWARD_WEIGHTS.SKIP_UNDER_10_SEC;
    } else if (listenRatio >= 0.9) {
      reward = REWARD_WEIGHTS.LISTEN_90_PLUS;
    } else if (listenRatio >= 0.5) {
      reward = REWARD_WEIGHTS.LISTEN_50_90;
    } else if (listenRatio < 0.3) {
      reward = REWARD_WEIGHTS.LISTEN_UNDER_30;
    }

    this.currentSong.reward = reward;

    const feedbackEvent: FeedbackEvent = {
      songId: this.currentSong.id,
      timestamp: now,
      type: skipped ? 'skip' : 'listen_end',
      listenRatio,
      reward,
    };
    await saveFeedbackEvent(feedbackEvent);
    await updateArmsForSong(this.currentSong.params, reward, this.currentSong.genre);
    await saveSongLog(this.currentSong);

    const savedReward = this.currentSong.reward;
    if (savedReward === undefined) {
      throw new Error('Song reward was not calculated');
    }
    this.currentSong = null;

    return savedReward;
  }

  async handleLike(): Promise<void> {
    if (!this.currentSong) {
      throw new Error('No song being tracked');
    }

    this.currentSong.explicitFeedback = 'like';
    const reward = REWARD_WEIGHTS.EXPLICIT_LIKE;

    const feedbackEvent: FeedbackEvent = {
      songId: this.currentSong.id,
      timestamp: Date.now(),
      type: 'like',
      reward,
    };
    await saveFeedbackEvent(feedbackEvent);
    await updateArmsForSong(this.currentSong.params, reward, this.currentSong.genre);
  }

  async handleDislike(): Promise<void> {
    if (!this.currentSong) {
      throw new Error('No song being tracked');
    }

    this.currentSong.explicitFeedback = 'dislike';
    const reward = REWARD_WEIGHTS.EXPLICIT_DISLIKE;

    const feedbackEvent: FeedbackEvent = {
      songId: this.currentSong.id,
      timestamp: Date.now(),
      type: 'dislike',
      reward,
    };
    await saveFeedbackEvent(feedbackEvent);
    await updateArmsForSong(this.currentSong.params, reward, this.currentSong.genre);
  }

  async checkSessionBonus(): Promise<boolean> {
    const sessionStart = await getSessionStartTime();
    if (!sessionStart) return false;

    const sessionDuration = (Date.now() - sessionStart) / 1000 / 60;

    if (sessionDuration >= 30 && this.currentSong) {
      const reward = REWARD_WEIGHTS.SESSION_BONUS;

      const feedbackEvent: FeedbackEvent = {
        songId: this.currentSong.id,
        timestamp: Date.now(),
        type: 'session_bonus',
        reward,
      };
      await saveFeedbackEvent(feedbackEvent);
      await updateArmsForSong(this.currentSong.params, reward, this.currentSong.genre);
      await setSessionStartTime(Date.now());

      return true;
    }

    return false;
  }

  async endSession(): Promise<void> {
    if (this.currentSong) {
      await this.endPlayback(false);
    }
    await clearSessionStartTime();
  }
}

const feedbackTracker = new FeedbackTracker();

export async function startSongTracking(
  params: GenerationParams,
  estimatedDuration: number,
  genre?: GenreId
): Promise<string> {
  return feedbackTracker.startTracking(params, estimatedDuration, genre);
}

export function updateListenDuration(duration: number): void {
  feedbackTracker.updateDuration(duration);
}

export async function endSongPlayback(skipped: boolean = false): Promise<number> {
  return feedbackTracker.endPlayback(skipped);
}

export async function handleExplicitLike(): Promise<void> {
  return feedbackTracker.handleLike();
}

export async function handleExplicitDislike(): Promise<void> {
  return feedbackTracker.handleDislike();
}

export async function checkSessionBonus(): Promise<boolean> {
  return feedbackTracker.checkSessionBonus();
}

export async function endSession(): Promise<void> {
  return feedbackTracker.endSession();
}

export function getCurrentSongInfo(): SongLog | null {
  return feedbackTracker.getCurrentSong();
}

export function isTrackingSong(): boolean {
  return feedbackTracker.isTracking();
}
