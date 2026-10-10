import { useState, useEffect, useCallback } from "react";

const THEME_KEY = "dw-theme";

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

export const applyTheme = (theme) => {
  try {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
    // Dọn tàn dư accent cũ (1 lần): xóa data-accent + key dw-accent.
    if (root.dataset?.accent) delete root.dataset.accent;
    try {
      localStorage.removeItem("dw-accent");
    } catch {}
  } catch {}
};

/**
 * Dark romantic mode (chỉ sáng/tối).
 * - theme: "light" | "dark", lưu `dw-theme`, default theo prefers-color-scheme.
 * - Giữ `accent: "rose"` + `setAccent` noop để tương thích ngược
 *   với code cũ còn gọi (không crash), nhưng không còn toggle accent.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const setAccent = useCallback(() => {}, []);

  return { theme, accent: "rose", toggleTheme, setAccent, isDark: theme === "dark" };
};

export default useTheme;
