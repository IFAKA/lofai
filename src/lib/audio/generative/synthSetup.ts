import * as Tone from 'tone';
import type { SynthConfig, DrumSampleConfig } from './genreConfig';

const SAMPLES_PATH = '/samples/engine';

export interface SynthResources {
  piano: Tone.Sampler;
  kick: Tone.Sampler;
  snare: Tone.Sampler;
  hat: Tone.Sampler;
  noise: Tone.Noise;
  pianoFilter: Tone.Filter;
  stereoWidener: Tone.StereoWidener;
  noiseFilter: Tone.Filter;
  noiseVol: Tone.Volume;
  compressor: Tone.Compressor;
  masterFilter: Tone.Filter;
  masterVol: Tone.Volume;
}

// Default synth config matching original lo-fi hardcoded values
const DEFAULT_SYNTH_CONFIG: SynthConfig = {
  pianoFilterFreq: 1000,
  masterFilterFreq: 2000,
  compressor: { threshold: -6, ratio: 3, attack: 0.5, release: 0.1 },
  noiseDefaults: { type: 'pink', volume: 0.3 },
  stereoWidth: 0.5,
};

export async function createSynthResources(
  onSampleError: (msg: string) => void,
  synthConfig?: SynthConfig
): Promise<SynthResources> {
  const config = synthConfig ?? DEFAULT_SYNTH_CONFIG;

  const compressor = new Tone.Compressor({
    threshold: config.compressor.threshold,
    ratio: config.compressor.ratio,
    attack: config.compressor.attack,
    release: config.compressor.release,
  });

  const masterFilter = new Tone.Filter(config.masterFilterFreq, 'lowpass');
  const masterVol = new Tone.Volume(0);

  Tone.getDestination().chain(compressor, masterFilter, masterVol);

  const pianoFilter = new Tone.Filter(config.pianoFilterFreq, 'lowpass');
  const stereoWidener = new Tone.StereoWidener(config.stereoWidth);

  const noiseFilter = new Tone.Filter(2000, 'lowshelf');
  const noiseVol = new Tone.Volume(-32);
  const noise = new Tone.Noise(config.noiseDefaults.type);
  noise.chain(noiseFilter, noiseVol, Tone.getDestination());

  const [piano, drums] = await Promise.all([
    loadPiano(pianoFilter, stereoWidener, onSampleError),
    loadDrums(config.drumSamples),
  ]);

  const resources: SynthResources = {
    piano,
    kick: drums.kick,
    snare: drums.snare,
    hat: drums.hat,
    noise,
    pianoFilter,
    stereoWidener,
    noiseFilter,
    noiseVol,
    compressor,
    masterFilter,
    masterVol,
  };

  return resources;
}

function loadPiano(
  pianoFilter: Tone.Filter,
  stereoWidener: Tone.StereoWidener,
  onError: (msg: string) => void
): Promise<Tone.Sampler> {
  return new Promise((resolve) => {
    const urls: Record<string, string> = {};

    ['C', 'Dsharp', 'Fsharp', 'A'].forEach(note => {
      for (let octave = 1; octave <= 6; octave++) {
        const key = note === 'Dsharp' ? `D#${octave}` : note === 'Fsharp' ? `F#${octave}` : `${note}${octave}`;
        urls[key] = `${SAMPLES_PATH}/piano/${note}${octave}v1.mp3`;
      }
    });

    const piano = new Tone.Sampler({
      urls,
      baseUrl: '',
      onload: () => resolve(piano),
      onerror: (error) => {
        const msg = `Piano sample load failed: ${error instanceof Error ? error.message : error}`;
        console.error(`[SynthSetup] ${msg}`);
        onError(msg);
        resolve(piano);
      },
    });

    piano.chain(pianoFilter, stereoWidener, Tone.getDestination());
  });
}

interface DrumLoadResult {
  kick: Tone.Sampler;
  snare: Tone.Sampler;
  hat: Tone.Sampler;
}

function loadDrums(drumConfig?: DrumSampleConfig): Promise<DrumLoadResult> {
  return new Promise((resolve) => {
    const path = drumConfig?.path ?? 'drums';
    const kickVol = drumConfig?.kickVolume ?? 0;
    const snareVol = drumConfig?.snareVolume ?? -4;
    const hatVol = drumConfig?.hatVolume ?? -6;

    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded >= 3) resolve({ kick, snare, hat });
    };

    const kick = new Tone.Sampler({
      urls: { C4: `${SAMPLES_PATH}/${path}/kick.mp3` },
      volume: kickVol,
      onload: checkLoaded,
    });
    kick.toDestination();

    const snare = new Tone.Sampler({
      urls: { C4: `${SAMPLES_PATH}/${path}/snare.mp3` },
      volume: snareVol,
      onload: checkLoaded,
    });
    snare.toDestination();

    const hat = new Tone.Sampler({
      urls: { C4: `${SAMPLES_PATH}/${path}/hat.mp3` },
      volume: hatVol,
      onload: checkLoaded,
    });
    hat.toDestination();
  });
}

export function disposeSynthResources(resources: SynthResources): void {
  resources.piano.dispose();
  resources.kick.dispose();
  resources.snare.dispose();
  resources.hat.dispose();
  resources.noise.dispose();
  resources.pianoFilter.dispose();
  resources.stereoWidener.dispose();
  resources.noiseFilter.dispose();
  resources.noiseVol.dispose();
  resources.compressor.dispose();
  resources.masterFilter.dispose();
  resources.masterVol.dispose();
}
