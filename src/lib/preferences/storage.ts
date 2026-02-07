import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  ArmState,
  SongLog,
  FeedbackEvent,
  createDefaultArmState,
} from './types';
import type { GenreId } from '@/lib/audio/generative/genreConfig';

interface SeedtoneDB extends DBSchema {
  armState: {
    key: string;
    value: ArmState;
  };
  songLogs: {
    key: string;
    value: SongLog;
    indexes: { 'by-time': number };
  };
  feedbackEvents: {
    key: string;
    value: FeedbackEvent;
    indexes: { 'by-time': number; 'by-song': string };
  };
  modelCache: {
    key: string;
    value: ArrayBuffer;
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'seedtone-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SeedtoneDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<SeedtoneDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SeedtoneDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('armState')) {
          db.createObjectStore('armState');
        }

        if (!db.objectStoreNames.contains('songLogs')) {
          const songStore = db.createObjectStore('songLogs', { keyPath: 'id' });
          songStore.createIndex('by-time', 'startTime');
        }

        if (!db.objectStoreNames.contains('feedbackEvents')) {
          const feedbackStore = db.createObjectStore('feedbackEvents', {
            keyPath: 'timestamp',
          });
          feedbackStore.createIndex('by-time', 'timestamp');
          feedbackStore.createIndex('by-song', 'songId');
        }

        if (!db.objectStoreNames.contains('modelCache')) {
          db.createObjectStore('modelCache');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

function armStateKey(genre?: GenreId): string {
  // 'lofi' uses 'current' for backward compatibility with existing data
  if (!genre || genre === 'lofi') return 'current';
  return genre;
}

export async function getArmState(genre?: GenreId): Promise<ArmState> {
  const db = await getDB();
  const key = armStateKey(genre);
  const state = await db.get('armState', key);
  if (state) return state;
  return createDefaultArmState();
}

export async function saveArmState(state: ArmState, genre?: GenreId): Promise<void> {
  const db = await getDB();
  await db.put('armState', state, armStateKey(genre));
}

export async function getAllArmStates(): Promise<Record<string, ArmState>> {
  const db = await getDB();
  const keys = await db.getAllKeys('armState');
  const result: Record<string, ArmState> = {};
  for (const key of keys) {
    const state = await db.get('armState', key);
    if (state) result[key] = state;
  }
  return result;
}

export async function saveSongLog(log: SongLog): Promise<void> {
  const db = await getDB();
  await db.put('songLogs', log);
}

export async function getSongLog(id: string): Promise<SongLog | undefined> {
  const db = await getDB();
  return db.get('songLogs', id);
}

export async function getRecentSongLogs(limit: number = 100): Promise<SongLog[]> {
  const db = await getDB();
  const logs = await db.getAllFromIndex('songLogs', 'by-time');
  return logs.slice(-limit).reverse();
}

export async function getSongCount(): Promise<number> {
  const db = await getDB();
  return db.count('songLogs');
}

export async function saveFeedbackEvent(event: FeedbackEvent): Promise<void> {
  const db = await getDB();
  await db.put('feedbackEvents', event);
}

export async function getFeedbackEventsForSong(songId: string): Promise<FeedbackEvent[]> {
  const db = await getDB();
  return db.getAllFromIndex('feedbackEvents', 'by-song', songId);
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const value = await db.get('settings', key);
  return (value as T) ?? defaultValue;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}

export async function getSessionStartTime(): Promise<number | null> {
  return getSetting<number | null>('sessionStartTime', null);
}

export async function setSessionStartTime(time: number): Promise<void> {
  return setSetting('sessionStartTime', time);
}

export async function clearSessionStartTime(): Promise<void> {
  const db = await getDB();
  await db.delete('settings', 'sessionStartTime');
}

export async function getListeningStats(): Promise<{
  totalSongs: number;
  totalListenTime: number;
  averageListenRatio: number;
  likeCount: number;
  skipCount: number;
}> {
  const db = await getDB();
  const logs = await db.getAll('songLogs');

  const totalSongs = logs.length;
  const totalListenTime = logs.reduce((sum, log) => sum + log.listenDuration, 0);
  const averageListenRatio = totalSongs > 0
    ? logs.reduce((sum, log) => sum + (log.listenDuration / log.totalDuration), 0) / totalSongs
    : 0;
  const likeCount = logs.filter(log => log.explicitFeedback === 'like').length;
  const skipCount = logs.filter(log => log.skipped).length;

  return {
    totalSongs,
    totalListenTime,
    averageListenRatio,
    likeCount,
    skipCount,
  };
}
