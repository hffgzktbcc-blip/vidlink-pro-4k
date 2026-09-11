/**
 * Native Haptic Feedback Utility for iOS & Android
 * Uses Web Vibration API and Capacitor Haptics fallback
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'selection' = 'light') => {
  if (typeof window === 'undefined' || !('navigator' in window)) return;

  try {
    if (navigator.vibrate) {
      switch (type) {
        case 'light':
        case 'selection':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(45);
          break;
        case 'success':
          navigator.vibrate([15, 60, 25]);
          break;
      }
    }
  } catch {
    // Graceful fallback on devices without haptic engines
  }
};
