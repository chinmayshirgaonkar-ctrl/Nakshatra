"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Topic,
  Subject,
  Concept,
  BlankPageEvaluation,
  ConceptFSRSChange,
} from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Eye,
  Clock,
  Compass,
  Star,
  Layers,
} from "lucide-react";
import Link from "next/link";

interface BlankPageResultsProps {
  topic: Topic;
  subject?: Subject;
  concepts: Concept[];
  recallText: string;
  durationSeconds: number;
  evaluation: BlankPageEvaluation;
  fsrsChanges?: ConceptFSRSChange[];
  onReset: () => void;
}

interface TextSpan {
  type: "plain" | "remembered" | "partial" | "misconception";
  text: string;
  data?: any;
}

export function BlankPageResults({
  topic,
  subject,
  concepts,
  recallText,
  durationSeconds,
  evaluation,
  fsrsChanges = [],
  onReset,
}: BlankPageResultsProps) {
  const [selectedItem, setSelectedItem] = useState<{
    type: "remembered" | "partial" | "misconception";
    data: any;
  } | null>(null);

  const durationMin = Math.floor(durationSeconds / 60);
  const durationSec = durationSeconds % 60;
  const wordCount = recallText.trim().split(/\s+/).filter(Boolean).length;

  // Annotated text splitter
  const annotatedSpans = useMemo(() => {
    type Match = {
      start: number;
      end: number;
      type: "remembered" | "partial" | "misconception";
      data: any;
    };

    const matches: Match[] = [];
    const lowerRecall = recallText.toLowerCase();

    // 1. Remembered matches
    evaluation.remembered.forEach((r) => {
      if (!r.userExcerpt) return;
      const needle = r.userExcerpt.trim().toLowerCase();
      if (!needle) return;
      let pos = 0;
      while ((pos = lowerRecall.indexOf(needle, pos)) !== -1) {
        matches.push({
          start: pos,
          end: pos + needle.length,
          type: "remembered",
          data: r,
        });
        pos += needle.length;
      }
    });

    // 2. Partial matches
    evaluation.partiallyRemembered.forEach((p) => {
      if (!p.userExcerpt) return;
      const needle = p.userExcerpt.trim().toLowerCase();
      if (!needle) return;
      let pos = 0;
      while ((pos = lowerRecall.indexOf(needle, pos)) !== -1) {
        matches.push({
          start: pos,
          end: pos + needle.length,
          type: "partial",
          data: p,
        });
        pos += needle.length;
      }
    });

    // 3. Misconceptions matches
    evaluation.misconceptions.forEach((m) => {
      if (!m.userExcerpt) return;
      const needle = m.userExcerpt.trim().toLowerCase();
      if (!needle) return;
      let pos = 0;
      while ((pos = lowerRecall.indexOf(needle, pos)) !== -1) {
        matches.push({
          start: pos,
          end: pos + needle.length,
          type: "misconception",
          data: m,
        });
        pos += needle.length;
      }
    });

    // Sort by start position
    matches.sort((a, b) => a.start - b.start || b.end - a.end);

    // Resolve overlaps by taking non-overlapping greedy matches
    const filteredMatches: Match[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        filteredMatches.push(m);
        lastEnd = m.end;
      }
    }

    // Build spans
    const spans: TextSpan[] = [];
    let currentIdx = 0;
    for (const m of filteredMatches) {
      if (m.start > currentIdx) {
        spans.push({
          type: "plain",
          text: recallText.slice(currentIdx, m.start),
        });
      }
      spans.push({
        type: m.type,
        text: recallText.slice(m.start, m.end),
        data: m.data,
      });
      currentIdx = m.end;
    }

    if (currentIdx < recallText.length) {
      spans.push({
        type: "plain",
        text: recallText.slice(currentIdx),
      });
    }

    return spans;
  }, [recallText, evaluation]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Topic Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-deep/70 p-6 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              Active Recall Assessment
            </span>
          </div>
          <h1 className="font-fraunces text-2xl md:text-3xl font-light text-ivory">
            {topic.name}
          </h1>
          {subject && (
            <p className="text-xs font-manrope text-mist flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
              {subject.name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-veil/40 px-4 py-2 rounded-xl border border-gold/10 text-xs font-mono text-mist">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold-soft" />
              {durationMin}m {durationSec}s
            </span>
            <span>•</span>
            <span>{wordCount} words</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-gold/30 hover:border-gold text-ivory gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>

      {/* Score Hero + Breakdown Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Card */}
        <div className="lg:col-span-4 rounded-2xl border border-gold/25 bg-gradient-to-b from-deep/90 via-deep/60 to-night/95 p-6 flex flex-col justify-between items-center text-center shadow-astral relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

          <div className="w-full">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft block mb-2">
              Recall Fidelity Score
            </span>

            {/* Circular Gauge */}
            <div className="relative inline-flex items-center justify-center my-4">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="rgba(230, 175, 46, 0.15)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke={
                    evaluation.score >= 75
                      ? "#10B981"
                      : evaluation.score >= 50
                      ? "#E6AF2E"
                      : "#EF4444"
                  }
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={
                    2 * Math.PI * 60 * (1 - Math.min(100, Math.max(0, evaluation.score)) / 100)
                  }
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-fraunces text-4xl font-light text-ivory">
                  {evaluation.score}
                </span>
                <span className="font-mono text-[10px] text-mist tracking-widest">
                  / 100
                </span>
              </div>
            </div>

            <p className="text-xs font-manrope text-mist/90 leading-relaxed italic px-2">
              &ldquo;{evaluation.reflection}&rdquo;
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="w-full grid grid-cols-3 gap-2 pt-6 mt-4 border-t border-gold/15 text-center">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="font-fraunces text-lg text-emerald-300 block">
                {evaluation.remembered.length}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/80">
                Retrieved
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="font-fraunces text-lg text-amber-300 block">
                {evaluation.partiallyRemembered.length}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400/80">
                Partial
              </span>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="font-fraunces text-lg text-rose-300 block">
                {evaluation.missed.length}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-rose-400/80">
                Missed
              </span>
            </div>
          </div>
        </div>

        {/* Annotated Parchment Text */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-gold/25 bg-parchment/95 p-6 md:p-8 text-ink shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10 mb-4">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink/60">
                Annotated Recall Manuscript
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="inline-flex items-center gap-1 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" /> Remembered
                </span>
                <span className="inline-flex items-center gap-1 text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" /> Partial
                </span>
                {evaluation.misconceptions.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-rose-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" /> Misconception
                  </span>
                )}
              </div>
            </div>

            {/* Rendered Spans */}
            <div className="font-manrope text-sm md:text-base leading-relaxed text-ink/90 whitespace-pre-wrap selection:bg-gold/30">
              {annotatedSpans.map((span, idx) => {
                if (span.type === "plain") {
                  return <span key={idx}>{span.text}</span>;
                }

                if (span.type === "remembered") {
                  return (
                    <mark
                      key={idx}
                      onClick={() =>
                        setSelectedItem({ type: "remembered", data: span.data })
                      }
                      className="cursor-pointer bg-emerald-500/25 text-emerald-950 font-medium px-1 py-0.5 rounded border-b-2 border-emerald-600 hover:bg-emerald-500/40 transition-colors"
                      title="Click to view concept feedback"
                    >
                      {span.text}
                    </mark>
                  );
                }

                if (span.type === "partial") {
                  return (
                    <mark
                      key={idx}
                      onClick={() =>
                        setSelectedItem({ type: "partial", data: span.data })
                      }
                      className="cursor-pointer bg-amber-500/25 text-amber-950 font-medium px-1 py-0.5 rounded border-b-2 border-amber-600 hover:bg-amber-500/40 transition-colors"
                      title="Click to view what was missing"
                    >
                      {span.text}
                    </mark>
                  );
                }

                if (span.type === "misconception") {
                  return (
                    <mark
                      key={idx}
                      onClick={() =>
                        setSelectedItem({ type: "misconception", data: span.data })
                      }
                      className="cursor-pointer bg-rose-500/25 text-rose-950 font-medium px-1 py-0.5 rounded border-b-2 border-rose-600 underline decoration-rose-600 hover:bg-rose-500/40 transition-colors"
                      title="Click to view misconception correction"
                    >
                      {span.text}
                    </mark>
                  );
                }

                return null;
              })}
            </div>
          </div>

          {/* Interactive Inspection Card when a highlight is clicked */}
          {selectedItem && (
            <div className="rounded-xl border border-gold/30 bg-deep/90 p-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 text-ivory">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gold/15">
                <div className="flex items-center gap-2">
                  {selectedItem.type === "remembered" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {selectedItem.type === "partial" && (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  {selectedItem.type === "misconception" && (
                    <Flame className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="font-fraunces text-sm font-medium">
                    {selectedItem.data.conceptName || "Misconception Analysis"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-xs font-mono text-mist hover:text-ivory"
                >
                  Close ×
                </button>
              </div>

              {selectedItem.type === "remembered" && (
                <div className="space-y-1 text-xs font-manrope">
                  <p className="text-emerald-300 font-medium">
                    {selectedItem.data.feedback}
                  </p>
                  <p className="text-mist text-[11px]">
                    Canonical principle: {selectedItem.data.canonicalPrinciple}
                  </p>
                </div>
              )}

              {selectedItem.type === "partial" && (
                <div className="space-y-1.5 text-xs font-manrope">
                  <p className="text-amber-300 font-medium">
                    {selectedItem.data.feedback}
                  </p>
                  <p className="text-mist bg-night/40 p-2 rounded-lg border border-gold/10">
                    <span className="text-gold-soft font-mono uppercase text-[10px] block">
                      Missing details to solidify:
                    </span>
                    {selectedItem.data.missingDetails}
                  </p>
                </div>
              )}

              {selectedItem.type === "misconception" && (
                <div className="space-y-1.5 text-xs font-manrope">
                  <p className="text-rose-300 font-medium">
                    {selectedItem.data.misconceptionExplanation}
                  </p>
                  <p className="text-mist bg-night/40 p-2 rounded-lg border border-gold/10">
                    <span className="text-gold-soft font-mono uppercase text-[10px] block">
                      Canonical Correction:
                    </span>
                    {selectedItem.data.canonicalCorrection}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section: Missed Stars */}
      {evaluation.missed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-mist">
              Missed Constellation Stars ({evaluation.missed.length})
            </span>
            <div className="h-px flex-1 bg-gold/15" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluation.missed.map((m, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-rose-500/25 bg-deep/60 p-4 space-y-2 hover:border-rose-500/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-fraunces text-sm font-medium text-ivory">
                    {m.conceptName}
                  </span>
                </div>
                <p className="text-xs font-manrope text-mist/90 leading-relaxed">
                  {m.keyPrinciple}
                </p>
                <div className="pt-2 border-t border-rose-500/15 flex items-center justify-between text-[10px] font-mono text-rose-400">
                  <span>FSRS Status: Fading / Due</span>
                  <span>Rating: Again</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Misconceptions (Ember Frame) */}
      {evaluation.misconceptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-rose-400">
              Misconceptions & Inaccuracies ({evaluation.misconceptions.length})
            </span>
            <div className="h-px flex-1 bg-rose-500/25" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluation.misconceptions.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-deep/80 to-night p-5 space-y-3"
              >
                <div>
                  <span className="font-mono text-[10px] uppercase text-rose-400/90 tracking-wider block mb-1">
                    Your Statement
                  </span>
                  <p className="font-serif italic text-xs text-ivory/90 bg-night/50 p-2.5 rounded-lg border border-rose-500/20">
                    &ldquo;{item.userExcerpt}&rdquo;
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase text-amber-400/90 tracking-wider block mb-1">
                    Why It Is Flawed
                  </span>
                  <p className="text-xs font-manrope text-mist leading-relaxed">
                    {item.misconceptionExplanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-rose-500/20">
                  <span className="font-mono text-[10px] uppercase text-emerald-400/90 tracking-wider block mb-1">
                    Canonical Truth
                  </span>
                  <p className="text-xs font-manrope text-emerald-200/90 leading-relaxed">
                    {item.canonicalCorrection}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FSRS Memory Updates Summary */}
      {fsrsChanges.length > 0 && (
        <div className="rounded-2xl border border-gold/20 bg-deep/60 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
              Living Sky Memory Shift (FSRS Update)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {fsrsChanges.map((change) => {
              const ratingLabel =
                change.rating === 4
                  ? "Easy (Brightest)"
                  : change.rating === 3
                  ? "Good (Strengthened)"
                  : change.rating === 2
                  ? "Hard (Partial)"
                  : "Again (Dimmed)";

              const colorClass =
                change.rating >= 3
                  ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                  : change.rating === 2
                  ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
                  : "text-rose-400 border-rose-500/20 bg-rose-500/5";

              return (
                <div
                  key={change.conceptId}
                  className={`p-3 rounded-xl border ${colorClass} text-xs space-y-1`}
                >
                  <span className="font-fraunces font-medium text-ivory block truncate">
                    {change.conceptName}
                  </span>
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span>{ratingLabel}</span>
                    <span className="text-mist">
                      Next: {new Date(change.newDue).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gold/15">
        <Link href="/sky">
          <Button
            type="button"
            variant="ghost"
            className="text-gold-soft hover:text-gold gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>View Updated Stars in The Sky</span>
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/library">
            <Button
              type="button"
              variant="outline"
              className="border-gold/30 hover:border-gold text-ivory gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Library Vault</span>
            </Button>
          </Link>

          <Button
            type="button"
            variant="celestial"
            onClick={onReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4 text-night" />
            <span>Practice Another Topic</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
