/**
 * Sample-Based Mixer Engine
 *
 * Simplified approach: Play pre-mixed loops as the primary music source,
 * with optional ambient layers. This ensures musical coherence since the
 * loops are complete tracks that were generated together.
 */

import * as Tone from 'tone';
import {
  SamplePack,
  SampleMetadata,
  LoadedSample,
  EnergyLevel,
  Mood,
} from './types';
import { SAMPLES_BASE_PATH, getSamplesByCategory } from './manifest';

// Crossfade duration in seconds
const CROSSFADE_DURATION = 3;

// Volume levels for each layer type
const LAYER_VOLUMES = {
  loop: 0,       // Main loop at 0dB
  ambient: -12,  // Ambient quieter but audible
};

interface ActiveLayer {
  sample: SampleMetadata;
  player: Tone.Player;
  gain: Tone.Gain;
}

export class SampleMixer {
  private pack: SamplePack | null = null;
  private loadedSamples: Map<string, LoadedSample> = new Map();

  // Simplified: just main loop + optional ambient
  private mainLoop: ActiveLayer | null = null;
  private ambientLayer: ActiveLayer | null = null;

  private output: Tone.Gain | null = null;
  private currentEnergy: EnergyLevel = 'low';
  private currentMood: Mood = 'chill';

  private isPlaying: boolean = false;

  private ensureOutput(): Tone.Gain {
    if (!this.output) {
      this.output = new Tone.Gain(1);
    }
    return this.output;
  }

  /**
   * Load a sample pack into memory
   * Only load loops and ambient textures for simplicity
   */
  async loadPack(pack: SamplePack): Promise<void> {
    this.pack = pack;

    // Only load loops and ambient - skip individual stems
    const relevantSamples = pack.samples.filter(
      s => s.category === 'loops' || s.category === 'ambient'
    );

    console.log(`Loading sample pack: ${pack.name} (${relevantSamples.length} loops/ambient)`);

    // Load samples in parallel
    const loadPromises = relevantSamples.map(async (sample) => {
      const url = `${SAMPLES_BASE_PATH}/${sample.filename}`;

      try {
        const player = new Tone.Player({
          url,
          loop: true,
          fadeIn: 0.5,
          fadeOut: 0.5,
        });

        await Tone.loaded();

        const loaded: LoadedSample = {
          metadata: sample,
          buffer: player.buffer.get() as AudioBuffer,
          player,
        };

        this.loadedSamples.set(sample.id, loaded);
        console.log(`Loaded: ${sample.id}`);
      } catch (error) {
        console.warn(`Failed to load sample: ${sample.filename}`, error);
      }
    });

    await Promise.all(loadPromises);

    console.log(`Loaded ${this.loadedSamples.size} samples`);
  }

  /**
   * Get the output node to connect to effects chain
   */
  getOutput(): Tone.Gain {
    return this.ensureOutput();
  }

  /**
   * Set the current musical parameters
   */
  setParameters(params: {
    energy?: EnergyLevel;
    mood?: Mood;
    key?: string;
    bpm?: number;
  }): void {
    if (params.energy) this.currentEnergy = params.energy;
    if (params.mood) this.currentMood = params.mood;
    // Key and BPM are ignored since we play pre-mixed loops
  }

  /**
   * Select the best loop based on current parameters
   */
  private selectLoop(): SampleMetadata | null {
    if (!this.pack) return null;

    const loops = getSamplesByCategory(this.pack, 'loops');
    if (loops.length === 0) return null;

    // Try to match mood first
    const moodMatches = loops.filter(l => l.mood === this.currentMood);
    if (moodMatches.length > 0) {
      return moodMatches[Math.floor(Math.random() * moodMatches.length)];
    }

    // Try to match energy
    const energyMatches = loops.filter(l => l.energy === this.currentEnergy);
    if (energyMatches.length > 0) {
      return energyMatches[Math.floor(Math.random() * energyMatches.length)];
    }

    // Random selection
    return loops[Math.floor(Math.random() * loops.length)];
  }

  /**
   * Select an ambient texture
   */
  private selectAmbient(): SampleMetadata | null {
    if (!this.pack) return null;

    const ambients = getSamplesByCategory(this.pack, 'ambient');
    if (ambients.length === 0) return null;

    return ambients[Math.floor(Math.random() * ambients.length)];
  }

  /**
   * Create a player from a loaded sample
   */
  private createPlayer(sample: SampleMetadata, volumeDb: number): ActiveLayer | null {
    const loaded = this.loadedSamples.get(sample.id);
    if (!loaded || !loaded.player) return null;

    const sourcePlayer = loaded.player as Tone.Player;

    // Create a new player instance
    const player = new Tone.Player({
      url: sourcePlayer.buffer,
      loop: true,
      fadeIn: 0.5,
      fadeOut: 0.5,
    });

    const gain = new Tone.Gain(Tone.dbToGain(volumeDb));

    player.connect(gain);
    gain.connect(this.ensureOutput());

    return {
      sample,
      player,
      gain,
    };
  }

  /**
   * Start playback with initial sample selection
   */
  async start(): Promise<void> {
    if (!this.pack) {
      throw new Error('No sample pack loaded');
    }

    if (this.isPlaying) return;

    // Select and start main loop
    const loopSample = this.selectLoop();
    if (loopSample) {
      this.mainLoop = this.createPlayer(loopSample, LAYER_VOLUMES.loop);
      if (this.mainLoop) {
        this.mainLoop.player.start(0);
        console.log(`Playing loop: ${loopSample.id}`);
      }
    }

    // Maybe add ambient (70% chance)
    if (Math.random() < 0.7) {
      const ambientSample = this.selectAmbient();
      if (ambientSample) {
        this.ambientLayer = this.createPlayer(ambientSample, LAYER_VOLUMES.ambient);
        if (this.ambientLayer) {
          this.ambientLayer.player.start(0);
          console.log(`Playing ambient: ${ambientSample.id}`);
        }
      }
    }

    this.isPlaying = true;
    console.log('Mixer started');
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (!this.isPlaying) return;

    // Stop main loop
    if (this.mainLoop) {
      this.mainLoop.player.stop();
      this.mainLoop.player.disconnect();
      this.mainLoop.gain.disconnect();
      this.mainLoop = null;
    }

    // Stop ambient
    if (this.ambientLayer) {
      this.ambientLayer.player.stop();
      this.ambientLayer.player.disconnect();
      this.ambientLayer.gain.disconnect();
      this.ambientLayer = null;
    }

    this.isPlaying = false;
    console.log('Mixer stopped');
  }

  /**
   * Crossfade to a new loop
   */
  private crossfadeToLoop(newSample: SampleMetadata): void {
    const oldLoop = this.mainLoop;
    const newLoop = this.createPlayer(newSample, 0); // Start silent

    if (!newLoop) return;

    // Start new loop
    newLoop.player.start(0);

    // Crossfade
    const now = Tone.now();
    const targetVolume = Tone.dbToGain(LAYER_VOLUMES.loop);

    // Fade in new
    newLoop.gain.gain.setValueAtTime(0, now);
    newLoop.gain.gain.linearRampToValueAtTime(targetVolume, now + CROSSFADE_DURATION);

    // Fade out old
    if (oldLoop) {
      oldLoop.gain.gain.setValueAtTime(oldLoop.gain.gain.value, now);
      oldLoop.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);

      // Clean up old loop after crossfade
      setTimeout(() => {
        oldLoop.player.stop();
        oldLoop.player.disconnect();
        oldLoop.gain.disconnect();
      }, CROSSFADE_DURATION * 1000 + 100);
    }

    this.mainLoop = newLoop;
    console.log(`Crossfaded to loop: ${newSample.id}`);
  }

  /**
   * Force a transition to a new loop (e.g., when user skips)
   */
  async transition(): Promise<void> {
    const newSample = this.selectLoop();
    if (newSample && newSample.id !== this.mainLoop?.sample.id) {
      this.crossfadeToLoop(newSample);
    }

    // Maybe change ambient
    if (Math.random() < 0.3) {
      const newAmbient = this.selectAmbient();
      if (newAmbient && this.ambientLayer) {
        // Crossfade ambient
        const oldAmbient = this.ambientLayer;
        const newLayer = this.createPlayer(newAmbient, 0);

        if (newLayer) {
          newLayer.player.start(0);

          const now = Tone.now();
          const targetVolume = Tone.dbToGain(LAYER_VOLUMES.ambient);

          newLayer.gain.gain.setValueAtTime(0, now);
          newLayer.gain.gain.linearRampToValueAtTime(targetVolume, now + CROSSFADE_DURATION);

          oldAmbient.gain.gain.setValueAtTime(oldAmbient.gain.gain.value, now);
          oldAmbient.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);

          setTimeout(() => {
            oldAmbient.player.stop();
            oldAmbient.player.disconnect();
            oldAmbient.gain.disconnect();
          }, CROSSFADE_DURATION * 1000 + 100);

          this.ambientLayer = newLayer;
          console.log(`Crossfaded to ambient: ${newAmbient.id}`);
        }
      }
    }
  }

  /**
   * Get current state for UI
   */
  getState(): {
    isPlaying: boolean;
    bpm: number;
    key: string;
    activeLayers: string[];
    sectionCount: number;
  } {
    const layers: string[] = [];
    if (this.mainLoop) {
      layers.push(`loop: ${this.mainLoop.sample.id}`);
    }
    if (this.ambientLayer) {
      layers.push(`ambient: ${this.ambientLayer.sample.id}`);
    }

    return {
      isPlaying: this.isPlaying,
      bpm: this.mainLoop?.sample.bpm || 80,
      key: this.mainLoop?.sample.key || 'Cm',
      activeLayers: layers,
      sectionCount: 0,
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();

    // Dispose all loaded samples
    for (const [, loaded] of this.loadedSamples) {
      if (loaded.player && typeof (loaded.player as Tone.Player).dispose === 'function') {
        (loaded.player as Tone.Player).dispose();
      }
    }

    this.loadedSamples.clear();
    this.output?.dispose();
    this.output = null;
  }
}

// Export singleton instance
export const sampleMixer = new SampleMixer();
