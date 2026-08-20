import GhostContentAPI from '@tryghost/content-api';
import { samplePosts } from '../data/samplePosts';
import type { Lang } from '../i18n/ui';

export interface Post {
  id: string;
  slug: string;
  lang: Lang;
  title: string;
  excerpt: string;
  html: string;
  featureImage?: string;
  publishedAt: string;
  readingTime?: number;
  tags: string[];
  /** Links a post to its translations in other locales. */
  translationKey?: string;
}

const GHOST_URL = import.meta.env.GHOST_URL ?? process.env.GHOST_URL;
const GHOST_KEY =
  import.meta.env.GHOST_CONTENT_API_KEY ?? process.env.GHOST_CONTENT_API_KEY;

const useGhost = Boolean(
  GHOST_URL &&
    GHOST_KEY &&
    !GHOST_URL.includes('your-ghost-site') &&
    !GHOST_KEY.includes('your_content_api'),
);

const api = useGhost
  ? new GhostContentAPI({ url: GHOST_URL!, key: GHOST_KEY!, version: 'v5.0' })
  : null;

/** Ghost internal tags look like `#lang-en` (slug `hash-lang-en`). */
function langFromTags(tags: any[]): Lang | null {
  for (const t of tags ?? []) {
    if (t.slug === 'hash-lang-en' || t.slug === 'lang-en') return 'en';
    if (t.slug === 'hash-lang-es' || t.slug === 'lang-es') return 'es';
  }
  return null;
}

/** A shared internal tag `#tk-<group>` links translations across locales. */
function translationKeyFromTags(tags: any[]): string | undefined {
  for (const t of tags ?? []) {
    const slug: string = t.slug ?? '';
    if (slug.startsWith('hash-tk-')) return slug.replace('hash-', '');
    if (slug.startsWith('tk-')) return slug;
  }
  return undefined;
}

function normalize(ghostPost: any): Post | null {
  const lang = langFromTags(ghostPost.tags);
  if (!lang) return null; // skip posts not tagged with a locale
  return {
    id: ghostPost.id,
    slug: ghostPost.slug,
    lang,
    title: ghostPost.title ?? '',
    excerpt: ghostPost.excerpt ?? ghostPost.custom_excerpt ?? '',
    html: ghostPost.html ?? '',
    featureImage: ghostPost.feature_image ?? undefined,
    publishedAt: ghostPost.published_at ?? ghostPost.created_at,
    readingTime: ghostPost.reading_time ?? undefined,
    tags: (ghostPost.tags ?? [])
      .filter((t: any) => t.visibility !== 'internal')
      .map((t: any) => t.name),
    translationKey: translationKeyFromTags(ghostPost.tags),
  };
}

let cache: Post[] | null = null;

async function allPosts(): Promise<Post[]> {
  if (cache) return cache;
  if (!api) {
    cache = samplePosts;
    return cache;
  }
  try {
    const raw = await api.posts.browse({
      limit: 'all',
      include: ['tags', 'authors'],
      order: 'published_at DESC',
    });
    const mapped = raw.map(normalize).filter((p): p is Post => p !== null);
    if (mapped.length === 0) {
      console.warn(
        '[ghost] Connected, but found 0 posts tagged with a locale (#lang-en / #lang-es). ' +
          'Tag your posts to publish them; showing sample content for now.',
      );
      cache = samplePosts;
    } else {
      cache = mapped;
    }
    return cache;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `[ghost] Content API unreachable (${msg}). ` +
        'Check that the site is public (not behind a login proxy). Falling back to sample content.',
    );
    cache = samplePosts;
    return cache;
  }
}

export async function getPosts(lang: Lang): Promise<Post[]> {
  const posts = await allPosts();
  return posts.filter((p) => p.lang === lang);
}

export async function getPost(lang: Lang, slug: string): Promise<Post | undefined> {
  const posts = await allPosts();
  return posts.find((p) => p.lang === lang && p.slug === slug);
}

/** Find the same article in another locale, if a translation exists. */
export async function getTranslation(
  post: Post,
  targetLang: Lang,
): Promise<Post | undefined> {
  if (!post.translationKey) return undefined;
  const posts = await allPosts();
  return posts.find(
    (p) => p.lang === targetLang && p.translationKey === post.translationKey,
  );
}

export const usingGhost = useGhost;
