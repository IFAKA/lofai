import * as Tone from 'tone';

export interface LofiChainConfig {
  lpfFrequency?: number;
}

/**
 * Clean master chain optimized for sample-based playback.
 *
 * Signal: Input → HPF (30Hz) → Compressor → LPF → Limiter → Output
 *
 * Matches lofi-engine's minimal processing approach for cleaner sound.
 * No bitcrusher, saturation, or reverb - lets samples speak naturally.
 */
export function createLofiChain(config: LofiChainConfig = {}) {
  const { lpfFrequency = 2000 } = config;

  const input = new Tone.Gain(1);

  const hpf = new Tone.Filter({
    frequency: 30,
    type: 'highpass',
    rolloff: -12,
  });

  const compressor = new Tone.Compressor({
    threshold: -6,
    ratio: 3,
    attack: 0.5,
    release: 0.1,
  });

  const masterLpf = new Tone.Filter({
    frequency: lpfFrequency,
    type: 'lowpass',
    rolloff: -12,
  });

  const limiter = new Tone.Limiter(-1);
  const output = new Tone.Gain(1);

  input.connect(hpf);
  hpf.connect(compressor);
  compressor.connect(masterLpf);
  masterLpf.connect(limiter);
  limiter.connect(output);

  return {
    input,
    output,
    hpf,
    compressor,
    masterLpf,
    limiter,
    setLpfFrequency: (freq: number) => {
      masterLpf.frequency.value = freq;
    },
    dispose: () => {
      input.dispose();
      hpf.dispose();
      compressor.dispose();
      masterLpf.dispose();
      limiter.dispose();
      output.dispose();
    },
  };
}

export type LofiChain = ReturnType<typeof createLofiChain>;
