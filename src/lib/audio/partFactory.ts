import * as Tone from 'tone';
import type { ChordInfo } from './generators/chordProgressions';
import type { DrumPattern } from './generators/drumPatterns';
import type { SampledPiano } from './synths/sampledPiano';
import type { SampledDrums } from './synths/sampledDrums';

interface MelodyNote {
  time: string;
  note: string;
  duration: string;
  velocity: number;
}

export function createChordPart(
  piano: SampledPiano,
  chords: ChordInfo[],
  velocity: number
): Tone.Part {
  const events = chords.map((chord, index) => ({
    time: `${index}:0:0`,
    notes: chord.notes,
    duration: chord.duration,
  }));

  const part = new Tone.Part((time, event) => {
    piano.triggerAttackRelease(
      event.notes,
      event.duration,
      time,
      velocity * (0.85 + Math.random() * 0.15)
    );
  }, events);

  part.loop = true;
  part.loopEnd = `${chords.length}:0:0`;
  part.humanize = '32n';

  return part;
}

const LIVE_PROBABILITY = {
  kick: 0.92,
  snare: 0.88,
  hihat: 0.87,
};

export function createDrumPart(
  drums: SampledDrums,
  pattern: DrumPattern
): Tone.Part {
  const events = pattern.hits.map((hit) => ({
    time: hit.time,
    type: hit.type,
    velocity: hit.velocity,
  }));

  const part = new Tone.Part((time, event) => {
    const probability = LIVE_PROBABILITY[event.type];
    if (Math.random() > probability) return;

    const humanizedVelocity = event.velocity * (0.85 + Math.random() * 0.3);

    switch (event.type) {
      case 'kick':
        drums.triggerKick(time, humanizedVelocity);
        break;
      case 'snare':
        drums.triggerSnare(time, humanizedVelocity);
        break;
      case 'hihat':
        drums.triggerHihat(time, humanizedVelocity);
        break;
    }
  }, events);

  part.loop = true;
  part.loopEnd = `${pattern.lengthBars}:0:0`;
  part.humanize = true;

  return part;
}

export function createMelodyPart(
  melodySynth: SampledPiano,
  melodyNotes: MelodyNote[],
  loopLength: number
): Tone.Part {
  const part = new Tone.Part((time, event) => {
    melodySynth.triggerAttackRelease(
      event.note,
      event.duration,
      time,
      event.velocity * 0.85
    );
  }, melodyNotes);

  part.loop = true;
  part.loopEnd = `${loopLength}:0:0`;
  part.humanize = '32n';

  return part;
}
