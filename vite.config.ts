import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api/debrid': {
        target: 'https://api.real-debrid.com',
        changeOrigin: true,
        rewrite: path => {
          const url = new URL(`http://localhost${path}`);
          const endpoint = url.searchParams.get('endpoint');
          if (!endpoint) return path;
          url.searchParams.delete('endpoint');
          const qs = url.searchParams.toString();
          const prefix = endpoint.startsWith('oauth/') ? '' : '/rest/1.0';
          return `${prefix}/${endpoint}${qs ? `?${qs}` : ''}`;
        },
      },
    },
  },
})

