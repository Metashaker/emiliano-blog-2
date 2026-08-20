import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../../lib/ghost';
import { locales, ui, type Lang } from '../../i18n/ui';

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

export async function GET(context: APIContext) {
  const lang = context.params.lang as Lang;
  const posts = await getPosts(lang);

  return rss({
    title: ui[lang]['site.title'],
    description: ui[lang]['site.tagline'],
    site: context.site ?? 'https://aether.example.com',
    items: posts.map((post) => ({
      title: post.title,
      description: post.excerpt,
      pubDate: new Date(post.publishedAt),
      link: `/${lang}/${post.slug}/`,
    })),
    customData: `<language>${lang}</language>`,
  });
}
