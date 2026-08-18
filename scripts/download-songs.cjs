/**
 * Download songs from YouTube as MP3 using yt-dlp + ffmpeg.
 * Each file is validated with ffprobe after download.
 * Invalid files are automatically deleted.
 *
 * Usage: node scripts/download-songs.cjs
 * Output: E:/claude/song/{artist} - {title}.mp3
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SONGLIST = path.join(__dirname, '..', 'song_list.txt');
const OUTPUT = 'E:/claude/song';
const FFMPEG_DIR = 'C:/Users/user/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin';
const FFPROBE = path.join(FFMPEG_DIR, 'ffprobe.exe');

// Add ffmpeg to PATH for yt-dlp
process.env.PATH = FFMPEG_DIR + ';' + process.env.PATH;

if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

function parseSongList() {
  const text = fs.readFileSync(SONGLIST, 'utf-8');
  const songs = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || /^_+$/.test(t) || /^\d{2}:\d{2}:\d{2}$/.test(t)) continue;
    if (t.includes('[80年代]') || t.includes('[90年代]')) continue;
    const m = t.match(/^·\s+(.+?)\s*[-–]\s*(.+)$/);
    if (!m) continue;
    const artist = m[1].trim(), title = m[2].trim();
    if (!title || !artist) continue;
    songs.push({ artist, title, safe: `${artist} - ${title}`.replace(/[/\\:*?"<>|]/g, '_') });
  }
  return songs;
}

/** Validate MP3 file is actually playable audio, not HTML/DASH stub */
function isValidAudio(filepath) {
  if (!fs.existsSync(filepath)) return false;
  const size = fs.statSync(filepath).size;
  if (size < 50000) return false; // < 50KB is not real audio

  // Check header: MP3 starts with FF FB or FF F3 or ID3 tag
  const buf = Buffer.alloc(4);
  const fd = fs.openSync(filepath, 'r');
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);

  // ID3 tag
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  // MPEG frame sync
  if (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0) return true;

  // Try ffprobe for other formats
  try {
    const r = spawnSync(FFPROBE, ['-v', 'quiet', filepath], { timeout: 5000, stdio: 'pipe' });
    return r.status === 0;
  } catch { return false; }
}

function main() {
  const songs = parseSongList();
  console.log(`${songs.length} songs\n`);
  let done = 0, failed = 0, skipped = 0, deleted = 0;

  // First pass: validate existing files, delete bad ones
  console.log('Checking existing files...\n');
  for (const { safe } of songs) {
    const fp = path.join(OUTPUT, `${safe}.mp3`);
    if (fs.existsSync(fp)) {
      if (isValidAudio(fp)) {
        skipped++;
      } else {
        console.log(`  🗑  Deleting invalid: ${safe}.mp3`);
        fs.unlinkSync(fp);
        deleted++;
      }
    }
  }
  if (deleted > 0) console.log(`  Deleted ${deleted} unplayable files\n`);

  // Second pass: download missing
  for (let i = 0; i < songs.length; i++) {
    const { artist, title, safe } = songs[i];
    const filepath = path.join(OUTPUT, `${safe}.mp3`);
    const progress = `[${i + 1}/${songs.length}]`;

    if (fs.existsSync(filepath)) {
      if (!skipped) {} // already counted
      console.log(`${progress} ⏭  ${safe}`);
      continue;
    }

    process.stdout.write(`${progress} ⬇ ${safe} ... `);
    const query = `${artist} ${title} 粵語`;
    const result = spawnSync('yt-dlp', [
      '--no-playlist', '--extract-audio', '--audio-format', 'mp3',
      '--audio-quality', '128K', '--max-filesize', '8M',
      '-o', filepath, `ytsearch1:${query}`
    ], { timeout: 30000, stdio: 'pipe' });

    // Clean up any leftover .webm intermediates
    try {
      const dir = path.dirname(filepath);
      fs.readdirSync(dir).filter(f => f.endsWith('.webm') || f.endsWith('.m4a')).forEach(f => {
        try { fs.unlinkSync(path.join(dir, f)); } catch(_) {}
      });
    } catch(_) {}

    if (result.status === 0 && isValidAudio(filepath)) {
      const kb = (fs.statSync(filepath).size / 1024).toFixed(0);
      console.log(`✅ ${kb}KB`);
      done++;
    } else {
      console.log('❌');
      failed++;
      try { fs.unlinkSync(filepath); } catch (_) {}
    }
  }

  console.log(`\nDone: ${done} new, ${skipped} existing, ${failed} failed`);
}

main();
