import { describe, it, expect } from 'vitest';
import {
  computeTempoParams,
  computeEnergyParams,
  computeDanceabilityParams,
  computeValenceParams,
} from '../paramApplicator';

describe('computeTempoParams', () => {
  it('returns BPM within focus range (doubled for swing)', () => {
    for (let i = 0; i < 20; i++) {
      const { bpm } = computeTempoParams('focus');
      // Focus range is 60-72, doubled = 120-144
      expect(bpm).toBeGreaterThanOrEqual(120);
      expect(bpm).toBeLessThanOrEqual(144);
    }
  });

  it('returns BPM within 90-100 range (doubled for swing)', () => {
    for (let i = 0; i < 20; i++) {
      const { bpm } = computeTempoParams('90-100');
      // 90-100 range is 94-102, doubled = 188-204
      expect(bpm).toBeGreaterThanOrEqual(188);
      expect(bpm).toBeLessThanOrEqual(204);
    }
  });

  it('returns integer BPM', () => {
    const { bpm } = computeTempoParams('70-80');
    expect(Number.isInteger(bpm)).toBe(true);
  });
});

describe('computeEnergyParams', () => {
  it('low energy has low density and velocity', () => {
    const result = computeEnergyParams('low');
    expect(result.melodyDensity).toBe(0.3);
    expect(result.velocity).toBe(0.6);
    expect(result.kickOff).toBe(true); // instruments < 3
    expect(result.snareOff).toBe(true); // instruments < 4
  });

  it('medium energy enables kick', () => {
    const result = computeEnergyParams('medium');
    expect(result.melodyDensity).toBe(0.5);
    expect(result.velocity).toBe(0.75);
    expect(result.kickOff).toBe(false); // instruments >= 3
    expect(result.snareOff).toBe(true); // instruments < 4
  });

  it('high energy enables all instruments', () => {
    const result = computeEnergyParams('high');
    expect(result.melodyDensity).toBe(0.7);
    expect(result.velocity).toBe(0.9);
    expect(result.kickOff).toBe(false); // instruments >= 3
    expect(result.snareOff).toBe(false); // instruments >= 4
  });
});

describe('computeDanceabilityParams', () => {
  it('chill has lowest swing and emphasis', () => {
    const result = computeDanceabilityParams('chill');
    expect(result.swing).toBe(0.45);
    expect(result.kickEmphasis).toBe(0.5);
    expect(result.hihatActivity).toBe(0.3);
  });

  it('groovy is in the middle', () => {
    const result = computeDanceabilityParams('groovy');
    expect(result.swing).toBe(0.55);
    expect(result.kickEmphasis).toBe(0.65);
    expect(result.hihatActivity).toBe(0.5);
  });

  it('bouncy has highest values', () => {
    const result = computeDanceabilityParams('bouncy');
    expect(result.swing).toBe(0.65);
    expect(result.kickEmphasis).toBe(0.8);
    expect(result.hihatActivity).toBe(0.7);
  });
});

describe('computeValenceParams', () => {
  it('sad prefers minor', () => {
    expect(computeValenceParams('sad').preferMinor).toBe(true);
  });

  it('neutral uses major', () => {
    expect(computeValenceParams('neutral').preferMinor).toBe(false);
  });

  it('happy uses major', () => {
    expect(computeValenceParams('happy').preferMinor).toBe(false);
  });
});
