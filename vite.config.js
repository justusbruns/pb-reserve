import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [sveltekit(), tsconfigPaths()],
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  ssr: {
    noExternal: ['@sveltejs/kit']
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
  kit: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    exclude: ['mapbox-gl', '@mapbox/mapbox-gl-geocoder']
  }
});
