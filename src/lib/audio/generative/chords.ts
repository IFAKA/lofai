/**
 * Chord generation system ported from lofi-engine
 * Now with full 7-chord system and rich extensions (9ths, 11ths, 13ths)
 */

// Available keys
export const KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Minor key roots (for use with minor mode progressions)
// Just the root notes - Tone.js needs 'A', not 'Am'
export const MINOR_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Major keys
export const MAJOR_KEYS = KEYS;

// Major scale intervals for semitone distance calculation
export const SINGLE_OCTAVE = [0, 2, 4, 5, 7, 9, 11];

// Major scale intervals (5 to 5 range for melody)
export const FIVE_TO_FIVE = [-7, -5, -4, -2, 0, 2, 4, 5, 7, 9, 11, 12, 14, 16];

// Interval weights for melody generation (closer intervals more likely)
export const INTERVAL_WEIGHTS = [8, 5, 3, 2, 1, 0.5, 0.25];

// Chord definitions with Roman numeral degrees
// Each chord now has 7 intervals for rich voicings (root, 3rd, 5th, 7th, 9th, 11th, 13th)
interface ChordDef {
  degree: string;
  degreeNum: number;
  intervals: number[];
  nextChordIdxs: number[];
}

// Full 7-chord system with rich extensions (matching lofi-engine exactly)
const CHORD_DEFS: ChordDef[] = [
  { degree: 'I', degreeNum: 1, intervals: [0, 4, 7, 11, 14, 17, 21], nextChordIdxs: [1, 2, 3, 4, 5, 6] },      // Imaj13
  { degree: 'ii', degreeNum: 2, intervals: [0, 3, 7, 10, 14, 17, 21], nextChordIdxs: [2, 4, 6] },              // ii13
  { degree: 'iii', degreeNum: 3, intervals: [0, 3, 7, 10, 13, 17, 20], nextChordIdxs: [3, 5] },                // iii13
  { degree: 'IV', degreeNum: 4, intervals: [0, 4, 7, 11, 14, 18, 21], nextChordIdxs: [1, 4] },                 // IVmaj13
  { degree: 'V', degreeNum: 5, intervals: [0, 4, 7, 10, 14, 17, 21], nextChordIdxs: [0, 2, 5] },               // V13
  { degree: 'vi', degreeNum: 6, intervals: [0, 3, 7, 10, 14, 17, 20], nextChordIdxs: [1, 3] },                 // vi13
  { degree: 'vii°', degreeNum: 7, intervals: [0, 3, 6, 10, 13, 17, 20], nextChordIdxs: [0, 2] },               // viiø13
];

export class Chord {
  degree: string;
  degreeNum: number;
  intervals: number[];
  nextChordIdxs: number[];
  semitoneDist: number;

  constructor(degree: string, degreeNum: number, intervals: number[], nextChordIdxs: number[]) {
    this.degree = degree;
    this.degreeNum = degreeNum;
    this.intervals = [...intervals];
    this.nextChordIdxs = [...nextChordIdxs];
    // Calculate semitone distance from root based on scale degree
    this.semitoneDist = SINGLE_OCTAVE[degreeNum - 1];
  }

  nextChordIdx(): number {
    return this.nextChordIdxs[Math.floor(Math.random() * this.nextChordIdxs.length)];
  }

  /**
   * Generate a voicing with proper octave spreading (matching lofi-engine)
   * This ensures notes ascend properly for a fuller, more musical sound
   */
  generateVoicing(size: number): number[] {
    if (size < 3) {
      return this.intervals.slice(0, 3);
    }

    // Take intervals starting from the 3rd (skip root for voicing variety)
    const voicing = this.intervals.slice(1, size);

    // Shuffle for variety
    voicing.sort(() => Math.random() - 0.5);

    // Ensure ascending voicing by adding octaves where needed
    for (let i = 1; i < voicing.length; i++) {
      while (voicing[i] < voicing[i - 1]) {
        voicing[i] += 12;
      }
    }

    // Add root at the bottom
    voicing.unshift(0);

    return voicing;
  }

  /**
   * Generate mode intervals for the chord (used for modal melody)
   */
  generateMode(): number[] {
    return this.intervals.map(n => n >= 12 ? n - 12 : n);
  }
}

export class ChordProgression {
  static generate(length: number): Chord[] {
    if (length < 2) return [];

    const progression: Chord[] = [];
    let chordDef = CHORD_DEFS[Math.floor(Math.random() * CHORD_DEFS.length)];

    for (let i = 0; i < length; i++) {
      progression.push(new Chord(
        chordDef.degree,
        chordDef.degreeNum,
        [...chordDef.intervals],
        [...chordDef.nextChordIdxs]
      ));

      const nextIdx = chordDef.nextChordIdxs[Math.floor(Math.random() * chordDef.nextChordIdxs.length)];
      chordDef = CHORD_DEFS[nextIdx];
    }

    return progression;
  }
}

export function getRandomKey(): string {
  return KEYS[Math.floor(Math.random() * KEYS.length)];
}
