export const languages = {
  en: 'English',
  es: 'Español',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'site.title': 'Aether',
    'site.tagline': 'Notes from the space between disciplines.',
    'nav.home': 'Writing',
    'nav.about': 'About',
    'post.readingTime': 'min read',
    'post.readMore': 'Read',
    'post.backToWriting': '← All writing',
    'post.noTranslation': 'Not available in English',
    'index.heading': 'Writing',
    'index.intro':
      'Books, life, work, and the craft of building — from a fashion designer turned engineer.',
    'footer.rights': 'All rights reserved.',
    'lang.switchTo': 'Español',
  },
  es: {
    'site.title': 'Aether',
    'site.tagline': 'Notas desde el espacio entre disciplinas.',
    'nav.home': 'Escritos',
    'nav.about': 'Acerca de',
    'post.readingTime': 'min de lectura',
    'post.readMore': 'Leer',
    'post.backToWriting': '← Todos los escritos',
    'post.noTranslation': 'No disponible en español',
    'index.heading': 'Escritos',
    'index.intro':
      'Libros, vida, trabajo y el oficio de construir — de diseñador de moda a ingeniero.',
    'footer.rights': 'Todos los derechos reservados.',
    'lang.switchTo': 'English',
  },
} as const;

type UIKey = keyof (typeof ui)['en'];

export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key] ?? key;
  };
}

export const locales = Object.keys(languages) as Lang[];

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'es' : 'en';
}
