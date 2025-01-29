import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

/** @type {import('vite').UserConfig} */
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Vite config loading with env:', {
    NODE_ENV: process.env.NODE_ENV,
    command,
    mode,
    ADMIN_USER_SET: !!env.ADMIN_USER,
    ADMIN_PASSWORD_SET: !!env.ADMIN_PASSWORD,
    SESSION_SECRET_SET: !!env.SESSION_SECRET
  });

  return {
    plugins: [sveltekit(), tsconfigPaths()],
    server: {
      port: 5173,
      host: true,
      fs: {
        allow: ['.']
      }
    },
    preview: {
      port: 4173
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
      },
      routes: {
        '/en/*': '/*'
      }
    },
    optimizeDeps: {
      exclude: ['mapbox-gl', '@mapbox/mapbox-gl-geocoder']
    }
  };
});
