import * as Tone from 'tone';
import { Chord, ChordProgression, FIVE_TO_FIVE, INTERVAL_WEIGHTS, MINOR_KEYS, MAJOR_KEYS } from './chords';
import { GenerationParams } from '@/lib/preferences/types';
import { createSynthResources, disposeSynthResources, type SynthResources } from './synthSetup';
import { createSequences, startSequences, stopSequences, disposeSequences, type Sequences } from './sequencer';
import {
  computeTempoParams,
  computeEnergyParams,
  computeDanceabilityParams,
  computeValenceParams,
} from './paramApplicator';

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
  sampleLoadErrors: string[];
}

class GenerativeEngine {
  private state: GenerativeState = {
    isPlaying: false,
    isLoaded: false,
    key: 'C',
    progression: [],
    progressIndex: 0,
    bpm: 156,
    noiseType: 'pink',
    noiseVolume: 0.3,
    sampleLoadErrors: [],
  };

  private resources: SynthResources | null = null;
  private sequences: Sequences | null = null;

  private scale: string[] = [];
  private scalePos: number = 0;
  private melodyDensity: number = 0.33;
  private melodyOff: boolean = false;

  private kickOff: boolean = false;
  private snareOff: boolean = false;
  private hatOff: boolean = false;

  private currentParams: GenerationParams | null = null;
  private currentVelocity: number = 0.7;
  private preferMinor: boolean = false;
  private hihatActivity: number = 0.5;
  private kickEmphasis: number = 0.65;

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
    this.resources = await createSynthResources((msg) => {
      this.state.sampleLoadErrors.push(msg);
    });

    Tone.getTransport().bpm.value = this.state.bpm;
    Tone.getTransport().swing = 1;

    this.sequences = createSequences(this.resources, {
      onChordTick: () => this.playChord(),
      onMelodyTick: () => this.playMelody(),
      getKickState: () => ({ kickOff: this.kickOff, kickEmphasis: this.kickEmphasis }),
      getSnareState: () => ({ snareOff: this.snareOff }),
      getHatState: () => ({ hatOff: this.hatOff, hihatActivity: this.hihatActivity }),
    });

    this.state.isLoaded = true;
    this.notifyListeners();
  }

  private playChord(): void {
    const chord = this.state.progression[this.state.progressIndex];
    if (!chord || !this.resources) return;

    const root = Tone.Frequency(this.state.key + '3').transpose(chord.semitoneDist);
    const voicing = chord.generateVoicing(4);
    const notes = Tone.Frequency(root)
      .harmonize(voicing)
      .map(f => Tone.Frequency(f).toNote());

    this.resources.piano.triggerAttackRelease(notes, '1n');
    this.nextChord();
  }

  private nextChord(): void {
    const nextProgress = this.state.progressIndex === this.state.progression.length - 1
      ? 0
      : this.state.progressIndex + 1;

    if (this.state.progressIndex === 0) {
      this.kickOff = Math.random() < 0.15;
      this.snareOff = Math.random() < 0.2;
      this.hatOff = Math.random() < 0.25;
      this.melodyDensity = Math.random() * 0.3 + 0.2;
      this.melodyOff = Math.random() < 0.25;
    }

    this.state.progressIndex = nextProgress;
    this.barCount++;

    if (this.barCount >= this.sectionLength) {
      this.barCount = 0;
      this.transition();
    }

    this.notifyListeners();
  }

  private playMelody(): void {
    if (this.melodyOff || Math.random() > this.melodyDensity || !this.resources) return;

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

    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);
    for (let i = 1; i < weights.length; i++) {
      weights[i] += weights[i - 1];
    }

    const rand = Math.random();
    let scaleDist = 0;
    while (scaleDist < weights.length && rand > weights[scaleDist]) {
      scaleDist++;
    }

    const newScalePos = this.scalePos + (descend ? -scaleDist : scaleDist);
    if (newScalePos >= 0 && newScalePos < this.scale.length) {
      this.scalePos = newScalePos;
      this.resources.piano.triggerAttackRelease(this.scale[newScalePos], '2n', undefined, this.currentVelocity);
    }
  }

  generateProgression(): void {
    const newKey = this.preferMinor
      ? MINOR_KEYS[Math.floor(Math.random() * MINOR_KEYS.length)]
      : MAJOR_KEYS[Math.floor(Math.random() * MAJOR_KEYS.length)];

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
    this.generateProgression();

    this.melodyDensity = 0.2 + Math.random() * 0.5;
    this.kickOff = Math.random() < 0.13;
    this.snareOff = Math.random() < 0.17;
    this.hatOff = Math.random() < 0.22;
    this.melodyOff = Math.random() < 0.25;

    if (this.resources?.masterFilter) {
      this.resources.masterFilter.frequency.linearRampTo(300, 2);
      setTimeout(() => {
        this.resources?.masterFilter?.frequency.linearRampTo(2000, 2);
      }, 2000);
    }

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
    if (this.sequences) startSequences(this.sequences);

    if (this.state.noiseType !== 'off') {
      this.resources?.noise.start();
    }

    this.state.isPlaying = true;
    this.notifyListeners();
  }

  pause(): void {
    Tone.getTransport().pause();
    this.resources?.noise.stop();
    this.state.isPlaying = false;
    this.notifyListeners();
  }

  stop(): void {
    Tone.getTransport().stop();
    if (this.sequences) stopSequences(this.sequences);
    this.resources?.noise.stop();

    this.state.isPlaying = false;
    this.state.progressIndex = 0;
    this.barCount = 0;
    this.notifyListeners();
  }

  skip(): void {
    this.transition();
  }

  setVolume(volume: number): void {
    if (this.resources?.masterVol) {
      this.resources.masterVol.volume.value = volume === 0 ? -Infinity : 20 * Math.log10(volume);
    }
  }

  setNoiseType(type: NoiseType): void {
    this.state.noiseType = type;
    if (!this.resources?.noise) return;

    if (type === 'off') {
      if (this.state.isPlaying) this.resources.noise.stop();
    } else {
      this.resources.noise.type = type;
      if (this.state.isPlaying) this.resources.noise.start();
    }

    this.notifyListeners();
  }

  setNoiseVolume(volume: number): void {
    this.state.noiseVolume = Math.max(0, Math.min(1, volume));
    if (this.resources?.noiseVol) {
      this.resources.noiseVol.volume.value = volume === 0 ? -Infinity : -60 + volume * 40;
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

  applyTempo(tempoArm: Parameters<typeof computeTempoParams>[0]): void {
    const result = computeTempoParams(tempoArm);
    this.state.bpm = result.bpm;
    Tone.getTransport().bpm.value = this.state.bpm;
  }

  applyEnergy(energyArm: Parameters<typeof computeEnergyParams>[0]): void {
    const result = computeEnergyParams(energyArm);
    this.melodyDensity = result.melodyDensity;
    this.currentVelocity = result.velocity;
    this.kickOff = result.kickOff;
    this.snareOff = result.snareOff;
  }

  applyDanceability(danceabilityArm: Parameters<typeof computeDanceabilityParams>[0]): void {
    const result = computeDanceabilityParams(danceabilityArm);
    Tone.getTransport().swing = result.swing;
    this.kickEmphasis = result.kickEmphasis;
    this.hihatActivity = result.hihatActivity;
  }

  applyValence(valenceArm: Parameters<typeof computeValenceParams>[0]): void {
    const result = computeValenceParams(valenceArm);
    this.preferMinor = result.preferMinor;
  }

  applyGenerationParams(params: GenerationParams): void {
    this.applyTempo(params.tempo);
    this.applyEnergy(params.energy);
    this.applyDanceability(params.danceability);
    this.applyValence(params.valence);
    this.currentParams = params;
    this.notifyListeners();
  }

  getCurrentParams(): GenerationParams | null {
    return this.currentParams;
  }

  dispose(): void {
    this.stop();
    if (this.sequences) disposeSequences(this.sequences);
    if (this.resources) disposeSynthResources(this.resources);
  }
}

export const generativeEngine = new GenerativeEngine();
