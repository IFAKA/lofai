import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDefaultArmState } from '../types';

const mockSaveArmState = vi.fn().mockResolvedValue(undefined);

vi.mock('../storage', () => ({
  saveArmState: (...args: unknown[]) => mockSaveArmState(...args),
}));

describe('applyWarmStart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('boosts slower tempo arms (focus and 60-70)', async () => {
    const { applyWarmStart } = await import('../warmStart');
    await applyWarmStart({ tempo: 'slower', energy: 'chill' });

    const savedState = mockSaveArmState.mock.calls[0][0];
    const defaults = createDefaultArmState();

    expect(savedState.tempo['focus'].alpha).toBeGreaterThan(defaults.tempo['focus'].alpha);
    expect(savedState.tempo['60-70'].alpha).toBeGreaterThan(defaults.tempo['60-70'].alpha);
    // Other tempo arms should not be boosted
    expect(savedState.tempo['90-100'].alpha).toBe(defaults.tempo['90-100'].alpha);
  });

  it('boosts faster tempo arms (90-100 and 80-90)', async () => {
    const { applyWarmStart } = await import('../warmStart');
    await applyWarmStart({ tempo: 'faster', energy: 'chill' });

    const savedState = mockSaveArmState.mock.calls[0][0];
    const defaults = createDefaultArmState();

    expect(savedState.tempo['90-100'].alpha).toBeGreaterThan(defaults.tempo['90-100'].alpha);
    expect(savedState.tempo['80-90'].alpha).toBeGreaterThan(defaults.tempo['80-90'].alpha);
    expect(savedState.tempo['focus'].alpha).toBe(defaults.tempo['focus'].alpha);
  });

  it('boosts chill energy and danceability', async () => {
    const { applyWarmStart } = await import('../warmStart');
    await applyWarmStart({ tempo: 'slower', energy: 'chill' });

    const savedState = mockSaveArmState.mock.calls[0][0];
    const defaults = createDefaultArmState();

    expect(savedState.energy.low.alpha).toBeGreaterThan(defaults.energy.low.alpha);
    expect(savedState.danceability.chill.alpha).toBeGreaterThan(defaults.danceability.chill.alpha);
    // Energetic arms should not be boosted
    expect(savedState.energy.high.alpha).toBe(defaults.energy.high.alpha);
  });

  it('boosts energetic energy and danceability', async () => {
    const { applyWarmStart } = await import('../warmStart');
    await applyWarmStart({ tempo: 'slower', energy: 'energetic' });

    const savedState = mockSaveArmState.mock.calls[0][0];
    const defaults = createDefaultArmState();

    expect(savedState.energy.high.alpha).toBeGreaterThan(defaults.energy.high.alpha);
    expect(savedState.danceability.groovy.alpha).toBeGreaterThan(defaults.danceability.groovy.alpha);
    expect(savedState.danceability.bouncy.alpha).toBeGreaterThan(defaults.danceability.bouncy.alpha);
  });

  it('calls saveArmState exactly once', async () => {
    const { applyWarmStart } = await import('../warmStart');
    await applyWarmStart({ tempo: 'slower', energy: 'chill' });

    expect(mockSaveArmState).toHaveBeenCalledTimes(1);
  });
});
