import type { Lang } from '../i18n/ui';

const LOCALE: Record<Lang, string> = {
  en: 'en-US',
  es: 'es-ES',
};

export function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(LOCALE[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
