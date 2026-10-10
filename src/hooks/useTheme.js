import { useState, useEffect, useCallback } from "react";

const THEME_KEY = "dw-theme";
const ACCENT_KEY = "dw-accent";

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

const getInitialAccent = () => {
  try {
    const saved = localStorage.getItem(ACCENT_KEY);
    if (saved === "violet" || saved === "rose") return saved;
  } catch {}
  return "rose";
};

export const applyTheme = (theme, accent) => {
  try {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
    if (accent) root.dataset.accent = accent;
  } catch {}
};

/**
 * P3 — Dark romantic mode + accent theme.
 * - theme: "light" | "dark", lưu `dw-theme`, default theo prefers-color-scheme.
 * - accent: "rose" | "violet", lưu `dw-accent`, đổi gradient CTA/dot/badge qua CSS var.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [accent, setAccentState] = useState(getInitialAccent);

  useEffect(() => {
    applyTheme(theme, accent);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme, accent]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const setAccent = useCallback((a) => {
    const next = a === "violet" ? "violet" : "rose";
    setAccentState(next);
    try {
      localStorage.setItem(ACCENT_KEY, next);
      document.documentElement.dataset.accent = next;
    } catch {}
  }, []);

  return { theme, accent, toggleTheme, setAccent, isDark: theme === "dark" };
};

export default useTheme;
