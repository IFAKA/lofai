import { describe, it, expect, vi, beforeEach } from 'vitest';
import { REWARD_WEIGHTS } from '../types';

// Mock storage and bandit modules
vi.mock('../storage', () => ({
  saveSongLog: vi.fn().mockResolvedValue(undefined),
  saveFeedbackEvent: vi.fn().mockResolvedValue(undefined),
  getSessionStartTime: vi.fn().mockResolvedValue(null),
  setSessionStartTime: vi.fn().mockResolvedValue(undefined),
  clearSessionStartTime: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../bandit', () => ({
  updateArmsForSong: vi.fn().mockResolvedValue(undefined),
}));

describe('feedback reward weights', () => {
  it('awards +1.0 for 90%+ listen', () => {
    expect(REWARD_WEIGHTS.LISTEN_90_PLUS).toBe(1.0);
  });

  it('awards +0.3 for 50-90% listen', () => {
    expect(REWARD_WEIGHTS.LISTEN_50_90).toBe(0.3);
  });

  it('penalizes -0.5 for <30% listen', () => {
    expect(REWARD_WEIGHTS.LISTEN_UNDER_30).toBe(-0.5);
  });

  it('penalizes -1.0 for skip under 10s', () => {
    expect(REWARD_WEIGHTS.SKIP_UNDER_10_SEC).toBe(-1.0);
  });

  it('awards +1.5 for explicit like', () => {
    expect(REWARD_WEIGHTS.EXPLICIT_LIKE).toBe(1.5);
  });

  it('penalizes -1.5 for explicit dislike', () => {
    expect(REWARD_WEIGHTS.EXPLICIT_DISLIKE).toBe(-1.5);
  });

  it('awards +0.5 session bonus', () => {
    expect(REWARD_WEIGHTS.SESSION_BONUS).toBe(0.5);
  });
});

describe('FeedbackTracker', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('starts tracking and returns a songId', async () => {
    const { startSongTracking } = await import('../feedback');
    const songId = await startSongTracking(
      { tempo: 'focus', energy: 'low', valence: 'neutral', danceability: 'chill', mode: 'minor' },
      100
    );
    expect(songId).toMatch(/^song_/);
  });

  it('endPlayback calculates reward for 90%+ listen', async () => {
    const { startSongTracking, updateListenDuration, endSongPlayback } = await import('../feedback');
    await startSongTracking(
      { tempo: 'focus', energy: 'low', valence: 'neutral', danceability: 'chill', mode: 'minor' },
      100
    );
    updateListenDuration(95); // 95% listened
    const reward = await endSongPlayback(false);
    expect(reward).toBe(REWARD_WEIGHTS.LISTEN_90_PLUS);
  });

  it('endPlayback calculates reward for 50-90% listen', async () => {
    const { startSongTracking, updateListenDuration, endSongPlayback } = await import('../feedback');
    await startSongTracking(
      { tempo: 'focus', energy: 'low', valence: 'neutral', danceability: 'chill', mode: 'minor' },
      100
    );
    updateListenDuration(70);
    const reward = await endSongPlayback(false);
    expect(reward).toBe(REWARD_WEIGHTS.LISTEN_50_90);
  });

  it('endPlayback penalizes <30% listen', async () => {
    const { startSongTracking, updateListenDuration, endSongPlayback } = await import('../feedback');
    await startSongTracking(
      { tempo: 'focus', energy: 'low', valence: 'neutral', danceability: 'chill', mode: 'minor' },
      100
    );
    updateListenDuration(20);
    const reward = await endSongPlayback(false);
    expect(reward).toBe(REWARD_WEIGHTS.LISTEN_UNDER_30);
  });

  it('endPlayback penalizes skip under 10s', async () => {
    const { startSongTracking, updateListenDuration, endSongPlayback } = await import('../feedback');
    await startSongTracking(
      { tempo: 'focus', energy: 'low', valence: 'neutral', danceability: 'chill', mode: 'minor' },
      100
    );
    updateListenDuration(5);
    const reward = await endSongPlayback(true);
    expect(reward).toBe(REWARD_WEIGHTS.SKIP_UNDER_10_SEC);
  });

  it('throws when ending playback with no song tracked', async () => {
    const { endSongPlayback } = await import('../feedback');
    await expect(endSongPlayback(false)).rejects.toThrow('No song being tracked');
  });
});
