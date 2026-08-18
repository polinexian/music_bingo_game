import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { generateCards } from '../../utils/bingoCard';
import { exportCardsToPDF } from '../../utils/pdfExport';

export default function CardGenerator() {
  const catalog = useGameStore((s) => s.catalog);
  const selectedSongIds = useGameStore((s) => s.selectedSongIds);
  const settings = useGameStore((s) => s.settings);
  const cards = useGameStore((s) => s.cards);
  const setCards = useGameStore((s) => s.setCards);
  const setPhase = useGameStore((s) => s.setPhase);

  const handleGenerate = () => {
    // Use selected songs or all songs
    const poolIds =
      selectedSongIds.length >= settings.songCount
        ? selectedSongIds.slice(0, settings.songCount)
        : catalog.slice(0, settings.songCount).map((s) => s.id);

    const pool = catalog.filter((s) => poolIds.includes(s.id));

    if (pool.length < settings.gridSize * settings.gridSize) {
      alert(`歌曲不足！需要至少 ${settings.gridSize * settings.gridSize} 首歌曲。`);
      return;
    }

    const generated = generateCards(pool, settings.gridSize, settings.cardCount);
    setCards(generated);
  };

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (cards.length === 0) {
      alert('請先生成賓果卡！');
      return;
    }
    setExporting(true);
    try {
      await exportCardsToPDF(cards);
    } catch (err: any) {
      console.error(err);
      alert(`匯出失敗：${err?.message || '請重試'}`);
    }
    setExporting(false);
  };

  const handleStartGame = () => {
    if (cards.length === 0) {
      alert('請先生成賓果卡！');
      return;
    }
    setPhase('ready');
  };

  return (
    <div className="card">
      <h2 className="text-subtitle font-bold mb-4">🎴 賓果卡生成</h2>

      <p className="text-body-sm text-text-muted mb-4">
        將生成 {settings.cardCount} 張 {settings.gridSize}×{settings.gridSize} 的賓果卡
        {settings.gridSize === 5 ? '（含免費中心格）' : ''}
      </p>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleGenerate} className="btn-primary">
          生成賓果卡
        </button>
        <button
          onClick={handleExportPDF}
          disabled={cards.length === 0 || exporting}
          className={`btn-secondary ${cards.length === 0 || exporting ? 'opacity-50' : ''}`}
        >
          {exporting ? '匯出中...' : '匯出 PDF'}
        </button>
      </div>

      {cards.length > 0 && (
        <>
          <p className="text-body-sm text-accent-green mt-4">
            ✅ 已生成 {cards.length} 張賓果卡
          </p>
          <button onClick={handleStartGame} className="btn-success mt-3 w-full">
            開始遊戲
          </button>
        </>
      )}
    </div>
  );
}
