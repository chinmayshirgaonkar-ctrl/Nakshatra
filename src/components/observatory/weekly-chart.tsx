"use client";

import * as React from "react";
import { ObservatoryWeeklyDay } from "@/lib/types/models";
import { Clock } from "lucide-react";

interface WeeklyChartProps {
  days: ObservatoryWeeklyDay[];
}

export function WeeklyChart({ days }: WeeklyChartProps) {
  const totalWeeklyMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
  const maxMinutes = Math.max(30, ...days.map((d) => d.totalMinutes));

  return (
    <div className="rounded-[24px] border border-gold/20 bg-deep/70 p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              Weekly Rhythm
            </span>
          </div>
          <h3 className="font-fraunces text-2xl font-light text-ivory mt-1">
            Minutes Studied
          </h3>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-2xl font-fraunces text-gold">
            <Clock className="w-5 h-5 text-gold-soft" />
            <span>{totalWeeklyMinutes}m</span>
          </div>
          <span className="text-[10px] font-mono text-mist">past 7 days</span>
        </div>
      </div>

      {/* Mini Bar Chart */}
      <div className="pt-2">
        <div className="flex items-end justify-between gap-2 h-36 border-b border-gold/15 pb-2">
          {days.map((d) => {
            const heightPercent = Math.max(6, (d.totalMinutes / maxMinutes) * 100);
            return (
              <div
                key={d.date}
                className="group relative flex-1 flex flex-col items-center justify-end h-full"
              >
                {/* Bar */}
                <div
                  className="w-full max-w-[28px] rounded-t-lg transition-all duration-300 relative overflow-hidden bg-veil/50 group-hover:scale-105"
                  style={{ height: `${heightPercent}%` }}
                >
                  <div
                    className={`w-full h-full rounded-t-lg transition-colors ${
                      d.totalMinutes > 0
                        ? "bg-gradient-to-t from-gold/60 to-gold shadow-[0_0_8px_rgba(230,175,46,0.3)]"
                        : "bg-veil/30"
                    }`}
                  />
                </div>

                {/* Day Label */}
                <span className="text-[11px] font-mono text-mist mt-2 group-hover:text-gold transition-colors">
                  {d.day}
                </span>

                {/* Hover Tooltip */}
                <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50">
                  <div className="rounded-xl border border-gold/30 bg-night/95 px-3 py-1.5 text-center text-xs shadow-2xl backdrop-blur-xl whitespace-nowrap">
                    <span className="font-mono text-ivory font-semibold block">
                      {d.totalMinutes} minutes
                    </span>
                    <span className="text-[10px] font-mono text-mist block">
                      {d.readingMinutes}m read • {d.reviewCount} reviews
                    </span>
                  </div>
                  <div className="w-2 h-2 -mt-1 rotate-45 border-r border-b border-gold/30 bg-night/95" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-mist pt-1">
        <span>Daily Consistency</span>
        <span className="text-gold-soft">
          {days.filter((d) => d.totalMinutes > 0).length} of 7 days active
        </span>
      </div>
    </div>
  );
}
