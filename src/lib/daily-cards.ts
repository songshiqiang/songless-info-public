// Draws cards outside the game for scripts/daily-cards.mjs: the same cards players get on
// the results screen, from the numbers the script hands over.
import { ladderLabel, type Chart } from './game';
import { dailyResultCard, partyResultCard, preloadFonts, renderShareImage, type Card } from './share-image';
import { DATE_LOCALE, localePath, type Locale } from '../i18n/locales';
import en from '../i18n/ui/en';
import ptBr from '../i18n/ui/pt-br';
import ru from '../i18n/ui/ru';
import zh from '../i18n/ui/zh';

export { preloadFonts, renderShareImage };

const UI = { en, zh, ru, 'pt-br': ptBr };

export interface CardsInput {
  num: number;
  locale: Locale;
  chart: Chart;
  /** Seconds each Daily song took; null for a miss. */
  daily?: (number | null)[];
  party?: { players: { name: string; score: number }[]; me?: string };
}

const site = (locale: Locale, path: string) => `songless.info${localePath(locale, path).replace(/^\/$/, '')}`;

export function buildCards({ num, locale, chart, daily, party }: CardsInput): { mode: string; card: Card }[] {
  const ui = UI[locale];
  const tagline = ui.shareImage.tagline;
  const cards: { mode: string; card: Card }[] = [];
  if (daily) {
    const date = ladderLabel(num, DATE_LOCALE[locale]);
    cards.push({
      mode: 'daily',
      card: dailyResultCard(daily, ui.secondsShort, {
        tag: chart === 'US' ? date : `${ui.charts[chart]} · ${date}`,
        tagline,
        url: site(locale, '/'),
        seed: num,
      }),
    });
  }
  if (party) {
    const players = party.players.map((p) => ({ id: p.name, name: p.name, score: p.score, solved: 0 }));
    const best = Math.max(...players.map((p) => p.score));
    const mine = players.find((p) => p.id === party.me);
    cards.push({
      mode: 'party',
      card: partyResultCard(players, party.me ?? '', ui.party.me, !!mine && mine.score > 0 && mine.score === best, {
        tag: ui.settings.party,
        tagline,
        url: site(locale, '/party'),
        seed: num,
      }),
    });
  }
  return cards;
}
