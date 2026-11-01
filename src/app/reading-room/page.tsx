import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Eye, BookOpen, Compass, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ReadingRoomPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                Deep Study Lectern
              </span>
              <span className="h-1 w-1 rounded-full bg-gold/50" />
              <span className="font-tiro text-xs text-mist">वाचनकक्ष</span>
            </div>
            <h1 className="font-fraunces text-3xl font-light text-ivory">The Reading Room</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[28px] border border-gold/20 bg-deep/60 p-12 md:p-20 text-center backdrop-blur-sm min-h-[440px]">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/30 bg-veil shadow-astral mb-6">
            <Eye className="h-9 w-9 text-gold animate-twinkle" />
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-gold-soft mb-2">
            Sanctuary of Focus
          </span>
          <h2 className="font-fraunces text-2xl md:text-3xl text-ivory mb-3 font-normal max-w-md">
            The Lectern is Bare
          </h2>
          <p className="font-manrope text-sm text-mist max-w-md leading-relaxed mb-8">
            Select a manuscript from your Library to open the Reading Room. Here you can generate 1-minute abstracts, deep summaries, mindmaps, and extract new concept stars in English or Marathi.
          </p>

          <Link href="/library">
            <Button variant="celestial" size="lg" className="gap-2">
              <BookOpen className="w-4 h-4 text-night" />
              <span>Select from Library</span>
              <ArrowRight className="w-4 h-4 text-night" />
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
