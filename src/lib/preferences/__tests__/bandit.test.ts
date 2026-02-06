import { describe, it, expect } from 'vitest';
import { sampleBeta, selectArm, updateArmDist } from '../bandit';
import { ArmDistribution } from '../types';

describe('sampleBeta', () => {
  it('returns values between 0 and 1', () => {
    for (let i = 0; i < 100; i++) {
      const val = sampleBeta(1, 1);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('high alpha skews toward 1', () => {
    const samples = Array.from({ length: 500 }, () => sampleBeta(50, 1));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeGreaterThan(0.8);
  });

  it('high beta skews toward 0', () => {
    const samples = Array.from({ length: 500 }, () => sampleBeta(1, 50));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeLessThan(0.2);
  });

  it('equal alpha/beta centers around 0.5', () => {
    const samples = Array.from({ length: 500 }, () => sampleBeta(10, 10));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeGreaterThan(0.35);
    expect(mean).toBeLessThan(0.65);
  });
});

describe('selectArm', () => {
  const arms: Record<string, ArmDistribution> = {
    a: { alpha: 50, beta: 1 },
    b: { alpha: 1, beta: 50 },
    c: { alpha: 1, beta: 1 },
  };

  it('exploits best arm when explorationBias is 0', () => {
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 100; i++) {
      const arm = selectArm(arms, undefined, 0);
      counts[arm]++;
    }
    // Arm 'a' has highest mean (50/51 ≈ 0.98), should always be selected
    expect(counts.a).toBe(100);
  });

  it('explores randomly when explorationBias is 1', () => {
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 300; i++) {
      const arm = selectArm(arms, undefined, 1);
      counts[arm]++;
    }
    // Each arm should be selected roughly equally
    expect(counts.a).toBeGreaterThan(30);
    expect(counts.b).toBeGreaterThan(30);
    expect(counts.c).toBeGreaterThan(30);
  });

  it('respects allowedArms filter', () => {
    for (let i = 0; i < 50; i++) {
      const arm = selectArm(arms, ['b', 'c'], 0.5);
      expect(['b', 'c']).toContain(arm);
    }
  });

  it('throws when no allowed arms match', () => {
    expect(() => selectArm(arms, ['x' as 'a'], 0.5)).toThrow('No allowed arms found');
  });
});

describe('updateArmDist', () => {
  it('increases alpha for positive reward', () => {
    const dist: ArmDistribution = { alpha: 1, beta: 1 };
    const updated = updateArmDist(dist, 1.0);
    expect(updated.alpha).toBe(2.0);
    expect(updated.beta).toBe(1);
  });

  it('increases beta for negative reward', () => {
    const dist: ArmDistribution = { alpha: 1, beta: 1 };
    const updated = updateArmDist(dist, -1.5);
    expect(updated.alpha).toBe(1);
    expect(updated.beta).toBe(2.5);
  });

  it('does not modify original distribution', () => {
    const dist: ArmDistribution = { alpha: 5, beta: 3 };
    const updated = updateArmDist(dist, 1.0);
    expect(dist.alpha).toBe(5);
    expect(updated.alpha).toBe(6);
  });

  it('handles zero reward (no change)', () => {
    const dist: ArmDistribution = { alpha: 5, beta: 3 };
    const updated = updateArmDist(dist, 0);
    expect(updated.alpha).toBe(5);
    expect(updated.beta).toBe(3);
  });
});
