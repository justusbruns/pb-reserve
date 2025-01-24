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
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'mapbox-gl',
            'canvas-confetti'
          ]
        },
        assetFileNames: 'assets/[name].[ext]',
        globals: {
          '@mapbox/mapbox-gl-geocoder': 'MapboxGeocoder'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      'flatpickr/dist/l10n/nl.js': 'flatpickr/dist/l10n/nl.js',
      'flatpickr/dist/flatpickr.css': 'flatpickr/dist/flatpickr.css',
      '@mapbox/mapbox-gl-geocoder': 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.7.0/mapbox-gl-geocoder.min.js'
    }
  },
  optimizeDeps: {
    exclude: ['@mapbox/mapbox-gl-geocoder']
  }
});
