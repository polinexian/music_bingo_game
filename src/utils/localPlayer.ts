// ============================================================
// Local MP3 Player — plays songs from E:/claude/song/ via proxy
// ============================================================

const PROXY_BASE = 'http://localhost:3001';

export interface LocalPlayerInstance {
  play(safeFilename: string, startSeconds: number, durationSeconds: number): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  setVolume(vol: number): void;
  destroy(): void;
  onEnded: (() => void) | null;
  onError: ((msg: string) => void) | null;
}

export function createLocalPlayer(): LocalPlayerInstance {
  let audio: HTMLAudioElement | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;
  let stopping = false; // Flag to suppress errors during cleanup

  function cleanAudio() {
    stopping = true;
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // Abort any pending requests
      audio = null;
    }
    stopping = false;
  }

  function setupAudio(url: string, startSeconds: number, durationSeconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
      cleanAudio();

      audio = new Audio();
      audio.volume = 0.8;

      const onMetadata = () => {
        if (audio && startSeconds > 0 && startSeconds < audio.duration) {
          audio.currentTime = startSeconds;
        }
      };

      const onPlaying = () => {
        if (stopTimer) clearTimeout(stopTimer);
        stopTimer = setTimeout(() => {
          instance.onEnded?.();
          cleanAudio();
        }, durationSeconds * 1000);
      };

      const onEnded = () => {
        if (!stopping) {
          if (stopTimer) clearTimeout(stopTimer);
          instance.onEnded?.();
          cleanAudio();
        }
      };

      const onError = () => {
        if (!stopping) {
          cleanAudio();
          reject(new Error('無法載入本地音檔'));
        }
      };

      audio.addEventListener('loadedmetadata', onMetadata, { once: true });
      audio.addEventListener('playing', onPlaying, { once: true });
      audio.addEventListener('ended', onEnded, { once: true });
      audio.addEventListener('error', onError, { once: true });

      audio.src = url;
      audio.load();

      audio.play().then(resolve).catch((err) => {
        if (!stopping) {
          cleanAudio();
          reject(new Error('播放失敗'));
        }
      });
    });
  }

  const instance: LocalPlayerInstance = {
    onEnded: null,
    onError: null,

    async play(safeFilename: string, startSeconds: number, durationSeconds: number) {
      const url = `${PROXY_BASE}/local/${encodeURIComponent(safeFilename)}`;
      try {
        await setupAudio(url, startSeconds, durationSeconds);
      } catch (err: any) {
        instance.onError?.(err.message);
      }
    },

    pause() {
      audio?.pause();
      if (stopTimer) clearTimeout(stopTimer);
    },

    resume() {
      audio?.play();
    },

    stop() {
      cleanAudio();
    },

    setVolume(vol) {
      if (audio) audio.volume = Math.max(0, Math.min(1, vol / 100));
    },

    destroy() {
      cleanAudio();
    },
  };

  return instance;
}
