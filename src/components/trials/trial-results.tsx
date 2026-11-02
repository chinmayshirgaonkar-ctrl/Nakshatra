"use client";

import * as React from "react";
import { TrialSessionResult } from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Clock,
  Sparkles,
  Star,
  RotateCw,
  Archive,
  BookOpen,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TrialResultsProps {
  result: TrialSessionResult;
  trialTitle: string;
  onRetry: () => void;
}

export function TrialResults({ result, trialTitle, onRetry }: TrialResultsProps) {
  const minutes = Math.floor(result.durationSeconds / 60);
  const seconds = result.durationSeconds % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const masteryTier =
    result.percentage >= 90
      ? "Master Cartographer"
      : result.percentage >= 70
      ? "Celestial Navigator"
      : result.percentage >= 50
      ? "Adept Apprentice"
      : "Initiate of the Sky";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Grand Score Card */}
      <div className="rounded-[28px] border border-gold/30 bg-deep/90 p-8 sm:p-10 shadow-astral text-center relative overflow-hidden">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-gold/40 bg-veil text-gold shadow-astral mb-4">
          <Trophy className="w-8 h-8 animate-twinkle" />
        </div>

        <span className="font-mono text-xs uppercase tracking-widest text-gold-soft block mb-1">
          {trialTitle}
        </span>
        <h2 className="font-fraunces text-3xl sm:text-4xl text-ivory font-normal mb-2">
          {masteryTier}
        </h2>

        {/* Big Score Numbers */}
        <div className="flex items-center justify-center gap-6 py-6 border-y border-gold/15 my-6">
          <div>
            <span className="font-fraunces text-4xl sm:text-5xl text-gold font-normal block">
              {result.percentage}%
            </span>
            <span className="text-[11px] font-mono text-mist">
              {result.score} of {result.totalQuestions} Correct
            </span>
          </div>

          <div className="h-10 w-px bg-gold/20" />

          <div>
            <span className="font-fraunces text-3xl sm:text-4xl text-ivory font-normal block flex items-center justify-center gap-1.5">
              <Clock className="w-6 h-6 text-mist" />
              <span>{timeFormatted}</span>
            </span>
            <span className="text-[11px] font-mono text-mist">Trial Duration</span>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onRetry} variant="celestial" className="gap-2 shadow-astral">
            <RotateCw className="w-4 h-4 text-night" />
            <span>Forge Another Trial</span>
          </Button>

          {result.newMistakesCount > 0 && (
            <Link href="/mistakes">
              <Button variant="outline" className="gap-2 border-ember/30 text-ember hover:border-ember">
                <Archive className="w-4 h-4" />
                <span>Museum Exhibits ({result.newMistakesCount})</span>
              </Button>
            </Link>
          )}

          <Link href="/library">
            <Button variant="ghost" className="gap-2 text-mist hover:text-ivory">
              <BookOpen className="w-4 h-4" />
              <span>Library Shelves</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Breakdown: Concepts Strengthened & Weakened */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Strengthened Stars */}
        <div className="rounded-3xl border border-gold/20 bg-deep/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              <h3 className="font-fraunces text-lg text-ivory font-normal">
                Stars Brightened
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full border border-gold/30 bg-gold/10 text-xs font-mono text-gold">
              +{result.strengthened.length}
            </span>
          </div>

          {result.strengthened.length === 0 ? (
            <p className="text-xs font-manrope text-mist/60 italic py-4 text-center">
              No concepts met high conviction criteria.
            </p>
          ) : (
            <div className="space-y-2.5">
              {result.strengthened.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl border border-gold/15 bg-veil/40 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 text-ivory">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold shrink-0" />
                    <span className="font-manrope text-sm font-medium">{item.conceptName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gold block font-bold">
                      +{ (item.newStability - item.oldStability).toFixed(1) }d stability
                    </span>
                    <span className="text-[10px] text-mist">
                      due in {Math.round(item.newStability)}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weakened Stars */}
        <div className="rounded-3xl border border-ember/25 bg-deep/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-ember" />
              <h3 className="font-fraunces text-lg text-ivory font-normal">
                Stars Dimmed (Lapsed)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full border border-ember/30 bg-ember/10 text-xs font-mono text-ember">
              {result.weakened.length}
            </span>
          </div>

          {result.weakened.length === 0 ? (
            <p className="text-xs font-manrope text-mist/60 italic py-4 text-center">
              ✨ Flawless trial! Zero stars lapsed.
            </p>
          ) : (
            <div className="space-y-2.5">
              {result.weakened.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl border border-ember/20 bg-ember/5 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 text-ivory">
                    <Star className="w-3.5 h-3.5 text-ember shrink-0" />
                    <span className="font-manrope text-sm font-medium">{item.conceptName}</span>
                  </div>
                  <span className="text-ember font-medium">Needs Review</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
