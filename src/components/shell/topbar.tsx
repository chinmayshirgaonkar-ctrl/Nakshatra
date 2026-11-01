"use client";

import * as React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/command-palette";
import { Sparkles, Menu, X } from "lucide-react";
import { NAV_ITEMS } from "./sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // Find current section info
  const currentSection =
    NAV_ITEMS.find(
      (item) =>
        item.href === pathname ||
        (item.href === "/observatory" && pathname === "/")
    ) || {
      title: "Observatory",
      marathi: "वेधशाळा",
    };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gold/15 bg-night/80 px-6 backdrop-blur-xl md:px-10">
        {/* Left: Current Chamber Indicator & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-gold/20 bg-deep text-gold"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-fraunces text-lg md:text-xl font-normal text-ivory">
                {currentSection.title}
              </span>
              <span className="gold-hairline w-4 hidden sm:inline-block" />
              <span className="font-tiro text-xs text-gold-soft hidden sm:inline-block">
                {currentSection.marathi}
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-mist uppercase">
              Stationed at Midnight
            </span>
          </div>
        </div>

        {/* Right: Search, Celestial Coordinates, Theme Toggle */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-gold/15 bg-deep/50 px-3.5 py-1 text-xs text-mist font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-aurora animate-pulse" />
            <span className="text-[11px] text-gold-soft">FSRS Active</span>
          </div>

          <CommandPalette />

          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-night/95 backdrop-blur-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-6 border-b border-gold/15">
            <div className="flex items-center gap-2">
              <span className="font-fraunces text-2xl text-ivory">Nakshatra</span>
              <span className="font-tiro text-sm text-gold">नक्षत्र</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-mist hover:text-gold"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 py-6 space-y-2 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-2xl text-base",
                    isActive
                      ? "bg-veil border border-gold/40 text-gold-soft"
                      : "text-mist hover:bg-veil/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gold" />
                    <span>{item.title}</span>
                  </div>
                  <span className="font-tiro text-sm text-gold-soft">{item.marathi}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
