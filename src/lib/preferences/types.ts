export type TempoArm = 'focus' | '60-70' | '70-80' | '80-90' | '90-100';
export type EnergyArm = 'low' | 'medium' | 'high';
export type ValenceArm = 'sad' | 'neutral' | 'happy';
export type DanceabilityArm = 'chill' | 'groovy' | 'bouncy';
export type ModeArm = 'major' | 'minor';

export interface ArmDistribution {
  alpha: number;
  beta: number;
}

export interface ArmState {
  tempo: Record<TempoArm, ArmDistribution>;
  energy: Record<EnergyArm, ArmDistribution>;
  valence: Record<ValenceArm, ArmDistribution>;
  danceability: Record<DanceabilityArm, ArmDistribution>;
  mode: Record<ModeArm, ArmDistribution>;
}

export interface GenerationParams {
  tempo: TempoArm;
  energy: EnergyArm;
  valence: ValenceArm;
  danceability: DanceabilityArm;
  mode: ModeArm;
}

export interface SongLog {
  id: string;
  params: GenerationParams;
  startTime: number;
  endTime?: number;
  listenDuration: number;
  totalDuration: number;
  skipped: boolean;
  explicitFeedback?: 'like' | 'dislike';
  reward?: number;
}

export interface FeedbackEvent {
  songId: string;
  timestamp: number;
  type: 'listen_end' | 'skip' | 'like' | 'dislike' | 'session_bonus';
  listenRatio?: number;
  reward: number;
}

export const REWARD_WEIGHTS = {
  LISTEN_90_PLUS: 1.0,
  LISTEN_50_90: 0.3,
  LISTEN_UNDER_30: -0.5,
  SKIP_UNDER_10_SEC: -1.0,
  EXPLICIT_LIKE: 1.5,
  EXPLICIT_DISLIKE: -1.5,
  SESSION_BONUS: 0.5,
} as const;

export function createDefaultArmState(): ArmState {
  return {
    tempo: {
      'focus': { alpha: 3, beta: 1 },
      '60-70': { alpha: 2, beta: 1 },
      '70-80': { alpha: 1, beta: 1 },
      '80-90': { alpha: 1, beta: 1.5 },
      '90-100': { alpha: 1, beta: 2 },
    },
    energy: {
      low: { alpha: 2, beta: 1 },
      medium: { alpha: 2, beta: 1 },
      high: { alpha: 1, beta: 1.5 },
    },
    valence: {
      sad: { alpha: 1, beta: 1 },
      neutral: { alpha: 1, beta: 1 },
      happy: { alpha: 1, beta: 1 },
    },
    danceability: {
      chill: { alpha: 2, beta: 1 },
      groovy: { alpha: 1.5, beta: 1 },
      bouncy: { alpha: 1, beta: 1.5 },
    },
    mode: {
      major: { alpha: 1, beta: 1 },
      minor: { alpha: 1, beta: 1 },
    },
  };
}

export const TEMPO_RANGES: Record<TempoArm, { min: number; max: number }> = {
  'focus': { min: 60, max: 72 },
  '60-70': { min: 70, max: 78 },
  '70-80': { min: 78, max: 86 },
  '80-90': { min: 86, max: 94 },
  '90-100': { min: 94, max: 102 },
};

export const ENERGY_PARAMS: Record<EnergyArm, { velocity: number; density: number; instruments: number }> = {
  low: { velocity: 0.6, density: 0.3, instruments: 2 },
  medium: { velocity: 0.75, density: 0.5, instruments: 3 },
  high: { velocity: 0.9, density: 0.7, instruments: 4 },
};

export const VALENCE_PARAMS: Record<ValenceArm, { useMinor: boolean; extensions: string[] }> = {
  sad: { useMinor: true, extensions: ['7', 'm7', 'dim7'] },
  neutral: { useMinor: false, extensions: ['7', 'maj7'] },
  happy: { useMinor: false, extensions: ['maj7', '6', 'add9'] },
};

export const DANCEABILITY_PARAMS: Record<DanceabilityArm, { swing: number; kickEmphasis: number; hihatActivity: number }> = {
  chill: { swing: 0.45, kickEmphasis: 0.5, hihatActivity: 0.3 },
  groovy: { swing: 0.55, kickEmphasis: 0.65, hihatActivity: 0.5 },
  bouncy: { swing: 0.65, kickEmphasis: 0.8, hihatActivity: 0.7 },
};
