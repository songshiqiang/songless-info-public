import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CHARTS, type Chart } from '../lib/game';
import { ui } from '../i18n/client';

interface Props {
  value: Chart;
  onChange: (chart: Chart) => void;
}

/** A button showing the current country that opens a list of the others. */
export default function ChartPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);

  // Keyboard users land on the current country, and return to the button afterwards.
  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    button.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...(menu.current?.querySelectorAll<HTMLElement>('button') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  }

  return (
    <div className="chart-picker">
      <button
        ref={button}
        type="button"
        className="filter-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ui.country.current(ui.charts[value])}
        onClick={() => setOpen(!open)}
      >
        {ui.charts[value]}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="chart-backdrop" onClick={close} />
          <ul ref={menu} className="chart-menu" role="menu" aria-label={ui.country.label} onKeyDown={onKeyDown}>
            {CHARTS.map((c) => (
              <li key={c} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  className="chart-option"
                  aria-checked={c === value}
                  onClick={() => {
                    close();
                    if (c !== value) onChange(c);
                  }}
                >
                  {ui.charts[c]}
                  {c === value && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
