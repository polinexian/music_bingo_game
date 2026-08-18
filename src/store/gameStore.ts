// ============================================================
// Zustand Game Store — Single source of truth for Music Bingo
// ============================================================

import { create } from 'zustand';
import type { Song, BingoCard, GamePhase, GameSettings, GameState } from '../types';

const defaultSettings: GameSettings = {
  gridSize: 5,
  cardCount: 50,
  songCount: 25,
  clipDuration: 30,
  autoAdvance: false,
  selectedDecades: ['70s', '80s', '90s'],
  musicSource: 'local',
};

export const useGameStore = create<GameState>((set) => ({
  // --- State ---
  catalog: [],
  selectedSongIds: [],
  cards: [],
  phase: 'setup',
  currentSongId: null,
  isPlaying: false,
  calledSongIds: [],
  currentRound: 0,
  settings: { ...defaultSettings },

  // --- Actions ---
  setCatalog: (songs: Song[]) =>
    set({ catalog: songs }),

  selectSongs: (ids: string[]) =>
    set({ selectedSongIds: ids }),

  setSettings: (s: Partial<GameSettings>) =>
    set((state) => ({ settings: { ...state.settings, ...s } })),

  setCards: (cards: BingoCard[]) =>
    set({ cards }),

  setPhase: (phase: GamePhase) =>
    set({ phase }),

  playSong: (songId: string) =>
    set({
      currentSongId: songId,
      isPlaying: true,
      phase: 'playing',
    }),

  pauseSong: () =>
    set({ isPlaying: false, phase: 'paused' }),

  resumeSong: () =>
    set({ isPlaying: true, phase: 'playing' }),

  stopSong: () =>
    set({ isPlaying: false, currentSongId: null }),

  markCalled: (songId: string) =>
    set((state) => {
      if (state.calledSongIds.includes(songId)) return state;
      return {
        calledSongIds: [...state.calledSongIds, songId],
        currentRound: state.currentRound + 1,
        currentSongId: null,
        isPlaying: false,
      };
    }),

  undoLastCall: () =>
    set((state) => {
      if (state.calledSongIds.length === 0) return state;
      return {
        calledSongIds: state.calledSongIds.slice(0, -1),
        currentRound: state.currentRound - 1,
      };
    }),

  nextRound: () =>
    set((state) => ({
      currentRound: state.currentRound + 1,
      currentSongId: null,
      isPlaying: false,
    })),

  resetGame: () =>
    set({
      selectedSongIds: [],
      cards: [],
      phase: 'setup',
      currentSongId: null,
      isPlaying: false,
      calledSongIds: [],
      currentRound: 0,
    }),
}));
