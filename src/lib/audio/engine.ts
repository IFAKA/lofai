import * as Tone from 'tone';
import { createLofiChain, type LofiChain } from './effects/lofiChain';
import { sampleMixer } from './sampleLibrary/mixer';
import { lofiPack } from './sampleLibrary/manifest';
import type { EnergyLevel, Mood } from './sampleLibrary/types';
import { mediaSession, generateSongTitle, generateSongSubtitle } from './mediaSession';
import {
  GenerationParams,
  TEMPO_RANGES,
} from '@/lib/preferences/types';
import { selectGenerationParams } from '@/lib/preferences/bandit';
import {
  startSongTracking,
  endSongPlayback,
  updateListenDuration,
  checkSessionBonus,
} from '@/lib/preferences/feedback';

export interface EngineState {
  isInitialized: boolean;
  isPlaying: boolean;
  bpm: number;
  currentKey: string;
  currentParams: GenerationParams | null;
  songId: string | null;
  playStartTime: number | null;
  samplesLoaded: boolean;
  samplesLoading: boolean;
  activeLayers: string[];
}

// Map generation params to sample mixer parameters
function mapParamsToMixer(params: GenerationParams): {
  energy: EnergyLevel;
  mood: Mood;
} {
  // Map energy level
  const energyMap: Record<string, EnergyLevel> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
  };
  const energy = energyMap[params.energy] || 'low';

  // Map valence/danceability to mood
  // ValenceArm = 'sad' | 'neutral' | 'happy'
  let mood: Mood = 'chill';
  if (params.valence === 'sad') {
    mood = 'melancholic';
  } else if (params.valence === 'happy') {
    mood = 'uplifting';
  } else if (params.danceability === 'chill') {
    mood = params.energy === 'low' ? 'dreamy' : 'chill';
  }

  return { energy, mood };
}

// Select a random key from available keys in the sample pack
function selectRandomKey(): string {
  const keys = ['Cm', 'Am', 'Fm', 'C', 'Dm'];
  return keys[Math.floor(Math.random() * keys.length)];
}

class AudioEngine {
  private state: EngineState = {
    isInitialized: false,
    isPlaying: false,
    bpm: 80,
    currentKey: 'Cm',
    currentParams: null,
    songId: null,
    playStartTime: null,
    samplesLoaded: false,
    samplesLoading: false,
    activeLayers: [],
  };

  private lofiChain: LofiChain | null = null;
  private masterGain: Tone.Gain | null = null;

  private audioElement: HTMLAudioElement | null = null;
  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;

  private samplesLoadPromise: Promise<void> | null = null;

  private stateListeners: Set<(state: EngineState) => void> = new Set();

  private durationInterval: ReturnType<typeof setInterval> | null = null;
  private sessionBonusCheckCounter = 0;

  async initialize(): Promise<void> {
    if (this.state.isInitialized) return;

    await Tone.start();

    this.masterGain = new Tone.Gain(0);

    this.lofiChain = createLofiChain();

    // Connect sample mixer output to lofi effects chain
    sampleMixer.getOutput().connect(this.lofiChain.input);

    this.lofiChain.output.connect(this.masterGain);

    this.setupBackgroundPlayback();

    this.masterGain.connect(Tone.getDestination());

    Tone.getTransport().swing = 0.5;
    Tone.getTransport().swingSubdivision = '16n';

    mediaSession.setup({
      onPlay: () => this.play(),
      onPause: () => this.pause(),
      onNextTrack: () => this.generateNewSong(),
    });

    // Start loading samples
    this.loadSamples();

    this.state.isInitialized = true;
    this.notifyListeners();
  }

  private async loadSamples(): Promise<void> {
    if (this.samplesLoadPromise) return this.samplesLoadPromise;

    this.state.samplesLoading = true;
    this.notifyListeners();

    this.samplesLoadPromise = (async () => {
      try {
        await sampleMixer.loadPack(lofiPack);
        this.state.samplesLoaded = true;
        this.state.samplesLoading = false;
        console.log('Sample pack loaded successfully');
        this.notifyListeners();
      } catch (error) {
        console.error('Failed to load sample pack:', error);
        this.state.samplesLoading = false;
        this.notifyListeners();
        throw error;
      }
    })();

    return this.samplesLoadPromise;
  }

  private setupBackgroundPlayback(): void {
    if (typeof window === 'undefined') {
      throw new Error('Background playback requires browser environment');
    }

    const ctx = Tone.getContext().rawContext as AudioContext;
    this.mediaStreamDestination = ctx.createMediaStreamDestination();

    if (!this.masterGain) {
      throw new Error('Master gain not initialized');
    }
    this.masterGain.connect(this.mediaStreamDestination);

    this.audioElement = document.createElement('audio');
    this.audioElement.srcObject = this.mediaStreamDestination.stream;
    this.audioElement.autoplay = true;

    document.body.appendChild(this.audioElement);
    this.audioElement.style.display = 'none';
  }

  async generateNewSong(useDefaults = false): Promise<void> {
    const wasPlaying = this.state.isPlaying;

    if (this.state.songId) {
      await endSongPlayback(true);
    }

    // Select generation params
    let params: GenerationParams;
    if (useDefaults) {
      params = {
        tempo: 'focus',
        energy: 'low',
        valence: 'neutral',
        danceability: 'chill',
        mode: 'minor',
      };
    } else {
      params = await selectGenerationParams();
    }
    this.state.currentParams = params;

    // Select key for sample selection
    this.state.currentKey = selectRandomKey();

    // Set BPM from tempo range
    const tempoRange = TEMPO_RANGES[params.tempo];
    this.state.bpm = Math.round(tempoRange.min + Math.random() * (tempoRange.max - tempoRange.min));

    // Map params to mixer parameters
    const { energy, mood } = mapParamsToMixer(params);

    // Configure the sample mixer
    sampleMixer.setParameters({
      energy,
      mood,
      key: this.state.currentKey,
      bpm: this.state.bpm,
    });

    // If already playing, trigger a transition to new samples
    if (wasPlaying) {
      await sampleMixer.transition();
    }

    // Update metadata
    const title = generateSongTitle(params);
    const subtitle = generateSongSubtitle({
      ...params,
      key: this.state.currentKey,
    });

    mediaSession.updateMetadata({
      title,
      artist: subtitle,
      album: 'LofAI',
    });

    // Track song for feedback system
    const estimatedDuration = 120;
    this.state.songId = await startSongTracking(params, estimatedDuration);
    this.state.playStartTime = Date.now();

    // Update active layers in state
    const mixerState = sampleMixer.getState();
    this.state.activeLayers = mixerState.activeLayers;

    this.notifyListeners();
  }

  async play(): Promise<void> {
    if (!this.state.isInitialized) {
      await this.initialize();
    }

    // Wait for samples to load
    if (this.samplesLoadPromise) {
      await this.samplesLoadPromise;
    }

    // Generate song params if none set
    if (!this.state.currentParams) {
      await this.generateNewSong(true);
    }

    // Fade in master gain
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(Tone.now());
      this.masterGain.gain.setValueAtTime(0, Tone.now());
      this.masterGain.gain.linearRampToValueAtTime(1, Tone.now() + 0.3);
    }

    // Start the sample mixer
    await sampleMixer.start();

    // Start transport
    Tone.getTransport().start();

    // Start audio element for background playback
    if (!this.audioElement) {
      throw new Error('Audio element not initialized');
    }
    await this.audioElement.play();

    this.startDurationTracking();

    this.state.isPlaying = true;
    this.state.playStartTime = Date.now();

    // Update active layers
    const mixerState = sampleMixer.getState();
    this.state.activeLayers = mixerState.activeLayers;

    mediaSession.setPlaybackState('playing');
    this.notifyListeners();
  }

  pause(): void {
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(Tone.now());
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, Tone.now());
      this.masterGain.gain.linearRampToValueAtTime(0, Tone.now() + 0.2);
    }

    setTimeout(() => {
      Tone.getTransport().pause();

      if (this.audioElement) {
        this.audioElement.pause();
      }
    }, 250);

    this.stopDurationTracking();

    this.state.isPlaying = false;

    mediaSession.setPlaybackState('paused');
    this.notifyListeners();
  }

  async stop(): Promise<void> {
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(Tone.now());
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, Tone.now());
      this.masterGain.gain.linearRampToValueAtTime(0, Tone.now() + 0.2);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));

    // Stop the sample mixer
    sampleMixer.stop();

    Tone.getTransport().stop();

    if (this.audioElement) {
      this.audioElement.pause();
    }

    if (this.state.songId) {
      await endSongPlayback(false);
      this.state.songId = null;
    }

    this.stopDurationTracking();

    this.state.isPlaying = false;
    this.state.currentParams = null;
    this.state.activeLayers = [];

    mediaSession.setPlaybackState('none');
    this.notifyListeners();
  }

  private startDurationTracking(): void {
    this.stopDurationTracking();
    this.sessionBonusCheckCounter = 0;

    this.durationInterval = setInterval(async () => {
      if (this.state.playStartTime) {
        const duration = (Date.now() - this.state.playStartTime) / 1000;
        updateListenDuration(duration);

        this.sessionBonusCheckCounter++;
        if (this.sessionBonusCheckCounter >= 60) {
          this.sessionBonusCheckCounter = 0;
          await checkSessionBonus();
        }
      }
    }, 1000);
  }

  private stopDurationTracking(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  setVolume(volume: number): void {
    const curved = volume * volume;

    if (this.masterGain) {
      this.masterGain.gain.value = curved;
    }
  }

  getState(): EngineState {
    return { ...this.state };
  }

  subscribe(listener: (state: EngineState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.stateListeners.forEach((listener) => listener(state));
  }

  dispose(): void {
    this.stop();

    sampleMixer.dispose();
    this.lofiChain?.dispose();
    this.masterGain?.dispose();

    if (this.audioElement) {
      this.audioElement.remove();
    }

    mediaSession.cleanup();

    this.state.isInitialized = false;
  }
}

export const audioEngine = new AudioEngine();
