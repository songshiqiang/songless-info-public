import { useEffect, useRef, type ReactNode } from 'react';
import { ui } from '../i18n/client';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: ReactNode;
}

/** A modal dialog. Its content mounts on each open, so it always shows fresh data. */
export default function Modal({ open, onClose, title, wide, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className={wide ? 'settings modal-wide' : 'settings'} onClose={onClose} aria-label={title}>
      <div className="settings-head">
        <h2>{title}</h2>
        <button type="button" className="icon-btn" aria-label={ui.close} onClick={onClose}>
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
      {open && <div className="modal-body">{children}</div>}
    </dialog>
  );
}
