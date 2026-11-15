// JSON-LD shared by the game pages.
import { HTML_LANG, localePath, type Locale } from '../i18n/locales';

const SITE = 'https://songless.info';

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Songless',
  url: `${SITE}/`,
  logo: `${SITE}/logo.png`,
  email: 'contact@songless.info'
};

const pageUrl = (locale: Locale, path: string) => `${SITE}${localePath(locale, path)}`;

export function websiteJsonLd(locale: Locale, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: locale === 'en' ? `${SITE}/` : pageUrl(locale, '/'),
    inLanguage: HTML_LANG[locale]
  };
}

export function videoGameJsonLd(locale: Locale, name: string, path: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name,
    url: pageUrl(locale, path),
    description,
    inLanguage: HTML_LANG[locale],
    genre: ['Music', 'Puzzle', 'Trivia'],
    gamePlatform: 'Web browser',
    applicationCategory: 'Game',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };
}

export function breadcrumbJsonLd(locale: Locale, name: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Songless', item: locale === 'en' ? `${SITE}/` : pageUrl(locale, '/') },
      { '@type': 'ListItem', position: 2, name, item: pageUrl(locale, path) }
    ]
  };
}

export interface Faq {
  q: string;
  a: string;
}

export function faqJsonLd(locale: Locale, items: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: HTML_LANG[locale],
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
}

export function howToJsonLd(locale: Locale, name: string, steps: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    inLanguage: HTML_LANG[locale],
    step: steps.map((text) => ({ '@type': 'HowToStep', text }))
  };
}
