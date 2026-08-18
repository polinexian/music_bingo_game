import { useCallback, useRef, useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { YouTubePlayerInstance } from '../../utils/youtubePlayer';
import type { QQMusicPlayerInstance } from '../../utils/qqMusicPlayer';
import type { LocalPlayerInstance } from '../../utils/localPlayer';
import { saveSongYoutubeId, saveSongQQMusicId } from '../../utils/storage';
import { scanLocalFiles, matchLocalToCatalog } from '../../utils/localScanner';

interface Props {
  youtubePlayer: YouTubePlayerInstance;
  qqMusicPlayer: QQMusicPlayerInstance;
  localPlayer: LocalPlayerInstance;
}

export default function GameControls({ youtubePlayer, qqMusicPlayer, localPlayer }: Props) {
  const [localFileMap, setLocalFileMap] = useState<Map<string, string>>(new Map());
  const catalog = useGameStore((s) => s.catalog);

  // Scan local files on mount, match to catalog
  useEffect(() => {
    (async () => {
      const files = await scanLocalFiles();
      const map = matchLocalToCatalog(catalog, files);
      setLocalFileMap(map);
      if (map.size > 0) console.log(`Matched ${map.size} local songs to catalog`);
    })();
  }, [catalog]);
  const selectedSongIds = useGameStore((s) => s.selectedSongIds);
  const calledSongIds = useGameStore((s) => s.calledSongIds);
  const currentSongId = useGameStore((s) => s.currentSongId);
  const isPlaying = useGameStore((s) => s.isPlaying);
  const phase = useGameStore((s) => s.phase);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const settings = useGameStore((s) => s.settings);

  const playSong = useGameStore((s) => s.playSong);
  const pauseSong = useGameStore((s) => s.pauseSong);
  const resumeSong = useGameStore((s) => s.resumeSong);
  const stopSong = useGameStore((s) => s.stopSong);
  const markCalled = useGameStore((s) => s.markCalled);
  const undoLastCall = useGameStore((s) => s.undoLastCall);
  const setPhase = useGameStore((s) => s.setPhase);

  const currentSong = catalog.find((s) => s.id === currentSongId);
  const calledSet = new Set(calledSongIds);

  // Get available songs (selected for game, not yet called)
  const availableSongs = catalog.filter(
    (s) => selectedSongIds.includes(s.id) && !calledSet.has(s.id),
  );

  const broadcast = useCallback(
    (data: Record<string, any>) => {
      const channel = new BroadcastChannel('music-bingo');
      channel.postMessage(data);
      setTimeout(() => channel.close(), 100);
    },
    [],
  );

  const handlePlayRandom = async () => {
    if (availableSongs.length === 0) {
      alert('所有歌曲已播放完畢！');
      return;
    }

    const song = availableSongs[Math.floor(Math.random() * availableSongs.length)];
    const duration = settings.clipDuration >= 999 ? 300 : settings.clipDuration;
    const clipStart = song.clipStart || 45;
    const isQQMusic = settings.musicSource === 'qqmusic';
    const isLocal = settings.musicSource === 'local';
    const activePlayer = isLocal ? null : (isQQMusic ? qqMusicPlayer : youtubePlayer);

    // --- LOCAL PLAYBACK ---
    if (isLocal) {
      const safeFilename = localFileMap.get(song.id);
      if (!safeFilename) {
        alert(`找不到本地檔案：${song.title} — ${song.artist}`);
        return;
      }
      localPlayer.onEnded = () => {
        if (settings.autoAdvance) {
          markCalled(song.id);
          broadcast({
            calledSongIds: [...calledSongIds, song.id],
            calledSongs: getCalledSongsData([...calledSongIds, song.id]),
            isPlaying: false, currentSong: null,
          });
        } else { stopSong(); broadcast({ isPlaying: false }); }
      };
      localPlayer.onError = (msg) => { alert(`播放失敗：${msg}`); stopSong(); };
      try {
        await localPlayer.play(safeFilename, clipStart, duration);
        playSong(song.id);
        broadcast({ currentSong: { title: song.title, artist: song.artist, year: song.year }, isPlaying: true });
      } catch { stopSong(); }
      return;
    }

    // --- ONLINE PLAYBACK (NetEase / YouTube) ---
    activePlayer!.onSearchResult = (foundId: string) => {
      if (isQQMusic) { saveSongQQMusicId(song.id, foundId); song.songmid = foundId; }
      else { saveSongYoutubeId(song.id, foundId); song.youtubeId = foundId; }
    };
    activePlayer!.onError = (msg: string) => { setIsSearching(false); setSearchStatus(''); alert(`播放失敗：${msg}`); stopSong(); };
    activePlayer!.onEnded = () => {
      setIsSearching(false); setSearchStatus('');
      if (settings.autoAdvance) {
        markCalled(song.id);
        broadcast({ calledSongIds: [...calledSongIds, song.id], calledSongs: getCalledSongsData([...calledSongIds, song.id]), isPlaying: false, currentSong: null });
      } else { stopSong(); broadcast({ isPlaying: false }); }
    };

    try {
      const fallbackId = isQQMusic ? (song.songmid || '') : song.youtubeId;
      await activePlayer!.searchAndPlay(song.title, song.artist, fallbackId, clipStart, duration, () => {
        setIsSearching(true);
        setSearchStatus(`正在搜尋 ${isQQMusic ? '網易雲音樂' : 'YouTube'}：${song.title} — ${song.artist}...`);
      });
      setIsSearching(false); setSearchStatus('');
      playSong(song.id);
      broadcast({ currentSong: { title: song.title, artist: song.artist, year: song.year }, isPlaying: true });
    } catch (err: any) {
      setIsSearching(false); setSearchStatus('');
      if (err.message) alert(`播放失敗：${err.message}`);
      stopSong();
    }
  };

  const getActivePlayer = () => {
    if (settings.musicSource === 'local') return localPlayer;
    return settings.musicSource === 'qqmusic' ? qqMusicPlayer : youtubePlayer;
  };

  const handlePause = () => {
    getActivePlayer().pause();
    pauseSong();
    broadcast({ isPlaying: false });
  };

  const handleResume = () => {
    getActivePlayer().resume();
    resumeSong();
    broadcast({ isPlaying: true });
  };

  const handleStop = () => {
    getActivePlayer().stop();
    stopSong();
    broadcast({ isPlaying: false, currentSong: null });
  };

  const handleMarkCalled = () => {
    if (!currentSongId) return;
    const newCalled = [...calledSongIds, currentSongId];
    markCalled(currentSongId);
    broadcast({
      calledSongIds: newCalled,
      calledSongs: getCalledSongsData(newCalled),
      isPlaying: false,
      currentSong: null,
      currentRound: newCalled.length,
    });
    getActivePlayer().stop();
  };

  const handleSkip = () => {
    getActivePlayer().stop();
    if (currentSongId) {
      // Don't mark as called, just move on
      stopSong();
      broadcast({ isPlaying: false, currentSong: null });
    }
  };

  const handleUndo = () => {
    undoLastCall();
    const newCalled = calledSongIds.slice(0, -1);
    broadcast({
      calledSongIds: newCalled,
      calledSongs: getCalledSongsData(newCalled),
      currentRound: newCalled.length,
    });
  };

  const handleReplay = async () => {
    if (!currentSong || !currentSongId) return;
    const isLocal = settings.musicSource === 'local';
    const isQQ = settings.musicSource === 'qqmusic';
    const activePlayer = isLocal ? localPlayer : (isQQ ? qqMusicPlayer : youtubePlayer);
    activePlayer.stop();
    const duration = settings.clipDuration >= 999 ? 300 : settings.clipDuration;

    if (isLocal) {
      const safeFilename = localFileMap.get(currentSong.id);
      if (!safeFilename) { alert('找不到本地檔案'); return; }
      try {
        await localPlayer.play(safeFilename, currentSong.clipStart || 45, duration);
        playSong(currentSongId);
        broadcast({ isPlaying: true });
      } catch { /* ignore */ }
      return;
    }

    const fallbackId = isQQ ? (currentSong.songmid || '') : currentSong.youtubeId;
    try {
      await (activePlayer as QQMusicPlayerInstance | YouTubePlayerInstance).searchAndPlay(
        currentSong.title,
        currentSong.artist,
        fallbackId,
        currentSong.clipStart || 45,
        duration,
        () => {
          setIsSearching(true);
          setSearchStatus('重新搜尋中...');
        },
      );
      setIsSearching(false);
      setSearchStatus('');
      playSong(currentSongId);
      broadcast({ isPlaying: true });
    } catch {
      setIsSearching(false);
      setSearchStatus('');
    }
  };

  // If in 'ready' phase, show start button
  if (phase === 'ready') {
    return (
      <div className="card text-center space-y-6 py-10">
        <p className="text-title text-accent-gold">🎵 準備就緒！</p>
        <p className="text-body text-text-muted">
          已生成賓果卡，按下「開始」播放第一首歌曲
        </p>
        <button onClick={handlePlayRandom} className="btn-primary text-display-sm px-12 py-6">
          ▶ 播放隨機歌曲
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-subtitle font-bold mb-4">🎮 遊戲控制</h2>

      {/* Searching indicator */}
      {isSearching && (
        <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-xl p-4 mb-4 text-center">
          <p className="text-subtitle text-accent-gold font-bold">
            🔍 搜尋中...
          </p>
          <p className="text-body-sm text-text-muted mt-1">
            {searchStatus}
          </p>
        </div>
      )}

      {/* Now playing info */}
      {currentSong && !isSearching && (
        <div className="bg-bg-dark rounded-xl p-4 mb-4 text-center">
          <p className="text-body text-text-muted mb-1">現正播放</p>
          <p className="text-title text-accent-gold">{currentSong.title}</p>
          <p className="text-subtitle text-text-light">{currentSong.artist}</p>
          {currentSong.year && (
            <p className="text-body-sm text-text-muted">{currentSong.year}</p>
          )}
        </div>
      )}

      {!currentSong && !isSearching && (
        <p className="text-body text-text-muted text-center mb-4 py-4">
          按下「播放隨機歌曲」開始
        </p>
      )}

      {/* Main play button */}
      <div className="text-center mb-4">
        <button onClick={handlePlayRandom} className="btn-primary text-title px-10 py-5">
          ▶ 播放隨機歌曲
        </button>
      </div>

      {/* Transport controls */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {isPlaying && (
          <button onClick={handlePause} className="btn-secondary text-body">
            ⏸ 暫停
          </button>
        )}
        {phase === 'paused' && (
          <button onClick={handleResume} className="btn-primary text-body">
            ▶ 繼續
          </button>
        )}
        <button onClick={handleReplay} disabled={!currentSongId} className={`btn-secondary text-body ${!currentSongId ? 'opacity-40' : ''}`}>
          🔄 重播
        </button>
        <button onClick={handleSkip} className="btn-secondary text-body">
          ⏭ 跳過
        </button>
        <button onClick={handleStop} disabled={!isPlaying && phase !== 'paused'} className={`btn-danger text-body ${!isPlaying && phase !== 'paused' ? 'opacity-40' : ''}`}>
          ⏹ 停止
        </button>
      </div>

      {/* Mark called / Undo */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        <button
          onClick={handleMarkCalled}
          disabled={!currentSongId}
          className={`btn-success text-body px-8 ${!currentSongId ? 'opacity-40' : ''}`}
        >
          ✅ 標記為已叫出
        </button>
        <button
          onClick={handleUndo}
          disabled={calledSongIds.length === 0}
          className={`btn-danger text-body ${calledSongIds.length === 0 ? 'opacity-40' : ''}`}
        >
          ↩ 復原上一步
        </button>
      </div>

      {/* Verify bingo */}
      <div className="text-center">
        <button
          onClick={() => setPhase('verifying')}
          className="text-body-sm text-accent-gold hover:underline bg-transparent min-w-0 min-h-0 p-1"
        >
          🔍 驗證賓果
        </button>
      </div>

      {/* Remaining songs */}
      <p className="text-body-sm text-text-muted text-center mt-3">
        剩餘未播放：{availableSongs.length} 首 | 已播放：{calledSongIds.length} 首
      </p>
    </div>
  );
}

/** Helper to get called songs data for broadcast */
function getCalledSongsData(calledIds: string[]) {
  const store = useGameStore.getState();
  return calledIds
    .map((id) => {
      const song = store.catalog.find((s) => s.id === id);
      return song ? { id: song.id, title: song.title, artist: song.artist } : null;
    })
    .filter(Boolean);
}
