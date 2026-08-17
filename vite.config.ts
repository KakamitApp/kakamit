import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      injectRegister: 'script-defer',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,pdf,json}'],
        navigateFallbackDenylist: [/^\/fodmap\//, /^\/faq\//, /^\/release-notes\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
