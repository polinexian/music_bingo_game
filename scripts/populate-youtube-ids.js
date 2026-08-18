/**
 * One-time script to populate YouTube video IDs in songCatalog.json.
 * Uses YouTube Data API v3 to search for each song.
 *
 * Usage:
 *   1. Set YOUTUBE_API_KEY environment variable
 *   2. Run: node scripts/populate-youtube-ids.js
 *
 * Quota: 100 search units/day free. Each search = 100 units.
 * So you can populate ~100 songs per day on free quota.
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.YOUTUBE_API_KEY;
const CATALOG_PATH = path.join(__dirname, '..', 'data', 'songCatalog.json');
const DELAY_MS = 1500; // 1.5s between requests to stay within quota

if (!API_KEY) {
  console.error('❌ 請設定 YOUTUBE_API_KEY 環境變數');
  console.error('   PowerShell: $env:YOUTUBE_API_KEY="your_key"');
  console.error('   CMD: set YOUTUBE_API_KEY=your_key');
  process.exit(1);
}

async function searchYouTubeSong(title, artist) {
  const query = encodeURIComponent(`${title} ${artist} 粵語`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const reason = err?.error?.errors?.[0]?.reason || '';
      if (reason === 'quotaExceeded') {
        console.error('⚠️  API 配額已用完，請明天再試');
        return null;
      }
      console.error(`  HTTP ${response.status}: ${reason}`);
      return null;
    }

    const data = await response.json();
    const items = data.items || [];
    return items[0]?.id?.videoId || null;
  } catch (err) {
    console.error(`  網路錯誤: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🎵 開始填充 YouTube 影片 ID...\n');

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  const emptySongs = catalog.filter((s) => !s.youtubeId || s.youtubeId.length < 3);

  console.log(`總歌曲數: ${catalog.length}`);
  console.log(`需要填充: ${emptySongs.length} 首\n`);

  let filled = 0;
  let failed = 0;

  for (let i = 0; i < emptySongs.length; i++) {
    const song = emptySongs[i];
    const progress = `[${i + 1}/${emptySongs.length}]`;

    console.log(`${progress} 搜尋: ${song.title} — ${song.artist}`);

    const videoId = await searchYouTubeSong(song.title, song.artist);

    if (videoId) {
      song.youtubeId = videoId;
      filled++;
      console.log(`  ✅ 找到: ${videoId}`);
    } else {
      failed++;
      console.log(`  ❌ 未找到`);
    }

    // Save progress every 10 songs
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
      console.log(`  💾 已儲存進度\n`);
    }

    // Rate limiting
    if (i < emptySongs.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // Final save
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(50));
  console.log('✅ 完成！');
  console.log(`   成功填充: ${filled} 首`);
  console.log(`   失敗: ${failed} 首`);
  console.log(`   已儲存至: ${CATALOG_PATH}`);
}

main().catch(console.error);
