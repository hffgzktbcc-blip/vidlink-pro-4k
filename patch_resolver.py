import sys
with open('src/services/audiobooksResolver.ts', 'r') as f:
    code = f.read()

start_str = "async function searchAudiobookTorrent(title: string, author: string) {"
end_str = "  } catch (error) {"

start_idx = code.find(start_str)
end_idx = code.find(end_str, start_idx)

replacement = """async function searchAudiobookTorrent(title: string, author: string) {
  try {
    // 1. Full Title + Author
    let results = await addonEngine.searchDownloads(title, author);
    
    // 2. Full Title only
    if (results.length === 0) {
      results = await addonEngine.searchDownloads(title, '');
    }

    // 3. Smart Fallbacks (Strip subtitles, parentheses, "A Novel", etc)
    if (results.length === 0) {
      const shortTitle = title.split(':')[0].split('(')[0].replace(/A Novel/i, '').trim();
      const shortAuthor = author.split(' ')[author.split(' ').length - 1]; // Last name
      
      // Short Title + Last Name
      if (shortTitle.length > 2) {
         results = await addonEngine.searchDownloads(shortTitle, shortAuthor);
         
         // 4. Short Title only
         if (results.length === 0) {
            results = await addonEngine.searchDownloads(shortTitle, '');
         }
      }
    }

    if (results.length > 0) {
      return {
        info_hash: results[0].infoHash,
        name: results[0].title
      };
    }
    return null;
"""

new_code = code[:start_idx] + replacement + code[end_idx:]
with open('src/services/audiobooksResolver.ts', 'w') as f:
    f.write(new_code)
print("Patched audiobooksResolver.ts")
