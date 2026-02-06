import { getDB } from './storage';
import type { ArmState, SongLog, FeedbackEvent } from './types';

const EXPORT_VERSION = 1;

export interface ExportData {
  version: number;
  exportedAt: string;
  armState: ArmState | null;
  songLogs: SongLog[];
  feedbackEvents: FeedbackEvent[];
  settings: Record<string, unknown>;
}

export async function exportAllData(): Promise<ExportData> {
  const db = await getDB();

  const armState = (await db.get('armState', 'current')) ?? null;
  const songLogs = await db.getAll('songLogs');
  const feedbackEvents = await db.getAll('feedbackEvents');

  // Collect settings from localStorage (persisted by zustand)
  const settings: Record<string, unknown> = {};
  try {
    const settingsRaw = localStorage.getItem('lofai-settings');
    if (settingsRaw) {
      settings.zustand = JSON.parse(settingsRaw);
    }

    const onboardingComplete = localStorage.getItem('lofai-onboarding-complete');
    if (onboardingComplete) {
      settings.onboardingComplete = onboardingComplete === 'true';
    }
  } catch {
    // localStorage may not be available in test/SSR environments
  }

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    armState,
    songLogs,
    feedbackEvents,
    settings,
  };
}

export function downloadJson(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `lofai-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateImportData(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  if (typeof d.version !== 'number') return false;
  if (d.version > EXPORT_VERSION) return false;
  if (!Array.isArray(d.songLogs)) return false;
  if (!Array.isArray(d.feedbackEvents)) return false;

  return true;
}

export async function importAllData(data: ExportData): Promise<void> {
  const db = await getDB();

  // Import arm state
  if (data.armState) {
    await db.put('armState', data.armState, 'current');
  }

  // Import song logs
  for (const log of data.songLogs) {
    await db.put('songLogs', log);
  }

  // Import feedback events
  for (const event of data.feedbackEvents) {
    await db.put('feedbackEvents', event);
  }

  // Import settings to localStorage
  try {
    if (data.settings?.zustand) {
      localStorage.setItem('lofai-settings', JSON.stringify(data.settings.zustand));
    }

    if (typeof data.settings?.onboardingComplete === 'boolean') {
      localStorage.setItem('lofai-onboarding-complete', String(data.settings.onboardingComplete));
    }
  } catch {
    // localStorage may not be available in test/SSR environments
  }
}
