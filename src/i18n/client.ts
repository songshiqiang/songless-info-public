// The language of the current page, for the React islands. The page's <html> says which one,
// and only that language's strings are downloaded.
import type { Chart } from '../lib/game';
import { DATE_LOCALE, DEFAULT_CHART, isLocale, localePath, type Locale } from './locales';
import type { Ui } from './ui/en';

const tag = typeof document === 'undefined' ? undefined : document.documentElement.dataset.locale;
export const locale: Locale = isLocale(tag) ? tag : 'en';
export const dateLocale = DATE_LOCALE[locale];
export const defaultChart: Chart = DEFAULT_CHART[locale];

const dictionaries: Record<Locale, () => Promise<{ default: Ui }>> = {
  en: () => import('./ui/en'),
  zh: () => import('./ui/zh'),
  ru: () => import('./ui/ru'),
  'pt-br': () => import('./ui/pt-br')
};

export const ui: Ui = (await dictionaries[locale]()).default;

export const path = (p: string) => localePath(locale, p);

/** The Worker answers in English; this shows its messages in the page's language. */
export function serverText(message: string): string {
  const names = message.match(/^Names can't be changed\. You saved as (.+)\.$/);
  if (names) return ui.server.namesFixed(names[1]);
  return (ui.server.messages as Record<string, string>)[message] ?? message;
}

/**
 * A saved filter summary ("USA · All decades · Rock, Pop") in this language. Summaries stay in
 * English when saved, so everyone reads a leaderboard row in their own language.
 */
export function localizeFilter(filter: string): string {
  const words: Record<string, string> = {
    'All countries': ui.allCountries,
    'All decades': ui.allDecades,
    'All genres': ui.allGenres,
    USA: ui.charts.US,
    Brazil: ui.charts.BR,
    Russia: ui.charts.RU,
    Chinese: ui.charts.ZH,
    ...ui.decadesShort,
    ...ui.genres
  };
  return filter
    .split(' · ')
    .map((part) => part.split(', ').map((w) => words[w] ?? w).join(', '))
    .join(' · ');
}
