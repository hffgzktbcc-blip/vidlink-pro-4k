const fs = require('fs');
let code = fs.readFileSync('src/services/audiobooksResolver.ts', 'utf8');

const startPattern = "/**\n * Step 1: Search APBay";
const endPattern = "  }\n}";

const startIndex = code.indexOf(startPattern);
let endIndex = code.indexOf(endPattern, startIndex);

if (startIndex > -1 && endIndex > -1) {
  endIndex += endPattern.length;
  const replacement = `/**
 * Step 1: Search all enabled Download Sources via the Addon Engine.
 */
async function searchAudiobookTorrent(title: string, author: string) {
  try {
    let results = await addonEngine.searchDownloads(title, author);
    if (results.length === 0) {
      results = await addonEngine.searchDownloads(title, '');
    }
    if (results.length > 0) {
      return {
        info_hash: results[0].infoHash,
        name: results[0].title
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to search audiobook torrents:', error);
    return null;
  }
}`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/services/audiobooksResolver.ts', code);
  console.log('patched');
} else {
  console.log('not found');
}
