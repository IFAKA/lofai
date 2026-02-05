import { ValenceArm, ModeArm } from '@/lib/preferences/types';

export interface ChordInfo {
  root: string;
  type: string;
  notes: string[];
  duration: string;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

// Extended jazz voicings with 7ths, 9ths, 11ths, and 13ths for rich lofi sound
const CHORD_TYPES: Record<string, number[]> = {
  'maj': [0, 4, 7, 11, 14],           // Major 9
  'min': [0, 3, 7, 10, 14],           // Minor 9
  'maj7': [0, 4, 7, 11, 14, 21],      // Major 13
  'm7': [0, 3, 7, 10, 14, 17],        // Minor 11
  '7': [0, 4, 7, 10, 14],             // Dominant 9
  'dim': [0, 3, 6, 9],                // Diminished 7
  'dim7': [0, 3, 6, 9],               // Diminished 7
  'aug': [0, 4, 8, 11],               // Augmented maj7
  '6': [0, 4, 7, 9, 14],              // Major 6/9
  'm6': [0, 3, 7, 9, 14],             // Minor 6/9
  'add9': [0, 4, 7, 14],              // Add9
  'sus2': [0, 2, 7, 11],              // Sus2 with 7th
  'sus4': [0, 5, 7, 10],              // Sus4 with 7th
  'maj9': [0, 4, 7, 11, 14],          // Major 9
  'm9': [0, 3, 7, 10, 14],            // Minor 9
  'maj11': [0, 4, 7, 11, 14, 17],     // Major 11
  'm11': [0, 3, 7, 10, 14, 17],       // Minor 11
  'maj13': [0, 4, 7, 11, 14, 21],     // Major 13
  'm13': [0, 3, 7, 10, 14, 21],       // Minor 13
};

const PROGRESSIONS: { name: string; chords: [number, string][] }[] = [
  { name: 'ii-V-I', chords: [[2, 'm7'], [5, '7'], [1, 'maj7'], [1, 'maj7']] },
  { name: 'vi-IV-I-V', chords: [[6, 'm7'], [4, 'maj7'], [1, 'maj7'], [5, '7']] },
  { name: 'I-vi-IV-V', chords: [[1, 'maj7'], [6, 'm7'], [4, 'maj7'], [5, '7']] },
  { name: 'I-V-vi-IV', chords: [[1, 'maj7'], [5, '7'], [6, 'm7'], [4, 'maj7']] },
  { name: 'ii-V-I-vi', chords: [[2, 'm7'], [5, '7'], [1, 'maj7'], [6, 'm7']] },
  { name: 'I-IV-vi-V', chords: [[1, 'maj7'], [4, 'maj7'], [6, 'm7'], [5, '7']] },
  { name: 'vi-ii-V-I', chords: [[6, 'm7'], [2, 'm7'], [5, '7'], [1, 'maj7']] },
  { name: 'I-vi-ii-V', chords: [[1, 'maj7'], [6, 'm7'], [2, 'm7'], [5, '7']] },
];

const MINOR_PROGRESSIONS: { name: string; chords: [number, string][] }[] = [
  { name: 'i-VI-III-VII', chords: [[1, 'm7'], [6, 'maj7'], [3, 'maj7'], [7, 'maj7']] },
  { name: 'i-iv-VII-III', chords: [[1, 'm7'], [4, 'm7'], [7, 'maj7'], [3, 'maj7']] },
  { name: 'i-VII-VI-VII', chords: [[1, 'm7'], [7, 'maj7'], [6, 'maj7'], [7, 'maj7']] },
  { name: 'i-iv-v-i', chords: [[1, 'm7'], [4, 'm7'], [5, 'm7'], [1, 'm7']] },
];

// Markov chain: defines valid next chords for natural voice leading
const CHORD_NEXT_MAP: Record<number, number[]> = {
  1: [2, 3, 4, 5, 6],    // I can go to many chords
  2: [3, 5, 7],          // ii typically goes to V, iii, or vii
  3: [4, 6, 2],          // iii goes to IV, vi, or ii
  4: [1, 2, 5],          // IV goes to I, ii, or V
  5: [1, 6, 3],          // V resolves to I, or deceptive to vi/iii
  6: [2, 4, 5],          // vi goes to ii, IV, or V
  7: [1, 3],             // vii resolves to I or iii
};

// Rich chord type selection based on scale degree
const DEGREE_CHORD_TYPES: Record<number, string[]> = {
  1: ['maj7', 'maj9', 'maj13', '6'],
  2: ['m7', 'm9', 'm11'],
  3: ['m7', 'm9'],
  4: ['maj7', 'maj9', '6'],
  5: ['7', 'maj7', 'sus4'],
  6: ['m7', 'm9', 'm11'],
  7: ['dim7', 'm7'],
};

function getNoteFromDegree(key: string, degree: number, mode: ModeArm): string {
  let keyIndex = NOTES.indexOf(key);

  if (keyIndex === -1) {
    const flatToSharp: Record<string, string> = {
      'Bb': 'A#', 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#',
    };
    const sharpKey = flatToSharp[key];
    if (sharpKey) {
      keyIndex = NOTES.indexOf(sharpKey);
    }
  }

  if (keyIndex === -1) {
    throw new Error(`Unknown key: ${key}`);
  }

  const scale = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
  const adjustedDegree = ((degree - 1) % 7 + 7) % 7;
  const noteIndex = (keyIndex + scale[adjustedDegree]) % 12;
  return NOTES[noteIndex];
}

function buildChord(root: string, type: string, octave: number = 3): string[] {
  const rootIndex = NOTES.indexOf(root);
  if (rootIndex === -1) {
    throw new Error(`Unknown root note: ${root}`);
  }

  const intervals = CHORD_TYPES[type];
  if (!intervals) {
    throw new Error(`Unknown chord type: ${type}`);
  }

  // Generate voicing with proper spread across octaves
  const voicing = generateVoicing(intervals, octave);

  return voicing.map((semitones) => {
    const noteIndex = (rootIndex + semitones) % 12;
    const noteOctave = octave + Math.floor((rootIndex + semitones) / 12);
    return `${NOTES[noteIndex]}${noteOctave}`;
  });
}

// Generate a jazz-like voicing by spreading notes across octaves
function generateVoicing(intervals: number[], _baseOctave: number): number[] {
  if (intervals.length <= 3) {
    return intervals;
  }

  // Keep root and 3rd/7th, spread extensions across octaves
  const voicing = [...intervals];

  // Shuffle upper extensions (everything after the 5th) for variety
  const coreNotes = voicing.slice(0, 3); // root, 3rd, 5th
  const extensions = voicing.slice(3);

  // Sometimes drop the 5th to thin out the voicing
  const useVoicing = Math.random() > 0.3
    ? [...coreNotes, ...extensions]
    : [coreNotes[0], coreNotes[1], ...extensions]; // Drop 5th

  // Ensure ascending pitch order
  const result = [useVoicing[0]];
  for (let i = 1; i < useVoicing.length; i++) {
    let note = useVoicing[i];
    while (note <= result[result.length - 1]) {
      note += 12;
    }
    result.push(note);
  }

  return result;
}

export function generateChordProgression(
  key: string,
  mode: ModeArm,
  valence: ValenceArm,
  length: number = 8 // Generate 8-bar progressions by default
): ChordInfo[] {
  // Start with a base progression to get the initial feel
  let progressionPool = mode === 'minor' ? MINOR_PROGRESSIONS : PROGRESSIONS;

  if (valence === 'sad' && mode === 'major') {
    const filtered = PROGRESSIONS.filter(p =>
      p.name.includes('vi') || p.name.includes('ii')
    );
    if (filtered.length > 0) {
      progressionPool = filtered;
    }
  }

  if (progressionPool.length === 0) {
    throw new Error(`No progressions found for mode: ${mode}`);
  }

  const baseProgression = progressionPool[Math.floor(Math.random() * progressionPool.length)];

  // Build initial 4-chord base
  const progression: ChordInfo[] = baseProgression.chords.map(([degree, _type]) => {
    const root = getNoteFromDegree(key, degree, mode);
    const richType = selectRichChordType(degree, mode, valence);

    return {
      root,
      type: richType,
      notes: buildChord(root, richType, 3),
      duration: '1m',
    };
  });

  // Use Markov chain to extend progression to desired length
  while (progression.length < length) {
    const lastDegree = getLastChordDegree(progression, key, mode);
    const nextDegrees = CHORD_NEXT_MAP[lastDegree] || [1, 4, 5];
    const nextDegree = nextDegrees[Math.floor(Math.random() * nextDegrees.length)];

    const root = getNoteFromDegree(key, nextDegree, mode);
    const richType = selectRichChordType(nextDegree, mode, valence);

    progression.push({
      root,
      type: richType,
      notes: buildChord(root, richType, 3),
      duration: '1m',
    });
  }

  return progression;
}

// Select rich chord types based on scale degree for jazz-like harmonies
function selectRichChordType(degree: number, mode: ModeArm, valence: ValenceArm): string {
  const options = DEGREE_CHORD_TYPES[degree] || ['maj7'];

  // Adjust based on mode
  let adjusted = options;
  if (mode === 'minor' && (degree === 3 || degree === 6 || degree === 7)) {
    // Natural minor: III, VI, VII are major
    adjusted = options.map(t => t.startsWith('m') && !t.includes('maj') ? t.replace('m', 'maj') : t);
  }

  // Valence adjustments
  if (valence === 'happy') {
    // Prefer brighter voicings (6, maj9, 13)
    const bright = adjusted.filter(t => t.includes('6') || t.includes('9') || t.includes('13'));
    if (bright.length > 0 && Math.random() > 0.4) {
      return bright[Math.floor(Math.random() * bright.length)];
    }
  } else if (valence === 'sad') {
    // Prefer darker voicings (m7, m11, 7)
    const dark = adjusted.filter(t => t.includes('7') || t.includes('11'));
    if (dark.length > 0 && Math.random() > 0.4) {
      return dark[Math.floor(Math.random() * dark.length)];
    }
  }

  return adjusted[Math.floor(Math.random() * adjusted.length)];
}

// Get the scale degree of the last chord in progression
function getLastChordDegree(progression: ChordInfo[], key: string, mode: ModeArm): number {
  if (progression.length === 0) return 1;

  const lastChord = progression[progression.length - 1];
  const scale = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
  const keyIndex = NOTES.indexOf(key);
  const rootIndex = NOTES.indexOf(lastChord.root);

  // Find which scale degree matches the root
  const interval = (rootIndex - keyIndex + 12) % 12;
  const degreeIndex = scale.indexOf(interval);

  return degreeIndex >= 0 ? degreeIndex + 1 : 1;
}

export function getAvailableKeys(): string[] {
  return NOTES;
}

export function selectRandomKey(): string {
  const preferredKeys = ['C', 'F', 'G', 'D', 'A', 'E', 'A#', 'D#'];
  const index = Math.floor(Math.random() * preferredKeys.length);
  return preferredKeys[index];
}
