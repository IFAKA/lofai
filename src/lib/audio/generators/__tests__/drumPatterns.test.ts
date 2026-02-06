import { describe, it, expect } from 'vitest';
import { generateDrumPattern, extendPattern } from '../drumPatterns';

describe('generateDrumPattern', () => {
  it('returns a pattern for chill danceability', () => {
    const pattern = generateDrumPattern('chill', 'low');
    expect(pattern.name).toMatch(/chill/);
    expect(pattern.hits.length).toBeGreaterThan(0);
    expect(pattern.lengthBars).toBe(1);
  });

  it('returns a pattern for groovy danceability', () => {
    const pattern = generateDrumPattern('groovy', 'medium');
    expect(pattern.name).toMatch(/groovy/);
    expect(pattern.hits.length).toBeGreaterThan(0);
  });

  it('returns a pattern for bouncy danceability', () => {
    const pattern = generateDrumPattern('bouncy', 'high');
    expect(pattern.name).toMatch(/bouncy/);
    expect(pattern.hits.length).toBeGreaterThan(0);
  });

  it('scales velocity by energy level', () => {
    const lowPattern = generateDrumPattern('groovy', 'low');
    const highPattern = generateDrumPattern('groovy', 'high');

    const lowKickVel = lowPattern.hits.find(h => h.type === 'kick')?.velocity ?? 0;
    const highKickVel = highPattern.hits.find(h => h.type === 'kick')?.velocity ?? 0;

    // Low energy velocity multiplier is 0.75, high is 1.0
    expect(lowKickVel).toBeLessThanOrEqual(highKickVel);
  });

  it('always includes kick and snare hits', () => {
    const pattern = generateDrumPattern('chill', 'medium');
    const types = new Set(pattern.hits.map(h => h.type));
    expect(types.has('kick')).toBe(true);
    expect(types.has('snare')).toBe(true);
  });

  it('hit times have format bar:quarter:sixteenth', () => {
    const pattern = generateDrumPattern('chill', 'low');
    for (const hit of pattern.hits) {
      expect(hit.time).toMatch(/^\d+:\d+:\d+$/);
    }
  });
});

describe('extendPattern', () => {
  it('extends pattern to specified bars', () => {
    const base = generateDrumPattern('chill', 'low');
    const extended = extendPattern(base, 4);
    expect(extended.lengthBars).toBe(4);
    expect(extended.hits.length).toBe(base.hits.length * 4);
  });

  it('adjusts bar numbers in hit times', () => {
    const base = generateDrumPattern('chill', 'low');
    const extended = extendPattern(base, 3);

    const bars = extended.hits.map(h => parseInt(h.time.split(':')[0], 10));
    expect(Math.max(...bars)).toBe(2); // 0-indexed: bars 0, 1, 2
  });

  it('preserves hit types and velocities', () => {
    const base = generateDrumPattern('groovy', 'medium');
    const extended = extendPattern(base, 2);

    // First bar should match base exactly
    const firstBarHits = extended.hits.filter(h => h.time.startsWith('0:'));
    expect(firstBarHits.length).toBe(base.hits.length);
    for (let i = 0; i < firstBarHits.length; i++) {
      expect(firstBarHits[i].type).toBe(base.hits[i].type);
      expect(firstBarHits[i].velocity).toBe(base.hits[i].velocity);
    }
  });
});
