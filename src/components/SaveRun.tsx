import { useState, type FormEvent } from 'react';
import { AVATARS, NAME_MAX, PASSWORD_MAX, PASSWORD_MIN, SaveError, cleanName, submitRun, type SaveResult } from '../lib/leaderboard';
import { adoptPlayerId, loadProfile, playerId, saveProfile } from '../lib/profile';
import { savedRunCard, type Card } from '../lib/share-image';
import { serverText, ui } from '../i18n/client';
import Avatar from './Avatar';
import Modal from './Modal';
import ShareImage from './ShareImage';

interface Props {
  correct: number;
  score: number;
  filter: string;
  /** The picture to share once the run is saved. */
  card: Card;
}

/** Saves the Songless Unlimited totals to the global leaderboard. */
function SaveRun({ correct, score, filter, card, onViewBoard, onSaved }: Props & { onViewBoard: () => void; onSaved: () => void }) {
  const [profile] = useState(loadProfile);
  const [name, setName] = useState(profile.name);
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(profile.avatar);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<SaveResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = cleanName(name);
    if (!clean) {
      setError(ui.save.enterName);
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(ui.save.passwordShort(PASSWORD_MIN));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await submitRun({ player: playerId(), name: clean, password, avatar, correct, score, filter });
      adoptPlayerId(result.player);
      saveProfile({ name: result.row.name, avatar });
      setSaved(result);
      onSaved();
    } catch (err) {
      setError(err instanceof SaveError ? serverText(err.message) : ui.save.failed);
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <div className="save-share">
        <div className="save-run save-run-done" aria-live="polite">
          <Avatar name={saved.row.name} avatar={saved.row.avatar} />
          <div className="save-run-text">
            <strong>
              {saved.best ? ui.save.savedRank(saved.rank) : ui.save.savedKept(saved.rank)}
            </strong>
            {!saved.best && (
              <span className="muted small">
                {ui.save.bestLine(saved.row.correct, saved.row.score)}
              </span>
            )}
          </div>
          <button type="button" className="btn btn-ghost" onClick={onViewBoard}>
            {ui.save.viewBoard}
          </button>
        </div>
        <ShareImage card={savedRunCard(card, saved, { rank: ui.shareImage.rank, points: ui.points, songs: ui.songs })} fileName="songless-unlimited.png" />
      </div>
    );
  }

  return (
    <form className="save-run" onSubmit={onSubmit} noValidate>
      <div className="save-run-title">
        <span className="muted small">
          {ui.songs(correct)} · {ui.points(score)}
        </span>
      </div>
      <label className="guess-label" htmlFor="save-name">
        {ui.yourName}
      </label>
      <input
        id="save-name"
        className="guess-input"
        value={name}
        maxLength={NAME_MAX}
        autoComplete="username"
        readOnly={Boolean(profile.name)}
        placeholder={ui.save.namePlaceholder}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'save-error' : undefined}
      />
      <label className="guess-label" htmlFor="save-password">
        {ui.save.password}
      </label>
      <input
        id="save-password"
        className="guess-input"
        type="password"
        value={password}
        maxLength={PASSWORD_MAX}
        autoComplete="current-password"
        placeholder={ui.save.passwordPlaceholder(PASSWORD_MIN)}
        onChange={(e) => {
          setPassword(e.target.value);
          setError('');
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'save-error' : 'save-password-note'}
      />
      <span id="save-password-note" className="muted small">
        {ui.save.passwordNote}
      </span>
      <fieldset className="avatar-pick">
        <legend className="guess-label">{ui.save.avatar}</legend>
        <button
          type="button"
          className={avatar === '' ? 'avatar-opt active' : 'avatar-opt'}
          onClick={() => setAvatar('')}
          aria-pressed={avatar === ''}
          aria-label={ui.save.noAvatar}
        >
          <Avatar name={name || '?'} avatar="" size={32} />
        </button>
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            className={avatar === a ? 'avatar-opt active' : 'avatar-opt'}
            onClick={() => setAvatar(a)}
            aria-pressed={avatar === a}
            aria-label={ui.save.avatarLabel(a)}
          >
            {a}
          </button>
        ))}
      </fieldset>
      {error && (
        <div id="save-error" className="save-run-error" role="alert">
          {error}
        </div>
      )}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? ui.save.saving : ui.save.save}
      </button>
    </form>
  );
}

/** Header button that saves the totals so far; play carries on afterwards. */
export default function SaveRunButton({ correct, score, filter, card, disabled, onViewBoard }: Props & { disabled: boolean; onViewBoard: () => void }) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const close = () => {
    setOpen(false);
    setSharing(false);
  };

  return (
    <>
      <button
        type="button"
        className="icon-btn"
        aria-label={ui.save.button}
        title={ui.save.button}
        disabled={disabled}
        onClick={() => setOpen(true)}
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
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <path d="M17 21v-8H7v8M7 3v5h8" />
        </svg>
      </button>

      <Modal open={open} onClose={close} title={sharing ? ui.shareImage.open : ui.save.title}>
        <SaveRun
          correct={correct}
          score={score}
          filter={filter}
          card={card}
          onSaved={() => setSharing(true)}
          onViewBoard={() => {
            close();
            onViewBoard();
          }}
        />
      </Modal>
    </>
  );
}
