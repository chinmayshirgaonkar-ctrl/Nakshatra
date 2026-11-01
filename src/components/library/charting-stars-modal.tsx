"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Concept, ConceptLink } from "@/lib/types/models";
import { Sparkles, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ChartingStarsModalProps {
  open: boolean;
  materialTitle: string;
  concepts: Concept[];
  links: ConceptLink[];
  isExtracting: boolean;
  onClose: () => void;
  materialId?: string;
}

export function ChartingStarsModal({
  open,
  materialTitle,
  concepts,
  links,
  isExtracting,
  onClose,
  materialId,
}: ChartingStarsModalProps) {
  const [revealedCount, setRevealedCount] = useState(0);

  // Stagger star ignition animation one by one
  useEffect(() => {
    if (!open || concepts.length === 0) {
      setRevealedCount(0);
      return;
    }

    setRevealedCount(1);
    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev < concepts.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [open, concepts]);

  if (!open) return null;

  const isComplete = !isExtracting && revealedCount >= concepts.length && concepts.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night/85 backdrop-blur-xl">
      <div className="relative w-full max-w-2xl rounded-[28px] border border-gold/30 bg-deep/95 p-6 md:p-10 shadow-2xl overflow-hidden flex flex-col items-center text-center">
        {/* Subtle celestial rings in modal background */}
        <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full border border-gold/10 animate-pulse-slow" />
        <div className="pointer-events-none absolute h-[350px] w-[350px] rounded-full border border-gold/5" />

        {/* Status Header */}
        <div className="relative z-10 flex flex-col items-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/40 bg-veil shadow-astral mb-4">
            <Sparkles className="h-8 w-8 text-gold animate-twinkle" />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
              {isExtracting ? "Astrolabe Synthesizing" : "Constellation Ignited"}
            </span>
            <span className="h-1 w-1 rounded-full bg-gold" />
            <span className="font-tiro text-xs text-mist">
              {isExtracting ? "नवे तारे रेखाटत आहे..." : "तारे आकाशात प्रज्वलित झाले"}
            </span>
          </div>

          <h2 className="font-fraunces text-2xl md:text-3xl text-ivory font-normal">
            {isExtracting ? "Charting New Stars…" : "Stars Pinned in Firmament"}
          </h2>
          <p className="font-manrope text-xs md:text-sm text-mist max-w-md mt-1">
            For: <span className="text-gold-soft italic font-fraunces font-medium">&ldquo;{materialTitle}&rdquo;</span>
          </p>
        </div>

        {/* Igniting Stars Display Grid */}
        <div className="relative z-10 w-full max-h-72 overflow-y-auto px-2 py-3 space-y-2.5 rounded-2xl border border-gold/15 bg-veil/30">
          {concepts.slice(0, revealedCount).map((c, i) => (
            <div
              key={c.id || i}
              className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gold/20 bg-deep/80 text-left animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold mt-0.5">
                  <Star className="h-3 w-3 fill-gold" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-fraunces text-sm font-medium text-ivory">
                      {c.name}
                    </span>
                    {c.marathiName && (
                      <span className="font-tiro text-xs text-gold-soft">
                        {c.marathiName}
                      </span>
                    )}
                  </div>
                  <p className="font-manrope text-xs text-mist line-clamp-2 mt-0.5">
                    {c.definition}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 font-mono text-[10px] text-gold-soft border border-gold/20 rounded px-1.5 py-0.5">
                <span>Mag {c.importance}</span>
              </div>
            </div>
          ))}

          {isExtracting && concepts.length === 0 && (
            <div className="py-12 text-center text-xs text-mist font-manrope animate-pulse">
              Consulting the Gemini engine to parse foundational axioms and memory hooks...
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 mt-6 flex flex-col sm:flex-row items-center justify-between w-full gap-4 pt-4 border-t border-gold/15">
          <div className="flex items-center gap-2 text-xs font-mono text-mist">
            <span className="text-gold-soft font-semibold">{revealedCount}</span>
            <span>of {concepts.length} stars mapped</span>
            {links.length > 0 && (
              <span className="text-aurora">({links.length} relational lines drawn)</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isExtracting}
            >
              Close
            </Button>

            {materialId && (
              <Link href={`/reading-room?id=${materialId}`}>
                <Button
                  variant="celestial"
                  size="sm"
                  onClick={onClose}
                  disabled={isExtracting}
                  className="gap-2"
                >
                  <span>Study in Reading Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
