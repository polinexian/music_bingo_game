interface Props {
  currentRound: number;
  totalSongs: number;
  phase: string;
}

export default function GameStatus({ currentRound, totalSongs, phase }: Props) {
  const progressPct = totalSongs > 0 ? Math.round((currentRound / totalSongs) * 100) : 0;

  return (
    <div className="w-full max-w-[600px] text-center">
      {/* Round counter */}
      <p className="display-text-md text-text-light mb-3">
        第 <span className="text-accent-gold font-bold">{currentRound}</span> 首
      </p>

      {/* Progress bar */}
      {totalSongs > 0 && (
        <div className="w-full bg-bg-card rounded-full h-6 overflow-hidden">
          <div
            className="h-full bg-accent-gold rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Phase indicator */}
      {phase === 'finished' && (
        <p className="text-title text-accent-green font-bold mt-4">🎉 遊戲結束</p>
      )}
    </div>
  );
}
