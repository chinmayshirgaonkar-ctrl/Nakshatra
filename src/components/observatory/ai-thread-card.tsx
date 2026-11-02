"use client";

import * as React from "react";
import { AiCrossSubjectThread } from "@/lib/types/models";
import { Sparkles, Compass } from "lucide-react";
import Link from "next/link";

interface AiThreadCardProps {
  thread: AiCrossSubjectThread | null;
}

export function AiThreadCard({ thread }: AiThreadCardProps) {
  if (!thread) {
    return (
      <div className="rounded-[24px] border border-gold/15 bg-deep/50 p-6 md:p-8 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
            Cross-Disciplinary Bridge
          </span>
          <span className="h-1 w-1 rounded-full bg-gold/50" />
          <span className="font-tiro text-xs text-mist">अदृश्य दुवा</span>
        </div>
        <h3 className="font-fraunces text-2xl font-light text-ivory">
          A Thread You Didn&apos;t Notice
        </h3>
        <p className="text-xs text-mist font-manrope leading-relaxed max-w-xl">
          Add materials across multiple subjects into your Library. Nakshatra&apos;s celestial synthesizer will automatically uncover unexpected isomorphism and hidden bridges between disciplines.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-gold/30 bg-gradient-to-br from-deep/90 via-veil/40 to-deep/90 p-6 md:p-8 backdrop-blur-xl shadow-astral space-y-5">
      {/* Background celestial constellation glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-aurora/5 blur-3xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold/15 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold animate-twinkle" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              A Thread You Didn&apos;t Notice
            </span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span className="font-tiro text-xs text-mist">कधीही न पाहिलेला दुवा</span>
          </div>
          <h3 className="font-fraunces text-2xl font-light text-ivory tracking-tight">
            {thread.connection}
          </h3>
        </div>

        <span className="text-[10px] font-mono text-gold-soft border border-gold/25 rounded-full px-3 py-1 bg-veil/50 self-start sm:self-auto">
          Synthesized for Today
        </span>
      </div>

      {/* Cross-Subject Celestial Bridge Diagram */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-night/60 p-5">
        {/* Node 1 */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-veil text-gold shadow-sm">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-mist block">
              {thread.fromSubject}
            </span>
            <span className="font-fraunces text-base text-ivory font-normal">
              {thread.fromConcept}
            </span>
          </div>
        </div>

        {/* Ethereal Beam Connector */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full sm:w-auto">
          <div className="flex items-center justify-center w-full relative">
            <div className="h-[1.5px] w-full bg-gradient-to-r from-gold/50 via-aurora to-gold/50" />
            <span className="absolute bg-night px-2.5 py-0.5 rounded-full border border-gold/30 text-[9px] font-mono text-gold-soft uppercase tracking-wider whitespace-nowrap">
              Isomorphic Thread
            </span>
          </div>
        </div>

        {/* Node 2 */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-end text-left sm:text-right">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-mist block">
              {thread.toSubject}
            </span>
            <span className="font-fraunces text-base text-ivory font-normal">
              {thread.toConcept}
            </span>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-aurora/40 bg-veil text-aurora shadow-sm order-first sm:order-last">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2-Line Poetic Insight */}
      <div className="rounded-2xl border border-gold/15 bg-veil/30 p-4">
        <p className="font-manrope text-sm text-ivory/95 italic leading-relaxed whitespace-pre-line">
          &ldquo;{thread.explanation}&rdquo;
        </p>
      </div>
    </div>
  );
}
