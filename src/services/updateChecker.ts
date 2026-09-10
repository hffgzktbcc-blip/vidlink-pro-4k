export const CURRENT_APP_VERSION = '1.1.0';
const GITHUB_REPO = 'hffgzktbcc-blip/vidlink-pro-4k';
const UPDATE_CHECK_KEY = 'vidlink_last_update_check';

export interface AppReleaseInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  mobileDownloadUrl?: string;
  publishedAt: string;
}

/**
 * Compare two semver strings like "1.2.0" and "1.1.0"
 * Returns true if remote is strictly greater than local
 */
function isNewerVersion(remote: string, current: string): boolean {
  const cleanRemote = remote.replace(/^v/i, '').trim();
  const cleanCurrent = current.replace(/^v/i, '').trim();

  const rParts = cleanRemote.split('.').map(n => parseInt(n, 10) || 0);
  const cParts = cleanCurrent.split('.').map(n => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

/**
 * Checks GitHub Releases API for the latest published APK release.
 */
export async function checkForAppUpdate(force: boolean = false): Promise<AppReleaseInfo | null> {
  // Rate-limit auto-checks on launch (once every 4 hours unless forced)
  if (!force) {
    const lastCheck = localStorage.getItem(UPDATE_CHECK_KEY);
    if (lastCheck) {
      const elapsed = Date.now() - parseInt(lastCheck, 10);
      if (elapsed < 4 * 60 * 60 * 1000) {
        return null;
      }
    }
  }

  try {
    localStorage.setItem(UPDATE_CHECK_KEY, Date.now().toString());

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const latestTag = (data.tag_name || data.name || '').replace(/^v/i, '');

    if (!latestTag) return null;

    // Find TV APK, fallback to any APK asset
    let tvApkUrl = '';
    let mobileApkUrl = '';

    if (Array.isArray(data.assets)) {
      for (const asset of data.assets) {
        const name = (asset.name || '').toLowerCase();
        if (name.includes('tv') && name.endsWith('.apk')) {
          tvApkUrl = asset.browser_download_url;
        } else if (name.includes('mobile') && name.endsWith('.apk')) {
          mobileApkUrl = asset.browser_download_url;
        } else if (name.endsWith('.apk') && !tvApkUrl) {
          tvApkUrl = asset.browser_download_url;
        }
      }
    }

    // Default fallback direct download link
    if (!tvApkUrl) {
      tvApkUrl = `https://github.com/${GITHUB_REPO}/releases/latest/download/app-debug.apk`;
    }

    const hasUpdate = isNewerVersion(latestTag, CURRENT_APP_VERSION);

    return {
      hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: latestTag,
      releaseName: data.name || `Version ${latestTag}`,
      releaseNotes: data.body || 'Performance improvements, updated stream resolvers, and UI bug fixes.',
      downloadUrl: tvApkUrl,
      mobileDownloadUrl: mobileApkUrl || tvApkUrl,
      publishedAt: data.published_at || new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Update check failed:', error);
    return null;
  }
}

/**
 * Triggers APK download and package installer on Android TV or mobile device
 */
export function startApkInstallation(downloadUrl: string): void {
  if (typeof window !== 'undefined') {
    // Open direct APK download link in Android system browser / download manager
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'VidLink-4K-Pro.apk');
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
