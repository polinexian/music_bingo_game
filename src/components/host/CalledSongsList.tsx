import { useGameStore } from '../../store/gameStore';

export default function CalledSongsList() {
  const catalog = useGameStore((s) => s.catalog);
  const calledSongIds = useGameStore((s) => s.calledSongIds);

  const calledSongs = calledSongIds
    .map((id) => catalog.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <div className="card">
      <h2 className="text-subtitle font-bold mb-4">
        📝 已叫出歌曲 ({calledSongs.length})
      </h2>

      {calledSongs.length === 0 ? (
        <p className="text-body text-text-muted text-center py-6">
          尚未播放任何歌曲
        </p>
      ) : (
        <div className="max-h-[500px] overflow-y-auto space-y-2">
          {calledSongs.map((song, index) => (
            <div
              key={song!.id}
              className="flex items-center gap-3 bg-bg-dark rounded-lg px-4 py-3"
            >
              <span className="text-body-sm font-bold text-accent-gold min-w-[2rem]">
                {index + 1}.
              </span>
              <div className="min-w-0">
                <p className="text-body-sm font-semibold truncate">{song!.title}</p>
                <p className="text-body-sm text-text-muted truncate">{song!.artist}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
