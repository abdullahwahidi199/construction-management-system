import React from "react";
import { Sun, Moon, HardHat } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

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
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-md transition-all ${
          theme === "light" ? "shadow-sm" : ""
        }`}
        style={{
          backgroundColor: theme === "light" ? "var(--hover)" : "transparent",
          color: "var(--text)",
        }}
      >
        <Sun size={18} />
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-md transition-all ${
          theme === "dark" ? "shadow-sm" : ""
        }`}
        style={{
          backgroundColor: theme === "dark" ? "var(--hover)" : "transparent",
          color: "var(--text)",
        }}
      >
        <Moon size={18} />
      </button>

      <button
        onClick={() => setTheme("construction")}
        className={`p-2 rounded-md transition-all ${
          theme === "construction" ? "shadow-sm" : ""
        }`}
        style={{
          backgroundColor:
            theme === "construction" ? "var(--hover)" : "transparent",
          color: "var(--text)",
        }}
      >
        <HardHat size={18} />
      </button>
    </div>
  );
}
