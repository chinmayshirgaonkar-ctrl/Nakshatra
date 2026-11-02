"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  BookOpen,
  Eye,
  Sparkles,
  Swords,
  Feather,
  GraduationCap,
  Archive,
  LogOut,
  Star,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Observatory",
    href: "/observatory",
    icon: Compass,
  },
  {
    title: "Library",
    href: "/library",
    icon: BookOpen,
  },
  {
    title: "Ask the Archive",
    href: "/archive",
    icon: Search,
  },
  {
    title: "Reading Room",
    href: "/reading-room",
    icon: Eye,
  },
  {
    title: "The Sky",
    href: "/sky",
    icon: Sparkles,
  },
  {
    title: "Trials",
    href: "/trials",
    icon: Swords,
  },
  {
    title: "Blank Page",
    href: "/blank-page",
    icon: Feather,
  },
  {
    title: "The Apprentice",
    href: "/apprentice",
    icon: GraduationCap,
  },
  {
    title: "Museum of Mistakes",
    href: "/mistakes",
    icon: Archive,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-gold/15 bg-deep/95 backdrop-blur-xl md:flex">
      {/* Brand Header */}
      <div className="flex h-24 flex-col justify-center px-7 border-b border-gold/10 relative">
        <Link href="/observatory" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/40 bg-veil shadow-astral group-hover:border-gold group-hover:shadow-astral-glow transition-all duration-300">
            <Star className="h-5 w-5 text-gold animate-twinkle" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-fraunces text-2xl font-light tracking-wide text-ivory group-hover:text-gold transition-colors">
                Nakshatra
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-mist uppercase">
              Celestial Learning OS
            </span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-mono tracking-widest text-gold/60">
          Astrolabe Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/observatory" && pathname === "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm transition-all duration-300",
                isActive
                  ? "bg-veil border border-gold/30 text-gold-soft shadow-innerGlow font-medium"
                  : "text-mist hover:bg-veil/50 hover:text-ivory hover:border-gold/15 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3.5">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-gold" : "text-mist group-hover:text-gold"
                  )}
                />
                <span className="font-manrope text-sm tracking-wide">
                  {item.title}
                </span>
              </div>

              {isActive && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gold shadow-astral" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Observatory Log Status */}
      <div className="border-t border-gold/10 p-4">
        <div className="rounded-2xl border border-gold/15 bg-veil/50 p-3.5 mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
              Sky Vitality
            </span>
            <span className="text-aurora font-mono text-[10px]">Active</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-fraunces text-lg text-ivory">Living Cosmos</span>
            <span className="text-[11px] font-mono text-gold-soft">FSRS 5.0</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-mist hover:bg-veil hover:text-ember transition-colors"
        >
          <div className="flex items-center gap-2">
            <LogOut className="h-3.5 w-3.5" />
            <span>Leave Observatory</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
