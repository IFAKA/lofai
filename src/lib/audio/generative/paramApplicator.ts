import {
  TempoArm,
  EnergyArm,
  DanceabilityArm,
  ValenceArm,
  TEMPO_RANGES,
  ENERGY_PARAMS,
  DANCEABILITY_PARAMS,
  VALENCE_PARAMS,
} from '@/lib/preferences/types';
import type { TempoConfig } from './genreConfig';

export interface TempoResult {
  bpm: number;
}

export interface EnergyResult {
  melodyDensity: number;
  velocity: number;
  kickOff: boolean;
  snareOff: boolean;
}

export interface DanceabilityResult {
  swing: number;
  kickEmphasis: number;
  hihatActivity: number;
}

export interface ValenceResult {
  preferMinor: boolean;
}

export function computeTempoParams(tempoArm: TempoArm, tempoConfig?: TempoConfig): TempoResult {
  const ranges = tempoConfig?.ranges ?? TEMPO_RANGES;
  const multiplier = tempoConfig?.multiplier ?? 2;
  const range = ranges[tempoArm];
  const targetBpm = range.min + Math.random() * (range.max - range.min);
  return { bpm: Math.round(targetBpm * multiplier) };
}

export function computeEnergyParams(energyArm: EnergyArm): EnergyResult {
  const params = ENERGY_PARAMS[energyArm];
  return {
    melodyDensity: params.density,
    velocity: params.velocity,
    kickOff: params.instruments < 3,
    snareOff: params.instruments < 4,
  };
}

export function computeDanceabilityParams(danceabilityArm: DanceabilityArm): DanceabilityResult {
  const params = DANCEABILITY_PARAMS[danceabilityArm];
  return {
    swing: params.swing,
    kickEmphasis: params.kickEmphasis,
    hihatActivity: params.hihatActivity,
  };
}

export function computeValenceParams(valenceArm: ValenceArm): ValenceResult {
  const params = VALENCE_PARAMS[valenceArm];
  return { preferMinor: params.useMinor };
}
