import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { checkWin } from '../../utils/winCheck';
import type { WinResult } from '../../types';

export default function WinVerifier() {
  const cards = useGameStore((s) => s.cards);
  const calledSongIds = useGameStore((s) => s.calledSongIds);
  const setPhase = useGameStore((s) => s.setPhase);

  const [cardIdInput, setCardIdInput] = useState('');
  const [result, setResult] = useState<WinResult | null>(null);
  const [searchedCardId, setSearchedCardId] = useState('');

  const handleVerify = () => {
    const cardId = cardIdInput.trim().toUpperCase();
    if (!cardId) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      setResult(null);
      setSearchedCardId(cardId);
      // Card not found
      return;
    }

    const winResult = checkWin(card, calledSongIds);
    setResult(winResult);
    setSearchedCardId(cardId);

    if (winResult.isBingo) {
      // Broadcast winning result to display
      const channel = new BroadcastChannel('music-bingo');
      channel.postMessage({
        bingoResult: {
          cardId,
          lineType: winResult.winningLine?.type,
          cells: winResult.winningLine?.cells,
        },
      });
      setTimeout(() => channel.close(), 100);
    }
  };

  const handleFinishGame = () => {
    setPhase('finished');
    const channel = new BroadcastChannel('music-bingo');
    channel.postMessage({ phase: 'finished' });
    setTimeout(() => channel.close(), 100);
  };

  return (
    <div className="card">
      <h2 className="text-subtitle font-bold mb-4">🔍 驗證賓果</h2>

      {/* Card ID input */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="輸入卡片編號 (例如: CARD-001)"
          value={cardIdInput}
          onChange={(e) => setCardIdInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          className="flex-1 bg-bg-dark text-text-light text-body px-4 py-3 rounded-lg border border-text-muted/20 focus:border-accent-gold focus:outline-none"
          style={{ fontSize: '1.25rem' }}
          autoFocus
        />
        <button onClick={handleVerify} className="btn-primary text-body min-w-0">
          檢查
        </button>
      </div>

      {/* Result */}
      {searchedCardId && !result && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-center mb-4">
          <p className="text-subtitle text-accent-red font-bold">
            ❌ 找不到卡片 「{searchedCardId}」
          </p>
          <p className="text-body-sm text-text-muted mt-2">
            請確認卡片編號是否正確（已生成 {cards.length} 張卡片）
          </p>
        </div>
      )}

      {result?.isBingo && result.winningLine && (
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-6 text-center mb-4">
          <p className="text-title text-accent-green font-bold mb-2">
            🎉 有效賓果！
          </p>
          <p className="text-body text-text-light mb-1">
            卡片：{searchedCardId}
          </p>
          <p className="text-body text-text-muted mb-4">
            {result.winningLine.type === 'row' && `第 ${result.winningLine.index + 1} 行`}
            {result.winningLine.type === 'col' && `第 ${result.winningLine.index + 1} 列`}
            {result.winningLine.type === 'diag' &&
              (result.winningLine.index === 0 ? '主對角線' : '副對角線')}
          </p>
          <button onClick={handleFinishGame} className="btn-success text-title px-8 py-4">
            🏆 結束遊戲
          </button>
        </div>
      )}

      {result && !result.isBingo && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-center mb-4">
          <p className="text-subtitle text-accent-red font-bold mb-2">
            ❌ 尚未成線
          </p>
          <p className="text-body text-text-muted mb-3">
            卡片 {searchedCardId} 還差 {result.missingCells?.length || 0} 格
          </p>
          {result.missingCells && result.missingCells.length > 0 && (
            <div className="text-body-sm text-text-muted space-y-1 max-h-[150px] overflow-y-auto">
              {result.missingCells.map((cell, i) => (
                <p key={i}>
                  第 {cell.row + 1} 行第 {cell.col + 1} 列：{cell.title}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => {
          setResult(null);
          setCardIdInput('');
          setPhase('playing');
        }}
        className="btn-secondary text-body w-full"
      >
        ← 返回遊戲
      </button>
    </div>
  );
}
