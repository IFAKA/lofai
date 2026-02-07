import {
  ArmDistribution,
  GenerationParams,
  TempoArm,
  EnergyArm,
  ValenceArm,
  DanceabilityArm,
  ModeArm,
} from './types';
import { getArmState, saveArmState } from './storage';
import { useSettingsStore, getAllowedTempoArms } from '@/stores/settingsStore';
import type { GenreId } from '@/lib/audio/generative/genreConfig';

function gammaVariate(shape: number): number {
  if (shape < 1) {
    return gammaVariate(1 + shape) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number;
    let v: number;

    do {
      x = gaussianRandom();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * (x * x) * (x * x)) {
      return d * v;
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function sampleBeta(alpha: number, beta: number): number {
  const x = gammaVariate(alpha);
  const y = gammaVariate(beta);
  return x / (x + y);
}

export function selectArm<T extends string>(
  arms: Record<T, ArmDistribution>,
  allowedArms?: T[],
  explorationBias: number = 0.5
): T {
  const armEntries = (Object.entries(arms) as [T, ArmDistribution][])
    .filter(([name]) => !allowedArms || allowedArms.includes(name));

  if (armEntries.length === 0) {
    throw new Error(`No allowed arms found. Allowed: ${allowedArms?.join(', ')}, Available: ${Object.keys(arms).join(', ')}`);
  }

  let bestArm: T | null = null;
  let bestScore = -1;

  for (const [armName, dist] of armEntries) {
    let score: number;

    if (explorationBias >= 1) {
      score = Math.random();
    } else if (explorationBias <= 0) {
      score = dist.alpha / (dist.alpha + dist.beta);
    } else {
      const thompsonSample = sampleBeta(dist.alpha, dist.beta);
      const randomSample = Math.random();
      score = (1 - explorationBias) * thompsonSample + explorationBias * randomSample;
    }

    if (score > bestScore) {
      bestScore = score;
      bestArm = armName;
    }
  }

  return bestArm!;
}

export async function selectGenerationParams(genre?: GenreId): Promise<GenerationParams> {
  const { bpmMin, bpmMax, explorationLevel, genre: storeGenre } = useSettingsStore.getState();
  const activeGenre = genre ?? storeGenre;
  const armState = await getArmState(activeGenre);

  const allowedTempoArms = getAllowedTempoArms(bpmMin, bpmMax, activeGenre) as TempoArm[];

  return {
    tempo: selectArm<TempoArm>(armState.tempo, allowedTempoArms, explorationLevel),
    energy: selectArm<EnergyArm>(armState.energy, undefined, explorationLevel),
    valence: selectArm<ValenceArm>(armState.valence, undefined, explorationLevel),
    danceability: selectArm<DanceabilityArm>(armState.danceability, undefined, explorationLevel),
    mode: selectArm<ModeArm>(armState.mode, undefined, explorationLevel),
  };
}

export function updateArmDist(dist: ArmDistribution, reward: number): ArmDistribution {
  if (reward > 0) {
    return { alpha: dist.alpha + reward, beta: dist.beta };
  } else {
    return { alpha: dist.alpha, beta: dist.beta + Math.abs(reward) };
  }
}

export async function updateArmsForSong(
  params: GenerationParams,
  reward: number,
  genre?: GenreId
): Promise<void> {
  const activeGenre = genre ?? useSettingsStore.getState().genre;
  const armState = await getArmState(activeGenre);

  armState.tempo[params.tempo] = updateArmDist(armState.tempo[params.tempo], reward);
  armState.energy[params.energy] = updateArmDist(armState.energy[params.energy], reward);
  armState.valence[params.valence] = updateArmDist(armState.valence[params.valence], reward);
  armState.danceability[params.danceability] = updateArmDist(armState.danceability[params.danceability], reward);
  armState.mode[params.mode] = updateArmDist(armState.mode[params.mode], reward);

  await saveArmState(armState, activeGenre);
}

export async function getExploitationRatio(genre?: GenreId): Promise<number> {
  const activeGenre = genre ?? useSettingsStore.getState().genre;
  const armState = await getArmState(activeGenre);

  let totalConfidence = 0;
  let armCount = 0;

  const allArms = [
    ...Object.values(armState.tempo),
    ...Object.values(armState.energy),
    ...Object.values(armState.valence),
    ...Object.values(armState.danceability),
    ...Object.values(armState.mode),
  ];

  for (const arm of allArms) {
    const total = arm.alpha + arm.beta;
    const skew = Math.abs(arm.alpha - arm.beta) / total;
    totalConfidence += Math.min(1, (total - 2) / 50) * (0.5 + 0.5 * skew);
    armCount++;
  }

  return totalConfidence / armCount;
}

export async function getCurrentBestParams(genre?: GenreId): Promise<GenerationParams> {
  const activeGenre = genre ?? useSettingsStore.getState().genre;
  const armState = await getArmState(activeGenre);

  const getBest = <T extends string>(arms: Record<T, ArmDistribution>): T => {
    let best: T | null = null;
    let bestMean = -1;

    for (const [name, dist] of Object.entries(arms) as [T, ArmDistribution][]) {
      const mean = dist.alpha / (dist.alpha + dist.beta);
      if (mean > bestMean) {
        bestMean = mean;
        best = name;
      }
    }

    return best!;
  };

  return {
    tempo: getBest<TempoArm>(armState.tempo),
    energy: getBest<EnergyArm>(armState.energy),
    valence: getBest<ValenceArm>(armState.valence),
    danceability: getBest<DanceabilityArm>(armState.danceability),
    mode: getBest<ModeArm>(armState.mode),
  };
}

export async function resetArms(genre?: GenreId): Promise<void> {
  const activeGenre = genre ?? useSettingsStore.getState().genre;
  const { createDefaultArmState } = await import('./types');
  await saveArmState(createDefaultArmState(), activeGenre);
}
