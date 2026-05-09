"use client";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

interface Props {
  size?: number;
  variant?: "icon" | "pill";
  label?: boolean;
}

export default function ThemeToggle({ size = 18, variant = "icon", label = false }: Props) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        onClick={toggle}
        aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
        title={isDark ? "Mode terang" : "Mode gelap"}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "7px 14px", borderRadius: 99,
          border: "1px solid var(--bo)", background: "var(--cw)",
          color: "var(--ts)", fontSize: 11, fontWeight: 700,
          letterSpacing: ".08em", textTransform: "uppercase",
          cursor: "pointer", transition: "all .25s",
        }}
      >
        {isDark ? <Sun size={size} strokeWidth={1.7} /> : <Moon size={size} strokeWidth={1.7} />}
        {label && <span>{isDark ? "Terang" : "Gelap"}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      className="theme-toggle-btn"
      style={{
        width: 38, height: 38, borderRadius: 99,
        border: "1px solid var(--bo)",
        background: "var(--cw)",
        color: "var(--ts)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all .3s cubic-bezier(.22,1,.36,1)",
        position: "relative", overflow: "hidden",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          transition: "transform .45s cubic-bezier(.22,1,.36,1), opacity .35s",
          transform: isDark ? "rotate(360deg) scale(1)" : "rotate(0deg) scale(1)",
        }}
      >
        {isDark ? <Sun size={size} strokeWidth={1.7} /> : <Moon size={size} strokeWidth={1.7} />}
      </span>
    </button>
  );
}
