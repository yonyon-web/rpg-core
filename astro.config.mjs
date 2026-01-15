import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://yonyon-web.github.io',
  base: '/GEasy-Kit',
  outDir: './docs',
  publicDir: './public',
  integrations: [mdx()],
  build: {
    assets: 'lib'
  }
});
