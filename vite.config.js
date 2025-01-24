import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [svelte(), tsconfigPaths()],
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
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
      external: ['mapbox-gl', '@mapbox/mapbox-gl-geocoder'],
      output: {
        globals: {
          'mapbox-gl': 'mapboxgl',
          '@mapbox/mapbox-gl-geocoder': 'MapboxGeocoder'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    exclude: ['mapbox-gl', '@mapbox/mapbox-gl-geocoder']
  }
});
