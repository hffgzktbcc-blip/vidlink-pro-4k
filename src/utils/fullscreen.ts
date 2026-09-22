/**
 * Universal Cross-Browser Fullscreen Utility
 * Handles HTML5 Fullscreen API, WebKit (Safari), and iOS Mobile Video Fullscreen
 */

export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

export async function enterFullscreen(element?: HTMLElement | HTMLVideoElement | null): Promise<void> {
  if (typeof document === 'undefined') return;
  const target = element || document.documentElement;

  try {
    // Special handling for iOS Safari on HTMLVideoElement
    if (target instanceof HTMLVideoElement && (target as any).webkitEnterFullscreen) {
      (target as any).webkitEnterFullscreen();
      return;
    }

    if (target.requestFullscreen) {
      await target.requestFullscreen({ navigationUI: 'hide' } as any).catch(() => target.requestFullscreen());
    } else if ((target as any).webkitRequestFullscreen) {
      await (target as any).webkitRequestFullscreen();
    } else if ((target as any).mozRequestFullScreen) {
      await (target as any).mozRequestFullScreen();
    } else if ((target as any).msRequestFullscreen) {
      await (target as any).msRequestFullscreen();
    }
  } catch (err) {
    console.warn('Fullscreen entry failed or was blocked by browser security policy:', err);
  }
}

export async function exitFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;

  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
  } catch (err) {
    console.warn('Fullscreen exit failed:', err);
  }
}

export async function toggleFullscreen(element?: HTMLElement | HTMLVideoElement | null): Promise<boolean> {
  if (isFullscreenActive()) {
    await exitFullscreen();
    return false;
  } else {
    await enterFullscreen(element);
    return true;
  }
}

export function subscribeToFullscreenChange(callback: (isActive: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {};

  const handler = () => {
    callback(isFullscreenActive());
  };

  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('mozfullscreenchange', handler);
  document.addEventListener('MSFullscreenChange', handler);

  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('MSFullscreenChange', handler);
  };
}
