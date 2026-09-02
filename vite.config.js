import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base './' supaya boleh di-host di mana-mana termasuk GitHub Pages (subpath repo)
// vite-plugin-pwa: manifest + service worker (offline shell) untuk PWA "PcJeng Invoices"
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/favicon-32x32.png', 'icons/favicon-16x16.png', 'icons/apple-touch-icon.png', 'favicon.ico'],
      manifest: {
        name: 'PcJeng Invoices',
        short_name: 'PcJeng',
        description: 'Quotation, Invoice & Receipt — sistem invois PcJeng',
        lang: 'ms',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#00AEEF',
        background_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,svg,png,ico,woff2}'],
        // index.html TIDAK di-precache — navigasi guna NetworkFirst supaya
        // browser sentiasa dapat versi TERKINI selepas deploy (elak skrin putih)
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'html-navigate', networkTimeoutSeconds: 3 },
          },
          {
            // imej Cloudinary (logo/signature/PDF) — URL tak berubah, cache dulu
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-media',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  base: './',
})
