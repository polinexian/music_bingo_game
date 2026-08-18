// ============================================================
// IndexedDB persistence for song catalog
// ============================================================

import { openDB } from 'idb';
import type { Song } from '../types';
import catalogData from '../../data/songCatalog.json';

const DB_NAME = 'music-bingo';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('songs')) {
        db.createObjectStore('songs', { keyPath: 'id' });
      }
    },
  });
}

/** Load catalog: try IndexedDB first, fallback to bundled JSON */
export async function loadCatalog(): Promise<Song[]> {
  try {
    const db = await getDB();
    const count = await db.count('songs');
    if (count > 0) {
      const songs = await db.getAll('songs');
      return songs as Song[];
    }
  } catch {
    // IndexedDB not available, use bundled
  }

  // Fallback to bundled catalog
  return catalogData as Song[];
}

/** Save catalog to IndexedDB */
export async function saveCatalog(songs: Song[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('songs', 'readwrite');
    await Promise.all([
      ...songs.map((s) => tx.store.put(s)),
      tx.done,
    ]);
  } catch {
    console.warn('無法儲存歌曲目錄到 IndexedDB');
  }
}

/** Save a found YouTube video ID for a song */
export async function saveSongYoutubeId(
  songId: string,
  youtubeId: string,
): Promise<void> {
  try {
    const db = await getDB();
    const song = await db.get('songs', songId);
    if (song) {
      song.youtubeId = youtubeId;
      await db.put('songs', song);
    }
  } catch {
    // ignore
  }
}

/** Save a found QQ Music songmid for a song */
export async function saveSongQQMusicId(
  songId: string,
  songmid: string,
): Promise<void> {
  try {
    const db = await getDB();
    const song = await db.get('songs', songId);
    if (song) {
      song.songmid = songmid;
      await db.put('songs', song);
    }
  } catch {
    // ignore
  }
}

/** Get cached QQ Music songmid for a song */
export async function getSongQQMusicId(songId: string): Promise<string | null> {
  try {
    const db = await getDB();
    const song = await db.get('songs', songId);
    return song?.songmid || null;
  } catch {
    return null;
  }
}

/** Get cached YouTube video ID for a song */
export async function getSongYoutubeId(songId: string): Promise<string | null> {
  try {
    const db = await getDB();
    const song = await db.get('songs', songId);
    return song?.youtubeId || null;
  } catch {
    return null;
  }
}

/** Save a single value */
export async function saveValue(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    if (!db.objectStoreNames.contains('settings')) {
      db.close();
      const db2 = await openDB(DB_NAME, DB_VERSION + 1, {
        upgrade(d) {
          if (!d.objectStoreNames.contains('settings')) {
            d.createObjectStore('settings');
          }
        },
      });
      await db2.put('settings', value, key);
      db2.close();
      return;
    }
    await db.put('settings', value, key);
  } catch {
    // ignore
  }
}

/** Load a single value */
export async function loadValue<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    if (!db.objectStoreNames.contains('settings')) return null;
    return (await db.get('settings', key)) as T | null;
  } catch {
    return null;
  }
}
