import { useEffect, useMemo, useRef, useState } from "react";
import { loadPool, loadSong } from "../lib/data";
import { feedback } from "../lib/sfx";
import {
  CHARTS,
  CLIPS,
  chartOf,
  MAX_ATTEMPTS,
  clipFor,
  clipStart,
  isCorrect,
  rungDone,
  rungScore,
  rungSolved,
  type PoolEntry,
  type RungState,
  type Song,
  type SongRef,
} from "../lib/game";
import {
  describe,
  filterSongs,
  loadSettings,
  type Settings as Prefs,
} from "../lib/settings";
import { loadRun, saveRun, type Run } from "../lib/unlimited-run";
import type { Card } from "../lib/share-image";
import { localizeFilter, path, ui } from "../i18n/client";
import Attempts from "./Attempts";
import ClipPlayer from "./ClipPlayer";
import GuessForm from "./GuessForm";
import LeaderboardTable from "./LeaderboardTable";
import Modal from "./Modal";
import SaveRunButton from "./SaveRun";
import Settings from "./Settings";
import SongReveal from "./SongReveal";
import { useLoaded, useTitles } from "./useLoaded";

function pickSong(pool: PoolEntry[], recent: string[]): PoolEntry {
  const fresh = pool.filter((s) => !recent.includes(s.id));
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}

/** Songs matching the settings, or all of them if nothing matches. */
function playable(songs: PoolEntry[], prefs: Prefs) {
  const p = filterSongs(songs, prefs);
  return p.length ? p : songs;
}

async function startGame() {
  const songs = await loadPool();
  const resumed = loadRun(songs);
  const first = await loadSong(
    resumed?.song ?? pickSong(playable(songs, loadSettings()), []),
  );
  return { songs, resumed, first };
}

export default function UnlimitedGame() {
  const data = useLoaded(startGame, []);
  if (data.error)
    return (
      <div className="game-loading">
        {ui.unlimited.loadError}
      </div>
    );
  if (!data.value)
    return <div className="game-loading">{ui.unlimited.loading}</div>;
  return <Unlimited {...data.value} />;
}

interface UnlimitedProps {
  songs: PoolEntry[];
  resumed: Run<PoolEntry> | null;
  first: Song;
}

function Unlimited({ songs, resumed, first }: UnlimitedProps) {
  const [prefs, setPrefs] = useState<Prefs>(loadSettings);
  const [filterOpen, setFilterOpen] = useState(0);
  const [boardOpen, setBoardOpen] = useState(false);
  const pool = useMemo(() => playable(songs, prefs), [songs, prefs]);
  // A run left unfinished picks up where it stopped.
  const [recent, setRecent] = useState<string[]>(resumed?.recent ?? []);
  const [song, setSong] = useState(first);
  // Suggestions for every country that can come up, and the song on screen after a filter change.
  const titles = useTitles(
    CHARTS.filter((c) => c === chartOf(song) || pool.some((s) => s.chart === c)),
  );
  const [rung, setRung] = useState<RungState>(
    resumed?.rung ?? { attempts: [] },
  );
  const [correct, setCorrect] = useState(resumed?.correct ?? 0);
  const [points, setPoints] = useState(resumed?.points ?? 0);
  const [salt] = useState(
    () => resumed?.salt ?? Math.floor(Math.random() * 1e6),
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const upcoming = useRef<PoolEntry | null>(null);
  const loadTurn = useRef(0);

  useEffect(() => {
    saveRun({ song, rung, correct, points, recent, salt });
  }, [song, rung, correct, points, recent, salt]);

  const done = rungDone(rung);
  const solved = rungSolved(rung);
  const clip = clipFor(rung);
  const used = rung.attempts.length;
  const skipLabel =
    used < CLIPS.length - 1
      ? ui.skip(CLIPS[used + 1] - CLIPS[used])
      : ui.giveUp;

  const recentAfter = (from: PoolEntry[]) =>
    [song.id, ...recent].slice(0, Math.min(200, Math.floor(from.length / 2)));

  // Once the answer is out, fetch the next song so "Next song" doesn't wait.
  useEffect(() => {
    upcoming.current = null;
    if (!done) return;
    upcoming.current = pickSong(pool, recentAfter(pool));
    loadSong(upcoming.current).catch(() => {});
  }, [done, pool]); // eslint-disable-line react-hooks/exhaustive-deps

  async function nextSong(from: PoolEntry[] = pool) {
    const r = recentAfter(from);
    const entry =
      (from === pool && upcoming.current) || pickSong(from, r);
    const turn = ++loadTurn.current;
    setLoadFailed(false);
    try {
      const next = await loadSong(entry);
      if (turn !== loadTurn.current) return;
      setRecent(r);
      setSong(next);
      setRung({ attempts: [] });
    } catch {
      if (turn === loadTurn.current) setLoadFailed(true);
    }
  }

  function act(guess: string | null, picked?: SongRef) {
    if (done) return;
    const attempt =
      guess === null
        ? ({ kind: "skip" } as const)
        : ({
            kind: isCorrect(guess, song, picked) ? "right" : "wrong",
            text: guess,
          } as const);
    const next = { attempts: [...rung.attempts, attempt] };
    feedback(next.attempts, MAX_ATTEMPTS);
    setRung(next);
    if (rungSolved(next)) {
      setCorrect(correct + 1);
      setPoints(points + rungScore(next));
    }
  }

  const card: Card = {
    tag: ui.settings.unlimited,
    hero: String(points),
    suffix: ui.songs(correct),
    rows: [],
    tagline: ui.shareImage.tagline,
    url: `songless.info${path("/unlimited")}`,
    lime: false,
    seed: salt,
  };

  return (
    <div className="game">
      <div className="game-head">
        <h2>{ui.unlimited.title}</h2>
        <div className="game-actions">
          <SaveRunButton
            correct={correct}
            score={points}
            filter={describe(prefs)}
            disabled={correct === 0}
            onViewBoard={() => setBoardOpen(true)}
            card={card}
          />
          <Settings
            mode="unlimited"
            songs={songs}
            openRequest={filterOpen}
            onApply={(p) => {
              if (describe(p) === describe(prefs)) return;
              setPrefs(p);
              nextSong(playable(songs, p));
            }}
          />
        </div>
      </div>
      <div className="game-sub">
        <button
          type="button"
          className="filter-btn"
          onClick={() => setFilterOpen((n) => n + 1)}
          aria-label={ui.unlimited.filterLabel(localizeFilter(describe(prefs)))}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          {localizeFilter(describe(prefs))}
        </button>
        <span className="muted">
          {ui.songs(correct)} · {ui.points(points)} ·{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => setBoardOpen(true)}
          >
            {ui.unlimited.leaderboard}
          </button>
        </span>
      </div>

      <ClipPlayer
        previewUrl={song.previewUrl}
        trackId={song.trackId}
        store={song.store}
        start={clipStart(song.id, salt)}
        clip={done ? CLIPS[CLIPS.length - 1] : clip}
        revealed={done}
        label={ui.unlimited.song(correct + (solved ? 0 : 1))}
      />

      {done ? (
        <SongReveal
          song={song}
          solved={solved}
          headline={solved ? ui.unlimited.correct(rungScore(rung)) : ui.missed}
          action={
            <button className="btn btn-primary" onClick={() => nextSong()}>
              {ui.nextSongPlain}
            </button>
          }
        />
      ) : (
        <GuessForm
          songs={titles}
          skipLabel={skipLabel}
          onGuess={act}
          onSkip={() => act(null)}
        />
      )}
      {loadFailed && (
        <p className="muted small">
          {ui.unlimited.nextError}
        </p>
      )}
      <Attempts attempts={rung.attempts} />

      <Modal
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
        title={ui.unlimited.leaderboard}
        wide
      >
        <LeaderboardTable />
      </Modal>
    </div>
  );
}
