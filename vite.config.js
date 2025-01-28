import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [sveltekit(), tsconfigPaths()],
  server: {
    port: 5173,
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
      external: ['mapbox-gl', '@mapbox/mapbox-gl-geocoder']
    }
  },
  optimizeDeps: {
    include: ['@sveltejs/kit', 'vite']
  }
});
