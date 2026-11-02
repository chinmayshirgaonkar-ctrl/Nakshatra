"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full border border-gold/20 bg-deep/50 animate-pulse" />
    );
  }

  const isDark = theme === "dark" || (!theme && true);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-9 h-9 rounded-full border border-gold/25 bg-deep/80 hover:bg-veil text-gold hover:text-gold-soft transition-all duration-300 shadow-sm hover:shadow-astral focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      title={isDark ? "Switch to Parchment" : "Switch to Midnight"}
      aria-label="Toggle celestial theme"
    >
      {isDark ? (
        <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 hover:-rotate-12 text-gold" />
      ) : (
        <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45 text-gold" />
      )}
    </button>
  );
}
