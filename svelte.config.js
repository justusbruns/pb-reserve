import adapter from '@sveltejs/adapter-vercel';
import preprocess from "svelte-preprocess";

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
  preprocess: preprocess({})
};

export default config;