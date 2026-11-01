"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Compass,
  BookOpen,
  Sparkles,
  Swords,
  Feather,
  GraduationCap,
  Archive,
  Search,
  SunMoon,
  PlusCircle,
  Eye,
} from "lucide-react";
import { useTheme } from "next-themes";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigateTo = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-full border border-gold/25 bg-deep/70 px-4 py-2 text-xs font-manrope text-mist hover:border-gold/50 hover:bg-veil/70 hover:text-ivory transition-all duration-300 shadow-innerGlow group"
      >
        <Search className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Search celestial chambers...</span>
        <span className="inline sm:hidden">Search...</span>
        <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-gold/30 bg-veil px-1.5 font-mono text-[10px] text-gold-soft">
          <span>⌘</span>K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-night/80 backdrop-blur-md px-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-[24px] border border-gold/30 bg-deep/95 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in-0 zoom-in-95"
          >
            <Command className="w-full flex flex-col">
              <div className="flex items-center border-b border-gold/15 px-4 py-3">
                <Search className="w-4 h-4 text-gold mr-3 shrink-0" />
                <Command.Input
                  placeholder="Ask the stars or search sections..."
                  className="w-full bg-transparent text-sm text-ivory placeholder:text-mist/60 focus:outline-none font-manrope"
                  autoFocus
                />
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-xs text-mist">
                  No celestial records found.
                </Command.Empty>

                <Command.Group heading="Celestial Chambers (विभाग)" className="text-[10px] uppercase tracking-widest text-gold/70 px-3 py-1 font-mono">
                  <Command.Item
                    onSelect={() => navigateTo("/observatory")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ivory hover:bg-veil/80 cursor-pointer transition-colors"
                  >
                    <Compass className="w-4 h-4 text-gold" />
                    <div className="flex flex-col">
                      <span>Observatory</span>
                      <span className="text-[11px] text-mist font-tiro">वेधशाळा — Today&apos;s Ritual</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo("/library")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ivory hover:bg-veil/80 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-gold" />
                    <div className="flex flex-col">
                      <span>Library</span>
                      <span className="text-[11px] text-mist font-tiro">ग्रंथालय — All Study Material</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo("/reading-room")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ivory hover:bg-veil/80 cursor-pointer transition-colors"
                  >
                    <Eye className="w-4 h-4 text-gold" />
                    <div className="flex flex-col">
                      <span>Reading Room</span>
                      <span className="text-[11px] text-mist font-tiro">वाचनकक्ष — Study One Material</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo("/sky")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ivory hover:bg-veil/80 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-gold" />
                    <div className="flex flex-col">
                      <span>The Sky</span>
                      <span className="text-[11px] text-mist font-tiro">आकाश — Constellation Map</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo("/trials")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ivory hover:bg-veil/80 cursor-pointer transition-colors"
                  >
                    <Swords className="w-4 h-4 text-gold" />
                    <div className="flex flex-col">
                      <span>Trials</span>
                      <span className="text-[11px] text-mist font-tiro">परीक्षा — Quizzes</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo("/blank-page")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ivory hover:bg-veil/80 cursor-pointer transition-colors"
                  >
                    <Feather className="w-4 h-4 text-gold" />
                    <div className="flex flex-col">
                      <span>Blank Page</span>
                      <span className="text-[11px] text-mist font-tiro">कोरा कागद — Free Recall</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo("/apprentice")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ivory hover:bg-veil/80 cursor-pointer transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-gold" />
                    <div className="flex flex-col">
                      <span>The Apprentice</span>
                      <span className="text-[11px] text-mist font-tiro">शिष्य — Teach-Back Feynman Mode</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo("/mistakes")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ivory hover:bg-veil/80 cursor-pointer transition-colors"
                  >
                    <Archive className="w-4 h-4 text-gold" />
                    <div className="flex flex-col">
                      <span>Museum of Mistakes</span>
                      <span className="text-[11px] text-mist font-tiro">चुकांचे संग्रहालय — Mistakes Repository</span>
                    </div>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Celestial Utilities" className="text-[10px] uppercase tracking-widest text-gold/70 px-3 py-2 font-mono">
                  <Command.Item
                    onSelect={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ivory hover:bg-veil/80 cursor-pointer transition-colors"
                  >
                    <SunMoon className="w-4 h-4 text-gold" />
                    <span>Toggle Theme (Midnight / Parchment)</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="border-t border-gold/15 px-4 py-2 flex items-center justify-between text-[11px] text-mist">
                <span>Navigate with <kbd className="font-mono text-gold-soft">↑</kbd> <kbd className="font-mono text-gold-soft">↓</kbd></span>
                <span>Select with <kbd className="font-mono text-gold-soft">↵</kbd></span>
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
