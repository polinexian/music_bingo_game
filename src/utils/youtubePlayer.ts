// ============================================================
// YouTube IFrame API Wrapper
// Auto-plays clips from chorus, handles all playback control.
// The host never sees YouTube — just hears the music.
// ============================================================

const YT_API_URL = 'https://www.youtube.com/iframe_api';

let apiReady = false;
let apiLoadPromise: Promise<void> | null = null;

/** Load the YouTube IFrame API once */
function loadYTAPI(): Promise<void> {
  if (apiReady) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise<void>((resolve) => {
    // If already loaded by another script
    if ((window as any).YT && (window as any).YT.Player) {
      apiReady = true;
      resolve();
      return;
    }

    // Set callback before injecting script
    const prevCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      apiReady = true;
      if (prevCallback) prevCallback();
      resolve();
    };

    const tag = document.createElement('script');
    tag.src = YT_API_URL;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
  });

  return apiLoadPromise;
}

export interface YouTubePlayerInstance {
  playClip(videoId: string, startSeconds: number, durationSeconds: number): Promise<void>;
  /** Search YouTube for a song and play it automatically */
  searchAndPlay(
    title: string,
    artist: string,
    fallbackId: string,
    startSeconds: number,
    durationSeconds: number,
    onSearching: () => void,
  ): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  setVolume(vol: number): void;
  destroy(): void;
  onEnded: (() => void) | null;
  onError: ((error: string) => void) | null;
  onReady: (() => void) | null;
  onSearchResult: ((videoId: string) => void) | null;
}

/**
 * Create a hidden YouTube player for audio-only playback.
 * The player div is created off-screen — invisible to the host.
 */
export function createYouTubePlayer(): YouTubePlayerInstance {
  let player: any = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;
  let isPaused = false;
  let currentDuration = 30;

  const instance: YouTubePlayerInstance = {
    onEnded: null,
    onError: null,
    onReady: null,
    onSearchResult: null,

    async searchAndPlay(
      title: string,
      artist: string,
      fallbackId: string,
      startSeconds: number,
      durationSeconds: number,
      onSearching: () => void,
    ) {
      // If we have a direct ID, use it
      if (fallbackId && fallbackId.length > 5) {
        return this.playClip(fallbackId, startSeconds, durationSeconds);
      }

      // Need to search YouTube
      onSearching();

      try {
        const { searchYouTubeSong } = await import('./youtubeSearch');
        const foundId = await searchYouTubeSong(title, artist);

        if (foundId) {
          // Cache the found ID
          this.onSearchResult?.(foundId);
          return this.playClip(foundId, startSeconds, durationSeconds);
        }

        // No result found — try a simpler search without 粵語 tag
        // (already handled in searchYouTubeSong)
        this.onError?.('找不到這首歌的線上版本');
      } catch {
        this.onError?.('搜尋歌曲時發生錯誤');
      }
    },

    async playClip(videoId: string, startSeconds: number, durationSeconds: number) {
      if (!videoId || videoId.length < 5) {
        this.onError?.('沒有影片 ID，無法播放');
        return;
      }
      await loadYTAPI();
      currentDuration = durationSeconds;

      // Create or reuse hidden player container
      let container = document.getElementById('yt-hidden-player');
      if (!container) {
        container = document.createElement('div');
        container.id = 'yt-hidden-player';
        container.style.cssText =
          'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(container);
      }

      // Destroy previous player if exists
      if (player) {
        try { player.destroy(); } catch (_) { /* ignore */ }
      }

      isPaused = false;
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }

      return new Promise<void>((resolve, reject) => {
        player = new (window as any).YT.Player('yt-hidden-player', {
          height: '1',
          width: '1',
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            start: Math.floor(startSeconds),
          },
          events: {
            onReady: () => {
              player.setVolume(80);
              instance.onReady?.();
              resolve();

              // Auto-stop after duration
              stopTimer = setTimeout(() => {
                player.pauseVideo();
                instance.onEnded?.();
              }, durationSeconds * 1000);
            },
            onStateChange: (event: any) => {
              // YT.PlayerState.ENDED = 0
              if (event.data === 0) {
                if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
                instance.onEnded?.();
              }
            },
            onError: (event: any) => {
              const errors = ['', '影片無法播放', '參數錯誤', '影片不存在或無法播放', '不支援的影片格式'];
              const msg = errors[event.data] || `播放錯誤 (${event.data})`;
              instance.onError?.(msg);
              reject(new Error(msg));
            },
          },
        });
      });
    },

    pause() {
      if (player && !isPaused) {
        player.pauseVideo();
        isPaused = true;
        if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
      }
    },

    resume() {
      if (player && isPaused) {
        player.playVideo();
        isPaused = false;
        // Resume the stop timer with remaining duration... simplified: just don't auto-stop
      }
    },

    stop() {
      if (player) {
        player.pauseVideo();
        player.seekTo(0);
        isPaused = false;
        if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
      }
    },

    setVolume(vol: number) {
      if (player) {
        player.setVolume(Math.max(0, Math.min(100, vol)));
      }
    },

    destroy() {
      if (player) {
        try { player.destroy(); } catch (_) { /* ignore */ }
        player = null;
      }
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
      const container = document.getElementById('yt-hidden-player');
      if (container) container.remove();
    },
  };

  return instance;
}
