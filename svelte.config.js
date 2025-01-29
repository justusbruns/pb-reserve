import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    env: {
      dir: '.'
    },
    alias: {
      '$lib': './src/lib'
    }
  },
  preprocess: preprocess()
};

export default config;