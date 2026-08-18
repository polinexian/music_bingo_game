import { useState, useEffect } from 'react';
import type { GameState } from '../types';
import NowPlaying from '../components/display/NowPlaying';
import BingoGrid from '../components/display/BingoGrid';
import GameStatus from '../components/display/GameStatus';

/** Snapshot of game state received via BroadcastChannel */
interface DisplayState {
  currentSong: { title: string; artist: string; year?: string } | null;
  isPlaying: boolean;
  calledSongIds: string[];
  calledSongs: { id: string; title: string; artist: string }[];
  currentRound: number;
  totalSongs: number;
  phase: string;
}

export default function Display() {
  const [state, setState] = useState<DisplayState>({
    currentSong: null,
    isPlaying: false,
    calledSongIds: [],
    calledSongs: [],
    currentRound: 0,
    totalSongs: 0,
    phase: 'setup',
  });

  useEffect(() => {
    const channel = new BroadcastChannel('music-bingo');

    channel.onmessage = (event: MessageEvent) => {
      const data = event.data as Partial<DisplayState>;
      setState((prev) => ({ ...prev, ...data }));
    };

    // Request initial state from host
    channel.postMessage({ type: 'display-ready' });

    return () => {
      channel.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* Now Playing — top 35% */}
      <div className="flex-[3] flex items-center justify-center p-4">
        <NowPlaying
          song={state.currentSong}
          isPlaying={state.isPlaying}
        />
      </div>

      {/* Called Songs Grid — middle 50% */}
      <div className="flex-[5] flex items-center justify-center p-4">
        <BingoGrid
          calledSongs={state.calledSongs}
          gridSize={5}
        />
      </div>

      {/* Game Status — bottom 15% */}
      <div className="flex-[2] flex items-center justify-center p-4">
        <GameStatus
          currentRound={state.currentRound}
          totalSongs={state.totalSongs}
          phase={state.phase}
        />
      </div>
    </div>
  );
}
