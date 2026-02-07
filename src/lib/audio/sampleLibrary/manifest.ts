/**
 * Sample Pack Manifest
 *
 * This file defines all available sample packs and their contents.
 * Samples are generated offline using AudioCraft/MusicGen and stored in /public/samples/
 */

import { SamplePack, SampleMetadata, Genre } from './types';

// Base path for samples
export const SAMPLES_BASE_PATH = '/samples';

/**
 * Lo-Fi Hip Hop Sample Pack
 *
 * Classic lofi aesthetic: dusty drums, jazzy chords, mellow melodies
 * BPM Range: 70-90 (sweet spot for lofi)
 */
export const lofiPack: SamplePack = {
  id: 'lofi-v1',
  name: 'Lo-Fi Essentials',
  genre: 'lofi',
  version: '1.0.0',
  description: 'Classic lo-fi hip hop vibes with dusty drums and warm keys',

  // All samples are actually at 120 BPM (ACE-Step default)
  defaultBpm: 120,
  bpmRange: { min: 120, max: 120 },

  layerOrder: ['drums', 'bass', 'chords', 'melodies', 'ambient'],
  maxSimultaneousLayers: 5,

  samples: [
    // =====================
    // DRUM LOOPS
    // =====================
    {
      id: 'drums-chill-01',
      filename: 'lofi/drums/chill-01.wav',
      category: 'drums',
      genre: 'lofi',
      bpm: 120,
      key: 'C',
      bars: 4,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['dusty', 'vinyl', 'boom-bap'],
      compatibleWith: ['chords-jazzy-Cm-01', 'chords-jazzy-Fm-01', 'bass-mellow-Cm-01'],
    },
    {
      id: 'drums-chill-02',
      filename: 'lofi/drums/chill-02.wav',
      category: 'drums',
      genre: 'lofi',
      bpm: 120,
      key: 'C',
      bars: 4,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'dreamy',
      tags: ['soft', 'brushes', 'minimal'],
      compatibleWith: ['chords-dreamy-Am-01', 'melodies-piano-Am-01'],
    },
    {
      id: 'drums-groove-01',
      filename: 'lofi/drums/groove-01.wav',
      category: 'drums',
      genre: 'lofi',
      bpm: 120,
      key: 'C',
      bars: 4,
      timeSignature: '4/4',
      energy: 'medium',
      mood: 'uplifting',
      tags: ['swing', 'punchy', 'groove'],
      compatibleWith: ['chords-uplifting-C-01', 'bass-groovy-C-01'],
    },
    {
      id: 'drums-dreamy-01',
      filename: 'lofi/drums/dreamy-01.wav',
      category: 'drums',
      genre: 'lofi',
      bpm: 120,
      key: 'C',
      bars: 4,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'dreamy',
      tags: ['reverb', 'soft', 'atmospheric'],
      compatibleWith: ['chords-dreamy-Am-01', 'melodies-piano-Am-01'],
    },

    // =====================
    // CHORD PROGRESSIONS
    // =====================
    {
      id: 'chords-jazzy-Cm-01',
      filename: 'lofi/chords/jazzy-Cm-01.wav',
      category: 'chords',
      genre: 'lofi',
      bpm: 120,
      key: 'Cm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'melancholic',
      tags: ['rhodes', 'jazz', '7ths', 'warm'],
      compatibleWith: ['drums-chill-01', 'melodies-piano-Cm-01', 'bass-mellow-Cm-01'],
    },
    {
      id: 'chords-jazzy-Fm-01',
      filename: 'lofi/chords/jazzy-Fm-01.wav',
      category: 'chords',
      genre: 'lofi',
      bpm: 120,
      key: 'Fm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['piano', 'jazz', 'smooth'],
      compatibleWith: ['drums-chill-01', 'drums-chill-02', 'melodies-synth-Fm-01'],
    },
    {
      id: 'chords-dreamy-Am-01',
      filename: 'lofi/chords/dreamy-Am-01.wav',
      category: 'chords',
      genre: 'lofi',
      bpm: 120,
      key: 'Am',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'dreamy',
      tags: ['pad', 'ethereal', 'reverb'],
      compatibleWith: ['drums-chill-02', 'drums-dreamy-01', 'ambient-rain-01'],
    },
    {
      id: 'chords-uplifting-C-01',
      filename: 'lofi/chords/uplifting-C-01.wav',
      category: 'chords',
      genre: 'lofi',
      bpm: 120,
      key: 'C',
      bars: 8,
      timeSignature: '4/4',
      energy: 'medium',
      mood: 'uplifting',
      tags: ['major', 'bright', 'hopeful'],
      compatibleWith: ['drums-groove-01', 'melodies-flute-C-01', 'bass-groovy-C-01'],
    },
    {
      id: 'chords-melancholic-Dm-01',
      filename: 'lofi/chords/melancholic-Dm-01.wav',
      category: 'chords',
      genre: 'lofi',
      bpm: 120,
      key: 'Dm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'melancholic',
      tags: ['sad', 'emotional', 'nostalgic'],
      compatibleWith: ['drums-chill-01', 'melodies-guitar-Dm-01'],
    },

    // =====================
    // MELODIES
    // =====================
    {
      id: 'melodies-piano-Cm-01',
      filename: 'lofi/melodies/piano-Cm-01.wav',
      category: 'melodies',
      genre: 'lofi',
      bpm: 120,
      key: 'Cm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'melancholic',
      tags: ['piano', 'sparse', 'emotive'],
      compatibleWith: ['chords-jazzy-Cm-01', 'drums-chill-01'],
    },
    {
      id: 'melodies-piano-Am-01',
      filename: 'lofi/melodies/piano-Am-01.wav',
      category: 'melodies',
      genre: 'lofi',
      bpm: 120,
      key: 'Am',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'dreamy',
      tags: ['piano', 'gentle', 'floating'],
      compatibleWith: ['chords-dreamy-Am-01', 'drums-chill-02', 'drums-dreamy-01'],
    },
    {
      id: 'melodies-flute-C-01',
      filename: 'lofi/melodies/flute-C-01.wav',
      category: 'melodies',
      genre: 'lofi',
      bpm: 120,
      key: 'C',
      bars: 4,
      timeSignature: '4/4',
      energy: 'medium',
      mood: 'uplifting',
      tags: ['flute', 'airy', 'organic'],
      compatibleWith: ['chords-uplifting-C-01', 'drums-groove-01'],
    },
    {
      id: 'melodies-guitar-Dm-01',
      filename: 'lofi/melodies/guitar-Dm-01.wav',
      category: 'melodies',
      genre: 'lofi',
      bpm: 120,
      key: 'Dm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'melancholic',
      tags: ['guitar', 'fingerpicked', 'warm'],
      compatibleWith: ['chords-melancholic-Dm-01', 'drums-chill-01'],
    },
    {
      id: 'melodies-synth-Fm-01',
      filename: 'lofi/melodies/synth-Fm-01.wav',
      category: 'melodies',
      genre: 'lofi',
      bpm: 120,
      key: 'Fm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['synth', 'analog', 'warm'],
      compatibleWith: ['chords-jazzy-Fm-01', 'drums-chill-01'],
    },

    // =====================
    // BASS LINES
    // =====================
    {
      id: 'bass-mellow-Cm-01',
      filename: 'lofi/bass/mellow-Cm-01.wav',
      category: 'bass',
      genre: 'lofi',
      bpm: 120,
      key: 'Cm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['sub', 'warm', 'simple'],
      compatibleWith: ['chords-jazzy-Cm-01', 'drums-chill-01'],
    },
    {
      id: 'bass-groovy-C-01',
      filename: 'lofi/bass/groovy-C-01.wav',
      category: 'bass',
      genre: 'lofi',
      bpm: 120,
      key: 'C',
      bars: 4,
      timeSignature: '4/4',
      energy: 'medium',
      mood: 'uplifting',
      tags: ['funky', 'walking', 'active'],
      compatibleWith: ['chords-uplifting-C-01', 'drums-groove-01'],
    },
    {
      id: 'bass-deep-Am-01',
      filename: 'lofi/bass/deep-Am-01.wav',
      category: 'bass',
      genre: 'lofi',
      bpm: 120,
      key: 'Am',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'dreamy',
      tags: ['deep', 'sub', 'atmospheric'],
      compatibleWith: ['chords-dreamy-Am-01', 'drums-dreamy-01'],
    },

    // =====================
    // AMBIENT TEXTURES
    // =====================
    {
      id: 'ambient-rain-01',
      filename: 'lofi/ambient/rain-01.wav',
      category: 'ambient',
      genre: 'lofi',
      bpm: 0,
      key: 'C',
      bars: 0,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['rain', 'nature', 'cozy'],
      compatibleWith: [],
    },
    {
      id: 'ambient-vinyl-01',
      filename: 'lofi/ambient/vinyl-01.wav',
      category: 'ambient',
      genre: 'lofi',
      bpm: 0,
      key: 'C',
      bars: 0,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['vinyl', 'crackle', 'nostalgic'],
      compatibleWith: [],
    },
    {
      id: 'ambient-cafe-01',
      filename: 'lofi/ambient/cafe-01.wav',
      category: 'ambient',
      genre: 'lofi',
      bpm: 0,
      key: 'C',
      bars: 0,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['cafe', 'chatter', 'urban'],
      compatibleWith: [],
    },
    {
      id: 'ambient-night-01',
      filename: 'lofi/ambient/night-01.wav',
      category: 'ambient',
      genre: 'lofi',
      bpm: 0,
      key: 'C',
      bars: 0,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['night', 'city', 'urban'],
      compatibleWith: [],
    },

    // =====================
    // FULL LOOPS (pre-mixed)
    // =====================
    {
      id: 'loop-chill-Cm-01',
      filename: 'lofi/loops/chill-Cm-01.wav',
      category: 'loops',
      genre: 'lofi',
      bpm: 120,
      key: 'Cm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['complete', 'mixed', 'ready'],
      compatibleWith: [],
    },
    {
      id: 'loop-dreamy-Am-01',
      filename: 'lofi/loops/dreamy-Am-01.wav',
      category: 'loops',
      genre: 'lofi',
      bpm: 120,
      key: 'Am',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'dreamy',
      tags: ['complete', 'mixed', 'spacey'],
      compatibleWith: [],
    },
    {
      id: 'loop-uplifting-C-01',
      filename: 'lofi/loops/uplifting-C-01.wav',
      category: 'loops',
      genre: 'lofi',
      bpm: 120,
      key: 'C',
      bars: 8,
      timeSignature: '4/4',
      energy: 'medium',
      mood: 'uplifting',
      tags: ['complete', 'mixed', 'bright'],
      compatibleWith: [],
    },
    {
      id: 'loop-melancholic-Dm-01',
      filename: 'lofi/loops/melancholic-Dm-01.wav',
      category: 'loops',
      genre: 'lofi',
      bpm: 120,
      key: 'Dm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'melancholic',
      tags: ['complete', 'mixed', 'sad'],
      compatibleWith: [],
    },
    {
      id: 'loop-jazzy-Fm-01',
      filename: 'lofi/loops/jazzy-Fm-01.wav',
      category: 'loops',
      genre: 'lofi',
      bpm: 120,
      key: 'Fm',
      bars: 8,
      timeSignature: '4/4',
      energy: 'low',
      mood: 'chill',
      tags: ['complete', 'mixed', 'smooth'],
      compatibleWith: [],
    },
  ],
};

// Registry of all available packs
export const samplePacks: Record<Genre, SamplePack> = {
  lofi: lofiPack,
};

/**
 * Get samples by category from a pack
 */
export function getSamplesByCategory(
  pack: SamplePack,
  category: SampleMetadata['category']
): SampleMetadata[] {
  return pack.samples.filter(s => s.category === category);
}

/**
 * Get samples compatible with a given sample
 */
export function getCompatibleSamples(
  pack: SamplePack,
  sampleId: string
): SampleMetadata[] {
  const sample = pack.samples.find(s => s.id === sampleId);
  if (!sample) return [];

  return pack.samples.filter(s => sample.compatibleWith.includes(s.id));
}

/**
 * Get samples matching energy/mood
 */
export function getSamplesByMood(
  pack: SamplePack,
  energy: SampleMetadata['energy'],
  mood: SampleMetadata['mood']
): SampleMetadata[] {
  return pack.samples.filter(s => s.energy === energy && s.mood === mood);
}

/**
 * Get samples in a specific key
 */
export function getSamplesByKey(
  pack: SamplePack,
  key: string
): SampleMetadata[] {
  return pack.samples.filter(s => s.key === key || s.key === 'C'); // Drums are always compatible
}
