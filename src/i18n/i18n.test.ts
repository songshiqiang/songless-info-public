import { describe, expect, it } from 'vitest';
import { LOCALES, localePath, localizeHtml, stripLocale } from './locales';
import { localizeFilter } from './client';
import ptBr from './ui/pt-br';
import ru from './ui/ru';
import zh from './ui/zh';

describe('language URLs', () => {
  it('leaves English at the bare URLs', () => {
    expect(localePath('en', '/')).toBe('/');
    expect(localePath('en', '/unlimited')).toBe('/unlimited');
  });

  it('prefixes the other languages without a trailing slash', () => {
    expect(localePath('zh', '/')).toBe('/zh');
    expect(localePath('pt-br', '/party#how-to-play')).toBe('/pt-br/party#how-to-play');
    expect(localePath('ru', '/?ladder=3&chart=BR#play')).toBe('/ru?ladder=3&chart=BR#play');
  });

  it('finds the English path of any page', () => {
    expect(stripLocale('/zh')).toBe('/');
    expect(stripLocale('/pt-br/party/ABCD')).toBe('/party/ABCD');
    expect(stripLocale('/unlimited')).toBe('/unlimited');
    expect(stripLocale('/zhang')).toBe('/zhang');
  });

  it('rewrites only the site\'s own links', () => {
    const html = '<a href="/unlimited">a</a> <a href="/">b</a> <a href="https://x.com/y">c</a> <a href="mailto:a@b.c">d</a>';
    expect(localizeHtml(html, 'ru')).toBe('<a href="/ru/unlimited">a</a> <a href="/ru">b</a> <a href="https://x.com/y">c</a> <a href="mailto:a@b.c">d</a>');
    expect(localizeHtml(html, 'en')).toBe(html);
    expect(LOCALES).toHaveLength(4);
  });
});

describe('strings', () => {
  it('translates the same Worker messages in every language', () => {
    const keys = Object.keys(zh.server.messages).sort();
    expect(Object.keys(ru.server.messages).sort()).toEqual(keys);
    expect(Object.keys(ptBr.server.messages).sort()).toEqual(keys);
  });

  it('keeps a saved filter summary as it is in English', () => {
    expect(localizeFilter('USA · All decades · Rock, Pop')).toBe('USA · All decades · Rock, Pop');
    expect(localizeFilter('old text')).toBe('old text');
  });
});

describe('Russian plurals', () => {
  it('follows the number', () => {
    expect([1, 2, 5, 11, 21, 22].map((n) => ru.songs(n))).toEqual(['1 песня', '2 песни', '5 песен', '11 песен', '21 песня', '22 песни']);
  });
});
