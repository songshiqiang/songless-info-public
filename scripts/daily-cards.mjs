// Draws the site's promotional pictures for social media, with made-up results (see
// daily-cards-demo.mjs). What players share comes from their own games, in the game itself.
//   npm run cards:daily                        every language, today (UTC), into daily-cards/<date>/
//   npm run cards:daily -- --date 2026-11-05 --locale zh --out some/dir
// Prints a JSON list of { mode, locale, file, url }. Set CHROME_PATH if Chrome isn't found.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { demoDaily, demoParty, ladderOn, seededRandom } from './daily-cards-demo.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHARTS = { en: 'US', zh: 'ZH', ru: 'RU', 'pt-br': 'BR' };

const fail = (message) => {
  console.error(`daily-cards: ${message}`);
  process.exit(1);
};

const { values: args } = parseArgs({ options: { date: { type: 'string' }, out: { type: 'string' }, locale: { type: 'string' } } });
const date = args.date ?? new Date().toISOString().slice(0, 10);
if (args.locale && !(args.locale in CHARTS)) fail(`--locale must be one of ${Object.keys(CHARTS).join(', ')}`);
const locales = args.locale ? [args.locale] : Object.keys(CHARTS);

let num;
try {
  num = ladderOn(date);
} catch (e) {
  fail(e.message);
}

// A picture must not show a day whose ladder doesn't exist.
const us = JSON.parse(readFileSync(join(ROOT, 'src/data/schedule.json'), 'utf8'));
const world = JSON.parse(readFileSync(join(ROOT, 'src/data/schedule-world.json'), 'utf8'));
for (const locale of locales) {
  const chart = CHARTS[locale];
  if (!(chart === 'US' ? us : world[chart])?.[num]) fail(`no ${chart} ladder #${num} for ${date}; extend the schedule`);
}

const inputs = locales.map((locale, i) => {
  const random = seededRandom(num * 7919 + i * 104729 + 1);
  return { num, locale, chart: CHARTS[locale], daily: demoDaily(random), party: demoParty(random, locale) };
});

const chrome =
  process.env.CHROME_PATH ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) fail('Chrome not found; set CHROME_PATH');

const outDir = resolve(args.out ?? join(ROOT, 'daily-cards', date));
const work = mkdtempSync(join(tmpdir(), 'daily-cards-'));

const PAGE = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@500;600&display=swap" rel="stylesheet">
<script src="/cards.js"></script>
<script>
const report = (result) => fetch('/done', { method: 'POST', body: JSON.stringify(result) });
(async () => {
  const cards = [];
  const all = ${JSON.stringify(inputs).replace(/</g, '\\u003c')}.flatMap((input) => DailyCards.buildCards(input).map((c) => ({ ...c, locale: input.locale })));
  await DailyCards.preloadFonts(all.map((c) => c.card));
  for (const { mode, locale, card } of all) {
    const blob = await DailyCards.renderShareImage(card);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let raw = '';
    for (let i = 0; i < bytes.length; i += 8192) raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
    cards.push({ mode, locale, url: 'https://' + card.url, png: btoa(raw) });
  }
  await report({ fonts: document.fonts.check('700 46px "Space Grotesk"'), cards });
})().catch((e) => report({ error: String(e) }));
</script>`;

/** Serves the page to Chrome and waits for it to send back what it drew. */
function drawInChrome() {
  return new Promise((resolve, reject) => {
    let finish = reject;
    const server = createServer((req, res) => {
      if (req.method === 'POST') {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          res.end();
          finish(resolve, JSON.parse(Buffer.concat(chunks).toString()));
        });
      } else if (req.url === '/cards.js') {
        res.setHeader('content-type', 'text/javascript');
        res.end(readFileSync(join(work, 'cards.js')));
      } else {
        res.setHeader('content-type', 'text/html');
        res.end(PAGE);
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', `--user-data-dir=${join(work, 'profile')}`, `http://127.0.0.1:${server.address().port}/`], { stdio: 'ignore' });
      const timer = setTimeout(() => finish(reject, new Error('Chrome took over 2 minutes; check the network')), 120_000);
      browser.on('error', reject);
      // Chrome keeps writing to its profile until it has gone, so wait for that.
      finish = (settle, value) => {
        clearTimeout(timer);
        server.close();
        server.closeAllConnections();
        browser.once('exit', () => settle(value));
        browser.kill();
      };
    });
  });
}

try {
  execFileSync(join(ROOT, 'node_modules/.bin/vite'), ['build', '--config', 'scripts/daily-cards.vite.mjs', '--outDir', work, '--emptyOutDir', '--logLevel', 'error'], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const { error, fonts, cards } = await drawInChrome();
  if (error) fail(error);
  if (!fonts) fail('the fonts did not load, so the pictures would be off-brand; check the network');

  mkdirSync(outDir, { recursive: true });
  const list = cards.map(({ mode, locale, url, png }) => {
    const file = join(outDir, `${mode}-${locale}.png`);
    writeFileSync(file, Buffer.from(png, 'base64'));
    return { mode, locale, file, url };
  });
  console.log(JSON.stringify(list, null, 2));
} catch (e) {
  fail(e.message);
} finally {
  rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
