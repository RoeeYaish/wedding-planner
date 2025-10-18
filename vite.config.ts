import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Bump this to force a new manifest/swc content hash so clients update the service worker
const PWA_VERSION = '1.0.0'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
      devOptions: { enabled: false },
      // cast to any so the manifest can include a non-standard `version` field used to force updates
      manifest: ( {
        name: 'Wedding Planner',
        short_name: 'Wedding Planner',
        description: 'Plan your wedding with tasks, budget, vendors and timeline.',
        // non-standard field included to make it easy to force a manifest change
        version: PWA_VERSION,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAF8F5',
        theme_color: '#1F2A44',
        icons: [
          { src: '/pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      } as any ),
    }),
  ],
})
