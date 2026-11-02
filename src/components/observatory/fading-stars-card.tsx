"use client";

import * as React from "react";
import { Concept } from "@/lib/types/models";
import { calculateConceptRetrievability } from "@/lib/fsrs/retrievability";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface FadingStarsCardProps {
  fadingStars: Concept[];
}

export function FadingStarsCard({ fadingStars }: FadingStarsCardProps) {
  const hasFading = fadingStars.length > 0;

  return (
    <div className="rounded-[24px] border border-gold/20 bg-deep/70 p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              Active Recall Due
            </span>
          </div>
          <span
            className={`text-xs font-mono px-2.5 py-0.5 rounded-full ${
              hasFading
                ? "bg-ember/15 text-ember border border-ember/30 font-semibold"
                : "bg-aurora/15 text-aurora border border-aurora/30"
            }`}
          >
            {fadingStars.length} Due
          </span>
        </div>

        <h3 className="font-fraunces text-2xl font-light text-ivory">
          Tonight&apos;s Fading Stars
        </h3>
        <p className="text-xs text-mist font-manrope mt-1 leading-relaxed">
          Spaced repetition calculations show these concept stars losing retrievability. Rekindle them before memory decays.
        </p>
      </div>

      {hasFading ? (
        <div className="space-y-2.5">
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {fadingStars.slice(0, 5).map((star) => {
              const r = Math.round(calculateConceptRetrievability(star.fsrs) * 100);
              return (
                <div
                  key={star.id}
                  className="flex items-center justify-between rounded-xl border border-gold/15 bg-veil/30 p-2.5 hover:border-gold/30 transition-colors"
                >
                  <div className="truncate mr-2">
                    <span className="font-fraunces text-sm text-ivory block truncate">
                      {star.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-ember font-semibold">
                      {r}%
                    </span>
                    <Flame className="w-3.5 h-3.5 text-ember animate-pulse" />
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/trials?scope=weakest&count=5" className="block pt-2">
            <Button variant="celestial" className="w-full gap-2 shadow-astral">
              <Flame className="w-4 h-4 text-night" />
              <span>Start 5-Minute Review</span>
              <ArrowRight className="w-4 h-4 text-night ml-auto" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-aurora/20 bg-aurora/5 p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-aurora/30 bg-veil">
            <CheckCircle2 className="w-6 h-6 text-aurora" />
          </div>
          <h4 className="font-fraunces text-lg text-ivory font-normal">
            Firmament in Equilibrium
          </h4>
          <p className="text-xs text-mist font-manrope leading-relaxed">
            All ignited concept stars currently maintain strong retention. No memories are slipping into darkness tonight.
          </p>
          <Link href="/trials">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Launch Exploratory Trial</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
