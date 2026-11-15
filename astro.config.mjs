import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://songless.info',
  integrations: [
    react(),
    sitemap({
      // Lists every language's version of each page as hreflang alternates.
      i18n: { defaultLocale: 'en', locales: { en: 'en', zh: 'zh-Hans', ru: 'ru', 'pt-br': 'pt-BR' } },
      filter: (page) => !/\/404\/?$/.test(page)
    })
  ],
  trailingSlash: 'never',
  build: { format: 'file' }
});
