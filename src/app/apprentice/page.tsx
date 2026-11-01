import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ApprenticePage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                Feynman Teach-Back Chamber
              </span>
              <span className="h-1 w-1 rounded-full bg-gold/50" />
              <span className="font-tiro text-xs text-mist">शिष्य संवाद कक्ष</span>
            </div>
            <h1 className="font-fraunces text-3xl font-light text-ivory">The Apprentice</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[28px] border border-gold/20 bg-deep/60 p-12 md:p-20 text-center backdrop-blur-sm min-h-[440px]">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/30 bg-veil shadow-astral mb-6">
            <GraduationCap className="h-9 w-9 text-gold animate-twinkle" />
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-gold-soft mb-2">
            The Student Listens
          </span>
          <h2 className="font-fraunces text-2xl md:text-3xl text-ivory mb-3 font-normal max-w-md">
            Your Apprentice Awaits Instruction
          </h2>
          <p className="font-manrope text-sm text-mist max-w-md leading-relaxed mb-8">
            To truly understand an idea, explain it simply to an inquisitive apprentice. Here, Gemini roleplays as an eager, sharp student who asks probing questions, tests edge cases, and discovers subtle gaps in your understanding.
          </p>

          <Link href="/library">
            <Button variant="celestial" size="lg" className="gap-2">
              <BookOpen className="w-4 h-4 text-night" />
              <span>Select Concept to Teach</span>
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
