// ============================================================
// Music Proxy Server
// - NetEase Cloud Music search + stream
// - Local MP3 file serving
// ============================================================

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const LOCAL_SONG_DIR = 'E:/claude/song';

app.use(cors());
app.use(express.json());

// --- Serve local MP3 files ---
app.use('/local', express.static(LOCAL_SONG_DIR, {
  setHeaders: (res) => {
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'public, max-age=3600');
  },
}));

// --- Scan local folder and match to catalog ---
app.get('/api/local/scan', (req, res) => {
  try {
    if (!fs.existsSync(LOCAL_SONG_DIR)) {
      return res.json({ files: [], matched: {} });
    }

    const files = fs.readdirSync(LOCAL_SONG_DIR)
      .filter(f => f.endsWith('.mp3'))
      .map(f => ({
        filename: f,
        name: f.replace(/\.mp3$/i, ''), // "artist - title"
      }));

    // Return list of available local files
    res.json({ files, dir: LOCAL_SONG_DIR });
  } catch (err) {
    res.status(500).json({ error: 'Scan failed' });
  }
});

// --- Search NetEase ---
app.get('/api/qq/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Missing query' });
    const url = `https://music.163.com/api/cloudsearch/pc?s=${encodeURIComponent(q)}&type=1&limit=3`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, 'Referer': 'https://music.163.com/' },
    });
    const data = await resp.json();
    const songs = (data?.result?.songs || []).map((s) => ({
      songmid: String(s.id),
      songname: s.name,
      singer: (s.ar || []).map((a) => a.name).join('、'),
    }));
    res.json({ songs });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// --- Audio redirect for NetEase ---
app.get('/api/qq/stream/:songId', (req, res) => {
  const url = `https://music.163.com/song/media/outer/url?id=${req.params.songId}.mp3`;
  res.redirect(302, url);
});

app.listen(PORT, () => console.log(`🎵 Music proxy :${PORT} | Local: ${LOCAL_SONG_DIR}`));
