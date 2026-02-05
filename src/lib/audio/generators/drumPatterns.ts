import { DanceabilityArm, EnergyArm } from '@/lib/preferences/types';

export interface DrumHit {
  type: 'kick' | 'snare' | 'hihat';
  time: string;
  velocity: number;
}

export interface DrumPattern {
  name: string;
  hits: DrumHit[];
  lengthBars: number;
}

function stepToTime(bar: number, step: number): string {
  const quarter = Math.floor(step / 4);
  const sixteenth = step % 4;
  return `${bar}:${quarter}:${sixteenth}`;
}

function createPattern(
  kicks: number[],
  snares: number[],
  hihats: number[],
  name: string
): DrumPattern {
  const hits: DrumHit[] = [
    ...kicks.map((step) => ({ type: 'kick' as const, time: stepToTime(0, step), velocity: 0.9 })),
    ...snares.map((step) => ({ type: 'snare' as const, time: stepToTime(0, step), velocity: 0.8 })),
    ...hihats.map((step) => ({ type: 'hihat' as const, time: stepToTime(0, step), velocity: 0.8 })),
  ];
  return { name, hits, lengthBars: 1 };
}

const PATTERNS: Record<DanceabilityArm, DrumPattern[]> = {
  chill: [
    createPattern([0, 7, 8], [4, 12], [0, 4, 8, 12], 'chill-lofi'),
    createPattern([0, 8], [4, 12], [0, 4, 8, 12], 'chill-simple'),
  ],
  groovy: [
    createPattern([0, 7, 8], [4, 12], [0, 2, 4, 6, 8, 10, 12, 14], 'groovy-lofi'),
    createPattern([0, 6, 8], [4, 12], [0, 2, 4, 6, 8, 10, 12, 14], 'groovy-sync'),
  ],
  bouncy: [
    createPattern([0, 4, 7, 8, 12], [4, 12], [0, 2, 4, 6, 8, 10, 12, 14], 'bouncy-active'),
    createPattern([0, 6, 8, 14], [4, 12], [0, 2, 4, 6, 8, 10, 12, 14], 'bouncy-drive'),
  ],
};

const ENERGY_VELOCITY: Record<EnergyArm, number> = {
  low: 0.75,
  medium: 0.9,
  high: 1.0,
};

const ENERGY_HAT_DENSITY: Record<EnergyArm, number> = {
  low: 0.5,
  medium: 0.75,
  high: 1.0,
};

export function generateDrumPattern(
  danceability: DanceabilityArm,
  energy: EnergyArm
): DrumPattern {
  const pool = PATTERNS[danceability];
  const base = pool[Math.floor(Math.random() * pool.length)];
  const velocityMult = ENERGY_VELOCITY[energy];
  const hatDensity = ENERGY_HAT_DENSITY[energy];

  const adjustedHits = base.hits
    .filter((hit) => {
      if (hit.type !== 'hihat') return true;
      const sixteenth = parseInt(hit.time.split(':')[2], 10);
      if (sixteenth === 0) return true;
      return Math.random() < hatDensity;
    })
    .map((hit) => ({ ...hit, velocity: hit.velocity * velocityMult }));

  return { ...base, hits: adjustedHits };
}

export function extendPattern(pattern: DrumPattern, bars: number): DrumPattern {
  const extendedHits: DrumHit[] = [];

  for (let bar = 0; bar < bars; bar++) {
    for (const hit of pattern.hits) {
      const parts = hit.time.split(':');
      const time = `${bar}:${parts[1]}:${parts[2]}`;
      extendedHits.push({ ...hit, time });
    }
  }

  return { name: `${pattern.name}-x${bars}`, hits: extendedHits, lengthBars: bars };
}
