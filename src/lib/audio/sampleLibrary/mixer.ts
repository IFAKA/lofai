/**
 * Sample-Based Mixer Engine
 *
 * Key insight: Chords define the key. ALL other harmonic layers MUST match.
 * This is how lofi.co works - samples are grouped by key compatibility.
 */

import * as Tone from 'tone';
import {
  SamplePack,
  SampleMetadata,
  SampleCategory,
  LoadedSample,
  EnergyLevel,
  Mood,
} from './types';
import { SAMPLES_BASE_PATH, getSamplesByCategory } from './manifest';

// Crossfade duration in seconds
const CROSSFADE_DURATION = 2;

// How often to consider changing samples (in bars at 120 BPM)
const SECTION_LENGTH_BARS = 16; // Longer sections = more coherent

// Probability of changing a layer when a section ends
const LAYER_CHANGE_PROBABILITY: Record<SampleCategory, number> = {
  loops: 0,        // Not used in stem mode
  drums: 0.2,      // Drums can change, they work with any key
  chords: 0.15,    // Chords change = key change = everything changes
  melodies: 0.3,   // Melodies can swap within same key
  bass: 0.2,       // Bass swaps within same key
  ambient: 0.1,    // Ambient rarely changes
};

// Volume levels for each layer (in dB) - tuned for good mix
const LAYER_VOLUMES: Record<SampleCategory, number> = {
  loops: 0,
  drums: -3,       // Drums present but not overwhelming
  chords: -5,      // Chords are the harmonic bed
  melodies: -7,    // Melodies sit on top, not too loud
  bass: -6,        // Bass fills the low end
  ambient: -18,    // Ambient very subtle
};

// Keys that work together (same key or relative major/minor)
const KEY_COMPATIBILITY: Record<string, string[]> = {
  'C': ['C', 'Am'],      // C major and A minor (relative)
  'Am': ['Am', 'C'],     // A minor and C major (relative)
  'Cm': ['Cm'],          // C minor - keep it pure
  'Fm': ['Fm'],          // F minor - keep it pure
  'Dm': ['Dm'],          // D minor - keep it pure
};

interface ActiveLayer {
  sample: SampleMetadata;
  player: Tone.Player;
  gain: Tone.Gain;
}

export class SampleMixer {
  private pack: SamplePack | null = null;
  private loadedSamples: Map<string, LoadedSample> = new Map();
  private activeLayers: Map<SampleCategory, ActiveLayer> = new Map();

  private output: Tone.Gain | null = null;
  private bpm: number = 120;
  private currentKey: string = 'Cm';  // Current musical key (from chords)
  private currentEnergy: EnergyLevel = 'low';
  private currentMood: Mood = 'chill';

  private barCount: number = 0;
  private sectionCount: number = 0;
  private isPlaying: boolean = false;

  private barCallback: number | null = null;

  private ensureOutput(): Tone.Gain {
    if (!this.output) {
      this.output = new Tone.Gain(1);
    }
    return this.output;
  }

  async loadPack(pack: SamplePack): Promise<void> {
    this.pack = pack;
    this.bpm = pack.defaultBpm;

    // Load all stems (exclude loops)
    const stemsToLoad = pack.samples.filter(s => s.category !== 'loops');

    console.log(`Loading sample pack: ${pack.name} (${stemsToLoad.length} stems)`);

    const loadPromises = stemsToLoad.map(async (sample) => {
      const url = `${SAMPLES_BASE_PATH}/${sample.filename}`;

      try {
        const player = new Tone.Player({
          url,
          loop: true,
          fadeIn: 0.05,
          fadeOut: 0.05,
        });

        await Tone.loaded();

        this.loadedSamples.set(sample.id, {
          metadata: sample,
          buffer: player.buffer.get() as AudioBuffer,
          player,
        });
      } catch (error) {
        console.warn(`Failed to load sample: ${sample.filename}`, error);
      }
    });

    await Promise.all(loadPromises);
    console.log(`Loaded ${this.loadedSamples.size} samples`);
  }

  getOutput(): Tone.Gain {
    return this.ensureOutput();
  }

  setParameters(params: {
    energy?: EnergyLevel;
    mood?: Mood;
  }): void {
    if (params.energy) this.currentEnergy = params.energy;
    if (params.mood) this.currentMood = params.mood;
  }

  /**
   * Get compatible keys for the given key
   */
  private getCompatibleKeys(key: string): string[] {
    return KEY_COMPATIBILITY[key] || [key];
  }

  /**
   * Check if a sample's key is compatible with the current key
   */
  private isKeyCompatible(sampleKey: string): boolean {
    // Drums work with everything
    if (sampleKey === 'C' && !this.currentKey) return true;

    const compatibleKeys = this.getCompatibleKeys(this.currentKey);
    return compatibleKeys.includes(sampleKey);
  }

  /**
   * Select a sample for a category, respecting key constraints
   */
  private selectSample(category: SampleCategory, forceKeyMatch: boolean = true): SampleMetadata | null {
    if (!this.pack) return null;

    let candidates = getSamplesByCategory(this.pack, category);
    if (candidates.length === 0) return null;

    // Filter to loaded samples
    candidates = candidates.filter(c => this.loadedSamples.has(c.id));
    if (candidates.length === 0) return null;

    // For harmonic content (chords, melodies, bass), enforce key matching
    if (forceKeyMatch && (category === 'melodies' || category === 'bass')) {
      const keyMatched = candidates.filter(c => this.isKeyCompatible(c.key));
      if (keyMatched.length > 0) {
        candidates = keyMatched;
      } else {
        console.warn(`No ${category} samples match key ${this.currentKey}`);
        return null; // Don't play incompatible samples
      }
    }

    // Exclude currently playing sample
    const current = this.activeLayers.get(category);
    if (current && candidates.length > 1) {
      candidates = candidates.filter(c => c.id !== current.sample.id);
    }

    // Prefer mood/energy matches but don't require them
    const scored = candidates.map(sample => {
      let score = 1;
      if (sample.mood === this.currentMood) score += 2;
      if (sample.energy === this.currentEnergy) score += 1;
      return { sample, score };
    });

    // Sort by score and pick from top candidates with some randomness
    scored.sort((a, b) => b.score - a.score);
    const topScore = scored[0].score;
    const topCandidates = scored.filter(s => s.score >= topScore - 1);

    const pick = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    return pick.sample;
  }

  /**
   * Select chords (this defines the key for everything else)
   */
  private selectChords(): SampleMetadata | null {
    if (!this.pack) return null;

    let candidates = getSamplesByCategory(this.pack, 'chords');
    candidates = candidates.filter(c => this.loadedSamples.has(c.id));
    if (candidates.length === 0) return null;

    // Exclude current
    const current = this.activeLayers.get('chords');
    if (current && candidates.length > 1) {
      candidates = candidates.filter(c => c.id !== current.sample.id);
    }

    // Prefer mood/energy matches
    const scored = candidates.map(sample => {
      let score = 1;
      if (sample.mood === this.currentMood) score += 3;
      if (sample.energy === this.currentEnergy) score += 2;
      return { sample, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topScore = scored[0].score;
    const topCandidates = scored.filter(s => s.score >= topScore - 1);

    const pick = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    return pick.sample;
  }

  private activateLayer(category: SampleCategory, sample: SampleMetadata): void {
    const loaded = this.loadedSamples.get(sample.id);
    if (!loaded || !loaded.player) return;

    // Clean up existing layer first
    const existing = this.activeLayers.get(category);
    if (existing) {
      existing.player.stop();
      existing.player.unsync();
      existing.player.disconnect();
      existing.gain.disconnect();
    }

    const sourcePlayer = loaded.player as Tone.Player;

    const player = new Tone.Player({
      url: sourcePlayer.buffer,
      loop: true,
      fadeIn: 0.05,
      fadeOut: 0.05,
    });

    const gain = new Tone.Gain(Tone.dbToGain(LAYER_VOLUMES[category]));

    player.connect(gain);
    gain.connect(this.ensureOutput());

    this.activeLayers.set(category, { sample, player, gain });

    if (this.isPlaying) {
      player.sync().start(0);
    }

    console.log(`Activated: ${category} -> ${sample.id} (key: ${sample.key})`);
  }

  private crossfadeLayer(category: SampleCategory, newSample: SampleMetadata): void {
    const oldLayer = this.activeLayers.get(category);
    const loaded = this.loadedSamples.get(newSample.id);

    if (!loaded || !loaded.player) return;

    const sourcePlayer = loaded.player as Tone.Player;

    const newPlayer = new Tone.Player({
      url: sourcePlayer.buffer,
      loop: true,
      fadeIn: 0.05,
      fadeOut: 0.05,
    });

    const newGain = new Tone.Gain(0);

    newPlayer.connect(newGain);
    newGain.connect(this.ensureOutput());

    newPlayer.sync().start(0);

    const now = Tone.now();
    const targetVolume = Tone.dbToGain(LAYER_VOLUMES[category]);

    newGain.gain.setValueAtTime(0, now);
    newGain.gain.linearRampToValueAtTime(targetVolume, now + CROSSFADE_DURATION);

    if (oldLayer) {
      oldLayer.gain.gain.setValueAtTime(oldLayer.gain.gain.value, now);
      oldLayer.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);

      setTimeout(() => {
        oldLayer.player.stop();
        oldLayer.player.unsync();
        oldLayer.player.disconnect();
        oldLayer.gain.disconnect();
      }, CROSSFADE_DURATION * 1000 + 100);
    }

    this.activeLayers.set(category, {
      sample: newSample,
      player: newPlayer,
      gain: newGain,
    });

    console.log(`Crossfade: ${category} -> ${newSample.id} (key: ${newSample.key})`);
  }

  /**
   * Build a coherent set of layers around a chord progression
   */
  private buildCoherentSet(): void {
    // 1. Select chords FIRST - this defines the key
    const chords = this.selectChords();
    if (!chords) {
      console.error('No chords available!');
      return;
    }

    this.currentKey = chords.key;
    this.activateLayer('chords', chords);
    console.log(`Key established: ${this.currentKey}`);

    // 2. Select drums (key-independent)
    const drums = this.selectSample('drums', false);
    if (drums) {
      this.activateLayer('drums', drums);
    }

    // 3. Maybe add melody (must match key)
    if (Math.random() < 0.7) {
      const melody = this.selectSample('melodies', true);
      if (melody) {
        this.activateLayer('melodies', melody);
      }
    }

    // 4. Maybe add bass (must match key)
    if (Math.random() < 0.6) {
      const bass = this.selectSample('bass', true);
      if (bass) {
        this.activateLayer('bass', bass);
      }
    }

    // 5. Maybe add ambient (key-independent)
    if (Math.random() < 0.5) {
      const ambient = this.selectSample('ambient', false);
      if (ambient) {
        this.activateLayer('ambient', ambient);
      }
    }
  }

  async start(): Promise<void> {
    if (!this.pack) {
      throw new Error('No sample pack loaded');
    }

    if (this.isPlaying) return;

    Tone.getTransport().bpm.value = this.bpm;

    // Build a coherent set of samples
    this.buildCoherentSet();

    // Schedule section changes
    this.barCallback = Tone.getTransport().scheduleRepeat(
      (time) => this.onBar(time),
      '1m',
      0
    );

    // Start all layers
    for (const [, layer] of this.activeLayers) {
      layer.player.sync().start(0);
    }

    this.isPlaying = true;
    console.log('Mixer started with key:', this.currentKey, 'layers:', Array.from(this.activeLayers.keys()).join(', '));
  }

  stop(): void {
    if (!this.isPlaying) return;

    for (const [, layer] of this.activeLayers) {
      layer.player.stop();
      layer.player.unsync();
      layer.player.disconnect();
      layer.gain.disconnect();
    }

    this.activeLayers.clear();

    if (this.barCallback !== null) {
      Tone.getTransport().clear(this.barCallback);
      this.barCallback = null;
    }

    this.barCount = 0;
    this.sectionCount = 0;
    this.isPlaying = false;

    console.log('Mixer stopped');
  }

  private onBar(_time: number): void {
    this.barCount++;

    if (this.barCount >= SECTION_LENGTH_BARS) {
      this.barCount = 0;
      this.sectionCount++;
      this.onSectionChange();
    }
  }

  private onSectionChange(): void {
    console.log(`Section ${this.sectionCount} - key: ${this.currentKey}`);

    // Maybe change chords (which changes everything)
    if (Math.random() < LAYER_CHANGE_PROBABILITY.chords) {
      const newChords = this.selectChords();
      if (newChords && newChords.id !== this.activeLayers.get('chords')?.sample.id) {
        // Key is changing - need to update all harmonic layers
        const oldKey = this.currentKey;
        this.currentKey = newChords.key;

        this.crossfadeLayer('chords', newChords);

        // If key changed, swap melodies and bass to match
        if (oldKey !== this.currentKey) {
          console.log(`Key change: ${oldKey} -> ${this.currentKey}`);

          if (this.activeLayers.has('melodies')) {
            const newMelody = this.selectSample('melodies', true);
            if (newMelody) {
              this.crossfadeLayer('melodies', newMelody);
            }
          }

          if (this.activeLayers.has('bass')) {
            const newBass = this.selectSample('bass', true);
            if (newBass) {
              this.crossfadeLayer('bass', newBass);
            }
          }
        }
        return; // Don't make other changes this section
      }
    }

    // Maybe change drums (key-independent)
    if (Math.random() < LAYER_CHANGE_PROBABILITY.drums) {
      const newDrums = this.selectSample('drums', false);
      if (newDrums && newDrums.id !== this.activeLayers.get('drums')?.sample.id) {
        this.crossfadeLayer('drums', newDrums);
      }
    }

    // Maybe change melody (within same key)
    if (this.activeLayers.has('melodies') && Math.random() < LAYER_CHANGE_PROBABILITY.melodies) {
      const newMelody = this.selectSample('melodies', true);
      if (newMelody && newMelody.id !== this.activeLayers.get('melodies')?.sample.id) {
        this.crossfadeLayer('melodies', newMelody);
      }
    }

    // Maybe add a missing layer
    if (Math.random() < 0.15) {
      if (!this.activeLayers.has('melodies')) {
        const melody = this.selectSample('melodies', true);
        if (melody) this.activateLayer('melodies', melody);
      } else if (!this.activeLayers.has('bass')) {
        const bass = this.selectSample('bass', true);
        if (bass) this.activateLayer('bass', bass);
      } else if (!this.activeLayers.has('ambient')) {
        const ambient = this.selectSample('ambient', false);
        if (ambient) this.activateLayer('ambient', ambient);
      }
    }

    // Maybe remove a layer (for dynamics)
    if (Math.random() < 0.08 && this.activeLayers.size > 3) {
      const removable: SampleCategory[] = ['melodies', 'bass', 'ambient']
        .filter(c => this.activeLayers.has(c as SampleCategory)) as SampleCategory[];

      if (removable.length > 0) {
        const category = removable[Math.floor(Math.random() * removable.length)];
        const layer = this.activeLayers.get(category);

        if (layer) {
          const now = Tone.now();
          layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
          layer.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);

          setTimeout(() => {
            layer.player.stop();
            layer.player.unsync();
            layer.player.disconnect();
            layer.gain.disconnect();
            this.activeLayers.delete(category);
            console.log(`Removed: ${category}`);
          }, CROSSFADE_DURATION * 1000 + 100);
        }
      }
    }
  }

  async transition(): Promise<void> {
    // Full transition = new coherent set
    console.log('Full transition requested');

    // Select new chords first
    const newChords = this.selectChords();
    if (newChords) {
      this.currentKey = newChords.key;
      this.crossfadeLayer('chords', newChords);
    }

    // New drums
    const newDrums = this.selectSample('drums', false);
    if (newDrums) {
      this.crossfadeLayer('drums', newDrums);
    }

    // New melody matching new key
    if (this.activeLayers.has('melodies')) {
      const newMelody = this.selectSample('melodies', true);
      if (newMelody) {
        this.crossfadeLayer('melodies', newMelody);
      }
    }

    // New bass matching new key
    if (this.activeLayers.has('bass')) {
      const newBass = this.selectSample('bass', true);
      if (newBass) {
        this.crossfadeLayer('bass', newBass);
      }
    }

    console.log('Transitioned to new set, key:', this.currentKey);
  }

  getState(): {
    isPlaying: boolean;
    bpm: number;
    key: string;
    activeLayers: string[];
    sectionCount: number;
  } {
    return {
      isPlaying: this.isPlaying,
      bpm: this.bpm,
      key: this.currentKey,
      activeLayers: Array.from(this.activeLayers.entries()).map(
        ([category, layer]) => `${category}: ${layer.sample.id}`
      ),
      sectionCount: this.sectionCount,
    };
  }

  dispose(): void {
    this.stop();

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

export const sampleMixer = new SampleMixer();
