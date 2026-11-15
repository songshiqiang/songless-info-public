// The languages the site is in. English keeps the bare URLs; the others live under a prefix.
import type { Chart } from '../lib/game';

export const LOCALES = ['en', 'zh', 'ru', 'pt-br'] as const;
export type Locale = (typeof LOCALES)[number];

export const isLocale = (x: unknown): x is Locale => (LOCALES as readonly unknown[]).includes(x);

/** BCP 47 tag for `lang` and `hreflang`. */
export const HTML_LANG: Record<Locale, string> = { en: 'en', zh: 'zh-Hans', ru: 'ru', 'pt-br': 'pt-BR' };
export const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', zh: 'zh-CN', ru: 'ru-RU', 'pt-br': 'pt-BR' };
export const OG_LOCALE: Record<Locale, string> = { en: 'en_US', zh: 'zh_CN', ru: 'ru_RU', 'pt-br': 'pt_BR' };
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', zh: '中文', ru: 'Русский', 'pt-br': 'Português' };

/** Whose songs a player hears until they pick a country themselves. */
export const DEFAULT_CHART: Record<Locale, Chart> = { en: 'US', zh: 'ZH', ru: 'RU', 'pt-br': 'BR' };

/** "/unlimited" in another language: "/zh/unlimited". "/" and "/?a=1#b" become "/zh" and "/zh?a=1#b". */
export function localePath(locale: Locale, path: string): string {
  if (locale === 'en') return path;
  return /^\/([?#]|$)/.test(path) ? `/${locale}${path.slice(1)}` : `/${locale}${path}`;
}

/** The English path of a page: "/zh/unlimited" gives "/unlimited", "/zh" gives "/". */
export function stripLocale(pathname: string): string {
  const m = pathname.match(/^\/(zh|ru|pt-br)(\/.*)?$/);
  return m ? m[2] || '/' : pathname;
}

/** Points the site's own links in a piece of HTML at this language. */
export const localizeHtml = (html: string, locale: Locale) =>
  html.replace(/href="(\/(?!\/)[^"]*)"/g, (_, path: string) => `href="${localePath(locale, path)}"`);

/** getStaticPaths for pages that exist in every language. */
export const localePaths = () =>
  LOCALES.map((locale) => ({ params: { locale: locale === 'en' ? undefined : locale }, props: { locale } }));
