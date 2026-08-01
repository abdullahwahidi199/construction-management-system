import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();
const THEME_KEY = "theme";
const THEMES = ["light", "dark", "construction"];

export const THEME_OPTIONS = [
  { value: "light", label: "Light Theme" },
  { value: "dark", label: "Dark Theme" },
  { value: "construction", label: "Construction Theme" },
];

function normalizeTheme(value) {
  if (value === "system") return "construction";
  return THEMES.includes(value) ? value : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    normalizeTheme(localStorage.getItem(THEME_KEY)),
  );
  const [resolvedTheme, setResolvedTheme] = useState(theme);

  const setTheme = (value) => {
    setThemeState(normalizeTheme(value));
  };

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("dark", "construction");
    if (theme !== "light") {
      root.classList.add(theme);
    }

    setResolvedTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
