import { useState } from 'react';
import { MAX_SCORE, type Chart } from '../lib/game';
import { dateLocale, path, ui } from '../i18n/client';
import { loadHistory, removeRecord, summarize, type HistoryRecord } from '../lib/history';

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(dateLocale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

const recordKey = (r: HistoryRecord) => `${r.chart ?? 'US'}:${r.num}`;
const ladderHref = (r: HistoryRecord) => path(`/?ladder=${r.num}&chart=${r.chart ?? 'US'}#play`);

/** Daily Ladder results the player saved in this browser. */
export default function History() {
  const [list, setList] = useState<HistoryRecord[]>(loadHistory);
  const [open, setOpen] = useState<string | null>(list[0] ? recordKey(list[0]) : null);
  const sum = summarize(list);

  if (!list.length)
    return (
      <div className="history-empty card">
        <h3>{ui.history.emptyTitle}</h3>
        <p className="muted">
          {ui.history.emptyBefore}
          <strong>{ui.daily.saveHistory}</strong>
          {ui.history.emptyAfter}
        </p>
      </div>
    );

  function remove(r: HistoryRecord) {
    if (!confirm(ui.history.confirmDelete)) return;
    setList(removeRecord(r.num, r.chart));
  }

  return (
    <div className="history">
      <div className="stat-grid history-stats">
        <div className="stat">
          <div className="stat-num">{sum.days}</div>
          <div className="stat-label">{ui.history.days}</div>
        </div>
        <div className="stat">
          <div className="stat-num">{sum.average}</div>
          <div className="stat-label">{ui.history.average}</div>
        </div>
        <div className="stat">
          <div className="stat-num">{sum.best}</div>
          <div className="stat-label">{ui.best}</div>
        </div>
      </div>
      <p className="muted small center">
        {ui.history.summary(sum.solved, sum.songs)}
      </p>
      <ul className="history-list">
        {list.map((r) => {
          const key = recordKey(r);
          const expanded = open === key;
          return (
            <li key={key} className="history-day">
              <button
                className="history-day-head"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : key)}
              >
                <span className="history-date">
                  {formatDate(r.date)} · {ui.charts[(r.chart ?? 'US') as Chart]}
                </span>
                <span className="history-dots" aria-hidden="true">
                  {r.songs.map((s, i) => (
                    <span key={i} className={s.solvedAt !== null ? 'dot solved' : 'dot missed'} />
                  ))}
                </span>
                <span className="history-total">
                  {r.total}
                  <span> / {MAX_SCORE}</span>
                </span>
              </button>
              {expanded && (
                <div className="history-day-body">
                  <ol className="results-rows">
                    {r.songs.map((s, i) => (
                      <li key={i} className={s.solvedAt !== null ? 'result-row solved' : 'result-row missed'}>
                        <span className="result-decade">{i + 1}</span>
                        <div className="result-song">
                          <div className="ellipsis">
                            {s.title} · {s.artist}
                          </div>
                          <div className="muted small">
                            {s.solvedAt !== null ? ui.solvedAt(s.solvedAt) : ui.missed}
                          </div>
                        </div>
                        <span className="result-pts">{s.points}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="history-actions">
                    <a className="small" href={ladderHref(r)}>
                      {ui.history.open}
                    </a>
                    <button className="link-btn small" onClick={() => remove(r)}>
                      {ui.history.delete}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
