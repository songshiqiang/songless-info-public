// Downloads the Billboard Year-End Hot 100 lists from Wikipedia and writes
// scripts/charts.json ([{ year, rank, title, artist }]). Run it once a year to
// add the newest list; resolve-previews.mjs reads the result.
import { writeFile } from 'node:fs/promises';

const FIRST = 1980;
const LAST = Number(process.argv[2]) || new Date().getUTCFullYear() - 1;
const OUT = new URL('./charts.json', import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Wikipedia asks clients to identify themselves; name your own project here if
// you run this for a different deployment.
const USER_AGENT = process.env.IMPORT_USER_AGENT || 'songless.info chart import';

const clean = (s) =>
  s
    .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{sort\|[^|}]*\|([^}]*)\}\}/gi, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/'''?/g, '')
    .replace(/^[^|]*?(style|scope|rowspan|align)="[^"]*"\s*\|/, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();

function parse(wikitext, year) {
  const table = wikitext.slice(wikitext.indexOf('{|'), wikitext.indexOf('|}', wikitext.indexOf('{|')));
  const rows = [];
  let lastRank = 0;
  for (const block of table.split(/\n\|-[^\n]*/).slice(1)) {
    const cells = block
      .split('\n')
      .filter((l) => /^[|!]/.test(l))
      .flatMap((l) => l.replace(/^[|!]/, '').split(/\|\||!!/))
      .map(clean)
      .filter((c) => c !== '');
    if (cells.length < 2) continue;
    // Tied ranks use rowspan, so a row may omit the rank cell.
    let rank = Number(cells[0]);
    let rest = cells.slice(1);
    if (!Number.isInteger(rank) || rank <= 0) {
      rank = lastRank;
      rest = cells;
    }
    if (rest.length < 2 || !rank) continue;
    lastRank = rank;
    const titleCell = rest[0];
    const artist = rest[1].replace(/\s+/g, ' ');
    // A double A-side is written as "Song A" / "Song B".
    for (const m of titleCell.matchAll(/"([^"]+)"/g)) rows.push({ year, rank, title: m[1].trim(), artist });
    if (!/"/.test(titleCell)) rows.push({ year, rank, title: titleCell, artist });
  }
  return rows;
}

const all = [];
for (let year = FIRST; year <= LAST; year++) {
  const page = `Billboard_Year-End_Hot_100_singles_of_${year}`;
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${page}&prop=wikitext&format=json&formatversion=2`;
  let json = {};
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const text = await res.text();
    try {
      json = JSON.parse(text);
      break;
    } catch {
      // Rate limited: back off and retry.
      await sleep(5000 * attempt);
    }
  }
  await sleep(1500);
  if (!json.parse) {
    console.log(`skip ${year}: ${json.error?.info ?? 'no response'}`);
    continue;
  }
  const rows = parse(json.parse.wikitext, year);
  console.log(`${year}: ${rows.length} songs`);
  all.push(...rows);
}

await writeFile(OUT, JSON.stringify(all, null, 0).replace(/\},\{/g, '},\n{') + '\n');
console.log(`${all.length} chart entries written`);
