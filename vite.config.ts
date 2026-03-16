import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Anti-Truffa Tool — Cyberpedia',
        short_name: 'Anti-Truffa',
        description:
          'Strumento di emergenza per gestire truffe e frodi online senza agire d\'impulso.',
        theme_color: '#78D5E3',
        background_color: '#0a0a1a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['security', 'utilities'],
        lang: 'it',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache all static assets aggressively (SPA on CDN)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // No runtime caching — 100% static, served by Cloudflare CDN
        runtimeCaching: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          /* Vendor: React core (rarely changes → long cache) */
          'vendor-react': ['react', 'react-dom'],
          /* Vendor: Animation library (LazyMotion domAnimation only) */
          'vendor-motion': ['motion/react-m'],
        },
      },
    },
  },
})
