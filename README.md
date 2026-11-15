# songless.info

A free daily song guessing game built with Astro, React and Cloudflare Workers.

> **Not an official product.** This is an independent hobby project. It is not
> affiliated with, endorsed by, or connected to Apple, Billboard, or any other
> song-guessing game that happens to share a similar name.

- **Daily Ladder** (`/`): five songs a day for each country (USA, Brazil, Russia, Chinese), picked from that chart's answer pool (any year, 80s to today). Each song starts as a 1-second clip; skips and wrong guesses unlock 3, 6 and 12 seconds. Up to 100 points per song, 500 per ladder. A new ladder unlocks at 00:00 UTC.
- **Songless Unlimited** (`/unlimited`): random songs with optional decade and genre filters, counting total points and songs guessed.
- **Songless Party** (`/party`): multiplayer buzz-in rooms. Everyone hears the same clip; it starts at 1 second and grows to 3, 6 and 12 seconds when nobody names the song within 10 seconds of a clip finishing. The first right answer scores (100/70/40/20) and the next song starts. Highest score after the last song wins; the room then closes and everyone goes back to the lobby.
- **Leaderboard** (a dialog in Unlimited): each player's best saved Unlimited score (total points and songs guessed). Players save their score with a unique, permanent name, a password that guards it, and an optional avatar.
Each game page has its own how-to-play and FAQ sections below the game.

## Languages

English lives at the bare URLs; Simplified Chinese, Russian and Brazilian Portuguese live under `/zh`, `/ru` and `/pt-br`. The game's strings are in `src/i18n/ui/`, the page text in `src/i18n/content/`, one file per language; `en.ts` sets the shape, so a missing string fails `tsc`. New text the Worker sends goes in each language's `server.messages`, keyed by the English text. The language also sets which country's songs a player hears until they pick one, and switching language resets the Daily Ladder to the new language's country.

## Development

```sh
npm install
cp .env.example .env   # fill in your own contact, donation and analytics links
npm run dev      # http://localhost:4321
npm test         # unit tests for the game logic
npm run build    # static site in dist/
npx wrangler dev # build, then serve the site, the party rooms and the API locally (http://localhost:8787)
```

The Worker in `src/worker/index.ts` handles `/api/*` and room links (`/party/ABCD`, `/zh/party/ABCD`); every other request is the static site. `npm run dev` serves the pages but not the API, so use `npx wrangler dev` for party rooms and the leaderboard.

## Songless Party (multiplayer rooms)

Two browser windows, or one normal and one private window, are two players. Each room is a Durable Object (`src/worker/room.ts`, SQLite-backed, so it works on the Workers Free plan) holding the players' WebSockets, and `src/worker/directory.ts` lists public rooms. The rules live in `src/lib/party.ts` and are tested in `src/lib/party.test.ts`. The room server is authoritative: browsers get the clip's preview URL but never the song's name.

## Leaderboard

The leaderboard is one SQLite-backed Durable Object (`src/worker/leaderboard.ts`, works on the Workers Free plan, nothing to create in the dashboard). Each browser gets a random player id in localStorage; that id and a password own the player's name (names are unique ignoring case and spaces, and can't be changed) and their one row, which keeps their best run. The server checks every run is possible (20 to 100 points per song) but can't prove it was played, so the board trusts players. Shared rules and tests: `src/lib/leaderboard.ts`, `src/lib/leaderboard.test.ts`.

## Songs

Audio comes from official 30-second iTunes previews, so no audio is hosted here.

- `scripts/charts.json` holds every Billboard Year-End Hot 100 from 1980 on. `npm run charts:fetch` downloads it from Wikipedia (re-run it each January for the new year).
- `scripts/catalog.mjs` holds extra hand-picked songs.
- `npm run songs:resolve` looks each song up on the iTunes Search API and writes `src/data/songs.json`, then extends `src/data/schedule.json`. Year-end top-40 songs and catalog songs are answers (`"pool": true`); the rest only appear as guess suggestions, so players can't narrow the answer down from the list. Lookups are rate limited (about 20 a minute), so the first full run takes a couple of hours; later runs only look up new songs. Songs with no preview are remembered in `scripts/misses.json` (delete an entry to retry it).

Every chart's library also takes each artist's best-known songs from the iTunes Store (`scripts/br-artists.mjs`, `scripts/ru-artists.mjs`, `scripts/zh-artists.mjs`, one request per artist), and `scripts/fetch-first-years.mjs` corrects the dates of old songs the store lists by their reissue. `npm run songs:world BR RU` rebuilds those libraries; songs already in the library are never dropped, since ladders point at them.

The scrape cache (`scripts/world-cache.json`) is written locally and is not committed: a fresh clone re-fetches everything on its first `npm run songs:world`, which takes far longer. To identify your own deployment to the services being scraped, set `IMPORT_USER_AGENT`.

`schedule.json` (US) and `schedule-world.json` (other charts) fix the five songs for each daily ladder about 400 days ahead. Existing days are never rewritten, so past and current ladders stay the same when the library changes. After growing a chart's answers, `node scripts/schedule.mjs --refresh ZH` redraws that chart's days from a week ahead on.

The browser never downloads the whole library: the build turns it into `/data/titles/<country>.json` (suggestions), `/data/pool.json` (Unlimited's filter index), `/data/pool/<country>-<n>.json` such as `us-1.json` (the answers by country, 200 songs per file, loaded as they come up) and one `/data/ladders/<n>.json` per day. If a stored preview URL has expired, the player looks up a fresh one by track id.

## Configuration

Site-wide settings live in environment variables, because they belong to whoever
runs the site rather than to the code. Copy `.env.example` to `.env`; anything
left empty is hidden from the pages instead of rendering a dead link.

| Variable | What it does |
| --- | --- |
| `PUBLIC_CONTACT_EMAIL` | Address on the Contact and legal pages |
| `PUBLIC_COFFEE_URL` | Header "Buy me a coffee" button; hidden when empty |
| `PUBLIC_DISCORD_URL` | Footer community link; hidden when empty |
| `PUBLIC_UMAMI_SRC`, `PUBLIC_UMAMI_WEBSITE_ID` | Self-hosted Umami analytics; no script when both are empty |

These values are baked into the built HTML, so they are public — never put a
secret in them. On Cloudflare Workers Builds, set the same names in the
project's environment variables. The Privacy page describes analytics and Apple
previews on the assumption that both are in use; reword it in
`src/i18n/content/` if your deployment differs.

## Deploying

The build output in `dist/` is plain static files. On Cloudflare Workers Builds, use `npm run build` as the build command and the default `npx wrangler deploy` as the deploy command; `wrangler.jsonc` serves `dist/` as static assets and deploys the Worker with its Durable Objects (party rooms, room directory, leaderboard). Static hosts (Pages, Vercel, Netlify) can still serve `dist`, but Songless Party and the leaderboard need the Worker.

## License

Code is licensed under the [GNU AGPL-3.0-or-later](LICENSE). Running a modified
version as a public service means offering its source under the same licence.

Data is separate: `scripts/charts.json` is derived from Wikipedia and stays
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), and the song
metadata plus the Apple preview URLs it points at are not covered by the AGPL.
Read [NOTICE](NOTICE) before deploying your own copy.
