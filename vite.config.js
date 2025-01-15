import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    svelte(),
    tsconfigPaths()
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173  // Default Vite port
  }
});
