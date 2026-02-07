import { describe, it, expect, beforeEach } from 'vitest';
import { exportAllData, validateImportData, importAllData, type ExportData } from '../dataTransfer';
import { getDB } from '../storage';
import { createDefaultArmState } from '../types';

// fake-indexeddb is loaded in setup.ts

describe('exportAllData', () => {
  beforeEach(async () => {
    // Clear all databases by deleting and recreating
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });

  it('returns data with correct structure', async () => {
    const data = await exportAllData();
    expect(data.version).toBe(2);
    expect(data.exportedAt).toBeTruthy();
    expect(Array.isArray(data.songLogs)).toBe(true);
    expect(Array.isArray(data.feedbackEvents)).toBe(true);
    expect(typeof data.settings).toBe('object');
  });

  it('includes arm state when available', async () => {
    const db = await getDB();
    const armState = createDefaultArmState();
    await db.put('armState', armState, 'current');

    const data = await exportAllData();
    expect(data.armState).not.toBeNull();
    expect(data.armState?.tempo).toBeDefined();
  });
});

describe('validateImportData', () => {
  it('accepts valid export data', () => {
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      armState: null,
      songLogs: [],
      feedbackEvents: [],
      settings: {},
    };
    expect(validateImportData(data)).toBe(true);
  });

  it('rejects null', () => {
    expect(validateImportData(null)).toBe(false);
  });

  it('rejects missing version', () => {
    expect(validateImportData({ songLogs: [], feedbackEvents: [] })).toBe(false);
  });

  it('rejects future version', () => {
    expect(validateImportData({ version: 999, songLogs: [], feedbackEvents: [] })).toBe(false);
  });

  it('rejects missing songLogs', () => {
    expect(validateImportData({ version: 1, feedbackEvents: [] })).toBe(false);
  });

  it('rejects non-array feedbackEvents', () => {
    expect(validateImportData({ version: 1, songLogs: [], feedbackEvents: 'bad' })).toBe(false);
  });
});

describe('importAllData', () => {
  beforeEach(async () => {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });

  it('imports arm state into IndexedDB', async () => {
    const armState = createDefaultArmState();
    armState.tempo['focus'].alpha = 10;

    await importAllData({
      version: 1,
      exportedAt: new Date().toISOString(),
      armState,
      songLogs: [],
      feedbackEvents: [],
      settings: {},
    });

    const db = await getDB();
    const imported = await db.get('armState', 'current');
    expect(imported?.tempo['focus'].alpha).toBe(10);
  });

  it('imports song logs into IndexedDB', async () => {
    const songLog = {
      id: 'test-song-1',
      params: { tempo: 'focus' as const, energy: 'low' as const, valence: 'neutral' as const, danceability: 'chill' as const, mode: 'minor' as const },
      startTime: Date.now(),
      listenDuration: 60,
      totalDuration: 100,
      skipped: false,
    };

    await importAllData({
      version: 1,
      exportedAt: new Date().toISOString(),
      armState: null,
      songLogs: [songLog],
      feedbackEvents: [],
      settings: {},
    });

    const db = await getDB();
    const imported = await db.get('songLogs', 'test-song-1');
    expect(imported?.id).toBe('test-song-1');
  });
});
