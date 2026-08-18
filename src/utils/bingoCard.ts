// ============================================================
// Bingo Card Generation — shuffle, layout, uniqueness
// ============================================================

import type { Song, BingoCard, BingoCell } from '../types';

/** Fisher-Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a single bingo card.
 * @param songs - pool of songs to place on the card
 * @param gridSize - 4 or 5
 * @param cardNumber - sequential card number for ID
 */
export function generateCard(
  songs: Song[],
  gridSize: number,
  cardNumber: number,
): BingoCard {
  const cellCount = gridSize * gridSize;
  const hasFree = gridSize === 5;

  // Need enough songs: grid cells minus free space
  const needed = hasFree ? cellCount - 1 : cellCount;
  if (songs.length < needed) {
    throw new Error(`需要至少 ${needed} 首歌曲，目前只有 ${songs.length} 首`);
  }

  // Pick random songs for this card
  const picked = shuffle(songs).slice(0, needed);
  let songIdx = 0;

  const cells: BingoCell[][] = [];
  const center = Math.floor(gridSize / 2);

  for (let row = 0; row < gridSize; row++) {
    const rowCells: BingoCell[] = [];
    for (let col = 0; col < gridSize; col++) {
      // Free space in center for 5×5
      if (hasFree && row === center && col === center) {
        rowCells.push({
          songId: 'FREE',
          title: '免費',
          artist: '',
          isFree: true,
          isCalled: true, // Free space is pre-marked
        });
      } else {
        const song = picked[songIdx++];
        rowCells.push({
          songId: song.id,
          title: song.title,
          artist: song.artist,
          isFree: false,
          isCalled: false,
        });
      }
    }
    cells.push(rowCells);
  }

  const paddedNum = String(cardNumber).padStart(3, '0');

  return {
    id: `CARD-${paddedNum}`,
    gridSize,
    cells,
  };
}

/**
 * Generate multiple unique bingo cards.
 * Uniqueness: no two cards have exactly the same song arrangement.
 */
export function generateCards(
  songs: Song[],
  gridSize: number,
  count: number,
): BingoCard[] {
  const cards: BingoCard[] = [];
  const seen = new Set<string>();

  let attempts = 0;
  const maxAttempts = count * 10; // safety limit

  while (cards.length < count && attempts < maxAttempts) {
    attempts++;
    const card = generateCard(songs, gridSize, cards.length + 1);

    // Create a fingerprint for uniqueness check
    const fp = card.cells
      .flat()
      .map((c) => c.songId)
      .join('|');

    if (!seen.has(fp)) {
      seen.add(fp);
      cards.push(card);
    }
  }

  return cards;
}
