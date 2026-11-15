import type { ReactNode } from 'react';
import { appleMusicUrl, type Song } from '../lib/game';
import { ui } from '../i18n/client';

interface Props {
  song: Song;
  solved: boolean;
  headline: string;
  action: ReactNode;
}

export default function SongReveal({ song, solved, headline, action }: Props) {
  return (
    <section className={solved ? 'reveal reveal-solved' : 'reveal reveal-missed'} aria-live="polite">
      {song.artwork && <img src={song.artwork} alt="" width={64} height={64} className="reveal-art" />}
      <div className="reveal-body">
        <div className="reveal-headline">{headline}</div>
        <div className="reveal-song">
          {solved ? '' : ui.reveal.itWas}
          {song.title} · {song.artist} ({song.year})
        </div>
        <a className="reveal-link" href={appleMusicUrl(song)} target="_blank" rel="noopener">
          {ui.listenApple}
        </a>
      </div>
      {action}
    </section>
  );
}
