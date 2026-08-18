// ============================================================
// Win Verification — Check rows, columns, diagonals
// ============================================================

import type { BingoCard, BingoCell, WinResult } from '../types';

/**
 * Check if a bingo card has a winning line.
 * @param card - the player's bingo card
 * @param calledSongIds - set of called song IDs
 */
export function checkWin(card: BingoCard, calledSongIds: string[]): WinResult {
  const calledSet = new Set(calledSongIds);
  const { cells, gridSize } = card;

  // Check each row
  for (let row = 0; row < gridSize; row++) {
    const rowCells = cells[row];
    const allCalled = rowCells.every(
      (cell) => cell.isFree || calledSet.has(cell.songId),
    );
    if (allCalled) {
      return {
        isBingo: true,
        winningLine: { type: 'row', index: row, cells: rowCells },
      };
    }
  }

  // Check each column
  for (let col = 0; col < gridSize; col++) {
    const colCells = cells.map((row) => row[col]);
    const allCalled = colCells.every(
      (cell) => cell.isFree || calledSet.has(cell.songId),
    );
    if (allCalled) {
      return {
        isBingo: true,
        winningLine: { type: 'col', index: col, cells: colCells },
      };
    }
  }

  // Check main diagonal
  const diag1 = cells.map((row, i) => row[i]);
  if (diag1.every((cell) => cell.isFree || calledSet.has(cell.songId))) {
    return {
      isBingo: true,
      winningLine: { type: 'diag', index: 0, cells: diag1 },
    };
  }

  // Check anti-diagonal
  const diag2 = cells.map((row, i) => row[gridSize - 1 - i]);
  if (diag2.every((cell) => cell.isFree || calledSet.has(cell.songId))) {
    return {
      isBingo: true,
      winningLine: { type: 'diag', index: 1, cells: diag2 },
    };
  }

  // No bingo — find which cells are missing
  const missingCells: { row: number; col: number; title: string }[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = cells[row][col];
      if (!cell.isFree && !calledSet.has(cell.songId)) {
        missingCells.push({ row, col, title: cell.title });
      }
    }
  }

  return {
    isBingo: false,
    missingCells,
  };
}
