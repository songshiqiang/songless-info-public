import { useEffect, useRef, useState } from 'react';
import { lookupPreview } from '../lib/data';
import { CLIPS } from '../lib/game';
import { ui } from '../i18n/client';

interface Props {
  previewUrl: string;
  /** Used to fetch a fresh preview URL if the stored one has expired. */
  trackId: number;
  /** iTunes storefront of the track, for refreshing an expired preview. */
  store?: string;
  /** Offset into the preview, in seconds. */
  start: number;
  /** Seconds unlocked for this attempt. */
  clip: number;
  label: string;
  /** The answer is shown: an unlocked clip then plays from the beginning. */
  revealed?: boolean;
  /** When set, the clip plays by itself each time this changes (Songless Party's new songs). */
  autoKey?: string | number;
  /** Smaller layout, for the middle of the Songless Party table. */
  compact?: boolean;
}

export default function ClipPlayer({
  previewUrl,
  trackId,
  store,
  start,
  clip,
  label,
  revealed = false,
  autoKey,
  compact,
}: Props) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const frame = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = new Audio();
    el.preload = 'auto';
    el.src = previewUrl;
    let retried = false;
    let disposed = false;
    el.addEventListener('error', async () => {
      if (disposed) return;
      if (!retried) {
        retried = true;
        const fresh = await lookupPreview(trackId, store);
        if (fresh && fresh !== el.src && !disposed) {
          el.src = fresh;
          return;
        }
      }
      setError(true);
    });
    audio.current = el;
    setError(false);
    setElapsed(0);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame.current);
      el.pause();
      el.removeAttribute('src');
      el.load();
    };
  }, [previewUrl, trackId, store]);

  function stop() {
    cancelAnimationFrame(frame.current);
    audio.current?.pause();
    setPlaying(false);
  }

  // A longer clip was unlocked (skip or wrong guess): play only the newly
  // unlocked part straight away, e.g. 1s to 3s. The play button still plays
  // the whole clip from the beginning. Once the answer is revealed, the full
  // clip plays from the start. Songless Party (autoKey set) always replays the
  // whole clip, because its answer timer counts the full clip length. The
  // short delay lets the guess sound effect finish first.
  const lastClip = useRef(clip);
  useEffect(() => {
    stop();
    setElapsed(0);
    const from = lastClip.current;
    const grew = clip > from;
    lastClip.current = clip;
    if (!grew) return;
    const t = setTimeout(() => void play(true, revealed || autoKey !== undefined ? 0 : from), 350);
    return () => clearTimeout(t);
  }, [clip]);

  // A new song in Songless Party: play it for everyone without waiting for a tap.
  useEffect(() => {
    if (autoKey === undefined) return;
    const t = setTimeout(() => void play(true), 350);
    return () => clearTimeout(t);
  }, [autoKey]);

  /** `from` is the offset into the clip, in seconds, to start playing at. */
  async function play(auto = false, from = 0) {
    const el = audio.current;
    if (!el) return;
    if (playing && !auto) return stop();
    try {
      if (el.readyState < 1) {
        await new Promise<void>((resolve, reject) => {
          el.addEventListener('loadedmetadata', () => resolve(), { once: true });
          el.addEventListener('error', () => reject(new Error('load')), { once: true });
          el.load();
        });
      }
      el.currentTime = start + from;
      await el.play();
    } catch (e) {
      // A browser may refuse an automatic play; the player just waits for a tap.
      if (!(auto && e instanceof DOMException && e.name === 'NotAllowedError')) setError(true);
      return;
    }
    setPlaying(true);
    const tick = () => {
      const t = el.currentTime - start;
      setElapsed(Math.max(0, Math.min(t, clip)));
      if (t >= clip || el.paused || el.ended) {
        el.pause();
        setPlaying(false);
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  let prev = 0;
  return (
    <section className={compact ? 'player player-compact' : 'player'} aria-label={ui.player.label}>
      <p className="player-label">
        {compact ? (
          label
        ) : (
          <>
            {label} · {ui.player.length} <strong>{ui.seconds(clip)}</strong>
          </>
        )}
      </p>
      <button className="play-btn" onClick={() => void play()} aria-label={playing ? ui.player.stop : ui.player.play}>
        {playing ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5l12 7-12 7z" />
          </svg>
        )}
      </button>
      <div className="segments" aria-hidden="true">
        {CLIPS.map((c) => {
          const from = prev;
          prev = c;
          const unlocked = c <= clip;
          const fill = playing || elapsed > 0 ? Math.max(0, Math.min(1, (elapsed - from) / (c - from))) : 0;
          return (
            <div key={c} className="segment" style={{ flex: c - from }}>
              <div className={`segment-bar${unlocked ? ' unlocked' : ''}`}>
                <div className="segment-fill" style={{ width: `${fill * 100}%` }} />
              </div>
              <span className={`segment-label${unlocked ? ' unlocked' : ''}${c === clip ? ' current' : ''}`}>{ui.secondsShort(c)}</span>
            </div>
          );
        })}
      </div>
      {error && <p className="player-error">{ui.player.error}</p>}
    </section>
  );
}
