import { callDebridApi } from './stremioResolver';
import { addonEngine } from './addonEngine';

export interface AudiobookStream {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Step 1: Search all enabled Download Sources via the Addon Engine.
 */
async function searchAudiobookTorrent(title: string, author: string) {
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
  } catch (error) {
    console.error('Failed to search audiobook torrents:', error);
    return null;
  }
}

/**
 * Step 2 & 3: Add Magnet to Real-Debrid and wait for files to populate.
 */
async function addMagnetAndGetInfo(magnet: string) {
  // Add Magnet
  const addParams = new URLSearchParams();
  addParams.append('magnet', magnet);
  
  const addRes = await callDebridApi('torrents/addMagnet', undefined, 'POST', addParams.toString());
  if (!addRes.id) throw new Error('Failed to add magnet to Real-Debrid');
  
  const torrentId = addRes.id;
  
  // Poll info until status is 'waiting_files_selection' or 'downloaded' (if it was auto-selected)
  let info = await callDebridApi(`torrents/info/${torrentId}`);
  let attempts = 0;
  
  while (info.status === 'magnet_conversion' && attempts < 10) {
    await new Promise(r => setTimeout(r, 2000));
    info = await callDebridApi(`torrents/info/${torrentId}`);
    attempts++;
  }
  
  return info;
}

/**
 * Step 4 & 5: Select Audio files and wait for download completion.
 */
async function selectFilesAndWait(torrentId: string, files: any[]) {
  // Find audio files
  const audioExtensions = ['.mp3', '.m4b', '.m4a', '.flac', '.ogg'];
  const audioFiles = files.filter(f => {
    const lowerPath = f.path.toLowerCase();
    return audioExtensions.some(ext => lowerPath.endsWith(ext));
  });
  
  if (audioFiles.length === 0) {
    throw new Error('No audio files found in this torrent.');
  }
  
  const fileIds = audioFiles.map(f => f.id).join(',');
  
  const selectParams = new URLSearchParams();
  selectParams.append('files', fileIds);
  await callDebridApi(`torrents/selectFiles/${torrentId}`, undefined, 'POST', selectParams.toString());
  
  // Wait for it to be cached ('downloaded'). If it goes to 'downloading', we might have to wait, but usually audiobooks cache instantly or are small enough.
  let info = await callDebridApi(`torrents/info/${torrentId}`);
  let attempts = 0;
  
  // We'll wait up to 15 seconds. If it's not cached, it might need to download on RD servers.
  while (info.status !== 'downloaded' && info.status !== 'error' && info.status !== 'dead' && attempts < 15) {
    await new Promise(r => setTimeout(r, 2000));
    info = await callDebridApi(`torrents/info/${torrentId}`);
    attempts++;
  }
  
  if (info.status !== 'downloaded') {
    throw new Error(`Torrent is not instantly available (status: ${info.status}). It is now downloading on Real-Debrid. Try again later.`);
  }
  
  return info;
}

/**
 * Step 6: Unrestrict links
 */
async function unrestrictLinks(links: string[]): Promise<AudiobookStream[]> {
  const streams: AudiobookStream[] = [];
  
  for (const link of links) {
    const unrestrictParams = new URLSearchParams();
    unrestrictParams.append('link', link);
    
    try {
      const res = await callDebridApi('unrestrict/link', undefined, 'POST', unrestrictParams.toString());
      if (res.download) {
        streams.push({
          url: res.download,
          filename: res.filename,
          mimeType: res.mimeType,
          size: res.filesize,
        });
      }
    } catch (error) {
      console.warn('Failed to unrestrict a link:', error);
    }
  }
  
  // Sort files nicely (Chapter 1, Chapter 2, etc.) based on filename
  streams.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }));
  
  return streams;
}

/**
 * Main Orchestrator: Search, add, unlock, and return playable streams.
 */
export async function resolveAudiobook(title: string, author: string, onProgress?: (msg: string) => void): Promise<AudiobookStream[]> {
  if (onProgress) onProgress('Searching for audiobook torrents...');
  const torrent = await searchAudiobookTorrent(title, author);
  
  if (!torrent) {
    throw new Error('Audiobook not found on torrent indices.');
  }
  
  const magnet = `magnet:?xt=urn:btih:${torrent.info_hash}&dn=${encodeURIComponent(torrent.name)}`;
  
  if (onProgress) onProgress('Adding to Real-Debrid...');
  let info = await addMagnetAndGetInfo(magnet);
  
  if (info.status === 'waiting_files_selection') {
    if (onProgress) onProgress('Selecting audio files...');
    info = await selectFilesAndWait(info.id, info.files);
  }
  
  if (info.status === 'downloaded' && info.links && info.links.length > 0) {
    if (onProgress) onProgress('Unrestricting high-speed links...');
    return await unrestrictLinks(info.links);
  } else {
    throw new Error('Failed to retrieve unrestricted links.');
  }
}
