import { useEffect, useRef, useState } from "react";

// Persistance brouillon localStorage avec debounce.
// Photos exclues (File non sérialisable) — l'utilisateur les rechargera.
export function useDraft<T extends Record<string, unknown>>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw) as Partial<T>;
      return { ...initial, ...parsed };
    } catch { return initial; }
  });

  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* quota */ }
    }, 400);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [key, state]);

  function clear() {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  }

  return [state, setState, clear] as const;
}
