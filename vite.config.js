import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [svelte(), tsconfigPaths()],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      'flatpickr/dist/l10n/nl.js': 'flatpickr/dist/l10n/nl.js',
      'flatpickr/dist/flatpickr.css': 'flatpickr/dist/flatpickr.css'
    }
  },
  optimizeDeps: {
    include: [
      'flatpickr',
      'flatpickr/dist/l10n/nl.js',
      'canvas-confetti',
      'mapbox-gl'
    ]
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      external: [
        '@mapbox/mapbox-gl-geocoder',
        '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
      ],
      output: {
        manualChunks: {
          'vendor': [
            'svelte',
            'flatpickr',
            'mapbox-gl',
            'canvas-confetti'
          ]
        },
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
