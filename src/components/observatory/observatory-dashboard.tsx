"use client";

import * as React from "react";
import { ObservatoryOverviewData } from "@/lib/types/models";
import { MoonStreak } from "./moon-streak";
import { WeeklyChart } from "./weekly-chart";
import { FadingStarsCard } from "./fading-stars-card";
import { AiThreadCard } from "./ai-thread-card";
import { ExamCountdownCard } from "./exam-countdown-card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BookOpen,
  Compass,
  ArrowRight,
  Flame,
  Moon,
  Clock,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface ObservatoryDashboardProps {
  overview: ObservatoryOverviewData;
}

export function ObservatoryDashboard({ overview }: ObservatoryDashboardProps) {
  return (
    <div className="space-y-8 pb-12">
      {/* 1. Celestial Welcome Hero */}
      <div className="relative overflow-hidden rounded-[28px] border border-gold/25 bg-gradient-to-br from-deep/90 via-veil/30 to-deep/90 p-8 md:p-12 backdrop-blur-2xl shadow-astral">
        {/* Celestial orbital ring decor */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border border-gold/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full border border-gold/15" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            {/* Date Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                {overview.dateEn}
              </span>
            </div>

            {/* Time-of-Day Greeting */}
            <h1 className="font-fraunces text-3xl md:text-5xl font-light text-ivory tracking-tight leading-tight">
              {overview.greetingEn}.
            </h1>

            <p className="font-manrope text-xs md:text-sm text-mist leading-relaxed pt-1">
              Welcome to your celestial learning sanctuary. Nakshatra maps your concepts into living constellations and calculates memory decay with the Free Spaced Repetition algorithm.
            </p>
          </div>

          {/* Hero Navigation Actions */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/sky">
              <Button variant="celestial" size="lg" className="w-full sm:w-auto gap-2 shadow-astral">
                <Sparkles className="w-4 h-4 text-night animate-twinkle" />
                <span>Survey The Sky</span>
              </Button>
            </Link>
            <Link href="/library">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                <BookOpen className="w-4 h-4 text-gold-soft" />
                <span>Open Library</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Observatory Telemetry Instruments (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Total Stars */}
        <div className="rounded-[24px] border border-gold/20 bg-deep/70 p-6 backdrop-blur-xl flex items-center justify-between hover:border-gold/35 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-mist">
                Firmament Scale
              </span>
            </div>
            <div className="font-fraunces text-3xl text-ivory">
              {overview.totalStars} <span className="text-lg font-light text-mist">Stars</span>
            </div>
            <p className="text-[11px] text-mist font-manrope">
              Active concept stars ignited across all subjects
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-veil text-gold shadow-sm shrink-0">
            <Sparkles className="w-6 h-6 animate-twinkle" />
          </div>
        </div>

        {/* Metric 2: Average Sky Brightness */}
        <div className="rounded-[24px] border border-gold/20 bg-deep/70 p-6 backdrop-blur-xl flex items-center justify-between hover:border-gold/35 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-mist">
                Radiance
              </span>
            </div>
            <div className="font-fraunces text-3xl text-aurora">
              {overview.averageSkyBrightness}%
            </div>
            <p className="text-[11px] text-mist font-manrope">
              Average FSRS memory retrievability index
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-aurora/30 bg-veil text-aurora shadow-sm shrink-0">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Lunar Ephemeris Streak */}
        <div className="rounded-[24px] border border-gold/20 bg-deep/70 p-6 backdrop-blur-xl flex items-center justify-between hover:border-gold/35 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-mist">
                Lunar Streak
              </span>
            </div>
            <div className="font-fraunces text-3xl text-ivory">
              {overview.streakDays} <span className="text-lg font-light text-mist">Days</span>
            </div>
            <p className="text-[11px] text-mist font-manrope">
              {overview.currentMoonPhase.en}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-veil text-gold shadow-sm shrink-0">
            <Moon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Primary Ritual Grid (Fading Stars & Weekly Minutes Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadingStarsCard fadingStars={overview.fadingStars} />
        <WeeklyChart days={overview.weeklyMinutes} />
      </div>

      {/* 4. 30-Day Moon Phases Streak Ribbon */}
      <MoonStreak
        phases={overview.moonPhases}
        streakDays={overview.streakDays}
        currentPhase={overview.currentMoonPhase}
      />

      {/* 5. "A Thread You Didn't Notice" Cross-Disciplinary Insight */}
      <AiThreadCard thread={overview.aiThread} />

      {/* 6. Exam Countdowns */}
      <ExamCountdownCard exams={overview.examCountdowns} />
    </div>
  );
}
