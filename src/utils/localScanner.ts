// ============================================================
// Local File Scanner — matches E:/claude/song/*.mp3 to catalog
// ============================================================

import type { Song } from '../types';

interface LocalFile {
  filename: string;  // e.g., "仙杜拉 - 啼笑姻缘.mp3"
  name: string;      // e.g., "仙杜拉 - 啼笑姻缘"
}

/** Scan local song folder via the proxy */
export async function scanLocalFiles(): Promise<LocalFile[]> {
  try {
    const resp = await fetch('http://localhost:3001/api/local/scan');
    const data = await resp.json();
    return data.files || [];
  } catch {
    return [];
  }
}

/** Match catalog songs to local files by fuzzy filename matching */
export function matchLocalToCatalog(
  catalog: Song[],
  localFiles: LocalFile[],
): Map<string, string> {
  const map = new Map<string, string>(); // catalogId → safeFilename

  for (const song of catalog) {
    const safeName = `${song.artist} - ${song.title}`.replace(/[/\\:*?"<>|]/g, '_');
    // Try exact match first
    const exact = localFiles.find((f) => f.name === safeName);
    if (exact) {
      map.set(song.id, `${exact.filename}`);
      continue;
    }
    // Try case-insensitive
    const ci = localFiles.find((f) => f.name.toLowerCase() === safeName.toLowerCase());
    if (ci) {
      map.set(song.id, `${ci.filename}`);
      continue;
    }
    // Try contains match
    const contains = localFiles.find(
      (f) => f.name.includes(song.title) && f.name.includes(song.artist),
    );
    if (contains) {
      map.set(song.id, `${contains.filename}`);
    }
  }

  return map;
}

/** Get the playable URL for a local file */
export function getLocalUrl(filename: string): string {
  return `http://localhost:3001/local/${encodeURIComponent(filename)}`;
}
