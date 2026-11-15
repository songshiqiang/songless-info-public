// Builds the Brazil, Russia and Chinese-language song libraries and merges them
// into src/data/songs.json (songs tagged `chart: "BR"`, `"RU"` or `"ZH"`).
//
// Brazil and Russia have no public year-end chart archive we can read, so their
// candidates come from Deezer playlists of each country's hits by decade
// (mostly Deezer's own editors for Brazil), ranked by Deezer's popularity score,
// plus the best-known songs of each artist in scripts/br-artists.mjs and
// scripts/ru-artists.mjs.
// The Chinese library (mainland China, Hong Kong and Taiwan together) adds the
// KKBOX year-end charts (Taiwan Mandarin and Hong Kong Cantonese, 2018 on) to
// Deezer playlists of older classics, then the best-known songs of each artist
// in scripts/zh-artists.mjs; its titles are shown in simplified Chinese, with
// the traditional spelling from the store kept as `alt`.
// Each song is then matched on the iTunes Search API in that country's store
// for the 30-second preview, like the US library. The most popular POOL songs
// of each country become answers; the rest are only guess suggestions.
// iTunes answers are cached in scripts/world-cache.json, so re-runs are quick.
//
//   node scripts/fetch-world.mjs          # both countries
//   node scripts/fetch-world.mjs BR       # one country
import { readFile, writeFile } from 'node:fs/promises';
import * as OpenCC from 'opencc-js';
import { BR_LAST_YEAR, BR_TIERS } from './br-artists.mjs';
import { RU_LAST_YEAR, RU_TIERS } from './ru-artists.mjs';
import { ZH_LAST_YEAR, ZH_TIERS } from './zh-artists.mjs';

const toSimplified = OpenCC.Converter({ from: 'hk', to: 'cn' });

const SONGS = new URL('../src/data/songs.json', import.meta.url);
const CACHE = new URL('./world-cache.json', import.meta.url);
const FIRST_YEARS = new URL('./first-years.json', import.meta.url);
const CANDIDATES = 600;
const POOL = 300;
// Say who is really calling, so one deployment's traffic is not mistaken for
// another's. KKBOX rejects plain clients, so the default keeps a browser prefix.
// Set IMPORT_USER_AGENT to name your own project if you run this.
const USER_AGENT = process.env.IMPORT_USER_AGENT || 'Mozilla/5.0 (songless.info song import)';

// Russian artists who write their names in Latin letters; for Russia, every
// other song needs Cyrillic in its title or artist, which keeps out the
// international hits that Russian playlists mix in.
const RU_LATIN = new Set(
  ['Zivert', 'MiyaGi', 'Little Big', 't.A.T.u.', 'Mona', 'HammAli & Navai', 'Artik & Asti', 'Morgenshtern', 'Slava Marlow', 'Dabro', 'Mary Gu', 'Instasamka', 'Klava Koka', 'Niletto', 'Jony', 'Ramil\'', 'Macan', 'Anna Asti', 'Serebro', 'Vintage', 'Smash', 'IOWA', 'Elman', 'Bahh Tee', 'Andro', 'Rauf & Faik', 'Big Baby Tape', 'Kizaru', 'Oxxxymiron', 'Scriptonite', 'Basta', 'Timati', 'Feduk', 'Dzharakhov', 'Mot', 'Egor Kreed', 'Polina Gagarina', 'Dima Bilan', 'Max Barskih', 'Loboda', 'Sergey Lazarev', 'Mumiy Troll', 'Nautilus Pompilius', 'Kino', 'DDT', 'Leningrad', 'Splean', 'Zemfira', 'Bi-2', 'Lyube', 'Ruki Vverh!', 'Mband', 'Gayazov$ Brother$', 'Xcho', 'Shaman']
    .map((a) => a.toLowerCase())
);
const cyrillic = /[\u0400-\u04ff]/;
const han = /\p{Script=Han}/u;
// Remixes and edits aren't the song people remember.
const NOT_ORIGINAL = /remix|\bmix\b|sped up|slowed|mashup|nightcore|8d audio|karaoke|instrumental|новогодняя версия|dj\w*版|伴奏/i;
// Version tags dropped from displayed titles (matching ignores brackets anyway).
const VERSION_TAG = /\s*[([](?:#?\w* ?ao vivo[^)\]]*|acústico(?: ao vivo)?|live|(?:\d{4} )?(?:digital )?remaster(?:ed|izad[oa])?(?: \d{4})?|radio edit|single version|bonus track|new version|version \d{4}|версия \d{4}|versão (?:single|acústica|remasterizada))[)\]]/gi;
const PER_DECADE = 60;
// Recordings that aren't the studio song, by track title or album name.
const NOT_STUDIO = /\blive\b|現場|演唱會|巡迴|音樂會|medley|組曲|串燒|純音樂|伴奏|off vocal|\bdemo\b|\bintro\b|interlude|\boutro\b|序曲|前奏|獨白|對白|旁白|acoustic|unplugged|不插電|翻唱|\bcover\b|重製|鋼琴版|吉他版|抒情版|合唱版|\bdj\b|\bver(?:sion)?\b|真言|神咒|心經|大悲咒|佛號|\s20\d\d$|трибьют|tribute|tributo|homenagem|in memoriam/i;
// Songs fetched per artist: twice the answers, so the rest can be suggestions.
const SUGGESTIONS_PER_ANSWER = 2;

const COUNTRIES = {
  BR: {
    tiers: BR_TIERS,
    lastYear: BR_LAST_YEAR,
    playlists: [
      309650853, // Anos 80 no Brasil
      989343587, // Anos 90 no Brasil
      3859951986, // Anos 2000 no Brasil
      7650721282, // Anos 2010: Mais Tocadas No Brasil
      8424100582, // Top Brasil 2020
      14590090081, // Top Brasil 2025
      1111141961, // Top Brazil (current)
      5446018302, // Pop Brasil Anos 90
      5441594162, // Pop Brasil Anos 2000
      5619143162, // Rock Brasil Anos 80
      5619144082, // Rock Brasil Anos 90
      5691936222, // MPB Anos 90
      5691935322, // MPB Anos 2000
      5519639222, // Sertanejo Anos 80
      5519638442, // Sertanejo Anos 90
      5518744242, // Sertanejo Anos 2000
      9040974842, // Sertanejo Anos 2010
      6119830224, // Pagode Anos 90
      6119915844, // Pagode Anos 2000
      1450851327, // Clássicos do Axé
      13692137581, // Funk Anos 2020
      13692974121 // Forró Anos 2020
    ]
  },
  RU: {
    tiers: RU_TIERS,
    lastYear: RU_LAST_YEAR,
    playlists: [
      14744448883, // Русские хиты 80х 90х 00х
      13876376061, // Russian Hits 80s 90s 00s | Русские хиты
      5988148284, // Русские Хиты 90-х и 2000-х
      10458088782, // Русская поп-музыка 2000-х: главное
      13571593881, // Хиты 2000-2010 Русские
      4410962386, // Русские хиты 2000х
      8424739742, // Top Russia 2020 (Deezer Best Of)
      10458093762, // ТОП 100 Лучшие Русские Песни 2022
      12390599043, // Russian Hits 2024
      15582398703, // Топ 100 Россия 2026
      10055297882, // Русский рок: золотые хиты
      15544176603 // ТОП 100 Русский рок
    ]
  },
  ZH: {
    store: 'TW', // the iTunes Store doesn't sell music in mainland China
    kkbox: [
      ['tw', 297], // Taiwan, Mandarin
      ['hk', 320] // Hong Kong, Cantonese
    ],
    kkboxTop: 15, // songs taken from each yearly chart
    candidates: 800,
    tiers: ZH_TIERS,
    lastYear: ZH_LAST_YEAR,
    playlists: [
      15832856881, // 华语金曲50年50首
      15293548663, // 90华语金曲榜
      7367247564, // 华语金曲
      10796728642, // Mandopop C-Pop Hits
      11407908884, // Chinese Top Hits 华语流行榜2020-23
      14647738101, // Top Chinese song 2025
      13731188941, // 香港懷舊 Hong Kong Classics
      14190925401, // Cantopop Classics (90s and 00s)
      14662004981, // Cantopop Classics 70s 80s
      2526922604 // Cantopop Classics
    ]
  }
};

// iTunes genre name (English, Portuguese, Russian or Chinese store) -> our genre bucket.
const BUCKETS = [
  ['Hip-Hop', /hip-hop|rap|рэп|хип-хоп|trap|嘻哈|饒舌/i],
  ['R&B', /r&b|soul|соул|靈魂/i],
  ['Country', /country|sertanejo|кантри|鄉村/i],
  ['Rock', /rock|metal|punk|alternative|indie|рок|метал|панк|альтернатив|инди|搖滾|另類|獨立/i],
  ['Dance', /dance|electronic|house|disco|funk|танц|электрон|диско|舞曲|電子/i],
  ['Latin', /latin|reggaeton|urbano|латин/i]
];
const bucket = (name = '') => BUCKETS.find(([, re]) => re.test(name))?.[0] ?? 'Pop';

const hanOnly = (s) => s.replace(/[a-z\d\s.]+/g, '');
/** The artists credited on a song, each without the Latin half of "Ian 陈卓贤". */
const credits = (artist) =>
  artist
    .split(/\s+(?:feat\.?|ft\.?|featuring|with|x)\s+|&|,|\/|、/i)
    .map((a) => norm(a))
    .filter(Boolean)
    .flatMap((a) => [a, hanOnly(a)].filter(Boolean));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) =>
  toSimplified(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ё/g, 'е')
    .replace(/\(.*?\)|\[.*?\]|- .*$/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
const lead = (a) => norm(a.split(/\s+(?:feat\.?|ft\.?|part\.?|featuring|with|и|e|x|&)\s+|,|\/|、/i)[0]);
const decadeOf = (y) => `${String(y).slice(2, 3)}0s`;

async function json(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.ok) {
        const data = await res.json();
        if (!data.error) return data;
      }
    } catch {}
    await sleep(4000 * (i + 1));
  }
  throw new Error(`failed: ${url}`);
}

async function playlistTracks(id) {
  const out = [];
  for (let index = 0; ; index += 100) {
    const page = await json(`https://api.deezer.com/playlist/${id}/tracks?limit=100&index=${index}`);
    out.push(...page.data);
    if (!page.next) return out;
    await sleep(200);
  }
}

/** KKBOX year-end chart entries, cleaned: "等你下課" by "周杰倫". */
async function kkboxYear(terr, category, year, top) {
  const url = `https://kma.kkbox.com/charts/api/v1/yearly?category=${category}&lang=tc&limit=${top}&terr=${terr}&type=newrelease&year=${year}`;
  const data = await json(url).catch(() => null);
  return (data?.data?.charts?.newrelease ?? []).map((x) => ({
    id: `kk:${x.song_id}`,
    // "《體面》(電影《前任3》插曲) - 電影<前任3>插曲" -> "體面"
    title: x.song_name.replace(/\s+-\s+.*$/, '').replace(/[(（].*?[)）]/g, '').replace(/[《》]/g, '').trim(),
    // "周杰倫 (Jay Chou)" -> "周杰倫"
    artist: x.artist_name.replace(/\s*\(.*?\)/g, '').trim(),
    year,
    // Chart songs outrank playlist songs; rank 1 scores like a top Deezer hit.
    score: 1_000_000 - x.rankings.this_period * 10_000,
    lists: 1
  }));
}

let itunesDelay = 3000;
async function itunes(term, store, extra = { limit: '15' }) {
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term, entity: 'song', country: store, ...extra })}`;
  for (let i = 0; i < 6; i++) {
    await sleep(itunesDelay);
    try {
      const res = await fetch(url);
      if (res.ok) {
        // One hiccup shouldn't slow down every request after it.
        itunesDelay = 3000;
        return (await res.json()).results ?? [];
      }
    } catch {}
    itunesDelay = Math.min(itunesDelay * 1.5, 8000);
    await sleep(15000 * (i + 1));
  }
  throw new Error(`iTunes search failed for "${term}"`);
}

function pick(results, title, artist) {
  const t = norm(title);
  const a = lead(artist);
  const ok = results.filter((r) => r.previewUrl && r.kind === 'song');
  return (
    ok.find((r) => norm(r.trackName) === t && norm(r.artistName).includes(a)) ??
    ok.find((r) => norm(r.trackName).startsWith(t) && norm(r.artistName).includes(a)) ??
    ok.find((r) => norm(r.trackName) === t && a.includes(lead(r.artistName))) ??
    null
  );
}

/** An artist's studio songs in the store's order, each with the earliest date of any version. */
async function artistSongs(name, store, max, hanOnly = false) {
  const results = await itunes(name, store, { limit: '200', attribute: 'artistTerm' });
  const wantedName = norm(name);
  // The store files a duo under one name ("Chitãozinho & Xororó"), while credits
  // splits on the "&", so the whole name has to count as a match as well.
  const isArtist = (artistName) => {
    const full = norm(artistName);
    return full === wantedName || full.startsWith(`${wantedName} `) || credits(artistName).includes(wantedName);
  };
  const earliest = new Map();
  for (const r of results) {
    const key = norm(r.trackName);
    const year = Number(String(r.releaseDate ?? '').slice(0, 4));
    if (year >= 1950) earliest.set(key, Math.min(earliest.get(key) ?? year, year));
  }
  const seen = new Set();
  const out = [];
  for (const r of results) {
    const key = norm(r.trackName);
    if (
      !r.previewUrl ||
      r.kind !== 'song' ||
      seen.has(key) ||
      !isArtist(r.artistName) ||
      (r.trackTimeMillis ?? 0) < 90_000 ||
      NOT_ORIGINAL.test(r.trackName) ||
      NOT_STUDIO.test(`${r.trackName} ${r.collectionName}`) ||
      /[\u3040-\u30ff\uac00-\ud7af]/.test(r.trackName) ||
      // Latin names like Tank also belong to Western artists.
      (hanOnly && !han.test(name) && !han.test(r.trackName))
    )
      continue;
    seen.add(key);
    out.push({
      trackId: r.trackId,
      title: r.trackName,
      artist: r.artistName,
      previewUrl: r.previewUrl,
      artwork: r.artworkUrl100?.replace('100x100bb', '300x300bb'),
      genre: r.primaryGenreName,
      years: [earliest.get(key)].filter(Boolean)
    });
    if (out.length === max) break;
  }
  return out;
}

const songs = JSON.parse(await readFile(SONGS, 'utf8'));
let cache = {};
try {
  cache = JSON.parse(await readFile(CACHE, 'utf8'));
} catch {}
const firstYears = JSON.parse(await readFile(FIRST_YEARS, 'utf8').catch(() => '{}'));
const saveCache = () => writeFile(CACHE, JSON.stringify(cache, null, 1) + '\n');
// Artists from the US library are left out, so "Brazil" doesn't fill up with Dua Lipa.
const usArtists = new Set(songs.filter((s) => !s.chart).map((s) => lead(s.artist)));

const wanted = process.argv.slice(2).filter((c) => c in COUNTRIES);
for (const code of wanted.length ? wanted : Object.keys(COUNTRIES)) {
  const { playlists, kkbox = [], kkboxTop = 0, store = code, candidates: max = CANDIDATES, tiers = [], lastYear = {} } = COUNTRIES[code];
  const byKey = new Map();
  const add = (t) => {
    const key = `${norm(t.title)}|${lead(t.artist)}`;
    const seen = byKey.get(key);
    if (!seen || t.score > seen.score) byKey.set(key, { ...t, lists: (seen?.lists ?? 0) + 1, year: t.year ?? seen?.year });
    else seen.lists++;
  };
  for (const [terr, category] of kkbox) {
    for (let year = 2018; year < new Date().getUTCFullYear(); year++) {
      const rows = await kkboxYear(terr, category, year, kkboxTop);
      console.log(`${code} KKBOX ${terr} ${year}: ${rows.length} songs`);
      rows.forEach(add);
    }
  }
  for (const id of playlists) {
    const tracks = await playlistTracks(id);
    console.log(`${code} playlist ${id}: ${tracks.length} tracks`);
    for (const t of tracks) {
      if (!t.readable || usArtists.has(lead(t.artist.name)) || NOT_ORIGINAL.test(t.title)) continue;
      if (code === 'RU' && !cyrillic.test(t.title + t.artist.name) && !RU_LATIN.has(t.artist.name.toLowerCase())) continue;
      // Han characters, but no Japanese kana or Korean hangul.
      if (code === 'ZH' && (!han.test(t.title + t.artist.name) || /[\u3040-\u30ff\uac00-\ud7af]/.test(t.title + t.artist.name))) continue;
      add({ id: t.id, title: t.title_short || t.title, artist: t.artist.name, score: t.rank });
    }
  }
  // Popularity score, nudged up for songs that appear on several hit lists.
  const candidates = [...byKey.values()]
    .sort((a, b) => b.score * (1 + 0.15 * (b.lists - 1)) - a.score * (1 + 0.15 * (a.lists - 1)))
    .slice(0, max);
  console.log(`${code}: ${byKey.size} unique, resolving ${candidates.length}`);

  const resolved = [];
  for (const [i, t] of candidates.entries()) {
    const key = `${code}:${t.id}`;
    if (!(key in cache)) {
      const { title } = t;
      const results = await itunes(`${t.artist} ${title}`, store);
      const hit = pick(results, title, t.artist);
      const deezer = typeof t.id === 'number';
      const info = deezer ? await json(`https://api.deezer.com/track/${t.id}`).catch(() => ({})) : {};
      cache[key] = hit
        ? {
            trackId: hit.trackId,
            title: hit.trackName,
            artist: hit.artistName,
            previewUrl: hit.previewUrl,
            artwork: hit.artworkUrl100?.replace('100x100bb', '300x300bb'),
            genre: hit.primaryGenreName,
            years: [hit.releaseDate, info.release_date, info.album?.release_date, t.year]
              .map((d) => Number(String(d ?? '').slice(0, 4)))
              .filter((y) => y >= 1950)
          }
        : null;
      if (i % 10 === 0) await saveCache();
      console.log(`${code} ${i + 1}/${candidates.length} ${t.artist} - ${title} -> ${hit ? 'ok' : 'miss'}`);
    }
    const c = cache[key];
    if (c && c.years.length && !NOT_ORIGINAL.test(c.title)) resolved.push(c);
  }
  await saveCache();

  const seen = new Set();
  const library = [];
  const perDecade = {};
  const toSong = (c, year, pool) => {
    const decade = decadeOf(year);
    const title = c.title.replace(/\s*[([](?:feat|ft|part)\.?[^)\]]*[)\]]/i, '').replace(VERSION_TAG, '').trim();
    // Chinese titles often carry notes like "(电视剧《想见你》片尾曲)" or "(国)"; drop them.
    const clean = code === 'ZH' ? title.replace(/\s*[(（[][^)）\]]*[)）\]]/g, '').trim() || title : title;
    const shown = code === 'ZH' ? [toSimplified(clean), toSimplified(c.artist)] : [title, c.artist];
    return {
      id: `${code.toLowerCase()}-${c.trackId}`,
      title: shown[0],
      artist: shown[1],
      // Other spelling accepted as a guess (traditional Chinese).
      ...(shown[0] !== clean || shown[1] !== c.artist ? { alt: [clean, c.artist] } : {}),
      year,
      decade,
      pool,
      chart: code,
      store,
      trackId: c.trackId,
      previewUrl: c.previewUrl,
      artwork: c.artwork,
      genre: bucket(c.genre)
    };
  };
  for (const c of resolved) {
    if (seen.has(c.trackId)) continue;
    seen.add(c.trackId);
    // Re-releases carry late dates, so the earliest date we have is the closest to the original.
    const year = Math.min(...c.years);
    if (year < 1980) continue; // the game's decades start at the 80s
    const decade = decadeOf(year);
    perDecade[decade] = (perDecade[decade] ?? 0) + 1;
    // Answers: the most popular songs, at most PER_DECADE from each decade so
    // the newest hits don't crowd out the classics.
    library.push(toSong(c, year, perDecade[decade] <= PER_DECADE));
  }
  // Top up to POOL answers if some decades ran short.
  let answers = library.filter((s) => s.pool).length;
  for (const s of library) if (answers < POOL && !s.pool) (s.pool = true), answers++;

  const before = songs.filter((s) => s.chart === code);
  // Scheduled ladders point at these ids, so an answer stays an answer for good.
  // Their titles still get the version tags dropped, in case the rules have grown.
  const kept = new Set(library.map((s) => s.id));
  for (const s of before) if (!kept.has(s.id)) library.push({ ...s, title: s.title.replace(VERSION_TAG, '').trim() });
  const wasAnswer = new Set(before.filter((s) => s.pool).map((s) => s.id));
  for (const s of library) s.pool ||= wasAnswer.has(s.id);

  // One song under several artists (or spellings) counts once.
  const songKeys = (s) => credits(s.artist).map((a) => `${norm(s.title)}|${a}`);
  const byCredit = new Map();
  for (const s of library) for (const k of songKeys(s)) byCredit.set(k, s);
  for (const [quota, names] of tiers) {
    for (const name of names.replaceAll(' ', '\n').replaceAll('_', ' ').split('\n')) {
      const key = `${code}:artist:${name}`;
      if (!cache[key]) {
        const found = await artistSongs(name, store, quota * SUGGESTIONS_PER_ANSWER, code === 'ZH');
        // A name that found nothing is remembered as null, so a re-run retries it
        // after the spelling is fixed.
        cache[key] = found.length ? found : null;
        await saveCache();
        console.log(`${code} ${name}: ${found.length} songs`);
      }
      const usable = (cache[key] ?? []).filter((c) => !NOT_STUDIO.test(c.title));
      for (const [rank, c] of usable.entries()) {
        const year = Math.min(...c.years, lastYear[name] ?? Infinity);
        if (year < 1980) continue;
        const song = toSong(c, year, rank < quota);
        const known = songKeys(song).map((k) => byCredit.get(k)).find(Boolean);
        if (known) {
          known.pool ||= song.pool;
          continue;
        }
        if (seen.has(c.trackId)) continue;
        seen.add(c.trackId);
        library.push(song);
        for (const k of songKeys(song)) byCredit.set(k, song);
      }
    }
  }
  // First release years looked up by scripts/fetch-first-years.mjs.
  for (const s of library) {
    const first = firstYears[s.trackId];
    if (first >= 1980 && first < s.year) Object.assign(s, { year: first, decade: decadeOf(first) });
  }
  answers = library.filter((s) => s.pool).length;
  const rest = songs.filter((s) => s.chart !== code);
  songs.length = 0;
  songs.push(...rest, ...library);
  const decades = {};
  for (const s of library.filter((x) => x.pool)) decades[s.decade] = (decades[s.decade] ?? 0) + 1;
  console.log(`${code}: ${library.length} songs, ${answers} answers`, decades);
}
await writeFile(SONGS, JSON.stringify(songs).replace(/\},\{/g, '},\n{') + '\n');
