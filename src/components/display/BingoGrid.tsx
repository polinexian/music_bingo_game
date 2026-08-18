interface CalledSong {
  id: string;
  title: string;
  artist: string;
}

interface Props {
  calledSongs: CalledSong[];
  gridSize: number;
}

export default function BingoGrid({ calledSongs, gridSize }: Props) {
  // Show a grid of called songs — each cell is a song that's been called
  const totalCells = gridSize * gridSize;
  const displaySongs = calledSongs.slice(0, totalCells);

  // Fill remaining cells with empty placeholders
  const cells: (CalledSong | null)[] = [...displaySongs];
  while (cells.length < totalCells) {
    cells.push(null);
  }

  return (
    <div className="w-full max-w-[900px] mx-auto">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {cells.map((song, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          const isFree = gridSize === 5 && row === Math.floor(gridSize / 2) && col === Math.floor(gridSize / 2);
          const isCalled = song !== null;

          if (isFree) {
            return (
              <div
                key={`free-${index}`}
                className="aspect-square flex items-center justify-center rounded-lg bg-accent-gold/30 border-2 border-accent-gold"
                style={{ minWidth: '60px', minHeight: '60px' }}
              >
                <span className="text-title text-accent-gold font-bold">免費</span>
              </div>
            );
          }

          return (
            <div
              key={song?.id || `empty-${index}`}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg p-2 transition-all ${
                isCalled
                  ? 'bg-accent-green/20 border-2 border-accent-green'
                  : 'bg-bg-card/50 border-2 border-text-muted/15'
              }`}
              style={{ minWidth: '60px', minHeight: '60px' }}
            >
              {isCalled ? (
                <>
                  <span className="text-body font-bold text-text-light text-center leading-tight truncate w-full">
                    {song!.title}
                  </span>
                  <span className="text-body-sm text-text-muted text-center truncate w-full mt-1">
                    {song!.artist}
                  </span>
                </>
              ) : (
                <span className="text-title text-text-muted/30 font-bold">
                  {index + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
