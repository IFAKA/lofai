export interface MediaSessionConfig {
  onPlay?: () => void;
  onPause?: () => void;
  onNextTrack?: () => void;
}

export interface MediaMetadata {
  title: string;
  artist: string;
  album?: string;
  artwork?: { src: string; sizes: string; type: string }[];
}

class MediaSessionManager {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'mediaSession' in navigator;
  }

  setup(config: MediaSessionConfig): void {
    if (!this.isSupported) return;

    if (config.onPlay) {
      navigator.mediaSession.setActionHandler('play', config.onPlay);
    }

    if (config.onPause) {
      navigator.mediaSession.setActionHandler('pause', config.onPause);
    }

    if (config.onNextTrack) {
      navigator.mediaSession.setActionHandler('nexttrack', config.onNextTrack);
    }
  }

  updateMetadata(metadata: MediaMetadata): void {
    if (!this.isSupported) return;

    const defaultArtwork = [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ];

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album ?? 'Seedtone',
      artwork: metadata.artwork ?? defaultArtwork,
    });
  }

  setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
    if (!this.isSupported) return;
    navigator.mediaSession.playbackState = state;
  }

  cleanup(): void {
    if (!this.isSupported) return;

    const actions: MediaSessionAction[] = ['play', 'pause', 'nexttrack'];

    actions.forEach((action) => {
      navigator.mediaSession.setActionHandler(action, null);
    });
  }
}

export const mediaSession = new MediaSessionManager();

export function generateSongTitle(params: {
  tempo: string;
  energy: string;
  valence: 'sad' | 'neutral' | 'happy';
  mode: string;
}): string {
  const moods: Record<'sad' | 'neutral' | 'happy', string[]> = {
    sad: ['Rainy', 'Melancholic', 'Wistful', 'Pensive', 'Twilight'],
    neutral: ['Calm', 'Peaceful', 'Serene', 'Gentle', 'Soft'],
    happy: ['Sunny', 'Bright', 'Warm', 'Golden', 'Pleasant'],
  };

  const places: string[] = [
    'Café',
    'Window',
    'Garden',
    'Study',
    'Night',
    'Morning',
    'Dreams',
    'Memories',
    'Thoughts',
    'Moments',
  ];

  const mood = moods[params.valence];
  const moodWord = mood[Math.floor(Math.random() * mood.length)];
  const place = places[Math.floor(Math.random() * places.length)];

  return `${moodWord} ${place}`;
}

export function generateSongSubtitle(params: {
  tempo: string;
  energy: string;
  key?: string;
}): string {
  const tempoRange = params.tempo.replace('-', '\u2013');
  return `${tempoRange} BPM \u00b7 ${params.energy} energy${params.key ? ` \u00b7 ${params.key}` : ''}`;
}
