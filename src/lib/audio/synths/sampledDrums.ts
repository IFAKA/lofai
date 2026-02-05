import * as Tone from 'tone';
import { getDrumSamplerUrls } from '../sampleLoader';

export interface DrumHumanizationConfig {
  velocityVariation: number;
  timingVariation: number;
  noteSkipChance: number;
}

export const DEFAULT_DRUM_HUMANIZATION: DrumHumanizationConfig = {
  velocityVariation: 0.1,
  timingVariation: 0,
  noteSkipChance: 0,
};

export interface SampledDrumsConfig {
  kickVolume: number;
  snareVolume: number;
  hihatVolume: number;
}

export async function createSampledDrums(
  config: SampledDrumsConfig = { kickVolume: -3, snareVolume: -6, hihatVolume: -9 },
  humanization: Partial<DrumHumanizationConfig> = {}
): Promise<ReturnType<typeof createSampledDrumsSync>> {
  const urls = getDrumSamplerUrls();

  const kickSampler = new Tone.Sampler({ urls: { C4: urls.kick } });
  const snareSampler = new Tone.Sampler({ urls: { C4: urls.snare } });
  const hihatSampler = new Tone.Sampler({ urls: { C4: urls.hihat } });

  await Tone.loaded();

  return createSampledDrumsSync(config, humanization, { kick: kickSampler, snare: snareSampler, hihat: hihatSampler });
}

function createSampledDrumsSync(
  config: SampledDrumsConfig,
  humanizationOverrides: Partial<DrumHumanizationConfig>,
  samplers: { kick: Tone.Sampler; snare: Tone.Sampler; hihat: Tone.Sampler }
) {
  const humanization = { ...DEFAULT_DRUM_HUMANIZATION, ...humanizationOverrides };

  const humanizeVelocity = (velocity: number): number => {
    const variation = (Math.random() * 2 - 1) * humanization.velocityVariation;
    return Math.max(0.1, Math.min(1, velocity + (velocity * variation)));
  };

  const humanizeTiming = (): number => {
    return (Math.random() * 2 - 1) * humanization.timingVariation;
  };

  const shouldSkipNote = (): boolean => {
    return Math.random() < humanization.noteSkipChance;
  };

  const getLayerGain = (velocity: number): number => {
    return velocity < 0.5 ? 0.5 : 1;
  };

  const kickHpf = new Tone.Filter({
    frequency: 30,
    type: 'highpass',
    rolloff: -12,
  });
  const kickLpf = new Tone.Filter({
    frequency: 5000,
    type: 'lowpass',
    rolloff: -12,
  });
  const kickVol = new Tone.Volume(config.kickVolume);
  samplers.kick.chain(kickHpf, kickLpf, kickVol);

  // HPF at 100Hz removes mud
  const snareHpf = new Tone.Filter({
    frequency: 100,
    type: 'highpass',
    rolloff: -12,
  });
  // LPF at 6kHz - keeps snap but removes harsh upper frequencies
  const snareLpf = new Tone.Filter({
    frequency: 6000,
    type: 'lowpass',
    rolloff: -12,
  });
  const snareChorus = new Tone.Chorus({
    frequency: 0.5,
    delayTime: 3,
    depth: 0.2,
    wet: 0.15,
  }).start();
  const snareVol = new Tone.Volume(config.snareVolume);
  const snareStereo = new Tone.StereoWidener(0.3);
  samplers.snare.chain(snareHpf, snareLpf, snareChorus, snareVol, snareStereo);

  // HPF at 300Hz removes low-end bleed
  const hihatHpf = new Tone.Filter({
    frequency: 300,
    type: 'highpass',
    rolloff: -12,
  });
  // LPF at 5kHz - ADHD-optimized: removes harsh 6-12kHz frequencies that cause ear fatigue
  // Research: roll off above 8kHz for lofi, harsh zone is 3-6kHz
  const hihatLpf = new Tone.Filter({
    frequency: 5000,
    type: 'lowpass',
    rolloff: -12,
  });
  const hihatChorus = new Tone.Chorus({
    frequency: 0.5,
    delayTime: 2,
    depth: 0.15,
    wet: 0.1,
  }).start();
  const hihatVol = new Tone.Volume(config.hihatVolume);
  const hihatStereo = new Tone.StereoWidener(0.25);
  samplers.hihat.chain(hihatHpf, hihatLpf, hihatChorus, hihatVol, hihatStereo);

  const lfo = new Tone.LFO({
    frequency: 0.08,
    min: -0.5,
    max: 0.5,
    type: 'sine',
  }).start();
  const panner = new Tone.Panner(0);
  lfo.connect(panner.pan);

  const preBus = new Tone.Gain(1);
  const output = new Tone.Gain(1);
  kickVol.connect(preBus);
  snareStereo.connect(preBus);
  hihatStereo.connect(preBus);
  preBus.connect(panner);
  panner.connect(output);

  return {
    kick: samplers.kick,
    snare: samplers.snare,
    hihat: samplers.hihat,
    output,

    triggerKick: (time?: Tone.Unit.Time, velocity?: number) => {
      if (shouldSkipNote()) return;

      const baseVelocity = velocity ?? 0.9;
      const humanizedVelocity = humanizeVelocity(baseVelocity);
      const layerGain = getLayerGain(humanizedVelocity);
      const finalVelocity = humanizedVelocity * layerGain;

      const timingOffset = humanizeTiming();
      const adjustedTime = time !== undefined
        ? Tone.Time(time).toSeconds() + timingOffset
        : Tone.now() + timingOffset;

      samplers.kick.triggerAttack('C4', adjustedTime, finalVelocity);
    },

    triggerSnare: (time?: Tone.Unit.Time, velocity?: number) => {
      if (shouldSkipNote()) return;

      const baseVelocity = velocity ?? 0.8;
      const humanizedVelocity = humanizeVelocity(baseVelocity);
      const layerGain = getLayerGain(humanizedVelocity);
      const finalVelocity = humanizedVelocity * layerGain;

      const timingOffset = humanizeTiming();
      const adjustedTime = time !== undefined
        ? Tone.Time(time).toSeconds() + timingOffset
        : Tone.now() + timingOffset;

      samplers.snare.triggerAttack('C4', adjustedTime, finalVelocity);
    },

    triggerHihat: (time?: Tone.Unit.Time, velocity?: number) => {
      if (shouldSkipNote()) return;

      const baseVelocity = velocity ?? 0.6;
      const humanizedVelocity = humanizeVelocity(baseVelocity);
      const layerGain = getLayerGain(humanizedVelocity);
      const finalVelocity = humanizedVelocity * layerGain;

      const timingOffset = humanizeTiming();
      const adjustedTime = time !== undefined
        ? Tone.Time(time).toSeconds() + timingOffset
        : Tone.now() + timingOffset;

      samplers.hihat.triggerAttack('C4', adjustedTime, finalVelocity);
    },

    dispose: () => {
      samplers.kick.dispose();
      samplers.snare.dispose();
      samplers.hihat.dispose();
      kickHpf.dispose();
      kickLpf.dispose();
      kickVol.dispose();
      snareHpf.dispose();
      snareLpf.dispose();
      snareChorus.dispose();
      snareVol.dispose();
      snareStereo.dispose();
      hihatHpf.dispose();
      hihatLpf.dispose();
      hihatChorus.dispose();
      hihatVol.dispose();
      hihatStereo.dispose();
      lfo.dispose();
      panner.dispose();
      preBus.dispose();
      output.dispose();
    },
  };
}

export type SampledDrums = Awaited<ReturnType<typeof createSampledDrums>>;
