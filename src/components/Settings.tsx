import { useEffect, useRef, useState } from "react";
import {
  DECADES,
  GENRES,
  CHARTS,
  chartOf,
  type PoolEntry,
} from "../lib/game";
import {
  filterSongs,
  loadSettings,
  saveSettings,
  type Settings as S,
} from "../lib/settings";
import { isMuted, setMuted, sfx } from "../lib/sfx";
import { path, ui } from "../i18n/client";

interface Props {
  mode: "daily" | "unlimited" | "party";
  /** Unlimited passes its answer pool so the dialog can count matching songs. */
  songs?: PoolEntry[];
  onApply?: (s: S) => void;
  /** Bump this to open the dialog from another button (Unlimited's filter button). */
  openRequest?: number;
}

/** Chip logic with an "All" chip: from "all", picking one narrows to it; clearing the last one goes back to all. */
function toggle<T>(list: readonly T[], item: T, order: readonly T[]): T[] {
  if (list.length === order.length) return [item];
  const next = list.includes(item)
    ? list.filter((x) => x !== item)
    : [...list, item];
  return next.length ? order.filter((x) => next.includes(x)) : [...order];
}

function Chips<T extends string>({
  label,
  allLabel,
  order,
  value,
  names,
  counts,
  onChange,
}: {
  label: string;
  allLabel: string;
  order: readonly T[];
  value: T[];
  names?: Record<T, string>;
  counts?: Map<T, number>;
  onChange: (v: T[]) => void;
}) {
  const all = value.length === order.length;
  return (
    <div className="chips" role="group" aria-label={label}>
      <button
        type="button"
        className={all ? "chip active" : "chip"}
        aria-pressed={all}
        onClick={() => onChange([...order])}
      >
        {allLabel}
      </button>
      {order.map((x) => {
        const on = !all && value.includes(x);
        return (
          <button
            key={x}
            type="button"
            className={on ? "chip active" : "chip"}
            aria-pressed={on}
            onClick={() => onChange(toggle(value, x, order))}
          >
            {names?.[x] ?? x}
            {counts && <span className="chip-count">{counts.get(x) ?? 0}</span>}
          </button>
        );
      })}
    </div>
  );
}

function countBy<T>(songs: PoolEntry[], key: (s: PoolEntry) => T): Map<T, number> {
  const m = new Map<T, number>();
  for (const s of songs) m.set(key(s), (m.get(key(s)) ?? 0) + 1);
  return m;
}

export default function Settings({
  mode,
  songs,
  onApply,
  openRequest = 0,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  // The gear opens game mode + sound; Unlimited's filter button opens only decades, genres + countries.
  const [view, setView] = useState<"general" | "filters">("general");
  const [draft, setDraft] = useState<S>(loadSettings);
  const [muted, setMutedState] = useState(isMuted);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const count = songs ? filterSongs(songs, draft).length : null;
  const empty =
    !draft.decades.length ||
    !draft.genres.length ||
    !draft.charts.length ||
    count === 0;

  function apply() {
    saveSettings(draft);
    setOpen(false);
    onApply?.(draft);
  }

  function openDialog(v: "general" | "filters" = "general") {
    setView(v);
    setDraft(loadSettings());
    setOpen(true);
  }

  useEffect(() => {
    if (openRequest) openDialog("filters");
  }, [openRequest]);

  return (
    <>
      <button
        type="button"
        className="icon-btn"
        aria-label={ui.settings.title}
        title={ui.settings.title}
        onClick={() => openDialog()}
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
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <dialog
        ref={ref}
        className="settings"
        onClose={() => setOpen(false)}
        aria-labelledby="settings-title"
      >
        <div className="settings-head">
          <h2 id="settings-title">
            {view === "filters" ? ui.settings.filterTitle : ui.settings.title}
          </h2>
          <button
            type="button"
            className="icon-btn"
            aria-label={ui.settings.closeLabel}
            onClick={() => setOpen(false)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {view === "general" && (
          <>
            <section className="settings-group">
              <h3>{ui.settings.mode}</h3>
              <div className="segmented">
                <a
                  href={path("/")}
                  className={mode === "daily" ? "active" : ""}
                  aria-current={mode === "daily" ? "page" : undefined}
                >
                  {ui.settings.daily}
                </a>
                <a
                  href={path("/unlimited")}
                  className={mode === "unlimited" ? "active" : ""}
                  aria-current={mode === "unlimited" ? "page" : undefined}
                >
                  {ui.settings.unlimited}
                </a>
                <a
                  href={path("/party")}
                  className={mode === "party" ? "active" : ""}
                  aria-current={mode === "party" ? "page" : undefined}
                >
                  {ui.settings.party}
                </a>
              </div>
            </section>

            <section className="settings-group">
              <div className="settings-row">
                <div>
                  <h3>{ui.settings.sound}</h3>
                  <p className="muted small">
                    {ui.settings.soundNote}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!muted}
                  aria-label={ui.settings.sound}
                  className="switch"
                  onClick={() => {
                    setMuted(!muted);
                    setMutedState(!muted);
                    if (muted) sfx.right();
                  }}
                >
                  <span />
                </button>
              </div>
            </section>
          </>
        )}

        {view === "filters" && (
          <>
            <section className="settings-group">
              <h3>{ui.settings.charts}</h3>
              <Chips
                label={ui.settings.charts}
                allLabel={ui.allCountries}
                order={CHARTS}
                value={draft.charts}
                names={ui.charts}
                counts={
                  songs && countBy(filterSongs(songs, draft, "charts"), chartOf)
                }
                onChange={(charts) => setDraft({ ...draft, charts })}
              />
            </section>

            <section className="settings-group">
              <h3>{ui.settings.decades}</h3>
              <Chips
                label={ui.settings.decades}
                allLabel={ui.allDecades}
                order={DECADES}
                value={draft.decades}
                names={ui.decades}
                counts={
                  songs &&
                  countBy(filterSongs(songs, draft, "decades"), (x) => x.decade)
                }
                onChange={(decades) => setDraft({ ...draft, decades })}
              />
            </section>

            <section className="settings-group">
              <h3>{ui.settings.genres}</h3>
              <Chips
                label={ui.settings.genres}
                allLabel={ui.allGenres}
                names={ui.genres}
                order={GENRES}
                value={draft.genres}
                counts={
                  songs &&
                  countBy(
                    filterSongs(songs, draft, "genres"),
                    (x) => x.genre ?? "Pop",
                  )
                }
                onChange={(genres) => setDraft({ ...draft, genres })}
              />
            </section>

          </>
        )}

        {view === "filters" && count !== null && (
          <p className="muted small">
            {ui.settings.match(count)}
          </p>
        )}

        <div className="settings-actions">
          {view === "filters" && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
            >
              {ui.cancel}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={empty}
            onClick={view === "filters" ? apply : () => setOpen(false)}
          >
            {ui.ok}
          </button>
        </div>
      </dialog>
    </>
  );
}
