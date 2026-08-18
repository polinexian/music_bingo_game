// ============================================================
// QQ Music Search — Search for songs via the proxy server
// ============================================================

const PROXY_BASE = 'http://localhost:3001';

interface QQSearchResult {
  songmid: string;
  songname: string;
  singer: string;
}

/**
 * Search QQ Music for a song. Returns the best matching songmid.
 * Falls back to a simpler query if the first search has no results.
 */
export async function searchQQMusic(
  title: string,
  artist: string,
): Promise<QQSearchResult | null> {
  // Try full query first
  const query1 = `${title} ${artist}`;
  const result = await doSearch(query1);
  if (result) return result;

  // Fallback: just the title
  const result2 = await doSearch(title);
  return result2;
}

async function doSearch(query: string): Promise<QQSearchResult | null> {
  try {
    const url = `${PROXY_BASE}/api/qq/search?q=${encodeURIComponent(query)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;

    const data = await resp.json();
    const songs: QQSearchResult[] = data.songs || [];

    if (songs.length === 0) return null;

    // Pick the first result (usually the best match)
    return songs[0];
  } catch {
    return null;
  }
}

/**
 * Pre-populate songmid values by batch searching.
 * Used by the populate-qq-ids script logic.
 */
export async function batchSearchQQMusic(
  songs: { title: string; artist: string }[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  let done = 0;

  for (const song of songs) {
    const key = `${song.title}|${song.artist}`;
    const result = await searchQQMusic(song.title, song.artist);
    if (result) {
      results.set(key, result.songmid);
    }
    done++;
    onProgress?.(done, songs.length);
    // Small delay to be polite to QQ Music servers
    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}
