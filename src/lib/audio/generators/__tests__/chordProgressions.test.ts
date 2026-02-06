import { describe, it, expect } from 'vitest';
import {
  generateChordProgression,
  getAvailableKeys,
  selectRandomKey,
} from '../chordProgressions';

describe('generateChordProgression', () => {
  it('generates progression of requested length', () => {
    const prog = generateChordProgression('C', 'major', 'neutral', 8);
    expect(prog).toHaveLength(8);
  });

  it('generates 4-bar progression by default when length < 8', () => {
    const prog = generateChordProgression('C', 'major', 'neutral', 4);
    expect(prog).toHaveLength(4);
  });

  it('each chord has root, type, notes, and duration', () => {
    const prog = generateChordProgression('C', 'major', 'neutral', 4);
    for (const chord of prog) {
      expect(chord).toHaveProperty('root');
      expect(chord).toHaveProperty('type');
      expect(chord).toHaveProperty('notes');
      expect(chord).toHaveProperty('duration');
      expect(Array.isArray(chord.notes)).toBe(true);
      expect(chord.notes.length).toBeGreaterThan(0);
    }
  });

  it('uses minor progressions for minor mode', () => {
    // Should not throw for minor
    const prog = generateChordProgression('A', 'minor', 'sad', 8);
    expect(prog).toHaveLength(8);
  });

  it('uses major progressions for major mode', () => {
    const prog = generateChordProgression('C', 'major', 'happy', 8);
    expect(prog).toHaveLength(8);
  });

  it('handles all available keys without errors', () => {
    const keys = getAvailableKeys();
    for (const key of keys) {
      expect(() => generateChordProgression(key, 'major', 'neutral', 4)).not.toThrow();
    }
  });
});

describe('getAvailableKeys', () => {
  it('returns all 12 note names', () => {
    const keys = getAvailableKeys();
    expect(keys).toHaveLength(12);
    expect(keys).toContain('C');
    expect(keys).toContain('F#');
  });
});

describe('selectRandomKey', () => {
  it('returns a valid note name', () => {
    const key = selectRandomKey();
    const allKeys = getAvailableKeys();
    expect(allKeys).toContain(key);
  });
});
