// ============================================================
// PDF Export — Elderly-friendly large-print bingo cards
// Landscape A4, big CJK text, high contrast.
// ============================================================

import { jsPDF } from 'jspdf';
import type { BingoCard } from '../types';

const SCALE = 2.5; // Sharp print for readable text

export async function exportCardsToPDF(cards: BingoCard[]): Promise<void> {
  // Landscape A4: 297mm wide × 210mm tall
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const cardW = 277, cardH = 190; // Nearly full page with small margin
  const x = 10, y = 10;

  for (let i = 0; i < cards.length; i++) {
    if (i > 0) pdf.addPage();
    try {
      const dataUrl = renderCardToDataUrl(cards[i]);
      pdf.addImage(dataUrl, 'JPEG', x, y, cardW, cardH);
    } catch (err) {
      console.error('Card render error:', err);
      throw err;
    }
  }

  try {
    pdf.save('音樂賓果卡.pdf');
  } catch (err) {
    console.error('PDF save error:', err);
    throw new Error('無法儲存 PDF');
  }
}

function renderCardToDataUrl(card: BingoCard): string {
  const { gridSize, cells, id } = card;
  const w = Math.round(277 * (96 / 25.4) * SCALE);
  const h = Math.round(190 * (96 / 25.4) * SCALE);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const margin = Math.round(20 * SCALE);
  const headerH = Math.round(42 * SCALE);
  const footerH = Math.round(24 * SCALE);
  const gridW = w - margin * 2;
  const gridH = h - margin * 2 - headerH - footerH;
  const cellW = gridW / gridSize;
  const cellH = gridH / gridSize;
  const gridX = margin;
  const gridY = margin + headerH;

  // --- Header ---
  ctx.fillStyle = '#000000';
  const headerFontSize = Math.round(20 * SCALE);
  ctx.font = `bold ${headerFontSize}px "Noto Sans TC","Microsoft JhengHei","微軟正黑體",sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🎵 音樂賓果', w / 2, margin + headerH * 0.65);

  // Card ID — large and clear
  const idFontSize = Math.round(14 * SCALE);
  ctx.font = `bold ${idFontSize}px "Noto Sans TC","Microsoft JhengHei","微軟正黑體",sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(id, w - margin, margin + headerH * 0.45);

  // --- Grid ---
  // Big font sizes for elderly readability
  const titleFontSize = Math.round(14 * SCALE);   // ~35px canvas → ~14pt printed
  const artistFontSize = Math.round(12 * SCALE);  // ~30px canvas → ~12pt printed
  const freeFontSize = Math.round(16 * SCALE);    // Even bigger for FREE cell

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = cells[row][col];
      const cx = gridX + col * cellW;
      const cy = gridY + row * cellH;

      // Cell background
      if (cell.isFree) {
        ctx.fillStyle = '#fff8c0'; // Light gold — easy on eyes
        ctx.fillRect(cx, cy, cellW, cellH);
        ctx.strokeStyle = '#b8960c';
        ctx.lineWidth = 2.5 * SCALE;
        ctx.strokeRect(cx, cy, cellW, cellH);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx, cy, cellW, cellH);
        ctx.strokeStyle = '#888888'; // Darker grid lines for visibility
        ctx.lineWidth = 1.2 * SCALE;
        ctx.strokeRect(cx, cy, cellW, cellH);
      }

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      const midX = cx + cellW / 2;
      const midY = cy + cellH / 2;

      if (cell.isFree) {
        ctx.font = `bold ${freeFontSize}px "Noto Sans TC","Microsoft JhengHei",sans-serif`;
        ctx.fillText('免費', midX, midY + freeFontSize * 0.3);
      } else {
        const hasArtist = !!cell.artist;
        // Song title — bold, large
        ctx.font = `bold ${titleFontSize}px "Noto Sans TC","Microsoft JhengHei","微軟正黑體",sans-serif`;
        const titleY = midY - (hasArtist ? artistFontSize * 0.7 : 0);
        const titleMaxW = cellW - 6 * SCALE;
        ctx.fillText(truncateForWidth(ctx, cell.title, titleMaxW), midX, titleY);

        // Artist — slightly smaller, gray
        if (hasArtist) {
          ctx.font = `${artistFontSize}px "Noto Sans TC","Microsoft JhengHei","微軟正黑體",sans-serif`;
          ctx.fillStyle = '#444444';
          const artistMaxW = cellW - 6 * SCALE;
          ctx.fillText(truncateForWidth(ctx, cell.artist, artistMaxW), midX, titleY + artistFontSize * 1.35);
        }
      }
    }
  }

  // --- Footer ---
  ctx.fillStyle = '#666666';
  const footerFontSize = Math.round(11 * SCALE);
  ctx.font = `${footerFontSize}px "Noto Sans TC","Microsoft JhengHei","微軟正黑體",sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('聽到歌曲時標記對應格子，連成一線即為賓果！', w / 2, h - margin * 0.5);

  return canvas.toDataURL('image/jpeg', 0.9);
}

function truncateForWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}
