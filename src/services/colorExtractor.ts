/**
 * Lightweight Client-Side Dominant Color Extractor
 * Uses offscreen canvas to sample average and vibrant palette tones from image backdrops
 */

export interface ExtractedPalette {
  dominant: string;
  glow: string;
  gradient: string;
}

const DEFAULT_PALETTE: ExtractedPalette = {
  dominant: '#6366f1',
  glow: 'rgba(99, 102, 241, 0.4)',
  gradient: 'from-indigo-600/30 via-purple-600/10 to-transparent',
};

const paletteCache = new Map<string, ExtractedPalette>();

export const extractDominantColor = (imageUrl?: string | null): Promise<ExtractedPalette> => {
  if (!imageUrl || typeof window === 'undefined') {
    return Promise.resolve(DEFAULT_PALETTE);
  }

  if (paletteCache.has(imageUrl)) {
    return Promise.resolve(paletteCache.get(imageUrl)!);
  }

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        // Sample down to 32x32 for high performance
        canvas.width = 32;
        canvas.height = 32;
        ctx.drawImage(img, 0, 0, 32, 32);

        const imgData = ctx.getImageData(0, 0, 32, 32).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < imgData.length; i += 16) {
          const red = imgData[i];
          const green = imgData[i + 1];
          const blue = imgData[i + 2];
          // Filter out near-black and near-white to find rich hues
          const brightness = (red + green + blue) / 3;
          if (brightness > 35 && brightness < 220) {
            r += red;
            g += green;
            b += blue;
            count++;
          }
        }

        if (count === 0) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        const palette: ExtractedPalette = {
          dominant: hex,
          glow: `rgba(${r}, ${g}, ${b}, 0.45)`,
          gradient: `radial-gradient(circle at 50% 30%, rgba(${r}, ${g}, ${b}, 0.35) 0%, rgba(7, 8, 13, 0.95) 75%)`,
        };

        paletteCache.set(imageUrl, palette);
        resolve(palette);
      } catch {
        resolve(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => {
      resolve(DEFAULT_PALETTE);
    };

    img.src = imageUrl;
  });
};
