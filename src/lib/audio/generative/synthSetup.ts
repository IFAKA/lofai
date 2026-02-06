import * as Tone from 'tone';

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

export async function createSynthResources(onSampleError: (msg: string) => void): Promise<SynthResources> {
  const compressor = new Tone.Compressor({
    threshold: -6,
    ratio: 3,
    attack: 0.5,
    release: 0.1,
  });

  const masterFilter = new Tone.Filter(2000, 'lowpass');
  const masterVol = new Tone.Volume(0);

  Tone.getDestination().chain(compressor, masterFilter, masterVol);

  const pianoFilter = new Tone.Filter(1000, 'lowpass');
  const stereoWidener = new Tone.StereoWidener(0.5);

  const noiseFilter = new Tone.Filter(2000, 'lowshelf');
  const noiseVol = new Tone.Volume(-32);
  const noise = new Tone.Noise('pink');
  noise.chain(noiseFilter, noiseVol, Tone.getDestination());

  const [piano, drums] = await Promise.all([
    loadPiano(pianoFilter, stereoWidener, onSampleError),
    loadDrums(),
  ]);

  return {
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

function loadDrums(): Promise<{ kick: Tone.Sampler; snare: Tone.Sampler; hat: Tone.Sampler }> {
  return new Promise((resolve) => {
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded >= 3) resolve({ kick, snare, hat });
    };

    const kick = new Tone.Sampler({
      urls: { C4: `${SAMPLES_PATH}/drums/kick.mp3` },
      onload: checkLoaded,
    }).toDestination();

    const snare = new Tone.Sampler({
      urls: { C4: `${SAMPLES_PATH}/drums/snare.mp3` },
      volume: -4,
      onload: checkLoaded,
    }).toDestination();

    const hat = new Tone.Sampler({
      urls: { C4: `${SAMPLES_PATH}/drums/hat.mp3` },
      volume: -6,
      onload: checkLoaded,
    }).toDestination();
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
