/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  function cycle() {
    const next = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
    setTheme(next);
    if (next === "system") {
      localStorage.removeItem("theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }
  }

  const label = theme === "system" ? "◐" : theme === "dark" ? "☽" : "☀";

  return (
    <button
      onClick={cycle}
      title={`Theme: ${theme}`}
      style={{
        background: "none",
        border: "none",
        color: "var(--ink-muted)",
        cursor: "pointer",
        fontSize: "1rem",
        padding: "0.2rem 0.4rem",
        transition: "color 0.2s, transform 0.2s",
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}
