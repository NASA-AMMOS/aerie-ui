import adapterNode from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';


/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapterNode(),
    alias: {
      $lib: 'src/lib', // Alias $lib to src/lib
    },
    paths: {
      base: '',
    },
  },
  onwarn(warning, defaultHandler) {
    // don't warn on components containing only global styles
    if (warning.code === 'vite-plugin-svelte-css-no-scopable-elements') {
      return;
    }

    // handle all other warnings normally
    defaultHandler(warning);
  },
  preprocess: [
    preprocess(),
  vitePreprocess()
],

};

export default config;
