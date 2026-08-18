interface Props {
  song: { title: string; artist: string; year?: string } | null;
  isPlaying: boolean;
}

export default function NowPlaying({ song, isPlaying }: Props) {
  if (!song) {
    return (
      <div className="text-center">
        <p className="display-text-md text-text-muted">等待播放...</p>
        <p className="text-subtitle text-text-muted mt-4">音樂賓果</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Playing indicator */}
      {isPlaying && (
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="inline-block w-4 h-4 bg-accent-green rounded-full animate-pulse" />
          <span className="text-subtitle text-accent-green font-bold">現正播放</span>
        </div>
      )}

      {/* Song title — huge for projection */}
      <h1 className="display-text-xl text-accent-gold mb-4" style={{ fontSize: '5rem' }}>
        {song.title}
      </h1>

      {/* Artist */}
      <p className="display-text-md text-text-light mb-2" style={{ fontSize: '3rem' }}>
        {song.artist}
      </p>

      {/* Year */}
      {song.year && (
        <p className="display-text-md text-text-muted" style={{ fontSize: '2rem' }}>
          {song.year}
        </p>
      )}

      {/* Paused indicator */}
      {!isPlaying && (
        <p className="text-subtitle text-text-muted mt-6">⏸ 已暫停</p>
      )}
    </div>
  );
}
