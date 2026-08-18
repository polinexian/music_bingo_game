// ============================================================
// YouTube Data API v3 — Search for songs online
// Auto-finds video IDs when catalog entries have no youtubeId.
// Results are cached in IndexedDB (via storage.ts).
// ============================================================

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3/search';

/** Get the API key from Vite env vars (prefixed with VITE_) */
function getApiKey(): string {
  // @ts-ignore — Vite exposes VITE_ env vars
  return import.meta.env.VITE_YOUTUBE_API_KEY || '';
}

/**
 * Search YouTube for a song and return the first video ID.
 * Returns null if not found, no API key, or quota exceeded.
 */
export async function searchYouTubeSong(
  title: string,
  artist: string,
): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('No VITE_YOUTUBE_API_KEY set — cannot search YouTube');
    return null;
  }

  const query = encodeURIComponent(`${title} ${artist} 粵語`);
  const url = `${YT_API_BASE}?part=snippet&q=${query}&type=video&maxResults=3&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const reason = (err as any)?.error?.errors?.[0]?.reason || '';
      if (reason === 'quotaExceeded') {
        console.warn('YouTube API quota exceeded');
      }
      return null;
    }

    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) return null;

    // Pick the first result that looks like a music video (not a karaoke/tutorial)
    // Prioritize videos with "Official" or "Audio" in title, or shorter durations
    for (const item of items) {
      const vidTitle = item.snippet.title.toLowerCase();
      // Skip karaoke, instrumental, tutorial
      if (/(karaoke|伴奏|cover|tutorial|教學|guitar|piano)/i.test(vidTitle)) {
        continue;
      }
      return item.id.videoId;
    }

    // Fallback: just use the first result
    return items[0]?.id?.videoId || null;
  } catch (err) {
    console.warn('YouTube search failed:', err);
    return null;
  }
}

/**
 * Check if the YouTube Data API is configured (has API key).
 */
export function isYouTubeSearchAvailable(): boolean {
  return !!getApiKey();
}
