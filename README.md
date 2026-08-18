Overview
Music Bingo (音樂賓果) — a single-page React web app for live events. A host plays 30s song clips from 298 classic Cantonese songs (70s–90s); audience members mark printed bingo cards. Dual-screen: host controls on laptop, projector shows display view. Target users are elderly (長者), so all UI uses large fonts, high contrast, Traditional Chinese, and oversized touch targets.

Commands
npm run dev          # Vite dev server on :5173
npm run server       # Music proxy on :3001 (NetEase Cloud Music)
npm run dev:all      # Both servers together
npm run build        # TypeScript check + production build to dist/
npm run populate:qq  # Batch-search NetEase for song IDs, populate songCatalog.json
Architecture
Stack: React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router v6. No backend — pure static SPA. A separate Express proxy (server/index.js) on port 3001 handles music search/streaming because NetEase's search API returns CORS errors from the browser.

Music source: NetEase Cloud Music (網易雲音樂) via its public API. No API key required. The proxy provides two endpoints:

GET /api/qq/search?q=... → searches NetEase, returns [{songmid, songname, singer}]
GET /api/qq/stream/:songId → 302 redirects to music.163.com/song/media/outer/url?id=xxx.mp3
The field name songmid is used throughout the codebase but actually holds a NetEase song ID (numeric string like "28219545"), not a QQ Music songmid. This is a historical naming artifact from when QQ Music was attempted first.

Data flow:

data/songCatalog.json (298 songs) → loaded at startup via storage.ts → IndexedDB cache
User selects songs → settings configured → bingoCard.ts generates unique cards → pdfExport.ts creates printable PDF
Host clicks play → GameControls.tsx calls qqMusicPlayer.searchAndPlay() → proxy searches NetEase → <audio> tag streams from NetEase CDN → winCheck.ts verifies bingo
State changes broadcast via BroadcastChannel('music-bingo') from Host → Display tab
State: Zustand store (src/store/gameStore.ts) holds catalog, selected songs, cards, called song IDs, current song, game phase. Host reads/writes; Display reads via BroadcastChannel.

Key utilities:

src/utils/youtubePlayer.ts / qqMusicPlayer.ts — alternate playback backends, both implement same interface (searchAndPlay, pause, resume, stop)
src/utils/bingoCard.ts — Fisher-Yates shuffle with uniqueness checking
src/utils/winCheck.ts — row/col/diagonal verification
src/utils/pdfExport.ts — jsPDF multi-page export (uses helvetica, CJK characters may not render)
Dual-screen: /host (control) and /display (projector) are separate React Router routes communicating via BroadcastChannel API.

Elderly-friendly design: See tailwind.config.js for custom colors/sizes and src/index.css for .btn-primary, .display-text-xl classes. Minimum touch target 56px, no icon-only buttons, no modals, dark theme with gold accents.

Song Catalog
data/songCatalog.json — 298 songs with fields: id, title, artist, year, decade, youtubeId, songmid (NetEase ID), clipStart. Populated from song_list.txt via a Node one-liner. Use npm run populate:qq to batch-search NetEase and fill missing songmid values (~2 min for all 298).

Known Issues
YouTube playback requires VITE_YOUTUBE_API_KEY in .env and the YouTube Data API. QQ Music CDN was abandoned because it geo-restricts non-China IPs to 100-byte stubs.
PDF export uses helvetica font; Traditional Chinese characters may not render. For production, embed a CJK font (e.g., Noto Sans TC).
songmid / qqmusic naming is misleading — the actual backend is NetEase Cloud Music, not QQ Music.
