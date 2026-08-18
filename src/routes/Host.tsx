import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import SongLibrary from '../components/host/SongLibrary';
import GameSettings from '../components/host/GameSettings';
import CardGenerator from '../components/host/CardGenerator';
import GameControls from '../components/host/GameControls';
import CalledSongsList from '../components/host/CalledSongsList';
import WinVerifier from '../components/host/WinVerifier';
import { loadCatalog } from '../utils/storage';
import { createYouTubePlayer } from '../utils/youtubePlayer';
import { createQQMusicPlayer } from '../utils/qqMusicPlayer';
import { createLocalPlayer } from '../utils/localPlayer';
import type { YouTubePlayerInstance } from '../utils/youtubePlayer';
import type { QQMusicPlayerInstance } from '../utils/qqMusicPlayer';
import type { LocalPlayerInstance } from '../utils/localPlayer';

let youtubeInstance: YouTubePlayerInstance | null = null;
let qqMusicInstance: QQMusicPlayerInstance | null = null;
let localInstance: LocalPlayerInstance | null = null;

function getYoutubePlayer() { if (!youtubeInstance) youtubeInstance = createYouTubePlayer(); return youtubeInstance; }
function getQQMusicPlayer() { if (!qqMusicInstance) qqMusicInstance = createQQMusicPlayer(); return qqMusicInstance; }
function getLocalPlayer() { if (!localInstance) localInstance = createLocalPlayer(); return localInstance; }

/** Build full display state snapshot from store */
function buildDisplayState() {
  const state = useGameStore.getState();
  const calledSongs = state.calledSongIds
    .map((id) => state.catalog.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => ({ id: s!.id, title: s!.title, artist: s!.artist }));

  const currentSong = state.currentSongId
    ? state.catalog.find((s) => s.id === state.currentSongId)
    : null;

  return {
    currentSong: currentSong
      ? { title: currentSong.title, artist: currentSong.artist, year: currentSong.year }
      : null,
    isPlaying: state.isPlaying,
    calledSongIds: state.calledSongIds,
    calledSongs,
    currentRound: state.currentRound,
    totalSongs: state.settings.songCount,
    phase: state.phase,
  };
}

export default function Host() {
  const phase = useGameStore((s) => s.phase);
  const catalog = useGameStore((s) => s.catalog);
  const setCatalog = useGameStore((s) => s.setCatalog);
  const resetGame = useGameStore((s) => s.resetGame);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Load catalog on mount
  useEffect(() => {
    if (catalog.length === 0) {
      loadCatalog().then((songs) => {
        if (songs.length > 0) setCatalog(songs);
      });
    }
  }, []);

  // Listen for display connection requests
  useEffect(() => {
    const channel = new BroadcastChannel('music-bingo');
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type === 'display-ready') {
        // Display tab just opened — send full state
        channel.postMessage(buildDisplayState());
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-dark p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-title md:text-display-sm text-accent-gold">
          🎵 音樂賓果
        </h1>
        <div className="flex gap-3">
          {phase !== 'setup' && (
            <button
              onClick={resetGame}
              className="btn-secondary text-body-sm py-2 px-4 min-w-0 min-h-0"
            >
              重新開始
            </button>
          )}
          <a
            href="/display"
            target="_blank"
            className="btn-primary text-body-sm py-2 px-4 min-w-0 min-h-0"
            rel="noreferrer"
          >
            開啟投影畫面
          </a>
        </div>
      </header>

      {/* Phase indicator */}
      <PhaseIndicator phase={phase} />

      {/* Content by phase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {phase === 'setup' && (
            <>
              <SongLibrary />
              <GameSettings />
            </>
          )}
          {(phase === 'ready' || phase === 'playing' || phase === 'paused') && (
            <GameControls
              youtubePlayer={getYoutubePlayer()}
              qqMusicPlayer={getQQMusicPlayer()}
              localPlayer={getLocalPlayer()}
            />
          )}
          {phase === 'verifying' && <WinVerifier />}
          {phase === 'finished' && <GameFinished />}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {phase === 'setup' && <CardGenerator />}
          {(phase === 'ready' || phase === 'playing' || phase === 'paused' || phase === 'verifying' || phase === 'finished') && (
            <CalledSongsList />
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: string }) {
  const labels: Record<string, { text: string; color: string }> = {
    setup: { text: '設定階段', color: 'text-text-muted' },
    ready: { text: '準備開始', color: 'text-accent-green' },
    playing: { text: '遊戲進行中', color: 'text-accent-gold' },
    paused: { text: '已暫停', color: 'text-text-muted' },
    verifying: { text: '驗證賓果中', color: 'text-accent-gold' },
    finished: { text: '遊戲結束', color: 'text-accent-green' },
  };
  const info = labels[phase] || labels.setup;

  return (
    <div className="mb-6 text-center">
      <span className={`text-subtitle font-bold ${info.color}`}>
        {info.text}
      </span>
    </div>
  );
}

function GameFinished() {
  const resetGame = useGameStore((s) => s.resetGame);
  return (
    <div className="card text-center space-y-6 py-12">
      <div className="display-text-lg text-accent-gold">🎉 恭喜！</div>
      <p className="text-subtitle text-text-light">遊戲結束，感謝參與！</p>
      <button onClick={resetGame} className="btn-primary">
        開始新遊戲
      </button>
    </div>
  );
}
