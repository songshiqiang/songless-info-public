import { useId, useMemo, useState } from 'react';
import { CLIPS, suggest, type SongRef } from '../lib/game';
import { ui } from '../i18n/client';

// Every label the skip button can show, so it can stay as wide as the longest.
const skipLabels = [...CLIPS.slice(1).map((clip, i) => ui.skip(clip - CLIPS[i])), ui.giveUp];

interface Props {
  songs: readonly SongRef[];
  skipLabel?: string;
  onGuess: (text: string, picked?: SongRef) => void;
  /** Leave out to hide the skip button (Songless Party). */
  onSkip?: () => void;
  /** Blocks guessing for a moment (Songless Party's wrong-guess lockout). */
  disabled?: boolean;
}

const label = (s: SongRef) => `${s.title} · ${s.artist}`;

export default function GuessForm({ songs, skipLabel, onGuess, onSkip, disabled }: Props) {
  const id = useId();
  const [text, setText] = useState('');
  /** Search text behind the open list; kept after a pick so the list can offer other songs again. */
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<SongRef | null>(null);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const options = useMemo(
    () => suggest(songs, picked ? query : text),
    [songs, text, query, picked]
  );
  const showList = open && options.length > 0;

  function reset() {
    setText('');
    setQuery('');
    setPicked(null);
    setActive(-1);
    setOpen(false);
  }

  function submit() {
    const v = text.trim();
    if (!v || disabled) return;
    // Only trust the picked song while the field still shows it, so edits stay text guesses.
    onGuess(v, picked && label(picked) === v ? picked : undefined);
    reset();
  }

  /** Fill the field with a suggestion. Guessing still needs the Guess button (or Enter again). */
  function choose(s: SongRef) {
    setPicked(s);
    setText(label(s));
    setActive(-1);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      // Enter on a highlighted suggestion only picks it; submit when none is highlighted.
      if (showList && active >= 0) {
        e.preventDefault();
        choose(options[active]);
      }
      return;
    }
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <form
      className="guess-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor={`${id}-guess`} className="guess-label">
        {ui.guess.label}
      </label>
      <div className="guess-row">
        <input
          id={`${id}-guess`}
          className="guess-input"
          value={text}
          autoComplete="off"
          placeholder={ui.guess.placeholder}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${id}-opt-${active}` : undefined}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            setQuery(v);
            setPicked(null);
            setActive(-1);
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => setOpen(true)}
        />
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          {ui.guess.button}
        </button>
        {onSkip && (
          <button type="button" className="btn btn-ghost guess-skip" onClick={onSkip}>
            {skipLabels.map((label) => (
              <span key={label} className={label === skipLabel ? undefined : 'guess-skip-sizer'}>
                {label}
              </span>
            ))}
          </button>
        )}
      </div>
      {showList && (
        <ul id={`${id}-list`} role="listbox" className="suggestions" aria-label={ui.guess.suggestions}>
          {options.map((s, i) => (
            <li
              key={s.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'suggestion active' : 'suggestion'}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
            >
              {s.title} <span className="muted">· {s.artist}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
