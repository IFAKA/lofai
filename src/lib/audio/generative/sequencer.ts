import * as Tone from 'tone';
import type { SynthResources } from './synthSetup';
import type { DrumConfig, MelodyConfig } from './genreConfig';

export interface SequenceCallbacks {
  onChordTick: () => void;
  onMelodyTick: () => void;
  getKickState: () => { kickOff: boolean; kickEmphasis: number };
  getSnareState: () => { snareOff: boolean };
  getHatState: () => { hatOff: boolean; hihatActivity: number };
}

export interface Sequences {
  chordSeq: Tone.Sequence;
  melodySeq: Tone.Sequence;
  kickSeq: Tone.Sequence;
  snareSeq: Tone.Sequence;
  hatSeq: Tone.Sequence;
}

// Default patterns matching original lo-fi hardcoded values
const DEFAULT_KICK_PATTERN: (string | null)[] = ['C4', null, null, null, null, null, null, 'C4', 'C4', null, '.', null, null, null, null, null];
const DEFAULT_SNARE_PATTERN: (string | null)[] = [null, 'C4'];
const DEFAULT_HAT_PATTERN: (string | null)[] = ['C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4'];

export function createSequences(
  resources: SynthResources,
  callbacks: SequenceCallbacks,
  drumConfig?: DrumConfig,
  melodyConfig?: MelodyConfig,
  danceability?: 'chill' | 'groovy' | 'bouncy',
): Sequences {
  const chordSeq = new Tone.Sequence(() => callbacks.onChordTick(), [''], '1n');
  chordSeq.humanize = true;

  const melodySubdivision = melodyConfig?.subdivision ?? '8n';
  const melodySeq = new Tone.Sequence(() => callbacks.onMelodyTick(), [''], melodySubdivision);
  melodySeq.humanize = true;

  // Select drum patterns based on config and danceability level
  const level = danceability ?? 'chill';
  const pattern = drumConfig?.patterns[level];
  const kickPattern = pattern?.kick ?? DEFAULT_KICK_PATTERN;
  const snarePattern = pattern?.snare ?? DEFAULT_SNARE_PATTERN;
  const hatPattern = pattern?.hat ?? DEFAULT_HAT_PATTERN;
  const kickSubdivision = pattern?.subdivision ?? '8n';
  const snareSubdivision = pattern?.snareSubdivision ?? pattern?.subdivision ?? '2n';
  const hatSubdivision = pattern?.hatSubdivision ?? pattern?.subdivision ?? '4n';
  const kickProb = drumConfig?.kickProbability ?? 0.6;
  const snareProb = drumConfig?.snareProbability ?? 0.8;
  const hatProb = drumConfig?.hatProbability ?? 0.5;

  const kickSeq = new Tone.Sequence(
    (time, note) => {
      const { kickOff, kickEmphasis } = callbacks.getKickState();
      if (!kickOff && note === 'C4') {
        if (Math.random() < (kickProb + kickEmphasis * 0.35)) {
          resources.kick.triggerAttack('C4', time);
        }
      } else if (!kickOff && note === '.' && Math.random() < (kickEmphasis * 0.15)) {
        resources.kick.triggerAttack('C4', time);
      }
    },
    kickPattern,
    kickSubdivision
  );
  kickSeq.humanize = true;

  const snareSeq = new Tone.Sequence(
    (time, note) => {
      const { snareOff } = callbacks.getSnareState();
      if (snareOff || note === null || note === '') return;
      if (note === '.') {
        if (Math.random() < 0.5) {
          resources.snare.triggerAttack('C4', time, 0.3);
        }
      } else if (Math.random() < snareProb) {
        resources.snare.triggerAttack('C4', time);
      }
    },
    snarePattern,
    snareSubdivision
  );
  snareSeq.humanize = true;

  const hatSeq = new Tone.Sequence(
    (time, note) => {
      const { hatOff, hihatActivity } = callbacks.getHatState();
      if (hatOff || note === null || note === '') return;
      if (note === '.') {
        if (Math.random() < 0.5) {
          resources.hat.triggerAttack('C4', time, 0.3);
        }
      } else if (Math.random() < (hatProb + hihatActivity * 0.4)) {
        resources.hat.triggerAttack('C4', time);
      }
    },
    hatPattern,
    hatSubdivision
  );
  hatSeq.humanize = true;

  return { chordSeq, melodySeq, kickSeq, snareSeq, hatSeq };
}

export function startSequences(seqs: Sequences): void {
  seqs.chordSeq.start(0);
  seqs.melodySeq.start(0);
  seqs.kickSeq.start(0);
  seqs.snareSeq.start(0);
  seqs.hatSeq.start(0);
}

export function stopSequences(seqs: Sequences): void {
  seqs.chordSeq.stop();
  seqs.melodySeq.stop();
  seqs.kickSeq.stop();
  seqs.snareSeq.stop();
  seqs.hatSeq.stop();
}

export function disposeSequences(seqs: Sequences): void {
  seqs.chordSeq.dispose();
  seqs.melodySeq.dispose();
  seqs.kickSeq.dispose();
  seqs.snareSeq.dispose();
  seqs.hatSeq.dispose();
}
