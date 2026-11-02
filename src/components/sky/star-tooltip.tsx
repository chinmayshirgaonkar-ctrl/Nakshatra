"use client";

import * as React from "react";
import { StarNode } from "./sky-types";
import { Sparkles, AlertCircle } from "lucide-react";

interface StarTooltipProps {
  star: StarNode;
  screenPos: { x: number; y: number };
}

export function StarTooltip({ star, screenPos }: StarTooltipProps) {
  const percent = Math.round(star.retrievability * 100);

  // Position tooltip safely offset from mouse cursor
  const tooltipWidth = 280;
  const x = Math.min(window.innerWidth - tooltipWidth - 20, Math.max(20, screenPos.x + 14));
  const y = Math.min(window.innerHeight - 180, Math.max(20, screenPos.y + 14));

  return (
    <div
      style={{ left: `${x}px`, top: `${y}px` }}
      className="pointer-events-none fixed z-50 w-72 rounded-2xl border border-gold/30 bg-deep/95 p-3.5 shadow-astral backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <span
            className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 border"
            style={{
              borderColor: `${star.color}40`,
              backgroundColor: `${star.color}15`,
              color: star.color,
            }}
          >
            {star.subject.name} • {star.topic.name}
          </span>
          <h4 className="font-fraunces text-base font-normal text-ivory leading-snug">
            {star.concept.name}
          </h4>
        </div>
      </div>

      <p className="font-manrope text-xs text-mist/90 line-clamp-2 mb-3 leading-relaxed">
        {star.concept.definition}
      </p>

      {/* Retrievability Memory Bar */}
      <div className="space-y-1 pt-2 border-t border-gold/15">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-mist flex items-center gap-1">
            {star.isFading ? (
              <AlertCircle className="w-3 h-3 text-ember animate-pulse" />
            ) : (
              <Sparkles className="w-3 h-3 text-gold-soft" />
            )}
            <span>Memory Retention</span>
          </span>
          <span
            className={`font-semibold ${
              star.retrievability >= 0.8
                ? "text-aurora"
                : star.retrievability >= 0.5
                ? "text-gold"
                : "text-ember font-bold"
            }`}
          >
            {percent}% {star.isFading ? "(Fading)" : ""}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-veil overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              star.retrievability >= 0.8
                ? "bg-aurora shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                : star.retrievability >= 0.5
                ? "bg-gold shadow-[0_0_8px_rgba(230,175,46,0.5)]"
                : "bg-ember shadow-[0_0_8px_rgba(244,63,94,0.5)]"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
