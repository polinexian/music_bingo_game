// ============================================================
// 音樂賓果 Music Bingo — Type Definitions
// ============================================================

export type MusicSource = 'local' | 'qqmusic' | 'youtube';

/** A song in the catalog */
export interface Song {
  id: string;
  title: string;        // 歌曲名稱
  artist: string;       // 歌手
  year?: string;        // 年份
  decade?: '70s' | '80s' | '90s';  // 年代
  youtubeId: string;    // YouTube video ID
  songmid?: string;     // QQ Music songmid
  clipStart: number;    // 副歌開始秒數 (default 30-60)
}

/** A single cell on a bingo card */
export interface BingoCell {
  songId: string;
  title: string;
  artist: string;
  isFree?: boolean;     // 免費空格
  isCalled?: boolean;
}

/** A full bingo card */
export interface BingoCard {
  id: string;           // e.g., "CARD-001"
  gridSize: number;     // 4 or 5
  cells: BingoCell[][]; // rows × cols
}

/** Game phase */
export type GamePhase =
  | 'setup'       // 選擇歌曲、設定
  | 'ready'       // 已生成卡片，等待開始
  | 'playing'     // 遊戲進行中
  | 'paused'      // 暫停
  | 'verifying'   // 驗證賓果中
  | 'finished';   // 遊戲結束

/** Game settings */
export interface GameSettings {
  gridSize: number;          // 4 or 5
  cardCount: number;         // 要生成多少張卡片
  songCount: number;         // 遊戲使用多少首歌
  clipDuration: number;      // 播放秒數 (15/30/45/999)
  autoAdvance: boolean;      // 播完自動標記
  selectedDecades: string[]; // 選擇的年代
  musicSource: MusicSource;  // 'qqmusic' | 'youtube'
}

/** Overall game state */
export interface GameState {
  // 歌曲庫
  catalog: Song[];                 // 完整歌曲目錄
  selectedSongIds: string[];       // 本局選用的歌曲

  // 賓果卡
  cards: BingoCard[];

  // 遊戲進行
  phase: GamePhase;
  currentSongId: string | null;
  isPlaying: boolean;
  calledSongIds: string[];         // 已叫出的歌曲 (ordered)
  currentRound: number;

  // 設定
  settings: GameSettings;

  // 操作
  setCatalog: (songs: Song[]) => void;
  selectSongs: (ids: string[]) => void;
  setSettings: (s: Partial<GameSettings>) => void;
  setCards: (cards: BingoCard[]) => void;
  setPhase: (phase: GamePhase) => void;
  playSong: (songId: string) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  stopSong: () => void;
  markCalled: (songId: string) => void;
  undoLastCall: () => void;
  nextRound: () => void;
  resetGame: () => void;
}

/** Win check result */
export interface WinResult {
  isBingo: boolean;
  winningLine?: {
    type: 'row' | 'col' | 'diag';
    index: number;
    cells: BingoCell[];
  };
  missingCells?: { row: number; col: number; title: string }[];
}
