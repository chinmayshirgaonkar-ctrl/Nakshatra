import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Feather, BookOpen } from "lucide-react";
import Link from "next/link";

export default function BlankPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                Unassisted Free Recall
              </span>
              <span className="h-1 w-1 rounded-full bg-gold/50" />
              <span className="font-tiro text-xs text-mist">कोरा कागद</span>
            </div>
            <h1 className="font-fraunces text-3xl font-light text-ivory">Blank Page</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[28px] border border-gold/20 bg-deep/60 p-12 md:p-20 text-center backdrop-blur-sm min-h-[440px]">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/30 bg-veil shadow-astral mb-6">
            <Feather className="h-9 w-9 text-gold animate-twinkle" />
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-gold-soft mb-2">
            The Quill is Stationary
          </span>
          <h2 className="font-fraunces text-2xl md:text-3xl text-ivory mb-3 font-normal max-w-md">
            A Pristine Sheet of Parchment
          </h2>
          <p className="font-manrope text-sm text-mist max-w-md leading-relaxed mb-8">
            The blank sheet represents the ultimate test of retrieval strength. Pick a topic and type everything you remember without assistance. Gemini then compares your recall against your source texts, highlighting remembered stars and blind spots.
          </p>

          <Link href="/library">
            <Button variant="celestial" size="lg" className="gap-2">
              <BookOpen className="w-4 h-4 text-night" />
              <span>Choose Topic to Recall</span>
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
