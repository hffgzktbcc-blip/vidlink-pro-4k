import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vidlink.pro4k',
  appName: 'VidLink Pro 4K',
  webDir: 'dist',
  server: {
    url: 'https://vidlink-pro-4k.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
