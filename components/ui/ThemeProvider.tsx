"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
interface ThemeCtx { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void; }

const Ctx = createContext<ThemeCtx>({ theme: "light", toggle: () => {}, setTheme: () => {} });

export function useTheme() { return useContext(Ctx); }

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Hydrate from localStorage / prefers-color-scheme on mount
  useEffect(() => {
    try {
      const saved = (typeof window !== "undefined" && localStorage.getItem("ciburial-theme")) as Theme | null;
      const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: Theme = saved ?? (prefersDark ? "dark" : "light");
      setThemeState(initial);
      document.documentElement.dataset.theme = initial;
    } catch {
      // ignore
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("ciburial-theme", t);
      document.documentElement.dataset.theme = t;
    } catch {}
  }, []);

  const toggle = useCallback(() => setTheme(theme === "light" ? "dark" : "light"), [theme, setTheme]);

  return <Ctx.Provider value={{ theme, toggle, setTheme }}>{children}</Ctx.Provider>;
}

/**
 * Inline script that runs BEFORE React hydrates, to set data-theme on <html>
 * based on localStorage / prefers-color-scheme. Prevents flash of wrong theme.
 */
export const themeInitScript = `
(function(){try{var t=localStorage.getItem('ciburial-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();
`;
