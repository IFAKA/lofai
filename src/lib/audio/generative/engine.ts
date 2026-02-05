/**
 * Generative Lofi Engine - Ported from lofi-engine
 *
 * This creates music algorithmically using:
 * - Programmed drum patterns (kick, snare, hat)
 * - Generated chord progressions
 * - Algorithmic melody based on scales
 * - Pink noise for lo-fi warmth
 * - Stereo widening for spacious mix
 */

import * as Tone from 'tone';
import { Chord, ChordProgression, FIVE_TO_FIVE, INTERVAL_WEIGHTS, MINOR_KEYS, MAJOR_KEYS } from './chords';
import {
  GenerationParams,
  TempoArm,
  EnergyArm,
  ValenceArm,
  DanceabilityArm,
  TEMPO_RANGES,
  ENERGY_PARAMS,
  VALENCE_PARAMS,
  DANCEABILITY_PARAMS,
} from '@/lib/preferences/types';

const SAMPLES_PATH = '/samples/engine';

export type NoiseType = 'off' | 'white' | 'pink' | 'brown';

interface GenerativeState {
  isPlaying: boolean;
  isLoaded: boolean;
  key: string;
  progression: Chord[];
  progressIndex: number;
  bpm: number;
  noiseType: NoiseType;
  noiseVolume: number;
}

class GenerativeEngine {
  private state: GenerativeState = {
    isPlaying: false,
    isLoaded: false,
    key: 'C',
    progression: [],
    progressIndex: 0,
    bpm: 156, // With swing this feels like ~78
    noiseType: 'pink',
    noiseVolume: 0.3,
  };

  // Audio nodes
  private piano: Tone.Sampler | null = null;
  private kick: Tone.Sampler | null = null;
  private snare: Tone.Sampler | null = null;
  private hat: Tone.Sampler | null = null;
  private noise: Tone.Noise | null = null;

  // Piano effects chain (separate from master)
  private pianoFilter: Tone.Filter | null = null;
  private stereoWidener: Tone.StereoWidener | null = null;

  // Noise effects chain
  private noiseFilter: Tone.Filter | null = null;
  private noiseVol: Tone.Volume | null = null;

  // Master effects chain
  private compressor: Tone.Compressor | null = null;
  private masterFilter: Tone.Filter | null = null;
  private masterVol: Tone.Volume | null = null;

  // Sequences
  private chordSeq: Tone.Sequence | null = null;
  private melodySeq: Tone.Sequence | null = null;
  private kickSeq: Tone.Sequence | null = null;
  private snareSeq: Tone.Sequence | null = null;
  private hatSeq: Tone.Sequence | null = null;

  // Melody state
  private scale: string[] = [];
  private scalePos: number = 0;
  private melodyDensity: number = 0.33;
  private melodyOff: boolean = false;

  // Drum state
  private kickOff: boolean = false;
  private snareOff: boolean = false;
  private hatOff: boolean = false;

  // Learning system state - applied from bandit
  private currentParams: GenerationParams | null = null;
  private currentVelocity: number = 0.7;
  private preferMinor: boolean = false;
  private hihatActivity: number = 0.5;
  private kickEmphasis: number = 0.65;

  // Section tracking
  private barCount: number = 0;
  private sectionLength: number = 32;

  private listeners: Set<(state: GenerativeState) => void> = new Set();
  private loadPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this._initialize();
    return this.loadPromise;
  }

  private async _initialize(): Promise<void> {
    // Setup master effects chain
    this.compressor = new Tone.Compressor({
      threshold: -6,
      ratio: 3,
      attack: 0.5,
      release: 0.1,
    });

    this.masterFilter = new Tone.Filter(2000, 'lowpass');
    this.masterVol = new Tone.Volume(0);

    // Chain: Destination → Compressor → Filter → Volume
    Tone.getDestination().chain(this.compressor, this.masterFilter, this.masterVol);

    // Setup piano-specific effects (lo-fi warmth + stereo width)
    this.pianoFilter = new Tone.Filter(1000, 'lowpass');
    this.stereoWidener = new Tone.StereoWidener(0.5);

    // Setup pink noise for vinyl/lo-fi texture
    this.noiseFilter = new Tone.Filter(2000, 'lowshelf');
    this.noiseVol = new Tone.Volume(-32); // Very quiet, just texture
    this.noise = new Tone.Noise('pink');
    this.noise.chain(this.noiseFilter, this.noiseVol, Tone.getDestination());

    // Set tempo and swing
    Tone.getTransport().bpm.value = this.state.bpm;
    Tone.getTransport().swing = 1;

    // Load samples
    await Promise.all([
      this.loadPiano(),
      this.loadDrums(),
    ]);

    // Setup sequences
    this.setupSequences();

    this.state.isLoaded = true;
    this.notifyListeners();
  }

  private async loadPiano(): Promise<void> {
    return new Promise((resolve) => {
      const urls: Record<string, string> = {};

      // Map note names to files
      ['C', 'Dsharp', 'Fsharp', 'A'].forEach(note => {
        for (let octave = 1; octave <= 6; octave++) {
          const key = note === 'Dsharp' ? `D#${octave}` : note === 'Fsharp' ? `F#${octave}` : `${note}${octave}`;
          urls[key] = `${SAMPLES_PATH}/piano/${note}${octave}v1.mp3`;
        }
      });

      this.piano = new Tone.Sampler({
        urls,
        baseUrl: '',
        onload: () => resolve(),
        onerror: (err) => {
          console.error('Piano load error:', err);
          resolve();
        },
      });

      // Chain piano through its own effects: Piano → LPF (1000Hz) → Stereo Widener → Master
      if (this.pianoFilter && this.stereoWidener) {
        this.piano.chain(this.pianoFilter, this.stereoWidener, Tone.getDestination());
      } else {
        this.piano.toDestination();
      }
    });
  }

  private async loadDrums(): Promise<void> {
    return new Promise((resolve) => {
      let loaded = 0;
      const checkLoaded = () => {
        loaded++;
        if (loaded >= 3) resolve();
      };

      this.kick = new Tone.Sampler({
        urls: { C4: `${SAMPLES_PATH}/drums/kick.mp3` },
        onload: checkLoaded,
      }).toDestination();

      this.snare = new Tone.Sampler({
        urls: { C4: `${SAMPLES_PATH}/drums/snare.mp3` },
        volume: -4,
        onload: checkLoaded,
      }).toDestination();

      this.hat = new Tone.Sampler({
        urls: { C4: `${SAMPLES_PATH}/drums/hat.mp3` },
        volume: -6,
        onload: checkLoaded,
      }).toDestination();
    });
  }

  private setupSequences(): void {
    // Chord sequence - plays every whole note
    this.chordSeq = new Tone.Sequence(
      () => this.playChord(),
      [''],
      '1n'
    );
    this.chordSeq.humanize = true;

    // Melody sequence - plays every 8th note (probabilistically)
    this.melodySeq = new Tone.Sequence(
      () => this.playMelody(),
      [''],
      '8n'
    );
    this.melodySeq.humanize = true;

    // Kick pattern: boom-bap style with kick emphasis from danceability
    this.kickSeq = new Tone.Sequence(
      (time, note) => {
        if (!this.kickOff && note === 'C4') {
          // Use kickEmphasis for main kick probability
          if (Math.random() < (0.6 + this.kickEmphasis * 0.35)) {
            this.kick?.triggerAttack('C4', time);
          }
        } else if (!this.kickOff && note === '.' && Math.random() < (this.kickEmphasis * 0.15)) {
          // Ghost kicks based on emphasis
          this.kick?.triggerAttack('C4', time);
        }
      },
      ['C4', '', '', '', '', '', '', 'C4', 'C4', '', '.', '', '', '', '', ''],
      '8n'
    );
    this.kickSeq.humanize = true;

    // Snare pattern: backbeat
    this.snareSeq = new Tone.Sequence(
      (time, note) => {
        if (!this.snareOff && note !== '' && Math.random() < 0.8) {
          this.snare?.triggerAttack('C4', time);
        }
      },
      ['', 'C4'],
      '2n'
    );
    this.snareSeq.humanize = true;

    // Hat pattern: straight 8ths with variation based on hihat activity
    this.hatSeq = new Tone.Sequence(
      (time, note) => {
        if (!this.hatOff && note !== '' && Math.random() < (0.5 + this.hihatActivity * 0.4)) {
          this.hat?.triggerAttack('C4', time);
        }
      },
      ['C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4'],
      '4n'
    );
    this.hatSeq.humanize = true;
  }

  private playChord(): void {
    const chord = this.state.progression[this.state.progressIndex];
    if (!chord || !this.piano) return;

    const root = Tone.Frequency(this.state.key + '3').transpose(chord.semitoneDist);
    const voicing = chord.generateVoicing(4);
    const notes = Tone.Frequency(root)
      .harmonize(voicing)
      .map(f => Tone.Frequency(f).toNote());

    this.piano.triggerAttackRelease(notes, '1n');
    this.nextChord();
  }

  private nextChord(): void {
    const nextProgress = this.state.progressIndex === this.state.progression.length - 1
      ? 0
      : this.state.progressIndex + 1;

    // Occasionally vary the drums
    if (this.state.progressIndex === 0) {
      this.kickOff = Math.random() < 0.15;
      this.snareOff = Math.random() < 0.2;
      this.hatOff = Math.random() < 0.25;
      this.melodyDensity = Math.random() * 0.3 + 0.2;
      this.melodyOff = Math.random() < 0.25;
    }

    this.state.progressIndex = nextProgress;
    this.barCount++;

    // Section change
    if (this.barCount >= this.sectionLength) {
      this.barCount = 0;
      this.transition();
    }

    this.notifyListeners();
  }

  private playMelody(): void {
    if (this.melodyOff || Math.random() > this.melodyDensity || !this.piano) return;

    const descendRange = Math.min(this.scalePos, 7) + 1;
    const ascendRange = Math.min(this.scale.length - this.scalePos, 7);

    let descend = descendRange > 1;
    let ascend = ascendRange > 1;

    if (descend && ascend) {
      if (Math.random() > 0.5) {
        ascend = false;
      } else {
        descend = false;
      }
    }

    let weights = descend
      ? INTERVAL_WEIGHTS.slice(0, descendRange)
      : INTERVAL_WEIGHTS.slice(0, ascendRange);

    // Normalize weights
    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);
    for (let i = 1; i < weights.length; i++) {
      weights[i] += weights[i - 1];
    }

    // Pick interval
    const rand = Math.random();
    let scaleDist = 0;
    while (scaleDist < weights.length && rand > weights[scaleDist]) {
      scaleDist++;
    }

    const newScalePos = this.scalePos + (descend ? -scaleDist : scaleDist);
    if (newScalePos >= 0 && newScalePos < this.scale.length) {
      this.scalePos = newScalePos;
      // Apply velocity from energy parameter
      this.piano.triggerAttackRelease(this.scale[newScalePos], '2n', undefined, this.currentVelocity);
    }
  }

  generateProgression(): void {
    // Select key based on learned valence preference
    let newKey: string;
    if (this.preferMinor) {
      // Use minor keys for sad valence
      newKey = MINOR_KEYS[Math.floor(Math.random() * MINOR_KEYS.length)];
    } else {
      // Use major keys for neutral/happy valence
      newKey = MAJOR_KEYS[Math.floor(Math.random() * MAJOR_KEYS.length)];
    }

    const newScale = Tone.Frequency(newKey + '5')
      .harmonize(FIVE_TO_FIVE)
      .map(f => Tone.Frequency(f).toNote());
    const newProgression = ChordProgression.generate(8);

    this.state.key = newKey;
    this.state.progression = newProgression;
    this.state.progressIndex = 0;
    this.scale = newScale;
    this.scalePos = Math.floor(Math.random() * newScale.length);

    this.notifyListeners();
  }

  private transition(): void {
    // Generate new progression
    this.generateProgression();

    // Vary instruments
    this.melodyDensity = 0.2 + Math.random() * 0.5;
    this.kickOff = Math.random() < 0.13;
    this.snareOff = Math.random() < 0.17;
    this.hatOff = Math.random() < 0.22;
    this.melodyOff = Math.random() < 0.25;

    // Filter sweep for smooth transition
    if (this.masterFilter) {
      this.masterFilter.frequency.linearRampTo(300, 2);
      setTimeout(() => {
        this.masterFilter?.frequency.linearRampTo(2000, 2);
      }, 2000);
    }

    // Random next section length
    const lengths = [16, 20, 24, 28, 32, 48];
    this.sectionLength = lengths[Math.floor(Math.random() * lengths.length)];
  }

  async play(): Promise<void> {
    if (!this.state.isLoaded) {
      await this.initialize();
    }

    await Tone.start();

    if (this.state.progression.length === 0) {
      this.generateProgression();
    }

    Tone.getTransport().start();
    this.chordSeq?.start(0);
    this.melodySeq?.start(0);
    this.kickSeq?.start(0);
    this.snareSeq?.start(0);
    this.hatSeq?.start(0);

    // Start noise if not set to 'off'
    if (this.state.noiseType !== 'off') {
      this.noise?.start();
    }

    this.state.isPlaying = true;
    this.notifyListeners();
  }

  pause(): void {
    Tone.getTransport().pause();
    this.noise?.stop();
    this.state.isPlaying = false;
    this.notifyListeners();
  }

  stop(): void {
    Tone.getTransport().stop();
    this.chordSeq?.stop();
    this.melodySeq?.stop();
    this.kickSeq?.stop();
    this.snareSeq?.stop();
    this.hatSeq?.stop();

    // Stop pink noise
    this.noise?.stop();

    this.state.isPlaying = false;
    this.state.progressIndex = 0;
    this.barCount = 0;
    this.notifyListeners();
  }

  skip(): void {
    this.transition();
  }

  setVolume(volume: number): void {
    if (this.masterVol) {
      // Convert 0-1 to dB
      const db = volume === 0 ? -Infinity : 20 * Math.log10(volume);
      this.masterVol.volume.value = db;
    }
  }

  setNoiseType(type: NoiseType): void {
    this.state.noiseType = type;

    if (!this.noise) return;

    if (type === 'off') {
      // Stop noise if playing
      if (this.state.isPlaying) {
        this.noise.stop();
      }
    } else {
      // Change noise type and restart if playing
      this.noise.type = type;
      if (this.state.isPlaying) {
        this.noise.start();
      }
    }

    this.notifyListeners();
  }

  setNoiseVolume(volume: number): void {
    this.state.noiseVolume = Math.max(0, Math.min(1, volume));

    if (this.noiseVol) {
      // Convert 0-1 to dB range (-60dB to -20dB for subtle background)
      // 0 = -Infinity (muted), 1 = -20dB (audible but not overwhelming)
      const db = volume === 0 ? -Infinity : -60 + volume * 40;
      this.noiseVol.volume.value = db;
    }

    this.notifyListeners();
  }

  getState(): GenerativeState {
    return { ...this.state };
  }

  subscribe(listener: (state: GenerativeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  // ========== Learning System Parameter Application ==========

  /**
   * Apply tempo from bandit selection
   * Maps tempo arm to BPM range and sets transport tempo
   */
  applyTempo(tempoArm: TempoArm): void {
    const range = TEMPO_RANGES[tempoArm];
    const targetBpm = range.min + Math.random() * (range.max - range.min);
    // Double BPM for swing feel (e.g., 78 becomes 156)
    this.state.bpm = Math.round(targetBpm * 2);
    Tone.getTransport().bpm.value = this.state.bpm;
  }

  /**
   * Apply energy level from bandit selection
   * Affects velocity, density, and which instruments play
   */
  applyEnergy(energyArm: EnergyArm): void {
    const params = ENERGY_PARAMS[energyArm];
    this.melodyDensity = params.density;
    this.currentVelocity = params.velocity;
    // Fewer instruments at lower energy
    this.kickOff = params.instruments < 3;
    this.snareOff = params.instruments < 4;
  }

  /**
   * Apply danceability from bandit selection
   * Affects swing feel, kick emphasis, and hihat activity
   */
  applyDanceability(danceabilityArm: DanceabilityArm): void {
    const params = DANCEABILITY_PARAMS[danceabilityArm];
    Tone.getTransport().swing = params.swing;
    this.kickEmphasis = params.kickEmphasis;
    this.hihatActivity = params.hihatActivity;
  }

  /**
   * Apply valence from bandit selection
   * Affects major/minor key preference
   */
  applyValence(valenceArm: ValenceArm): void {
    const params = VALENCE_PARAMS[valenceArm];
    this.preferMinor = params.useMinor;
  }

  /**
   * Apply all generation parameters from the bandit
   * Called when generating a new song to apply learned preferences
   */
  applyGenerationParams(params: GenerationParams): void {
    this.applyTempo(params.tempo);
    this.applyEnergy(params.energy);
    this.applyDanceability(params.danceability);
    this.applyValence(params.valence);
    this.currentParams = params;
    this.notifyListeners();
  }

  /**
   * Get current generation parameters (for feedback tracking)
   */
  getCurrentParams(): GenerationParams | null {
    return this.currentParams;
  }

  dispose(): void {
    this.stop();

    // Dispose instruments
    this.piano?.dispose();
    this.kick?.dispose();
    this.snare?.dispose();
    this.hat?.dispose();
    this.noise?.dispose();

    // Dispose piano effects
    this.pianoFilter?.dispose();
    this.stereoWidener?.dispose();

    // Dispose noise effects
    this.noiseFilter?.dispose();
    this.noiseVol?.dispose();

    // Dispose master effects
    this.compressor?.dispose();
    this.masterFilter?.dispose();
    this.masterVol?.dispose();

    // Dispose sequences
    this.chordSeq?.dispose();
    this.melodySeq?.dispose();
    this.kickSeq?.dispose();
    this.snareSeq?.dispose();
    this.hatSeq?.dispose();
  }
}

export const generativeEngine = new GenerativeEngine();
