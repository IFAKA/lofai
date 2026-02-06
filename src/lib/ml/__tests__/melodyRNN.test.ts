import { describe, it, expect } from 'vitest';
import { convertToToneNotes } from '../melodyRNN';

describe('convertToToneNotes', () => {
  const makeSequence = (notes: Array<{
    pitch: number;
    quantizedStartStep: number;
    quantizedEndStep: number;
    velocity?: number;
  }>) => ({
    quantizationInfo: { stepsPerQuarter: 4 },
    notes,
    totalQuantizedSteps: notes.length > 0
      ? Math.max(...notes.map(n => n.quantizedEndStep))
      : 0,
  });

  it('converts MIDI pitch to note name correctly', () => {
    const seq = makeSequence([
      { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 4 },  // C4
      { pitch: 69, quantizedStartStep: 4, quantizedEndStep: 8 },  // A4
      { pitch: 72, quantizedStartStep: 8, quantizedEndStep: 12 }, // C5
    ]);

    const notes = convertToToneNotes(seq, 120);
    expect(notes[0].note).toBe('C4');
    expect(notes[1].note).toBe('A4');
    expect(notes[2].note).toBe('C5');
  });

  it('formats time as bars:beats:sixteenths', () => {
    const seq = makeSequence([
      { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 4 },   // 0:0:0
      { pitch: 64, quantizedStartStep: 4, quantizedEndStep: 8 },   // 0:1:0
      { pitch: 67, quantizedStartStep: 16, quantizedEndStep: 20 }, // 1:0:0
    ]);

    const notes = convertToToneNotes(seq, 120);
    expect(notes[0].time).toBe('0:0:0');
    expect(notes[1].time).toBe('0:1:0');
    expect(notes[2].time).toBe('1:0:0');
  });

  it('calculates duration in seconds', () => {
    const bpm = 120;
    const stepsPerQuarter = 4;
    const secondsPerStep = 60 / bpm / stepsPerQuarter; // 0.125s

    const seq = makeSequence([
      { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 4 }, // 4 steps = 0.5s
    ]);

    const notes = convertToToneNotes(seq, bpm);
    const expectedDuration = 4 * secondsPerStep;
    expect(notes[0].duration).toBe(`${expectedDuration}s`);
  });

  it('normalizes velocity from 0-127 to 0-1', () => {
    const seq = makeSequence([
      { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 4, velocity: 127 },
      { pitch: 64, quantizedStartStep: 4, quantizedEndStep: 8, velocity: 64 },
    ]);

    const notes = convertToToneNotes(seq, 120);
    expect(notes[0].velocity).toBeCloseTo(1.0, 1);
    expect(notes[1].velocity).toBeCloseTo(64 / 127, 2);
  });

  it('uses default velocity 0.7 when not provided', () => {
    const seq = makeSequence([
      { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 4 },
    ]);

    const notes = convertToToneNotes(seq, 120);
    expect(notes[0].velocity).toBe(0.7);
  });

  it('throws when sequence has no notes', () => {
    const seq = { quantizationInfo: { stepsPerQuarter: 4 }, notes: [], totalQuantizedSteps: 0 };
    expect(() => convertToToneNotes(seq, 120)).toThrow('Sequence has no notes');
  });

  it('throws when sequence missing quantization info', () => {
    const seq = { notes: [{ pitch: 60, quantizedStartStep: 0, quantizedEndStep: 4 }] };
    expect(() => convertToToneNotes(seq, 120)).toThrow('Sequence missing quantization info');
  });

  it('throws for invalid MIDI pitch', () => {
    const seq = makeSequence([
      { pitch: 200, quantizedStartStep: 0, quantizedEndStep: 4 },
    ]);
    expect(() => convertToToneNotes(seq, 120)).toThrow('Invalid MIDI pitch');
  });
});
