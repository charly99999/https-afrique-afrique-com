import { useEffect, useState } from "react";

const KEY = "afb-lite-mode";
const EVT = "afb-lite-mode-change";

function read(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function useLiteMode(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(read());
    const onChange = () => setEnabled(read());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = (next: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, next ? "1" : "0");
    setEnabled(next);
    window.dispatchEvent(new Event(EVT));
  };

  return [enabled, update];
}
