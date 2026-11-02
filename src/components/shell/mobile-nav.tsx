"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, BookOpen, Sparkles, Swords, Feather } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_ITEMS = [
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
    title: "Recall",
    href: "/blank-page",
    icon: Feather,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden items-center justify-around border-t border-gold/15 bg-deep/95 backdrop-blur-xl px-2 py-2 safe-bottom shadow-astral">
      {MOBILE_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href === "/observatory" && pathname === "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative min-w-[56px]",
              isActive
                ? "text-gold font-medium scale-105"
                : "text-mist hover:text-ivory opacity-80"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 mb-0.5",
                isActive ? "text-gold animate-twinkle" : "text-mist"
              )}
            />
            <span className="text-[10px] font-manrope tracking-tight leading-none">
              {item.title}
            </span>

            {isActive && (
              <span className="absolute -bottom-1 h-1 w-6 rounded-full bg-gold shadow-astral" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
