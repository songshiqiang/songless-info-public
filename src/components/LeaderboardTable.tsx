import { useEffect, useState } from 'react';
import { fetchBoard, type BoardRow } from '../lib/leaderboard';
import { knownPlayerId } from '../lib/profile';
import { dateLocale, localizeFilter, ui } from '../i18n/client';
import Avatar from './Avatar';

const dateFmt = new Intl.DateTimeFormat(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });

function Row({ r }: { r: BoardRow }) {
  return (
    <li className={r.you ? 'lb-row lb-you' : 'lb-row'}>
      <span className={`lb-rank${r.rank <= 3 ? ` lb-top lb-top-${r.rank}` : ''}`}>{r.rank}</span>
      <Avatar name={r.name} avatar={r.avatar} />
      <span className="lb-name">
        <strong className="ellipsis">
          {r.name}
          {r.you && <span className="tag lb-you-tag">{ui.board.you}</span>}
        </strong>
        <span className="muted small ellipsis">
          {localizeFilter(r.filter || 'All decades · All genres')} · {dateFmt.format(r.at)}
        </span>
      </span>
      <span className="lb-num">
        <strong>{r.correct}</strong>
        <span className="muted small">{ui.board.songs(r.correct)}</span>
      </span>
      <span className="lb-num lb-score">
        <strong>{r.score}</strong>
        <span className="muted small">{ui.board.points(r.score)}</span>
      </span>
    </li>
  );
}

/** The global Songless Unlimited leaderboard: each player's best saved score. */
export default function LeaderboardTable() {
  const [data, setData] = useState<{ rows: BoardRow[]; you: BoardRow | null } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchBoard(knownPlayerId())
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="game-loading lb-empty">{ui.board.loadError}</div>;
  if (!data) return <div className="game-loading lb-empty">{ui.board.loading}</div>;
  if (!data.rows.length)
    return (
      <div className="game-loading lb-empty">
        <p>{ui.board.empty}</p>
      </div>
    );

  const youBelow = data.you && !data.rows.some((r) => r.you);
  return (
    <div className="lb">
      <div className="lb-head muted small" aria-hidden="true">
        <span>#</span>
        <span>{ui.board.player}</span>
        <span>{ui.board.songsHead}</span>
        <span>{ui.board.pointsHead}</span>
      </div>
      <ol className="lb-list">
        {data.rows.map((r) => (
          <Row key={r.rank} r={r} />
        ))}
      </ol>
      {youBelow && (
        <>
          <div className="lb-gap muted small">{ui.board.yourBest}</div>
          <ol className="lb-list">
            <Row r={data.you!} />
          </ol>
        </>
      )}
    </div>
  );
}
