// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = process.env.SITE_URL || 'https://aether.example.com';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true },
  },
  integrations: [sitemap()],
});
