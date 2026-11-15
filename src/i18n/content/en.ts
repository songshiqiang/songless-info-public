// The text of the pages themselves. The HTML fields can link to "/unlimited" and the like;
// the pages point those links at their own language.
import { CONTACT_EMAIL } from '../../data/site';
import { library } from '../../data/songs';

const n = (x: number) => x.toLocaleString('en-US');
const mail = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;
const topArtists = library.topArtists.slice(0, 5).map(([a]) => a);

const en = {
  layout: {
    nav: { daily: 'Daily Ladder', unlimited: 'Unlimited', party: 'Party' },
    mainNav: 'Main',
    siteNav: 'Site',
    language: 'Language',
    coffee: 'Buy me a coffee',
    ogAlt: 'Songless: guess the song in one second',
    tagline: 'A free daily song guessing game',
    about: 'About Us',
    contact: 'Contact Us',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    credit: 'Song previews courtesy of Apple Music'
  },

  home: {
    title: 'Songless: Song Guessing Game',
    description: 'Play Songless, the free daily song guessing game. Guess five hit songs from short clips every day, play Songless Unlimited, or challenge your friends.',
    howToName: 'How to play Songless',
    howTo: [
      'Press play to hear a one-second clip of the song.',
      'Type the song title and pick it from the suggestions, or skip to hear a longer clip.',
      'Finish all five songs of the Daily Ladder to get your score out of 500.',
      'Share your spoiler-free result and come back tomorrow for a new ladder.'
    ],
    loading: "Loading today's ladder…",
    aria: 'About Songless',
    h1: 'Songless: Song Guessing Game',
    tagline: 'One second to start.',
    lead: 'Five hit songs from the 80s to today. Every song starts as a one-second clip, and each skip gives you a little more. The fewer seconds you need to guess the song, the higher you score.',
    meta: 'New ladder every day at 00:00 UTC · No sign-up needed · <a href="/unlimited">Play Songless Unlimited</a>',
    modesTitle: 'Ways to play',
    modes: [
      { tag: 'Daily', title: 'Daily Ladder', body: 'Five hit songs from the 80s to today, new every day. Pick a country and play the same ladder as everyone else.' },
      { tag: 'Unlimited', title: 'Songless Unlimited', body: 'Guess as many songs as you like. Every right answer adds to your total score.' },
      { tag: 'With friends', title: 'Songless Party', body: 'Everyone hears the same clip, first to name the song scores. Host a room and play live with up to 10 friends.' }
    ],
    howTitle: 'How to play Songless',
    steps: [
      { num: '1s', title: 'Listen', body: 'Each song starts with a one-second clip taken from somewhere in the song, not always the intro.' },
      { num: '+2s', title: 'Guess or stretch', body: 'Type the title, or skip to hear more: 1, 3, 6 and then 12 seconds. A wrong guess also stretches the clip.' },
      { num: '100', title: 'Score and share', body: 'Up to 100 points per song. Finish all five, then share your ladder without spoiling the songs.' }
    ],
    guide: `
    <h3>The Daily Ladder rules</h3>
    <p>Every day at 00:00 UTC a new Daily Ladder unlocks. It has five hit songs picked from the 1980s to today, and everyone who picks the same country plays the same five songs that day.</p>
    <ol>
      <li><strong>Press play.</strong> You hear one second of the song. The clip can come from anywhere in the track, not just the intro.</li>
      <li><strong>Guess or skip.</strong> Start typing a title or artist and pick the song from the suggestions. Not sure? Skip to unlock a longer clip.</li>
      <li><strong>Move on.</strong> Once a song is solved or you run out of clips, go on to the next song.</li>
      <li><strong>Share.</strong> After the fifth song you get your score out of 500 and a spoiler-free grid to share.</li>
    </ol>
    <h3>Clip lengths and scoring</h3>
    <p>Each song gives you four tries. A skip or a wrong guess both use up a try and unlock the next clip.</p>
    <table>
      <thead><tr><th>Try</th><th>Clip length</th><th>Points if solved</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>1 second</td><td>100</td></tr>
        <tr><td>2</td><td>3 seconds</td><td>70</td></tr>
        <tr><td>3</td><td>6 seconds</td><td>40</td></tr>
        <tr><td>4</td><td>12 seconds</td><td>20</td></tr>
      </tbody>
    </table>
    <p>The best possible score is 500: every song guessed from the first one-second clip.</p>
    <h3>Tips to guess the song faster</h3>
    <ul>
      <li><strong>Place the era first.</strong> Production gives the decade away fast: synth pads point to the 80s, grunge guitars to the 90s, and trap hi-hats to the 2010s or later.</li>
      <li><strong>Listen for the instrument, not the words.</strong> One second rarely has a full lyric, but a distinctive riff, drum fill or vocal tone often gives the song away.</li>
      <li><strong>Search by artist.</strong> The guess box matches artist names too, so if you recognise the voice, type the artist and scan their songs.</li>
      <li><strong>Guess if you have any idea.</strong> A wrong guess and a skip cost the same, so a hunch is always worth typing.</li>
      <li><strong>Practise in Unlimited.</strong> Playing one decade or genre at a time in <a href="/unlimited">Songless Unlimited</a> is the fastest way to train your ear.</li>
    </ul>`,
    faqTitle: 'Songless FAQ',
    faq: [
      { q: 'What is Songless?', a: 'Songless is a song guessing game: you hear a tiny clip of a song and try to name it in as few seconds as possible. On songless.info you can play a free Daily Ladder of five hit songs from the 1980s to today, or keep going in Songless Unlimited.' },
      { q: 'When does the new Songless ladder come out?', a: 'A new Daily Ladder unlocks every day at 00:00 UTC. Everyone who picks the same country gets the same five songs, so you can compare scores with friends.' },
      { q: 'Can I play the Daily Ladder with songs from other countries?', a: 'Yes. Choose USA, Brazil, Russia or Chinese above the player. Each one has its own five songs every day, and your scores and day streak are kept separately for each.' },
      { q: 'How does scoring work?', a: 'Each song starts as a 1-second clip. Skipping or guessing wrong stretches it to 3, 6 and then 12 seconds. You score 100, 70, 40 or 20 points depending on which clip you solve it on, for a maximum of 500 per ladder.' },
      { q: 'Is there a Songless Unlimited mode?', a: 'Yes. Songless Unlimited lets you guess song after song with no daily limit. Pick the decades and genres you like, and see how high your total score can go.' },
      { q: 'Do I need an account?', a: 'No. Songless is free and needs no sign-up. Your scores and stats are saved in your browser.' },
      { q: 'Where do the song clips come from?', a: 'Clips are official 30-second previews provided by Apple Music. We never host the audio ourselves, and every revealed song links to the full track.' }
    ],
    faqFoot: 'Playing with friends? See <a href="/party#how-to-play">how Songless Party works</a>.'
  },

  unlimited: {
    title: 'Songless Unlimited: Guess the Song from a 1-Second Clip | Songless',
    description: `Play Songless Unlimited free. Guess the song from a 1-second clip, choose from ${n(library.answers)} hits by decade, genre or country, and build your total score.`,
    name: 'Songless Unlimited',
    loading: 'Loading Songless Unlimited…',
    aria: 'Intro',
    h1: 'Songless Unlimited: Guess the Song in One Second',
    tagline: 'No daily limit. Keep guessing.',
    lead: 'Guess the song from a one-second clip, then keep going. Every song you get right adds to your total score and song count.',
    how: `
    <h2 id="how-to-play">How to play Songless Unlimited</h2>
    <ol>
      <li><strong>Press play.</strong> You hear a one-second clip of a random hit song.</li>
      <li><strong>Guess or skip.</strong> Type a title or artist and pick the song from the suggestions. A skip or a wrong guess unlocks a longer clip: 1, 3, 6 and then 12 seconds.</li>
      <li><strong>Build your total.</strong> Every song you name adds to your total score and song count.</li>
      <li><strong>Miss and move on.</strong> If you still don't have it after the 12-second clip, the song is revealed and you lose nothing.</li>
      <li><strong>Save your score.</strong> Use the save button at any time to get on the leaderboard.</li>
    </ol>
    <h3>Scoring</h3>
    <p>Each song scores like the Daily Ladder: <strong>100 points</strong> on the 1-second clip, <strong>70</strong> on 3 seconds, <strong>40</strong> on 6 seconds and <strong>20</strong> on 12 seconds. The leaderboard ranks players by total points, then by songs guessed.</p>
    <h2 id="library">What's in Songless Unlimited</h2>
    <p><strong>${n(library.answers)} songs</strong> by ${n(library.artists)} artist credits can come up as answers, from ${library.firstYear} to ${library.lastYear}. The guess box knows ${n(library.suggestions)} songs, so the suggestions don't give the answer away. The US songs play by default. Use the filter to add Brazil, Russia or the Chinese-language library.</p>`,
    stats: { decade: 'Decade', genre: 'Genre', chart: 'Chart', artist: 'Artist', songs: 'Songs' },
    tips: `
    <h2 id="tips">How to get better at guessing songs</h2>
    <ol>
      <li><strong>Name the kind of record first.</strong> Before you hunt for a title, ask what you heard: a drum machine, a distorted guitar, a choir of backing vocals. That alone can rule out most of the library.</li>
      <li><strong>Place the decade next.</strong> Listeners can often judge a song's era from a clip too short to identify it, so trust that instinct and start your search there.</li>
      <li><strong>Train one sound at a time.</strong> Use the filter to play one decade, genre or country until you know its sound, then open it up.</li>
      <li><strong>Search by artist.</strong> If you know the voice but not the title, type the artist and scan their songs.</li>
      <li><strong>Guess if you have any idea.</strong> A wrong guess costs the same as a skip, so a hunch is always worth typing.</li>
    </ol>`,
    faqTitle: 'Songless Unlimited FAQ',
    faq: [
      { q: 'Is there an unlimited Songless?', a: 'Yes. Songless Unlimited on this page has no daily limit. It plays random hit songs for as long as you like, and a missed song costs nothing.' },
      { q: 'Is Songless Unlimited free?', a: 'Yes. It is free to play in your browser with no account and nothing to install. You only choose a name and password if you want to save your score to the leaderboard.' },
      { q: 'Is there a guess the song game with a 1-second clip?', a: 'Yes, this one. Every song in Songless Unlimited starts as a 1-second clip, then opens up to 3, 6 and 12 seconds if you skip or guess wrong.' },
      { q: 'Where can I guess the song online for free?', a: 'Right here. Songless has three free modes: Unlimited for endless solo play, the Daily Ladder for five fixed songs a day, and Songless Party for live rooms with friends.' },
      { q: 'Which songs are in Songless Unlimited?', a: `${n(library.answers)} hit songs from ${library.firstYear} to ${library.lastYear} can come up as answers: US Billboard year-end hits plus hits from Brazil, Russia and the Chinese-language charts. The US songs play by default, and the filter adds the others.` },
      { q: 'Which artists are in Songless?', a: `${n(library.artists)} artist credits appear among the answers. The artists with the most songs are ${topArtists.slice(0, -1).join(', ')} and ${topArtists.at(-1)}.` },
      { q: 'How is Songless Unlimited different from the Daily Ladder?', a: 'The Daily Ladder is five fixed songs per day for each country, the same for everyone. Songless Unlimited picks random songs for as long as you like.' },
      { q: 'What happens if I miss a song in Unlimited?', a: 'A song you miss after all four clips (1, 3, 6 and 12 seconds) earns no points, and the next song is ready. Your total score and song count stay as they are.' },
      { q: 'Can I play only one decade or genre?', a: 'Yes. Tap the filter button above the player to choose decades (80s to 2020s), genres such as pop, rock, hip-hop or country, and which country’s hits you hear: the US Billboard charts, Brazil, Russia, or Chinese-language hits from mainland China, Hong Kong and Taiwan. Changing them keeps your totals.' },
      { q: 'Is Songless like Heardle?', a: 'They share an idea: a short clip that grows until you name the song. Heardle gave everyone one song a day, and Spotify closed the original in May 2023. Songless Unlimited has no daily limit, and each song gets four clips instead of six guesses.' },
      { q: 'Is songless.info the official Songless?', a: 'Other games also use the name Songless. songless.info is an independent, fan-made site and is not connected to any of them.' }
    ],
    faqFoot: 'Want a fixed challenge to compare with friends? <a href="/">Play today\'s Daily Ladder</a>.',
    deep: `
    <h2 id="one-second">What one second of a song contains</h2>
    <p>One second is long enough to sound like a particular record, but rarely long enough to carry a tune. At 120 beats per minute it covers two beats: a few notes and perhaps a syllable. So how can anyone name a song from that?</p>
    <p>In 1999, E. Glenn Schellenberg, Paul Iverson and Margaret McKinnon tested much shorter clips. Students heard excerpts from five recent hits, including "Macarena" and "One Sweet Day", and matched them to titles and artists. At 200 milliseconds, 19 of 20 listeners beat chance. At 100 milliseconds the group still beat chance, though the average fell from 3.45 songs out of five to 1.70.</p>
    <p>Clips that short can't hold a melody or a word. When the 100-millisecond clips were played backward, or their sound above 1,000 Hz was filtered out, results fell to chance. Removing the low frequencies made no difference. The authors concluded that listeners were mostly using timbre: the overall sound of the recording, more than its pitch.</p>
    <p>That test was much easier than this game. Listeners had five songs to choose from, could replay each clip, and had just heard longer excerpts of the same songs. The authors say those conditions inflated the scores. Here, nobody hands you a list of five.</p>
    <p>Carol Krumhansl's 2010 study "Plink" used clips from popular songs recorded after 1960. University students named the artist and title more than 25% of the time from 400 milliseconds. When they didn't recognise a 300-millisecond clip, they could still judge its style, emotion and decade. You can know what kind of song it is before you know which song it is, and that is what the tips above build on.</p>
    <h2 id="history">From Name That Tune to Songless</h2>
    <table>
      <thead><tr><th>Year</th><th>What changed</th></tr></thead>
      <tbody>
        <tr><td>1948</td><td><em>Stop the Music</em> starts on American radio. An orchestra plays a melody, and studio guests and people reached by phone try to name it.</td></tr>
        <tr><td>1952</td><td><em>Name That Tune</em>, from Harry and Roberta Semple Salter, starts on NBC radio and reaches TV in 1953. Its Bid-a-Note round has contestants bid on how few notes they need.</td></tr>
        <tr><td>2002</td><td>Shazam launches in the UK. You dial 2580, hold your phone up to the music and get the answer by text. Now a machine is playing the game.</td></tr>
        <tr><td>2022</td><td>Heardle brings the Wordle format to music: one song a day, starting at one second. Spotify buys it that July.</td></tr>
        <tr><td>2023</td><td>Spotify closes Heardle in May, leaving the format to independent games.</td></tr>
      </tbody>
    </table>
    <p>Records have been moving the same way. A study of 303 US top-10 singles from 1986 to 2015 found that intros shrank from more than 20 seconds in the mid-1980s to about 5, and that the title arrived about 18% sooner once the lyrics began.</p>
    <h2 id="terms">Song game terms</h2>
    <dl class="terms">
      <div><dt>Clip</dt><dd>The part of the song you hear. Here it is 1, 3, 6 or 12 seconds long.</dd></div>
      <div><dt>Timbre</dt><dd>The character of a sound, the thing that separates a piano from a trumpet playing the same note.</dd></div>
      <div><dt>Hook</dt><dd>The short, catchy part of a song that you remember, often its title line.</dd></div>
      <div><dt>Audio fingerprint</dt><dd>A compact digital signature of a recording. Apps like Shazam match these to identify songs.</dd></div>
    </dl>`,
    sourcesTitle: 'Sources'
  },

  party: {
    title: 'Songless Party: Multiplayer Song Guessing Game with Friends | Songless',
    description: 'Play Songless Party free with friends: everyone hears the same clip and the first to name the song scores. Host a room, share the code, play live.',
    name: 'Songless Party',
    loading: 'Loading Songless Party…',
    aria: 'Intro',
    h1: 'Songless Party',
    tagline: 'Same clip. Fastest ears win.',
    lead: 'The multiplayer song guessing game. Everyone hears the same clip at the same time, and the first to name the song scores. Host a room above and send your friends the code.',
    meta: 'Free · No sign-up · Up to 10 players per room',
    guide: `
    <h2 id="how-to-play">How to play Songless Party</h2>
    <ol>
      <li><strong>Open a room.</strong> Pick a name and an instrument, press Host a room, and share the four-letter code or invite link.</li>
      <li><strong>Start the game.</strong> Once two or more players have a seat, the host starts. After a 3-second countdown the first song plays.</li>
      <li><strong>Buzz in.</strong> Everyone hears the same 1-second clip. Type the song and send it as fast as you can. The first right answer wins the song.</li>
      <li><strong>Longer clips.</strong> If nobody names it within 10 seconds of the clip finishing, it grows to 3 seconds, then 6, then 12. The longer the clip, the fewer points.</li>
      <li><strong>Wrong guess?</strong> You are locked out for 2 seconds, then you can try again.</li>
      <li><strong>Highest score wins.</strong> After the last song the results show for a few seconds, then everyone goes back to the lobby, ready for the next room.</li>
    </ol>
    <h2>Scoring</h2>
    <ul>
      <li><strong>100 points</strong> on the 1-second clip, <strong>70</strong> on 3 seconds, <strong>40</strong> on 6 seconds and <strong>20</strong> on 12 seconds.</li>
      <li>Only the first right answer scores. If nobody gets it, the song is revealed and the next one starts.</li>
    </ul>
    <h2>Room settings</h2>
    <p>The host can change these in the room before starting:</p>
    <ul>
      <li><strong>Songs:</strong> how many songs in a game (5 to 20, default 10).</li>
      <li><strong>Seats:</strong> up to 10 players per room.</li>
    </ul>
    <h2>Tips for winning</h2>
    <ul>
      <li><strong>Type a few letters and pick.</strong> The suggestion list is faster than typing the whole title. Practise with <a href="/unlimited">Songless Unlimited</a>.</li>
      <li><strong>Don't spam.</strong> A wrong guess locks you out for 2 seconds, which can be the moment someone else gets it.</li>
      <li><strong>Gamble on the first second.</strong> 100 points for the 1-second clip is worth five 12-second answers.</li>
    </ul>`,
    faqTitle: 'Songless Party FAQ',
    faq: [
      { q: 'What is Songless Party?', a: 'Songless Party is the multiplayer mode of Songless. Friends share a room and everyone hears the same song clip at the same time. The first player to name the song scores, and the highest score after the last song wins.' },
      { q: 'How do I play Songless Party with friends?', a: 'Enter your name, press Host a room and send your friends the four-letter room code or the invite link. They type the code under Join with a code, or open the link, and take a seat. Once at least two players are in, the host starts the game.' },
      { q: 'How long are the clips?', a: 'Every song starts as a 1-second clip. If nobody names it within 10 seconds of the clip finishing, it grows to 3 seconds, then 6, then 12, the same lengths as the Daily Ladder.' },
      { q: 'How does scoring work?', a: 'Only the first right answer scores: 100 points on the 1-second clip, 70 on 3 seconds, 40 on 6 seconds and 20 on 12 seconds. A wrong guess costs no points, but locks you out for 2 seconds.' },
      { q: 'How many songs are in a game?', a: 'Ten by default. The host can pick 5 to 20 songs before starting. After the last song the results show for a few seconds and everyone goes back to the lobby.' },
      { q: 'Is Songless Party free? Do I need an account?', a: 'It is free and there is no sign-up. Rooms close at the end of each game, or after 30 minutes with nobody in them.' }
    ],
    faqFoot: 'Playing alone? <a href="/">Play today\'s Daily Ladder</a> or <a href="/unlimited">Songless Unlimited</a>.'
  },

  about: {
    title: 'About Songless: a free song guessing game | Songless',
    description: 'Songless.info is a free, independent song guessing game: hear a short clip of a hit song and name it in as few seconds as you can. Learn who makes it and how it works.',
    body: `
    <h1>About Songless</h1>
    <p class="lead">Songless.info is a free song guessing game. You hear a short clip of a hit song, and the fewer seconds you need to name it, the more points you score.</p>
    <h2>What you can play</h2>
    <ul>
      <li><strong><a href="/">Daily Ladder</a></strong>: five new songs every day, the same for every player.</li>
      <li><strong><a href="/unlimited">Unlimited</a></strong>: play as many songs as you like, filtered by decade, genre or chart country, and post your best run to the leaderboard.</li>
      <li><strong><a href="/party">Party</a></strong>: a private room where friends buzz in on the same clip.</li>
    </ul>
    <h2>Where the songs come from</h2>
    <p>The song library is built from year-end hit charts from 1980 to today. The audio clips are the 30-second previews that Apple publishes through its iTunes Search API, streamed straight from Apple. We do not host or sell any music, and every song belongs to its artists and rights holders.</p>
    <h2>An independent site</h2>
    <p>"Songless" is the name of a style of guessing game, and songless.info is an independent fan-made take on it. We are not affiliated with, endorsed by or connected to Apple, any record label, any artist, or any other song guessing game.</p>
    <h2>How the site is paid for</h2>
    <p>Songless is free to play with no account needed. There are no ads. If you enjoy it, you can help cover hosting costs with a Buy me a coffee tip from the button at the top of every page.</p>
    <h2>Get in touch</h2>
    <p>Found a wrong answer, a broken clip or have an idea? Email us at ${mail} or see the <a href="/contact">Contact page</a>.</p>`
  },

  contact: {
    title: 'Contact Us | Songless',
    description: 'Contact the Songless team: report a wrong answer or broken song clip, ask about your leaderboard name, or send feedback and ideas.',
    body: `
    <h1>Contact us</h1>
    <p class="lead">The best way to reach us is by email: ${mail}. We read every message and usually reply within a few days.</p>
    <h2>What to include</h2>
    <ul>
      <li><strong>A wrong answer or broken clip:</strong> the mode you were playing (Daily, Unlimited or Party), the date, and the song title and artist if you know them.</li>
      <li><strong>Your leaderboard entry:</strong> the name shown on the leaderboard and what you would like changed or removed.</li>
      <li><strong>A bug:</strong> your browser and device, and what happened on screen.</li>
      <li><strong>Privacy requests:</strong> see our <a href="/privacy">Privacy Policy</a> for what we keep.</li>
    </ul>
    <h2>Copyright and music</h2>
    <p>The song clips are official previews streamed from Apple, and all music belongs to its rights holders. If you are a rights holder and want a song removed from the game, email us with the song title and artist and we will take it out.</p>`
  },

  legal: {
    updated: (date: string) => `Last updated: ${date}`,
    // Translated legal pages say which version counts.
    note: ''
  },

  privacy: {
    title: 'Privacy Policy | Songless',
    description: 'How songless.info handles your data: what the game saves in your browser, what the leaderboard stores, and the analytics and music previews the site uses.',
    h1: 'Privacy Policy',
    body: `
    <p class="lead">Songless (songless.info) does not need an account, and we collect as little as we can. This page explains what is saved, where, and why.</p>
    <h2>Saved in your browser</h2>
    <p>The game uses your browser's local storage to remember things on your own device: your Daily Ladder history and stats, your best Unlimited run, your settings (mode, sound on or off, filters, language), your leaderboard player ID, name and avatar, and which Party room you are in. This data never leaves your device unless you choose to save a run to the leaderboard. You can delete it at any time by clearing this site's data in your browser.</p>
    <h2>The Unlimited leaderboard</h2>
    <p>If you save an Unlimited run, we store on our server: a random player ID made by your browser, the nickname and optional emoji avatar you choose, your score, number of correct songs, the filter you played with, and the time of the run. All but the player ID is shown publicly on the leaderboard. We also keep a salted hash of your password, never the password itself, and it is not shown to anyone. Please do not use your real name or any personal information as your nickname. Your IP address is used only for a few seconds to stop spam submissions and is not stored with your entry.</p>
    <h2>Party rooms</h2>
    <p>The name you enter in a Party room is shared with the other players in that room for the game. Rooms are deleted when the game ends, and we do not keep the names or scores afterwards.</p>
    <h2>Analytics</h2>
    <p>We use a self-hosted instance of Umami to count visits and see which pages and modes are used. Umami does not use cookies, does not track you across other websites, and reports only anonymous, aggregated numbers such as page views, referrers, country and device type.</p>
    <h2>Music previews and other services</h2>
    <ul>
      <li><strong>Apple:</strong> song clips and artwork are streamed directly from Apple's servers (the iTunes preview service), so Apple receives your IP address and basic browser information when a clip plays. Apple's privacy policy applies to those requests.</li>
      <li><strong>Cloudflare:</strong> the site, Party rooms and leaderboard run on Cloudflare. Cloudflare processes requests (including IP addresses) to deliver the site and protect it from abuse.</li>
      <li><strong>Google Fonts:</strong> fonts are loaded from Google, which receives your IP address when they load.</li>
    </ul>
    <h2>Children</h2>
    <p>Songless is a general audience game and is not directed at children under 13. We do not knowingly collect personal information from children.</p>
    <h2>Your choices and rights</h2>
    <p>You can clear everything stored in your browser yourself. To have your leaderboard entry changed or removed, or for any other privacy question, email ${mail} with the nickname shown on the leaderboard. Depending on where you live, you may have rights to access, correct or delete your personal data, and we will honour those requests.</p>
    <h2>Changes to this policy</h2>
    <p>If we change how the site handles data, we will update this page and the date at the top.</p>`
  },

  terms: {
    title: 'Terms of Service | Songless',
    description: 'The terms for using songless.info, the free song guessing game: fair play, leaderboard names, music rights, and our limits of liability.',
    h1: 'Terms of Service',
    body: `
    <p class="lead">By using songless.info ("Songless", "the site", "we") you agree to these terms. If you do not agree, please do not use the site.</p>
    <h2>The game</h2>
    <p>Songless is a free song guessing game for personal, non-commercial entertainment. No account is needed. We may change, pause or remove any part of the game, including modes, songs and the leaderboard, at any time.</p>
    <h2>Fair play and the leaderboard</h2>
    <ul>
      <li>Do not use scripts, bots or automated tools to play or to submit scores.</li>
      <li>Do not try to break, overload or get around the site's limits or security.</li>
      <li>Leaderboard and Party names must not be offensive, hateful, sexual, impersonate someone else, or include personal information or advertising.</li>
    </ul>
    <p>We may edit or remove any name or score, and block anyone who breaks these rules, without notice.</p>
    <h2>Music and content</h2>
    <p>Song clips and artwork are official previews streamed from Apple and belong to their artists, labels and other rights holders. They are provided only so you can play the game, and you may not download, copy or redistribute them. Song titles and artist names are used only to identify the songs. The rest of the site, including its design, code and text, belongs to Songless.</p>
    <p>If you are a rights holder and want a song removed, email ${mail}.</p>
    <h2>Independent site</h2>
    <p>Songless.info is an independent site. It is not affiliated with or endorsed by Apple, any record label or artist, or any other song guessing game. All trademarks belong to their owners.</p>
    <h2>Third-party links</h2>
    <p>The site may link to other sites such as Apple Music and Buy Me a Coffee. We are not responsible for the content, products or privacy practices of those third parties.</p>
    <h2>No warranty</h2>
    <p>The site is provided "as is" and "as available". We do not promise it will always be available, error-free, or that every answer or chart position is accurate.</p>
    <h2>Limitation of liability</h2>
    <p>To the fullest extent allowed by law, Songless is not liable for any indirect, incidental or consequential damages, or any loss of data or scores, arising from your use of the site.</p>
    <h2>Privacy</h2>
    <p>Our <a href="/privacy">Privacy Policy</a> explains what data the site uses and why.</p>
    <h2>Changes</h2>
    <p>We may update these terms from time to time. The date at the top shows the latest version, and using the site after a change means you accept the new terms.</p>
    <h2>Contact</h2>
    <p>Questions about these terms: ${mail}.</p>`
  },

  notFound: {
    title: 'Page not found | Songless',
    description: "This page does not exist. Play today's Songless ladder instead.",
    h1: 'That page skipped a beat',
    lead: "We couldn't find this page.",
    cta: "Play today's ladder"
  }
};

export type Content = typeof en;
export default en;
