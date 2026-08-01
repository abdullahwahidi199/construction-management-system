import React from "react";
import { HardHat, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const OPTIONS = [
  { value: "light", label: "Light Theme", icon: Sun },
  { value: "dark", label: "Dark Theme", icon: Moon },
  { value: "construction", label: "Construction Theme", icon: HardHat },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg border"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`p-2 rounded-md transition-all ${
            theme === value ? "shadow-sm" : ""
          }`}
          style={{
            backgroundColor: theme === value ? "var(--hover)" : "transparent",
            color: "var(--text)",
          }}
          title={label}
          aria-label={label}
          aria-pressed={theme === value}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
}
