import { defineConfig } from 'vite';

// base './' so the built site works from any static path
// (GitHub Pages subfolder during dev previews, Cloudflare Pages root at launch).
export default defineConfig({
  base: './',
  server: { host: true, port: 5199 },
  build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 1600 }
});
