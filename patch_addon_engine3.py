import sys

with open('src/services/addonEngine.ts', 'r') as f:
    code = f.read()

replacement = """        const mappedResults = results.map(item => {
          const mapping = source.response.mapping;
          return {
            sourceId: source.id,
            title: getValueByPath(item, mapping.title),
            infoHash: getValueByPath(item, mapping.infoHash),
            magnetUrl: mapping.magnetUrl ? getValueByPath(item, mapping.magnetUrl) : undefined,
            seeders: parseInt(getValueByPath(item, mapping.seeders) || '0'),
            leechers: parseInt(getValueByPath(item, mapping.leechers) || '0'),
            size: getValueByPath(item, mapping.size)
          };
        }).filter(item => {
          if (!item.title) return false;
          const t = item.title.toLowerCase();
          // Reject obvious ebooks
          if (t.includes('epub') || t.includes('mobi') || t.includes('pdf') || t.includes(' azw3')) return false;
          return true;
        });
        
        allResults = [...allResults, ...mappedResults];"""

old_str = """        const mappedResults = results.map(item => {
          const mapping = source.response.mapping;
          return {
            sourceId: source.id,
            title: getValueByPath(item, mapping.title),
            infoHash: getValueByPath(item, mapping.infoHash),
            magnetUrl: mapping.magnetUrl ? getValueByPath(item, mapping.magnetUrl) : undefined,
            seeders: parseInt(getValueByPath(item, mapping.seeders) || '0'),
            leechers: parseInt(getValueByPath(item, mapping.leechers) || '0'),
            size: getValueByPath(item, mapping.size)
          };
        });
        
        allResults = [...allResults, ...mappedResults];"""

if old_str in code:
    code = code.replace(old_str, replacement)
    with open('src/services/addonEngine.ts', 'w') as f:
        f.write(code)
    print("Patched addonEngine.ts with epub filter")
else:
    print("Could not find the string to replace")
