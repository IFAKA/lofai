/**
 * Sample Library Type Definitions
 *
 * This defines the structure for pre-generated audio loops
 * that can be mixed at runtime for endless, high-quality playback.
 */

export type Genre = 'lofi' | 'jazz' | 'ambient' | 'chillhop';
export type SampleCategory = 'loops' | 'chords' | 'drums' | 'melodies' | 'bass' | 'ambient';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type Mood = 'chill' | 'melancholic' | 'uplifting' | 'dreamy';

export interface SampleMetadata {
  id: string;
  filename: string;
  category: SampleCategory;
  genre: Genre;

  // Musical properties
  bpm: number;
  key: string;           // e.g., 'C', 'Am', 'F#m'
  bars: number;          // Length in bars (typically 4 or 8)
  timeSignature: string; // e.g., '4/4'

  // Mood/energy tags for smart mixing
  energy: EnergyLevel;
  mood: Mood;
  tags: string[];        // Additional tags like 'vinyl', 'dusty', 'warm'

  // Compatibility
  compatibleWith: string[]; // IDs of samples that mix well together
}

export interface SamplePack {
  id: string;
  name: string;
  genre: Genre;
  version: string;
  description: string;

  // Default settings for this pack
  defaultBpm: number;
  bpmRange: { min: number; max: number };

  // Sample manifest
  samples: SampleMetadata[];

  // Mixing rules
  layerOrder: SampleCategory[]; // Order to layer samples
  maxSimultaneousLayers: number;
}

export interface LoadedSample {
  metadata: SampleMetadata;
  buffer: AudioBuffer;
  // Player is created at runtime, typed as any to avoid Tone.js import in types
  player: unknown | null;
}

export interface MixerState {
  currentPack: SamplePack | null;
  loadedSamples: Map<string, LoadedSample>;
  activeLayers: Map<SampleCategory, string>; // category -> sample id
  bpm: number;
  isPlaying: boolean;
  currentSection: number;
  barCount: number;
}

// For the mixer to decide what to play next
export interface MixDecision {
  category: SampleCategory;
  sampleId: string;
  startBar: number;
  shouldCrossfade: boolean;
  volume: number;
}
