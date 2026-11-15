import type { Locale } from '../locales';
import en, { type Content } from './en';
import ptBr from './pt-br';
import ru from './ru';
import zh from './zh';
import uiEn, { type Ui } from '../ui/en';
import uiPt from '../ui/pt-br';
import uiRu from '../ui/ru';
import uiZh from '../ui/zh';

export const content: Record<Locale, Content> = { en, zh, ru, 'pt-br': ptBr };
/** The game's strings, for the pages that show them too. */
export const uiStrings: Record<Locale, Ui> = { en: uiEn, zh: uiZh, ru: uiRu, 'pt-br': uiPt };
