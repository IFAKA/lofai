import { describe, it, expect } from 'vitest';
import { GENRE_CONFIGS, GENRE_IDS, getGenreConfig, type GenreId } from '../genreConfig';

describe('genreConfig', () => {
  it('has lofi genre', () => {
    expect(GENRE_IDS).toEqual(['lofi']);
    expect(Object.keys(GENRE_CONFIGS)).toHaveLength(1);
  });

  it('getGenreConfig returns correct config for each genre', () => {
    for (const id of GENRE_IDS) {
      const config = getGenreConfig(id);
      expect(config.id).toBe(id);
      expect(config.label).toBeTruthy();
    }
  });

  describe.each(GENRE_IDS)('genre: %s', (genreId) => {
    const config = getGenreConfig(genreId as GenreId);

    it('has valid tempo config', () => {
      const { tempo } = config;
      expect(tempo.multiplier).toBeGreaterThan(0);
      expect(Object.keys(tempo.ranges)).toHaveLength(5);
      for (const [arm, range] of Object.entries(tempo.ranges)) {
        expect(range.min).toBeLessThan(range.max);
        expect(range.min).toBeGreaterThan(0);
        expect(tempo.armLabels[arm as keyof typeof tempo.armLabels]).toBeTruthy();
      }
    });

    it('has valid synth config', () => {
      const { synth } = config;
      expect(synth.pianoFilterFreq).toBeGreaterThan(0);
      expect(synth.masterFilterFreq).toBeGreaterThan(0);
      expect(synth.compressor.threshold).toBeLessThan(0);
      expect(synth.compressor.ratio).toBeGreaterThan(1);
      expect(synth.stereoWidth).toBeGreaterThanOrEqual(0);
      expect(synth.stereoWidth).toBeLessThanOrEqual(1);
    });

    it('has valid chord config', () => {
      const { chords } = config;
      expect(chords.voicingSize).toBeGreaterThanOrEqual(3);
      expect(chords.voicingSize).toBeLessThanOrEqual(7);
      expect(chords.progressionLength).toBeGreaterThanOrEqual(2);
    });

    it('has valid melody config', () => {
      const { melody } = config;
      expect(melody.densityRange[0]).toBeLessThan(melody.densityRange[1]);
      expect(melody.densityRange[0]).toBeGreaterThanOrEqual(0);
      expect(melody.densityRange[1]).toBeLessThanOrEqual(1);
      expect(['4n', '8n', '16n']).toContain(melody.subdivision);
      expect(melody.scaleRange).toBeGreaterThan(0);
    });

    it('has valid drum config', () => {
      const { drums } = config;
      expect(drums.velocityMultiplier).toBeGreaterThan(0);
      for (const level of ['chill', 'groovy', 'bouncy'] as const) {
        const pattern = drums.patterns[level];
        expect(pattern.kick.length).toBeGreaterThan(0);
        expect(pattern.snare.length).toBeGreaterThan(0);
        expect(pattern.hat.length).toBeGreaterThan(0);
        expect(pattern.subdivision).toBeTruthy();
      }
    });

    it('has valid engine config', () => {
      const { engine: eng } = config;
      expect(eng.defaultBpm).toBeGreaterThan(0);
      expect(eng.sectionLengths.length).toBeGreaterThan(0);
      expect(eng.swing[0]).toBeLessThanOrEqual(eng.swing[1]);
      expect(eng.transitionFilterSweep.downFreq).toBeGreaterThan(0);
      expect(eng.transitionFilterSweep.upFreq).toBeGreaterThan(eng.transitionFilterSweep.downFreq);
    });

    it('has valid bandit defaults', () => {
      const armState = config.banditDefaults.createDefaultArmState();
      expect(Object.keys(armState.tempo)).toHaveLength(5);
      expect(Object.keys(armState.energy)).toHaveLength(3);
      expect(Object.keys(armState.valence)).toHaveLength(3);
      expect(Object.keys(armState.danceability)).toHaveLength(3);
      expect(Object.keys(armState.mode)).toHaveLength(2);

      // All distributions should have positive alpha and beta
      for (const dim of Object.values(armState)) {
        for (const dist of Object.values(dim as Record<string, { alpha: number; beta: number }>)) {
          expect(dist.alpha).toBeGreaterThan(0);
          expect(dist.beta).toBeGreaterThan(0);
        }
      }
    });

    it('has valid BPM slider range', () => {
      expect(config.bpmSliderRange.min).toBeLessThan(config.bpmSliderRange.max);
      expect(config.bpmSliderRange.min).toBeGreaterThan(0);
    });
  });

  it('lofi config matches original hardcoded values', () => {
    const lofi = getGenreConfig('lofi');
    expect(lofi.tempo.multiplier).toBe(2);
    expect(lofi.synth.pianoFilterFreq).toBe(1000);
    expect(lofi.synth.masterFilterFreq).toBe(2000);
    expect(lofi.engine.defaultBpm).toBe(156);
    expect(lofi.chords.voicingSize).toBe(4);
    expect(lofi.melody.subdivision).toBe('8n');
  });

  describe('drum sample config', () => {
    it('lofi has drumSamples defined', () => {
      const config = getGenreConfig('lofi');
      expect(config.synth.drumSamples).toBeDefined();
      expect(config.synth.drumSamples!.path).toBeTruthy();
    });

    it('lofi has no drum effects', () => {
      const lofi = getGenreConfig('lofi');
      expect(lofi.synth.drumSamples!.effects).toBeUndefined();
    });
  });
});
