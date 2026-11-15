import { useEffect, useState, type DependencyList } from 'react';
import { loadTitles } from '../lib/data';
import type { Chart, SongRef } from '../lib/game';

/** Runs an async loader and tracks its result. */
export function useLoaded<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<{ value?: T; error?: unknown }>({});
  useEffect(() => {
    let live = true;
    setState({});
    load().then(
      (value) => live && setState({ value }),
      (error) => live && setState({ error })
    );
    return () => {
      live = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

/** Guess suggestions for these charts. Big files, so they wait until the game is ready and the page is idle to not hold up the game's own downloads. */
export function useTitles(charts: Chart[], ready = true): SongRef[] {
  const [titles, setTitles] = useState<SongRef[]>([]);
  useEffect(() => {
    setTitles([]);
    if (!ready) return;
    let live = true;
    const attempt = (n: number) =>
      loadTitles(charts).then(
        (t) => live && setTitles(t),
        () => live && n < 3 && setTimeout(() => attempt(n + 1), 2000)
      );
    const start = () => live && attempt(0);
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2000 });
    else setTimeout(start, 200);
    return () => {
      live = false;
    };
  }, [charts.join(), ready]); // eslint-disable-line react-hooks/exhaustive-deps
  return titles;
}
