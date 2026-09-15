// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://pvfcalculator.com',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/request-a-quote/thanks/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});