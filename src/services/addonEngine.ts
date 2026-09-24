import type { MetadataProvider, DownloadSource, Addon } from '../types/addons';
import type { Book } from './booksApi';

// Pre-built addons so the user doesn't have to configure anything
export const BUILTIN_ADDONS: Addon[] = [
  {
    id: 'openlibrary',
    name: 'OpenLibrary (Default)',
    version: '1.0.0',
    type: 'metadata',
    search: {
      request: {
        method: 'GET',
        url: 'https://openlibrary.org/search.json?q={QUERY}&limit=20',
        useCorsProxy: false
      },
      response: {
        type: 'json',
        resultsPath: 'docs',
        mapping: {
          id: 'key',
          title: 'title',
          author: 'author_name.0',
          description: 'first_sentence.0',
          cover: 'cover_i',
          publishedYear: 'first_publish_year'
        }
      }
    }
  },
  {
    id: 'apbay',
    name: 'APBay Audiobooks',
    version: '1.0.0',
    type: 'download',
    request: {
      method: 'GET',
      url: 'https://apibay.org/q.php?q={TITLE} {AUTHOR}&cat=102',
      useCorsProxy: true
    },
    response: {
      type: 'json',
      resultsPath: '',
      mapping: {
        title: 'name',
        infoHash: 'info_hash',
        seeders: 'seeders',
        leechers: 'leechers',
        size: 'size'
      }
    }
  }
];

// Helper to get nested value by dot notation path
function getValueByPath(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => {
    if (acc && Array.isArray(acc) && !isNaN(Number(part))) {
      return acc[Number(part)];
    }
    return acc ? acc[part] : undefined;
  }, obj);
}

// Helper to inject variables into URLs
function buildUrl(urlTemplate: string, variables: Record<string, string>, useProxy: boolean = false): string {
  let url = urlTemplate;
  for (const [key, value] of Object.entries(variables)) {
    url = url.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value || ''));
  }
  return useProxy ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url;
}

export class AddonEngine {
  private addons: Addon[] = [...BUILTIN_ADDONS];

  getProviders(): MetadataProvider[] {
    return this.addons.filter(a => a.type === 'metadata') as MetadataProvider[];
  }

  getDownloadSources(): DownloadSource[] {
    return this.addons.filter(a => a.type === 'download') as DownloadSource[];
  }

  async searchMetadata(query: string, providerId?: string): Promise<Book[]> {
    const provider = this.getProviders().find(p => p.id === providerId) || this.getProviders()[0];
    if (!provider) throw new Error('No metadata provider found');

    const url = buildUrl(provider.search.request.url, { QUERY: query }, provider.search.request.useCorsProxy);
    const res = await fetch(url);
    const data = await res.json();

    const results = provider.search.response.resultsPath ? getValueByPath(data, provider.search.response.resultsPath) : data;
    if (!Array.isArray(results)) return [];

    return results.map(item => {
      const mapping = provider.search.response.mapping;
      const getVal = (field: string) => {
        const val = getValueByPath(item, mapping[field]);
        if (Array.isArray(val) && val.length > 0) return val[0];
        return val;
      };
      
      const coverId = getVal('cover');
      let coverUrl = null;
      if (coverId && provider.id === 'openlibrary') {
        coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      }

      return {
        id: getVal('id') || Math.random().toString(),
        title: getVal('title') || 'Unknown Title',
        author: getVal('author') || 'Unknown Author',
        description: getVal('description') || '',
        coverUrl,
        publishedYear: (getVal('publishedYear') || '').toString()
      };
    });
  }

  async searchDownloads(title: string, author: string): Promise<any[]> {
    const sources = this.getDownloadSources();
    let allResults: any[] = [];
    
    // Clean up punctuation
    const cleanTitle = title.replace(/[^\w\s]/g, ' ').trim();
    const cleanAuthor = author.replace(/[^\w\s]/g, ' ').trim();

    for (const source of sources) {
      try {
        const url = buildUrl(source.request.url, { TITLE: cleanTitle, AUTHOR: cleanAuthor }, source.request.useCorsProxy);
        const res = await fetch(url);
        const data = await res.json();
        
        const results = source.response.resultsPath ? getValueByPath(data, source.response.resultsPath) : data;
        if (!Array.isArray(results) || (results.length > 0 && results[0].id === '0')) continue;

        const mappedResults = results.map(item => {
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
        
        allResults = [...allResults, ...mappedResults];
      } catch (err) {
        console.error(`Failed to fetch from download source ${source.name}:`, err);
      }
    }
    
    // Sort all combined results by seeders descending
    allResults.sort((a, b) => b.seeders - a.seeders);
    return allResults;
  }
}

export const addonEngine = new AddonEngine();
