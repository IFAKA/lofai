import * as Tone from 'tone';
import type { SynthResources } from './synthSetup';

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

export function createSequences(
  resources: SynthResources,
  callbacks: SequenceCallbacks
): Sequences {
  const chordSeq = new Tone.Sequence(() => callbacks.onChordTick(), [''], '1n');
  chordSeq.humanize = true;

  const melodySeq = new Tone.Sequence(() => callbacks.onMelodyTick(), [''], '8n');
  melodySeq.humanize = true;

  const kickSeq = new Tone.Sequence(
    (time, note) => {
      const { kickOff, kickEmphasis } = callbacks.getKickState();
      if (!kickOff && note === 'C4') {
        if (Math.random() < (0.6 + kickEmphasis * 0.35)) {
          resources.kick.triggerAttack('C4', time);
        }
      } else if (!kickOff && note === '.' && Math.random() < (kickEmphasis * 0.15)) {
        resources.kick.triggerAttack('C4', time);
      }
    },
    ['C4', '', '', '', '', '', '', 'C4', 'C4', '', '.', '', '', '', '', ''],
    '8n'
  );
  kickSeq.humanize = true;

  const snareSeq = new Tone.Sequence(
    (time, note) => {
      const { snareOff } = callbacks.getSnareState();
      if (!snareOff && note !== '' && Math.random() < 0.8) {
        resources.snare.triggerAttack('C4', time);
      }
    },
    ['', 'C4'],
    '2n'
  );
  snareSeq.humanize = true;

  const hatSeq = new Tone.Sequence(
    (time, note) => {
      const { hatOff, hihatActivity } = callbacks.getHatState();
      if (!hatOff && note !== '' && Math.random() < (0.5 + hihatActivity * 0.4)) {
        resources.hat.triggerAttack('C4', time);
      }
    },
    ['C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4'],
    '4n'
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
