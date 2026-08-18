// ============================================================
// QQ Music Player — Plays songs via proxy audio streaming
// Same interface as youtubePlayer for easy swapping
// ============================================================

import { searchQQMusic } from './qqMusicSearch';

const PROXY_BASE = 'http://localhost:3001';

export interface QQMusicPlayerInstance {
  searchAndPlay(
    title: string,
    artist: string,
    fallbackSongmid: string,
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
  onError: ((msg: string) => void) | null;
  onSearchResult: ((songmid: string) => void) | null;
}

export function createQQMusicPlayer(): QQMusicPlayerInstance {
  let audio: HTMLAudioElement | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;

  const instance: QQMusicPlayerInstance = {
    onEnded: null,
    onError: null,
    onSearchResult: null,

    async searchAndPlay(
      title: string,
      artist: string,
      fallbackSongmid: string,
      startSeconds: number,
      durationSeconds: number,
      onSearching: () => void,
    ) {
      // Clean up previous
      instance.stop();

      let songmid = fallbackSongmid;

      // Search if no cached songmid
      if (!songmid || songmid.length < 5) {
        onSearching();
        const result = await searchQQMusic(title, artist);
        if (result) {
          songmid = result.songmid;
          instance.onSearchResult?.(songmid);
        } else {
          instance.onError?.('在 QQ 音樂找不到這首歌');
          return;
        }
      }

      // Create audio element and play
      const streamUrl = `${PROXY_BASE}/api/qq/stream/${songmid}`;

      audio = new Audio(streamUrl);
      audio.volume = 0.8;

      // Seek to start position once metadata loads
      audio.addEventListener('loadedmetadata', () => {
        if (audio && startSeconds > 0 && startSeconds < audio.duration) {
          audio.currentTime = startSeconds;
        }
      });

      // Auto-stop after duration
      audio.addEventListener('playing', () => {
        if (stopTimer) clearTimeout(stopTimer);
        stopTimer = setTimeout(() => {
          instance.stop();
          instance.onEnded?.();
        }, durationSeconds * 1000);
      });

      audio.addEventListener('ended', () => {
        if (stopTimer) clearTimeout(stopTimer);
        instance.onEnded?.();
      });

      audio.addEventListener('error', () => {
        instance.onError?.('音訊載入失敗，請檢查代理伺服器是否執行中');
      });

      try {
        await audio.play();
      } catch (err: any) {
        instance.onError?.(`播放失敗：${err.message || '無法播放'}`);
      }
    },

    pause() {
      if (audio) {
        audio.pause();
        if (stopTimer) clearTimeout(stopTimer);
      }
    },

    resume() {
      if (audio) audio.play();
    },

    stop() {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio = null;
      }
      if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
      }
    },

    setVolume(vol: number) {
      if (audio) {
        audio.volume = Math.max(0, Math.min(1, vol / 100));
      }
    },

    destroy() {
      instance.stop();
    },
  };

  return instance;
}
