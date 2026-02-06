import type { GenerationParams } from './types';
import { getArmState } from './storage';

export interface TasteProfile {
  version: 1;
  topArms: GenerationParams;
  summary: string;
}

function getTopArm<T extends string>(arms: Record<T, { alpha: number; beta: number }>): T {
  let best: T | null = null;
  let bestScore = -Infinity;

  for (const [arm, dist] of Object.entries(arms) as [T, { alpha: number; beta: number }][]) {
    const score = dist.alpha / (dist.alpha + dist.beta);
    if (score > bestScore) {
      bestScore = score;
      best = arm;
    }
  }

  return best!;
}

function buildSummary(params: GenerationParams): string {
  const parts: string[] = [];

  const tempoLabel: Record<string, string> = {
    'focus': 'Slow', '60-70': 'Relaxed', '70-80': 'Medium',
    '80-90': 'Upbeat', '90-100': 'Fast',
  };

  const energyLabel: Record<string, string> = {
    low: 'Chill', medium: 'Moderate', high: 'Energetic',
  };

  const valenceLabel: Record<string, string> = {
    sad: 'Melancholic', neutral: 'Balanced', happy: 'Uplifting',
  };

  const danceLabel: Record<string, string> = {
    chill: 'Laid-back', groovy: 'Groovy', bouncy: 'Bouncy',
  };

  parts.push(energyLabel[params.energy] ?? params.energy);
  parts.push(valenceLabel[params.valence] ?? params.valence);
  parts.push(tempoLabel[params.tempo] ?? params.tempo);
  parts.push(danceLabel[params.danceability] ?? params.danceability);
  parts.push(params.mode === 'minor' ? 'Minor' : 'Major');

  return parts.join(', ');
}

export async function generateTasteProfile(): Promise<TasteProfile> {
  const armState = await getArmState();

  const topArms: GenerationParams = {
    tempo: getTopArm(armState.tempo),
    energy: getTopArm(armState.energy),
    valence: getTopArm(armState.valence),
    danceability: getTopArm(armState.danceability),
    mode: getTopArm(armState.mode),
  };

  return {
    version: 1,
    topArms,
    summary: buildSummary(topArms),
  };
}

export function encodeTasteProfile(profile: TasteProfile): string {
  const json = JSON.stringify(profile);
  if (typeof window !== 'undefined') {
    return btoa(json);
  }
  return Buffer.from(json).toString('base64');
}

export function decodeTasteProfile(encoded: string): TasteProfile | null {
  try {
    let json: string;
    if (typeof window !== 'undefined') {
      json = atob(encoded);
    } else {
      json = Buffer.from(encoded, 'base64').toString('utf-8');
    }

    const parsed = JSON.parse(json);
    if (parsed.version !== 1 || !parsed.topArms || !parsed.summary) {
      return null;
    }
    return parsed as TasteProfile;
  } catch {
    return null;
  }
}

export function getTasteProfileUrl(profile: TasteProfile): string {
  const encoded = encodeTasteProfile(profile);
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}?taste=${encoded}`;
}
