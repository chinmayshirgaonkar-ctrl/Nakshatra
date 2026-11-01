import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Sparkles, Compass, Plus, Eye } from "lucide-react";
import Link from "next/link";

export default function SkyPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                The Living Firmament
              </span>
              <span className="h-1 w-1 rounded-full bg-gold/50" />
              <span className="font-tiro text-xs text-mist">नक्षत्र आकाश</span>
            </div>
            <h1 className="font-fraunces text-3xl font-light text-ivory">The Sky</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/20 bg-deep/60 text-xs font-mono text-mist">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-twinkle" />
              <span>0 Stars Ignited</span>
            </div>
            <Link href="/library">
              <Button variant="celestial" className="gap-2">
                <Plus className="w-4 h-4 text-night" />
                <span>Add Material</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Celestial Map Canvas Frame */}
        <div className="relative flex flex-col items-center justify-center rounded-[28px] border border-gold/20 bg-deep/40 p-12 md:p-24 text-center backdrop-blur-md min-h-[500px] overflow-hidden">
          {/* Subtle concentric celestial rings */}
          <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full border border-gold/5" />
          <div className="pointer-events-none absolute h-[350px] w-[350px] rounded-full border border-gold/10" />
          <div className="pointer-events-none absolute h-[200px] w-[200px] rounded-full border border-gold/15" />

          <div className="relative z-10 flex flex-col items-center max-w-lg">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/30 bg-veil shadow-astral mb-6">
              <Sparkles className="h-9 w-9 text-gold animate-twinkle" />
            </div>

            <span className="font-mono text-xs uppercase tracking-widest text-gold-soft mb-2">
              Celestial Sphere
            </span>
            <h2 className="font-fraunces text-2xl md:text-3xl text-ivory mb-3 font-normal">
              Your sky is still dark.
            </h2>
            <p className="font-manrope text-sm text-mist leading-relaxed mb-8">
              Add your first material to light a star. Each concept extracted from your texts will occupy a celestial coordinate. FSRS spaced repetition will govern its brightness — shining brilliant when remembered, dimming gently when due for review.
            </p>

            <Link href="/library">
              <Button variant="celestial" size="lg" className="gap-2">
                <Plus className="w-4 h-4 text-night" />
                <span>Ignite First Star</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
