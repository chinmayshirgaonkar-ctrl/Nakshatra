"use client";

import * as React from "react";
import { MoonPhaseInfo } from "@/lib/astronomy/moon";
import { Sparkles } from "lucide-react";

interface MoonStreakProps {
  phases: MoonPhaseInfo[];
  streakDays: number;
  currentPhase: { en: string; mr: string; fraction: number };
}

/**
 * Draws a celestial moon glyph using SVG based on the phase fraction (0=New, 0.5=Full).
 */
function MoonGlyph({
  fraction,
  hasActivity,
  size = 20,
}: {
  fraction: number;
  hasActivity: boolean;
  size?: number;
}) {
  const r = size / 2;

  // Determine illumination shape
  const isWaxing = fraction <= 0.5;
  // Illumination ratio 0 to 1
  const illumination = 1 - Math.abs(fraction - 0.5) * 2;

  const glowColor = hasActivity
    ? illumination > 0.7
      ? "#E6AF2E"
      : "#38BDF8"
    : "rgba(255,255,255,0.15)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <radialGradient id={`moon-glow-${fraction}-${hasActivity}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity={hasActivity ? 0.9 : 0.2} />
          <stop offset="85%" stopColor={glowColor} stopOpacity={hasActivity ? 0.4 : 0.05} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Dark Lunar Disc Base */}
      <circle
        cx={r}
        cy={r}
        r={r - 1.5}
        fill="rgba(10, 14, 26, 0.8)"
        stroke={hasActivity ? glowColor : "rgba(255, 255, 255, 0.12)"}
        strokeWidth={hasActivity ? "1.5" : "1"}
      />

      {/* Illuminated Moon Phase Portion */}
      {hasActivity && (
        <circle
          cx={r}
          cy={r}
          r={r - 2}
          fill={`url(#moon-glow-${fraction}-${hasActivity})`}
        />
      )}

      {/* Mini Activity Core Pip */}
      {hasActivity && (
        <circle
          cx={r}
          cy={r}
          r={1.2}
          fill="#FFFFFF"
          className="animate-pulse"
        />
      )}
    </svg>
  );
}

export function MoonStreak({ phases, streakDays, currentPhase }: MoonStreakProps) {
  return (
    <div className="rounded-[24px] border border-gold/20 bg-deep/70 p-6 md:p-8 backdrop-blur-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              Lunar Ephemeris
            </span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span className="font-tiro text-xs text-mist">चंद्रकला सातत्य</span>
          </div>
          <h3 className="font-fraunces text-2xl font-light text-ivory">
            30-Day Moon Phase Streak
          </h3>
        </div>

        {/* Current Lunar State Badge */}
        <div className="flex items-center gap-3 rounded-2xl border border-gold/25 bg-veil/50 px-4 py-2 self-start sm:self-auto shadow-sm">
          <MoonGlyph
            fraction={currentPhase.fraction}
            hasActivity={true}
            size={22}
          />
          <div className="text-left font-mono text-xs">
            <span className="text-ivory font-semibold block">
              {streakDays} Day{streakDays === 1 ? "" : "s"} Active
            </span>
            <span className="text-[10px] text-gold-soft">
              {currentPhase.en} • {currentPhase.mr}
            </span>
          </div>
        </div>
      </div>

      {/* 30-Day Moon Sequence Ribbon */}
      <div className="pt-2">
        <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-30 gap-1.5 md:gap-2">
          {phases.map((item, idx) => {
            const isToday = idx === phases.length - 1;
            return (
              <div
                key={item.date}
                className="group relative flex flex-col items-center gap-1.5"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                    item.hasActivity
                      ? "bg-veil/70 border border-gold/40 shadow-[0_0_8px_rgba(230,175,46,0.2)]"
                      : "bg-deep/40 border border-gold/10 hover:border-gold/25"
                  } ${isToday ? "ring-2 ring-gold/60" : ""}`}
                >
                  <MoonGlyph
                    fraction={item.phaseFraction}
                    hasActivity={item.hasActivity}
                    size={20}
                  />
                </div>

                <span className="font-mono text-[9px] text-mist/60 group-hover:text-gold transition-colors">
                  {item.dayOfMonth}
                </span>

                {/* Hover Tooltip */}
                <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50">
                  <div className="rounded-xl border border-gold/30 bg-night/95 px-3 py-2 text-center text-xs shadow-2xl backdrop-blur-xl whitespace-nowrap space-y-0.5">
                    <span className="font-mono text-[10px] text-mist block">
                      {item.date} {isToday ? "(Today)" : ""}
                    </span>
                    <span className="font-fraunces text-ivory font-normal block">
                      {item.phaseName} ({item.marathiPhaseName})
                    </span>
                    <span className="text-[10px] font-mono text-gold-soft block">
                      {item.hasActivity
                        ? `${item.readingMinutes}m reading • ${item.reviewsCount} reviews`
                        : "No contemplation logged"}
                    </span>
                  </div>
                  <div className="w-2 h-2 -mt-1 rotate-45 border-r border-b border-gold/30 bg-night/95" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-mist font-manrope leading-relaxed">
        Rather than fleeting flames, your study streak reflects the enduring lunar tides. Each day of active recall or reading ignites the moon phase in silver moonlight.
      </p>
    </div>
  );
}
