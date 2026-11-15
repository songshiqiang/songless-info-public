import { useRef } from 'react';
import { CLIPS, MAX_ATTEMPTS, POINTS, type Attempt } from '../lib/game';
import { ui } from '../i18n/client';

export default function Attempts({ attempts }: { attempts: Attempt[] }) {
  // Only a row filled while playing flashes, not ones restored from a saved game.
  const count = useRef(attempts.length);
  const fresh = useRef(-1);
  if (attempts.length !== count.current) {
    fresh.current = attempts.length > count.current ? attempts.length - 1 : -1;
    count.current = attempts.length;
  }
  const next = attempts.some((a) => a.kind === 'right') ? -1 : attempts.length;

  return (
    <div className="attempts-wrap">
      <ol className="attempts" aria-label={ui.attempts.label}>
        {Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
          const a = attempts[i];
          const kind = a?.kind ?? 'empty';
          return (
            <li key={i} className={`attempt attempt-${kind}${i === next ? ' attempt-next' : ''}${i === fresh.current ? ' attempt-fresh' : ''}`}>
              <span className="attempt-text">
                {!a
                  ? ui.attempts.hint(i, ui.seconds(CLIPS[i]), POINTS[i])
                  : a.kind === 'skip'
                    ? ui.attempts.skipped
                    : a.text}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
