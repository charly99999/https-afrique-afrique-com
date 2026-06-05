import { useCallback, useEffect, useState } from "react";

const KEY = "ab_search_history";
const MAX = 8;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  const push = useCallback((term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setHistory((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const remove = useCallback((term: string) => {
    setHistory((prev) => {
      const next = prev.filter((x) => x !== term);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
  }, []);

  return { history, push, remove, clear };
}
