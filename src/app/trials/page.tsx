import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Swords, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

export default function TrialsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                Crucible of Intellect
              </span>
              <span className="h-1 w-1 rounded-full bg-gold/50" />
              <span className="font-tiro text-xs text-mist">परीक्षा कक्ष</span>
            </div>
            <h1 className="font-fraunces text-3xl font-light text-ivory">Trials</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[28px] border border-gold/20 bg-deep/60 p-12 md:p-20 text-center backdrop-blur-sm min-h-[440px]">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/30 bg-veil shadow-astral mb-6">
            <Swords className="h-9 w-9 text-gold animate-twinkle" />
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-gold-soft mb-2">
            The Crucible is Silent
          </span>
          <h2 className="font-fraunces text-2xl md:text-3xl text-ivory mb-3 font-normal max-w-md">
            No Active Trials
          </h2>
          <p className="font-manrope text-sm text-mist max-w-md leading-relaxed mb-8">
            Trials are generative evaluations forged by Gemini to test your grasp across multiple modalities: deep MCQs, true/false with reasoning, and short explanations. Light concepts in your sky to unlock examinations.
          </p>

          <Link href="/library">
            <Button variant="celestial" size="lg" className="gap-2">
              <BookOpen className="w-4 h-4 text-night" />
              <span>Study Manuscripts First</span>
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
