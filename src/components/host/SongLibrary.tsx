import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function SongLibrary() {
  const catalog = useGameStore((s) => s.catalog);
  const selectedSongIds = useGameStore((s) => s.selectedSongIds);
  const selectSongs = useGameStore((s) => s.selectSongs);
  const settings = useGameStore((s) => s.settings);

  const [decadeFilter, setDecadeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSongs = useMemo(() => {
    return catalog.filter((song) => {
      if (decadeFilter !== 'all' && song.decade !== decadeFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          song.title.toLowerCase().includes(q) ||
          song.artist.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalog, decadeFilter, searchTerm]);

  const handleSelectAll = () => {
    const ids = filteredSongs.map((s) => s.id);
    selectSongs([...new Set([...selectedSongIds, ...ids])]);
  };

  const handleClearSelection = () => {
    const filteredIds = new Set(filteredSongs.map((s) => s.id));
    selectSongs(selectedSongIds.filter((id) => !filteredIds.has(id)));
  };

  const toggleSong = (id: string) => {
    if (selectedSongIds.includes(id)) {
      selectSongs(selectedSongIds.filter((s) => s !== id));
    } else {
      selectSongs([...selectedSongIds, id]);
    }
  };

  const decades = [
    { key: 'all', label: '全部' },
    { key: '70s', label: '70年代' },
    { key: '80s', label: '80年代' },
    { key: '90s', label: '90年代' },
  ];

  return (
    <div className="card">
      <h2 className="text-subtitle font-bold mb-4">📋 歌曲庫</h2>

      {/* Catalog status */}
      <p className="text-body-sm text-text-muted mb-4">
        共 {catalog.length} 首歌曲 | 已選 {selectedSongIds.length} 首
        {settings.songCount > 0 && (
          <span className="text-accent-gold ml-2">
            (本局需要 {settings.songCount} 首)
          </span>
        )}
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {decades.map((d) => (
          <button
            key={d.key}
            onClick={() => setDecadeFilter(d.key)}
            className={`text-body-sm px-4 py-2 rounded-lg min-w-0 min-h-0 font-semibold transition-colors ${
              decadeFilter === d.key
                ? 'bg-accent-gold text-bg-dark'
                : 'bg-bg-dark text-text-muted hover:text-text-light'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="搜尋歌曲或歌手..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-bg-dark text-text-light text-body-sm px-4 py-3 rounded-lg mb-4 border border-text-muted/20 focus:border-accent-gold focus:outline-none"
        style={{ fontSize: '1.125rem' }}
      />

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button onClick={handleSelectAll} className="text-body-sm text-accent-gold hover:underline min-w-0 min-h-0 bg-transparent p-1">
          全選本頁
        </button>
        <button onClick={handleClearSelection} className="text-body-sm text-accent-red hover:underline min-w-0 min-h-0 bg-transparent p-1">
          清除本頁
        </button>
      </div>

      {/* Song list */}
      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {filteredSongs.map((song) => {
          const isSelected = selectedSongIds.includes(song.id);
          return (
            <button
              key={song.id}
              onClick={() => toggleSong(song.id)}
              className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors min-w-0 min-h-0 ${
                isSelected
                  ? 'bg-accent-gold/20 border border-accent-gold/50'
                  : 'bg-bg-dark/50 hover:bg-bg-dark border border-transparent'
              }`}
            >
              {/* Checkbox */}
              <span
                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center text-sm ${
                  isSelected
                    ? 'bg-accent-gold border-accent-gold text-bg-dark'
                    : 'border-text-muted'
                }`}
              >
                {isSelected ? '✓' : ''}
              </span>
              <div className="min-w-0">
                <p className="text-body-sm font-semibold truncate">{song.title}</p>
                <p className="text-body-sm text-text-muted truncate">{song.artist}</p>
              </div>
              <span className="flex-shrink-0 text-body-sm text-text-muted ml-auto">
                {song.decade}
              </span>
            </button>
          );
        })}
        {filteredSongs.length === 0 && (
          <p className="text-center text-text-muted py-8 text-body">沒有符合的歌曲</p>
        )}
      </div>
    </div>
  );
}
