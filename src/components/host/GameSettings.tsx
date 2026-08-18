import { useGameStore } from '../../store/gameStore';

export default function GameSettings() {
  const settings = useGameStore((s) => s.settings);
  const setSettings = useGameStore((s) => s.setSettings);
  const selectedSongIds = useGameStore((s) => s.selectedSongIds);

  const maxSongs = selectedSongIds.length || 50;

  return (
    <div className="card">
      <h2 className="text-subtitle font-bold mb-4">⚙️ 遊戲設定</h2>

      <div className="space-y-5">
        {/* Grid size */}
        <div>
          <label className="text-body-sm font-semibold block mb-2">賓果卡大小</label>
          <div className="flex gap-3">
            {[4, 5].map((size) => (
              <button
                key={size}
                onClick={() => setSettings({ gridSize: size })}
                className={`text-body px-6 py-3 rounded-xl min-w-0 min-h-0 font-semibold ${
                  settings.gridSize === size
                    ? 'bg-accent-gold text-bg-dark'
                    : 'bg-bg-dark text-text-muted hover:text-text-light'
                }`}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </div>

        {/* Song count */}
        <div>
          <label className="text-body-sm font-semibold block mb-2">
            本局使用歌曲數量：{settings.songCount} 首
          </label>
          <input
            type="range"
            min={settings.gridSize * settings.gridSize}
            max={Math.min(maxSongs, 100)}
            value={settings.songCount}
            onChange={(e) => setSettings({ songCount: Number(e.target.value) })}
            className="w-full h-3 accent-accent-gold"
            style={{ minHeight: '24px' }}
          />
          <p className="text-body-sm text-text-muted mt-1">
            最少需要 {settings.gridSize * settings.gridSize} 首（賓果卡格子數）
          </p>
        </div>

        {/* Card count */}
        <div>
          <label className="text-body-sm font-semibold block mb-2">
            生成卡片數量：{settings.cardCount} 張
          </label>
          <input
            type="range"
            min={1}
            max={200}
            step={5}
            value={settings.cardCount}
            onChange={(e) => setSettings({ cardCount: Number(e.target.value) })}
            className="w-full h-3 accent-accent-gold"
            style={{ minHeight: '24px' }}
          />
        </div>

        {/* Clip duration */}
        <div>
          <label className="text-body-sm font-semibold block mb-2">播放片段長度</label>
          <div className="flex gap-3 flex-wrap">
            {[
              { value: 15, label: '15 秒' },
              { value: 30, label: '30 秒' },
              { value: 45, label: '45 秒' },
              { value: 999, label: '全首' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSettings({ clipDuration: opt.value })}
                className={`text-body px-5 py-2 rounded-xl min-w-0 min-h-0 font-semibold ${
                  settings.clipDuration === opt.value
                    ? 'bg-accent-gold text-bg-dark'
                    : 'bg-bg-dark text-text-muted hover:text-text-light'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Music source */}
        <div>
          <label className="text-body-sm font-semibold block mb-2">音樂來源</label>
          <div className="flex gap-3 flex-wrap">
            {[
              { value: 'local' as const, label: '🎵 本機音檔' },
              { value: 'qqmusic' as const, label: '🌐 網易雲音樂' },
              { value: 'youtube' as const, label: '📺 YouTube' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSettings({ musicSource: opt.value })}
                className={`text-body px-5 py-3 rounded-xl min-w-0 min-h-0 font-semibold ${
                  settings.musicSource === opt.value
                    ? 'bg-accent-gold text-bg-dark'
                    : 'bg-bg-dark text-text-muted hover:text-text-light'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto advance */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoAdvance}
              onChange={(e) => setSettings({ autoAdvance: e.target.checked })}
              className="w-6 h-6 accent-accent-gold"
              style={{ minWidth: '24px', minHeight: '24px' }}
            />
            <span className="text-body-sm font-semibold">自動標記：播完後自動標記為已叫出</span>
          </label>
        </div>
      </div>
    </div>
  );
}
