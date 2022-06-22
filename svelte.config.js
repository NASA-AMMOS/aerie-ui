import adapterNode from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapterNode(),
    vite: {
      test: {
        environment: 'jsdom',
        include: ['./src/**/*.test.ts'],
        outputFile: process.env.CI ? 'unit-test-results/json-results.json' : null,
        reporters: process.env.CI ? 'json' : null,
      },
    },
  },
  preprocess: preprocess(),
};

export default config;
