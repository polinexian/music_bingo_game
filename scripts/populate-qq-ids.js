/**
 * One-time script to populate QQ Music songmid values in songCatalog.json.
 * Uses QQ Music's public search API (no auth needed).
 *
 * Usage: node scripts/populate-qq-ids.js
 */

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'songCatalog.json');
const DELAY_MS = 500; // 0.5s between requests

async function searchQQMusic(title, artist) {
  const query = encodeURIComponent(`${title} ${artist}`);
  const url = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=1&n=1&w=${query}&format=json`;

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://y.qq.com/' },
    });
    const data = await resp.json();
    const list = data?.data?.song?.list || [];
    return list[0]?.songmid || null;
  } catch (err) {
    console.error(`  錯誤: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🎵 開始填充 QQ 音樂 songmid...\n');

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  const needFill = catalog.filter((s) => !s.songmid);

  console.log(`總歌曲數: ${catalog.length}`);
  console.log(`需要填充: ${needFill.length} 首\n`);

  let filled = 0;
  let failed = 0;

  for (let i = 0; i < needFill.length; i++) {
    const song = needFill[i];
    const progress = `[${i + 1}/${needFill.length}]`;

    process.stdout.write(`${progress} 搜尋: ${song.title} — ${song.artist} ... `);

    const songmid = await searchQQMusic(song.title, song.artist);

    if (songmid) {
      song.songmid = songmid;
      filled++;
      console.log(`✅ ${songmid}`);
    } else {
      failed++;
      console.log('❌ 未找到');
    }

    // Save progress every 20 songs
    if ((i + 1) % 20 === 0) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
      console.log(`  💾 已儲存進度 (${filled} 成功, ${failed} 失敗)\n`);
    }

    if (i < needFill.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // Final save
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(50));
  console.log('✅ 完成！');
  console.log(`   成功: ${filled} 首`);
  console.log(`   失敗: ${failed} 首`);
  console.log(`   已儲存至: ${CATALOG_PATH}`);
}

main().catch(console.error);
