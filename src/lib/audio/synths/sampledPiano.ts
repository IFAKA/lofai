import * as Tone from 'tone';
import { getPianoSamplerUrls, type VelocityLayer } from '../sampleLoader';

export interface SampledPianoConfig {
  velocity: number;
  release: number;
}

export interface HumanizationConfig {
  velocityVariation: number;
  timingVariation: number;
  noteSkipChance: number;
  octaveShiftChance: number;
}

const DEFAULT_HUMANIZATION: HumanizationConfig = {
  velocityVariation: 0.1,
  timingVariation: 0,
  noteSkipChance: 0,
  octaveShiftChance: 0,
};

interface SamplerSet {
  soft: Tone.Sampler;
  hard: Tone.Sampler;
}

export async function createSampledPiano(
  config: SampledPianoConfig = { velocity: 0.6, release: 1.5 },
  humanization: Partial<HumanizationConfig> = {}
): Promise<ReturnType<typeof createSampledPianoSync>> {
  const samplers = await loadSamplers();
  return createSampledPianoSync(config, humanization, samplers);
}

async function loadSamplers(): Promise<SamplerSet> {
  const createSampler = async (layer: VelocityLayer): Promise<Tone.Sampler> => {
    const sampler = new Tone.Sampler({
      urls: getPianoSamplerUrls(layer),
      release: 1.5,
      volume: -6,
    });

    await Tone.loaded();
    return sampler;
  };

  const [soft, hard] = await Promise.all([
    createSampler('soft'),
    createSampler('hard'),
  ]);

  return { soft, hard };
}

function createSampledPianoSync(
  config: SampledPianoConfig,
  humanizationOverrides: Partial<HumanizationConfig>,
  samplers: SamplerSet
) {
  const humanization = { ...DEFAULT_HUMANIZATION, ...humanizationOverrides };

  const highpass = new Tone.Filter({
    frequency: 80,
    type: 'highpass',
    rolloff: -12,
  });

  const lowpass = new Tone.Filter({
    frequency: 3800,
    type: 'lowpass',
    rolloff: -12,
  });

  const stereoWidener = new Tone.StereoWidener(0.4);

  samplers.soft.connect(highpass);
  samplers.hard.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(stereoWidener);

  const selectLayer = (velocity: number): Tone.Sampler => {
    return velocity < 0.5 ? samplers.soft : samplers.hard;
  };

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

  const maybeShiftOctave = (note: Tone.Unit.Frequency): Tone.Unit.Frequency => {
    if (Math.random() < humanization.octaveShiftChance) {
      const noteString = typeof note === 'string' ? note : String(note);
      const match = noteString.match(/^([A-Ga-g][#b]?)(\d+)$/);
      if (match) {
        const noteName = match[1];
        const octave = parseInt(match[2], 10);
        const shift = Math.random() > 0.5 ? 1 : -1;
        const newOctave = Math.max(2, Math.min(6, octave + shift));
        return `${noteName}${newOctave}` as Tone.Unit.Frequency;
      }
    }
    return note;
  };

  const processNotes = (notes: Tone.Unit.Frequency[]): Tone.Unit.Frequency[] => {
    return notes
      .filter(() => !shouldSkipNote())
      .map(note => maybeShiftOctave(note));
  };

  return {
    synth: samplers.hard,
    output: stereoWidener,
    velocity: config.velocity,

    triggerAttackRelease: (
      notes: Tone.Unit.Frequency | Tone.Unit.Frequency[],
      duration: Tone.Unit.Time,
      time?: Tone.Unit.Time,
      velocity?: number
    ) => {
      const baseVelocity = velocity ?? config.velocity;
      const humanizedVelocity = humanizeVelocity(baseVelocity);
      const sampler = selectLayer(humanizedVelocity);

      const timingOffset = humanizeTiming();
      const adjustedTime = time !== undefined
        ? Tone.Time(time).toSeconds() + timingOffset
        : Tone.now() + timingOffset;

      const noteArray = Array.isArray(notes) ? notes : [notes];
      const processedNotes = processNotes(noteArray);

      if (processedNotes.length > 0) {
        sampler.triggerAttackRelease(processedNotes, duration, adjustedTime, humanizedVelocity);
      }
    },

    dispose: () => {
      samplers.soft.dispose();
      samplers.hard.dispose();
      highpass.dispose();
      lowpass.dispose();
      stereoWidener.dispose();
    },
  };
}

export type SampledPiano = Awaited<ReturnType<typeof createSampledPiano>>;
