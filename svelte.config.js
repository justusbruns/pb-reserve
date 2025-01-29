import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      runtime: 'nodejs18.x'
    }),
    env: {
      dir: '.'
    },
    alias: {
      '$lib': './src/lib'
    }
  },
  preprocess: preprocess({
    typescript: {
      tsconfigFile: './tsconfig.json'
    },
    sourceMap: true
  })
};

export default config;