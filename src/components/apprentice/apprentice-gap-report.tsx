"use client";

import * as React from "react";
import { Concept, Subject, Topic, ApprenticeGapReport, ConceptFSRSChange } from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  HelpCircle,
  RotateCcw,
  Compass,
  BookOpen,
  ArrowRight,
  Star,
} from "lucide-react";
import Link from "next/link";

interface ApprenticeGapReportViewProps {
  concept: Concept;
  subject?: Subject;
  topic?: Topic;
  gapReport: ApprenticeGapReport;
  fsrsChange?: ConceptFSRSChange;
  onReset: () => void;
}

export function ApprenticeGapReportView({
  concept,
  subject,
  topic,
  gapReport,
  fsrsChange,
  onReset,
}: ApprenticeGapReportViewProps) {
  const score = gapReport.feynmanScore;

  const scoreBadgeColor =
    score >= 80
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 60
      ? "text-gold-soft border-gold/30 bg-gold/10"
      : score >= 40
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-deep/80 p-6 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              Feynman Lesson Evaluation
            </span>
          </div>
          <h1 className="font-fraunces text-2xl md:text-3xl font-light text-ivory">
            Gap Report: {concept.name}
          </h1>
          {topic && (
            <p className="text-xs font-manrope text-mist">
              Constellation: {topic.name} {subject ? `• ${subject.name}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-gold/30 hover:border-gold text-ivory gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Teach Another Star</span>
          </Button>
        </div>
      </div>

      {/* Score Hero + Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Score Radial */}
        <div className="md:col-span-4 rounded-2xl border border-gold/25 bg-gradient-to-b from-deep/90 via-deep/60 to-night/95 p-6 flex flex-col justify-between items-center text-center shadow-astral relative overflow-hidden">
          <div className="w-full">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft block mb-2">
              Feynman Mastery Index
            </span>

            <div className="relative inline-flex items-center justify-center my-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="rgba(230, 175, 46, 0.15)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke={score >= 75 ? "#10B981" : score >= 50 ? "#E6AF2E" : "#EF4444"}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={
                    2 * Math.PI * 52 * (1 - Math.min(100, Math.max(0, score)) / 100)
                  }
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-fraunces text-3xl font-light text-ivory">
                  {score}
                </span>
                <span className="font-mono text-[10px] text-mist tracking-widest">
                  / 100
                </span>
              </div>
            </div>

            <div
              className={`inline-block px-3 py-1 rounded-full text-xs font-mono border ${scoreBadgeColor}`}
            >
              {score >= 80
                ? "Exemplary Mentor"
                : score >= 60
                ? "Solid Explanation"
                : score >= 40
                ? "Gaps Detected"
                : "Needs Deep Study"}
            </div>
          </div>

          {/* FSRS Change Badge */}
          {fsrsChange && (
            <div className="w-full pt-4 mt-4 border-t border-gold/15 text-left text-xs font-mono space-y-1">
              <span className="text-[10px] text-mist uppercase tracking-wider block">
                Memory Retrievability
              </span>
              <div className="flex items-center justify-between text-gold-soft">
                <span>Rating Applied:</span>
                <span className="font-bold">
                  {fsrsChange.rating === 4
                    ? "Easy"
                    : fsrsChange.rating === 3
                    ? "Good"
                    : fsrsChange.rating === 2
                    ? "Hard"
                    : "Again"}
                </span>
              </div>
              <div className="flex items-center justify-between text-mist text-[11px]">
                <span>Next Sky Review:</span>
                <span>{new Date(fsrsChange.newDue).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Apprentice Narrative Summary */}
        <div className="md:col-span-8 rounded-2xl border border-gold/25 bg-deep/70 p-6 md:p-8 flex flex-col justify-between shadow-astral backdrop-blur-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gold-soft" />
              <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
                The Apprentice&apos;s Reflections
              </span>
            </div>
            <p className="font-manrope text-sm md:text-base text-ivory/90 leading-relaxed italic bg-night/40 p-4 rounded-xl border border-gold/10">
              &ldquo;{gapReport.summary}&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 mt-4 border-t border-gold/15 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="font-fraunces text-xl text-emerald-300 block">
                {gapReport.explainedWell.length}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/80">
                Grasped
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="font-fraunces text-xl text-amber-300 block">
                {gapReport.unclear.length}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400/80">
                Murky
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="font-fraunces text-xl text-rose-300 block">
                {gapReport.gotWrong.length}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-rose-400/80">
                Flaws
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown 1: Explained Well */}
      {gapReport.explainedWell.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
              What You Taught Clearly & Powerfully
            </span>
            <div className="h-px flex-1 bg-emerald-500/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gapReport.explainedWell.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-xs font-manrope text-ivory/95 leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown 2: Unclear or Murky */}
      {gapReport.unclear.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
              Where Your Explanation Drifted or Lacked Clarity
            </span>
            <div className="h-px flex-1 bg-amber-500/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gapReport.unclear.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs font-manrope text-ivory/95 leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown 3: Inaccuracies or Contradictions */}
      {gapReport.gotWrong.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-rose-400">
              Conceptual Inaccuracies or Source Contradictions
            </span>
            <div className="h-px flex-1 bg-rose-500/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gapReport.gotWrong.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-manrope text-rose-100/90 leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Follow-up Study Questions */}
      {gapReport.nextQuestions && gapReport.nextQuestions.length > 0 && (
        <div className="rounded-2xl border border-gold/25 bg-deep/60 p-6 space-y-4 shadow-astral">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-gold-soft" />
            <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
              Apprentice&apos;s Follow-Up Questions to Ponder Next
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {gapReport.nextQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-gold/15 bg-veil/40 text-xs font-manrope text-ivory/90 leading-relaxed space-y-1.5"
              >
                <span className="font-mono text-[10px] uppercase text-gold-soft block">
                  Inquiry {idx + 1}
                </span>
                <p>&ldquo;{q}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gold/15">
        <Link href="/sky">
          <Button
            type="button"
            variant="ghost"
            className="text-gold-soft hover:text-gold gap-2 text-xs"
          >
            <Compass className="w-4 h-4" />
            <span>View Star Brightness in The Sky</span>
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/library">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-gold/30 hover:border-gold text-ivory gap-2 text-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Library</span>
            </Button>
          </Link>

          <Button
            type="button"
            variant="celestial"
            size="sm"
            onClick={onReset}
            className="gap-2 text-xs text-night font-semibold shadow-astral"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Teach Another Concept</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
