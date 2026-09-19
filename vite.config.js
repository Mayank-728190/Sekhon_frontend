import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const root = import.meta.dirname

  return {
    plugins: [react()],

    // ── Path aliases ──────────────────────────────────────
    resolve: {
      alias: {
        '@':           resolve(root, './src'),
        '@config':     resolve(root, './src/config'),
        '@components': resolve(root, './src/components'),
        '@context':    resolve(root, './src/context'),
        '@hooks':      resolve(root, './src/hooks'),
      },
    },

    // ── Dev server ────────────────────────────────────────
    server: {
      port: 5173,
      strictPort: false,
      open: true,

      // Proxy API calls to backend to avoid CORS in dev
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: env.VITE_WS_BASE_URL || 'ws://localhost:8000',
          ws: true,
          changeOrigin: true,
        },
      },
    },

    // ── Production build ──────────────────────────────────
    build: {
      outDir: 'dist',
      sourcemap: true,
      minify: 'oxc',
      target: 'es2020',
      chunkSizeWarningLimit: 1000,

      rollupOptions: {
        output: {
          // Split large vendor libs for better caching (function form for rolldown)
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'leaflet-vendor'
            if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) return 'chart-vendor'
          },
        },
      },
    },

    // ── Preview server (after build) ─────────────────────
    preview: {
      port: 4173,
      open: true,
    },
  }
})

