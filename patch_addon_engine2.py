import sys

with open('src/services/addonEngine.ts', 'r') as f:
    code = f.read()

replacement = """  },
  {
    id: 'torrents-csv',
    name: 'Torrents-CSV (Global)',
    version: '1.0.0',
    type: 'download',
    request: {
      method: 'GET',
      url: 'https://torrents-csv.com/service/search?q={TITLE} {AUTHOR}&size=50',
      useCorsProxy: false
    },
    response: {
      type: 'json',
      resultsPath: 'torrents',
      mapping: {
        title: 'name',
        infoHash: 'infohash',
        seeders: 'seeders',
        leechers: 'leechers',
        size: 'size_bytes'
      }
    }
  },
  {
    id: 'apbay',"""

code = code.replace("  },\n  {\n    id: 'apbay',", replacement)

with open('src/services/addonEngine.ts', 'w') as f:
    f.write(code)
print("Patched addonEngine.ts with torrents-csv")
