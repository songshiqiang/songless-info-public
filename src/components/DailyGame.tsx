import { useEffect, useState } from "react";
import { loadLadder } from "../lib/data";
import { feedback } from "../lib/sfx";
import {
  CHARTS,
  CLIPS,
  LADDER_SIZE,
  MAX_ATTEMPTS,
  MAX_SCORE,
  clipFor,
  clipStart,
  isCorrect,
  ladderDate,
  ladderLabel,
  ladderNumber,
  msUntilNextLadder,
  rungDone,
  rungScore,
  rungSolved,
  type Attempt,
  type Chart,
  type RungState,
  type Song,
  type SongRef,
} from "../lib/game";
import {
  emptyDailyStats,
  load,
  recordDaily,
  save,
  type DailyStats,
} from "../lib/storage";
import { buildRecord, isSaved, saveRecord } from "../lib/history";
import { dailyResultCard, rungClip } from "../lib/share-image";
import { dateLocale, defaultChart, path, ui } from "../i18n/client";
import Attempts from "./Attempts";
import ChartPicker from "./ChartPicker";
import ClipPlayer from "./ClipPlayer";
import GuessForm from "./GuessForm";
import History from "./History";
import Modal from "./Modal";
import Settings from "./Settings";
import ShareImage from "./ShareImage";
import SongReveal from "./SongReveal";
import { useLoaded, useTitles } from "./useLoaded";

const CHART_KEY = "songless:daily-chart";
/** The US ladder keeps the original keys, so progress from before the choice stays. */
const chartKey = (base: string, chart: Chart) =>
  chart === "US" ? base : `${base}:${chart}`;
const fresh = (): RungState[] => Array.from({ length: LADDER_SIZE }, () => ({ attempts: [] }));

/** Chart from `?chart=XX` (a link to a saved ladder), else the player's last choice. */
function requestedChart(): Chart {
  const c = new URLSearchParams(window.location.search).get("chart");
  const saved = load<string>(CHART_KEY, defaultChart);
  return CHARTS.find((x) => x === c) ?? CHARTS.find((x) => x === saved) ?? defaultChart;
}

/** Ladder number from `?ladder=N` for archive play, else today's. */
function requestedLadder(today: number): number {
  const n = Number(new URLSearchParams(window.location.search).get("ladder"));
  return Number.isInteger(n) && n >= 1 && n <= today ? n : today;
}

function formatDate(d: Date) {
  return d.toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function useCountdown() {
  const [ms, setMs] = useState(msUntilNextLadder());
  useEffect(() => {
    const t = setInterval(() => setMs(msUntilNextLadder()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export default function DailyGame() {
  const today = ladderNumber();
  const [num] = useState(() => requestedLadder(today));
  const [chart, setChart] = useState<Chart>(requestedChart);
  const data = useLoaded(() => loadLadder(num, chart), [num, chart]);
  const titles = useTitles([chart], !!data.value);

  function pickChart(next: Chart) {
    setChart(next);
    save(CHART_KEY, next);
    // A link's `?chart=` would otherwise win again on reload.
    const url = new URL(window.location.href);
    url.searchParams.delete("chart");
    window.history.replaceState(null, "", url);
  }

  if (data.error)
    return (
      <div className="game-loading">
        {ui.daily.loadError}
      </div>
    );
  if (!data.value)
    return <div className="game-loading">{ui.daily.loading}</div>;
  const ladder = data.value;
  return (
    <Ladder
      key={chart}
      num={num}
      isToday={num === today}
      ladder={ladder}
      titles={titles}
      chart={chart}
      onChart={pickChart}
    />
  );
}

interface LadderProps {
  num: number;
  isToday: boolean;
  ladder: Song[];
  titles: SongRef[];
  chart: Chart;
  onChart: (chart: Chart) => void;
}

function Ladder({ num, isToday, ladder, titles, chart, onChart }: LadderProps) {
  const key = chartKey("songless:daily", chart) + `:${num}`;
  const statsKey = chartKey("songless:daily-stats", chart);
  const [rungs, setRungs] = useState<RungState[]>(() => load(key, fresh()));
  const firstOpen = rungs.findIndex((r) => !rungDone(r));
  const [viewing, setViewing] = useState(
    firstOpen === -1 ? LADDER_SIZE : firstOpen,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [stats, setStats] = useState<DailyStats>(() =>
    load(statsKey, emptyDailyStats),
  );

  const total = rungs.reduce((sum, r) => sum + rungScore(r), 0);
  const finished = rungs.every(rungDone);

  useEffect(() => save(key, rungs), [key, rungs]);

  useEffect(() => {
    if (!finished || !isToday) return;
    const next = recordDaily(stats, num, total);
    if (next !== stats) {
      setStats(next);
      save(statsKey, next);
    }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  function act(i: number, guess: string | null, picked?: SongRef) {
    const r = rungs[i];
    if (rungDone(r)) return;
    const attempt: Attempt =
      guess === null
        ? { kind: "skip" }
        : {
            kind: isCorrect(guess, ladder[i], picked) ? "right" : "wrong",
            text: guess,
          };
    const next = { attempts: [...r.attempts, attempt] };
    feedback(next.attempts, MAX_ATTEMPTS);
    setRungs(rungs.map((old, k) => (k === i ? next : old)));
  }

  return (
    <div className="game">
      <div className="game-head">
        <h2>
          {ui.daily.title(formatDate(ladderDate(num)))}
          {!isToday && <span className="tag">{ui.daily.archive}</span>}
        </h2>
        <div className="game-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={ui.daily.history}
            title={ui.daily.history}
            onClick={() => setHistoryOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l3 2" />
            </svg>
          </button>
          <Settings mode="daily" />
        </div>
      </div>
      <div className="game-sub">
        <span className="muted">
          {ui.daily.scoreLine(total, MAX_SCORE)}
        </span>
        <ChartPicker value={chart} onChange={onChart} />
      </div>


      {viewing < LADDER_SIZE ? (
        <Rung
          index={viewing}
          song={ladder[viewing]}
          state={rungs[viewing]}
          salt={num}
          titles={titles}
          onGuess={(g, picked) => act(viewing, g, picked)}
          onSkip={() => act(viewing, null)}
          onNext={() => setViewing(viewing + 1)}
        />
      ) : (
        <Results
          num={num}
          ladder={ladder}
          rungs={rungs}
          total={total}
          stats={stats}
          isToday={isToday}
          chart={chart}
          onViewHistory={() => setHistoryOpen(true)}
        />
      )}

      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={ui.daily.history}
        wide
      >
        <History />
      </Modal>
    </div>
  );
}

interface RungProps {
  index: number;
  song: Song;
  state: RungState;
  salt: number;
  titles: SongRef[];
  onGuess: (g: string, picked?: SongRef) => void;
  onSkip: () => void;
  onNext: () => void;
}

function Rung({
  index,
  song,
  state,
  salt,
  titles,
  onGuess,
  onSkip,
  onNext,
}: RungProps) {
  const done = rungDone(state);
  const solved = rungSolved(state);
  const clip = clipFor(state);
  const attemptsLeft = state.attempts.length;
  const skipLabel =
    attemptsLeft < CLIPS.length - 1
      ? ui.skip(CLIPS[attemptsLeft + 1] - CLIPS[attemptsLeft])
      : ui.giveUp;
  const last = index === LADDER_SIZE - 1;
  const solvedClip = CLIPS[state.attempts.findIndex((a) => a.kind === "right")];

  return (
    <>
      <ClipPlayer
        previewUrl={song.previewUrl}
        trackId={song.trackId}
        store={song.store}
        start={clipStart(song.id, salt)}
        clip={done ? CLIPS[CLIPS.length - 1] : clip}
        revealed={done}
        label={ui.daily.songOf(index + 1, LADDER_SIZE)}
      />
      {done ? (
        <SongReveal
          song={song}
          solved={solved}
          headline={
            solved
              ? ui.daily.solvedIn(ui.seconds(solvedClip), rungScore(state))
              : ui.daily.outOfClips
          }
          action={
            <button className="btn btn-primary" onClick={onNext}>
              {last ? ui.daily.seeResults : ui.daily.nextSong(index + 2, LADDER_SIZE)}
            </button>
          }
        />
      ) : (
        <GuessForm
          songs={titles}
          skipLabel={skipLabel}
          onGuess={onGuess}
          onSkip={onSkip}
        />
      )}
      <Attempts attempts={state.attempts} />
    </>
  );
}

interface ResultsProps {
  num: number;
  ladder: Song[];
  rungs: RungState[];
  total: number;
  stats: DailyStats;
  isToday: boolean;
  chart: Chart;
  onViewHistory: () => void;
}

function Results({ num, ladder, rungs, total, stats, isToday, chart, onViewHistory }: ResultsProps) {
  const countdown = useCountdown();
  const [saved, setSaved] = useState(() => isSaved(num, chart));

  function saveToHistory() {
    saveRecord(buildRecord(num, ladder, rungs, chart));
    setSaved(true);
  }

  const date = ladderLabel(num, dateLocale);
  const card = dailyResultCard(rungs.map(rungClip), ui.secondsShort, {
    tag: chart === "US" ? date : `${ui.charts[chart]} · ${date}`,
    tagline: ui.shareImage.tagline,
    url: `songless.info${path("/").replace(/^\/$/, "")}`,
    seed: num,
  });

  return (
    <section className="results" aria-live="polite">
      <div className="results-head">
        <p className="eyebrow">{ui.daily.complete(formatDate(ladderDate(num)))}</p>
        <p className="results-total">
          {total}
          <span> / {MAX_SCORE}</span>
        </p>
      </div>
      <div className="results-main">
        <ol className="results-rows">
          {ladder.map((s, i) => (
            <li
              key={s.id}
              className={
                rungSolved(rungs[i]) ? "result-row solved" : "result-row missed"
              }
            >
              <span className="result-decade">{i + 1}</span>
              <div className="result-song">
                <div className="ellipsis">
                  {s.title} · {s.artist}
                </div>
                <div className="muted small">
                  {rungSolved(rungs[i])
                    ? ui.solvedAt(CLIPS[rungs[i].attempts.findIndex((a) => a.kind === "right")])
                    : ui.missed}
                </div>
              </div>
              <span className="result-pts">{rungScore(rungs[i])}</span>
            </li>
          ))}
        </ol>
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-num">{stats.played}</div>
            <div className="stat-label">{ui.daily.played}</div>
          </div>
          <div className="stat">
            <div className="stat-num">{stats.streak}</div>
            <div className="stat-label">{ui.daily.streak}</div>
          </div>
          <div className="stat">
            <div className="stat-num">{stats.best}</div>
            <div className="stat-label">{ui.best}</div>
          </div>
        </div>
      </div>
      <a className="cta-card" href={path("/unlimited")}>
        <span>
          <span className="eyebrow orange">{ui.daily.notDone}</span>
          <span className="cta-title">{ui.daily.keepGoing}</span>
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </a>
      <aside className="results-side">
        <div className="card">
          <h3>{ui.daily.shareTitle}</h3>
          <ShareImage card={card} fileName={`songless-${num}.png`} />
        </div>
        <div className="history-save">
          {saved ? (
            <button className="btn btn-ghost btn-block" disabled>
              {ui.daily.savedHere}
            </button>
          ) : (
            <button className="btn btn-ghost btn-block" onClick={saveToHistory}>
              {ui.daily.saveHistory}
            </button>
          )}
          <button
            type="button"
            className="link-btn small"
            onClick={onViewHistory}
          >
            {ui.daily.viewPast}
          </button>
        </div>
        <p className="muted small center">
          {isToday ? (
            ui.daily.nextIn(countdown)
          ) : (
            <a href={path("/")}>{ui.daily.playToday}</a>
          )}
        </p>
      </aside>
    </section>
  );
}
