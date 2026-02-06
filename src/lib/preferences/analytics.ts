import { getRecentSongLogs } from './storage';
import type { GenerationParams } from './types';

export interface DailyStat {
  date: string;
  songCount: number;
  listenMinutes: number;
  likeCount: number;
  skipCount: number;
}

export interface ParamPopularity {
  param: string;
  arm: string;
  count: number;
  likeRatio: number;
}

function toDateStr(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export async function getDailyStats(days: number = 14): Promise<DailyStat[]> {
  const logs = await getRecentSongLogs(500);
  const cutoff = Date.now() - days * 86400000;

  const byDate = new Map<string, DailyStat>();

  for (const log of logs) {
    if (log.startTime < cutoff) continue;
    const date = toDateStr(log.startTime);

    const existing = byDate.get(date) ?? {
      date,
      songCount: 0,
      listenMinutes: 0,
      likeCount: 0,
      skipCount: 0,
    };

    existing.songCount++;
    existing.listenMinutes += log.listenDuration / 60;
    if (log.explicitFeedback === 'like') existing.likeCount++;
    if (log.skipped) existing.skipCount++;

    byDate.set(date, existing);
  }

  // Fill in missing days
  const result: DailyStat[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push(byDate.get(dateStr) ?? {
      date: dateStr,
      songCount: 0,
      listenMinutes: 0,
      likeCount: 0,
      skipCount: 0,
    });
  }

  return result;
}

export async function getParamPopularity(): Promise<ParamPopularity[]> {
  const logs = await getRecentSongLogs(500);

  const counts = new Map<string, { count: number; likes: number }>();

  for (const log of logs) {
    const params = log.params;
    if (!params) continue;

    for (const [param, arm] of Object.entries(params) as [keyof GenerationParams, string][]) {
      const key = `${param}:${arm}`;
      const existing = counts.get(key) ?? { count: 0, likes: 0 };
      existing.count++;
      if (log.explicitFeedback === 'like') existing.likes++;
      counts.set(key, existing);
    }
  }

  return Array.from(counts.entries())
    .map(([key, { count, likes }]) => {
      const [param, arm] = key.split(':');
      return { param, arm, count, likeRatio: count > 0 ? likes / count : 0 };
    })
    .sort((a, b) => b.count - a.count);
}

export function summarizeTopPreferences(popularity: ParamPopularity[]): string[] {
  const topByParam = new Map<string, ParamPopularity>();

  for (const p of popularity) {
    const existing = topByParam.get(p.param);
    if (!existing || p.count > existing.count) {
      topByParam.set(p.param, p);
    }
  }

  return Array.from(topByParam.values())
    .map(p => `${p.param}: ${p.arm}`)
    .slice(0, 5);
}
