'use client';

import type { GenerationParams } from '@/lib/preferences/types';

interface LearnedPreferencesProps {
  bestParams: GenerationParams | null;
}

export function LearnedPreferences({ bestParams }: LearnedPreferencesProps) {
  if (!bestParams) return null;

  const rows = [
    { label: 'Tempo', value: `${bestParams.tempo} BPM` },
    { label: 'Energy', value: bestParams.energy },
    { label: 'Mood', value: bestParams.valence },
    { label: 'Feel', value: bestParams.danceability },
    { label: 'Mode', value: bestParams.mode },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-text text-sm">Learned Preferences</h3>
      <div className="glass-light rounded-xl p-5 space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="text-text-muted">{label}</span>
            <span className="text-text capitalize">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
