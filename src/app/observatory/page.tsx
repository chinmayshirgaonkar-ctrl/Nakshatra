import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Compass, Flame, BookOpen, Clock, Moon, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function ObservatoryPage() {
  return (
    <AppShell>
      <div className="space-y-10">
        {/* Welcome Celestial Hero */}
        <div className="relative overflow-hidden rounded-[24px] border border-gold/20 bg-deep/70 p-8 md:p-12 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                  Observation Chamber
                </span>
                <span className="h-1 w-1 rounded-full bg-gold/50" />
                <span className="font-tiro text-xs text-mist">दैनिक वेधशाळा विधी</span>
              </div>
              <h1 className="font-fraunces text-3xl md:text-5xl font-light text-ivory tracking-tight leading-tight">
                Tonight’s Horizon is Clear.
              </h1>
              <p className="font-manrope text-sm md:text-base text-mist leading-relaxed">
                Your concepts are resting in equilibrium. In the quiet hours of midnight, spaced repetition tracks the fading radiance of every star you have ever ignited.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/library">
                <Button variant="celestial" size="lg" className="gap-2">
                  <BookOpen className="w-4 h-4 text-night" />
                  <span>Enter Library</span>
                </Button>
              </Link>
              <Link href="/sky">
                <Button variant="outline" size="lg" className="gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span>Survey Sky</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Vital Observatory Instruments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Dimming Stars */}
          <Card className="hover:border-gold/30 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-xl">Fading Radiance</CardTitle>
                <CardDescription className="text-xs font-tiro text-gold-soft">
                  पुनरावलोकन आवश्यक तारे
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-2xl border border-ember/30 bg-ember/10 flex items-center justify-center text-ember">
                <Flame className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-2 text-3xl font-fraunces text-ivory">0 Stars</div>
              <p className="mt-2 text-xs text-mist leading-relaxed font-manrope">
                No memories have slipped into darkness. All ignited concepts currently hold stable retention.
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Constellation Size */}
          <Card className="hover:border-gold/30 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-xl">The Constellation</CardTitle>
                <CardDescription className="text-xs font-tiro text-gold-soft">
                  एकूण नक्षत्र संकल्पना
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-2xl border border-gold/30 bg-veil flex items-center justify-center text-gold">
                <Sparkles className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-2 text-3xl font-fraunces text-ivory">0 Stars</div>
              <p className="mt-2 text-xs text-mist leading-relaxed font-manrope">
                A dark canvas waits for your first study material. Each concept will form a coordinate in the sky.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Memory Half-Life */}
          <Card className="hover:border-gold/30 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-xl">FSRS Memory Engine</CardTitle>
                <CardDescription className="text-xs font-tiro text-gold-soft">
                  स्मरण सामर्थ्य अल्गोरिदम
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-2xl border border-aurora/30 bg-aurora/10 flex items-center justify-center text-aurora">
                <Moon className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-2 text-3xl font-fraunces text-ivory">100%</div>
              <p className="mt-2 text-xs text-mist leading-relaxed font-manrope">
                The Free Spaced Repetition Scheduler is calibrated and awaiting your first active recall session.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Ritual Section */}
        <div className="rounded-[24px] border border-gold/15 bg-deep/50 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gold/10">
            <div>
              <h2 className="font-fraunces text-2xl text-ivory">Today&apos;s Contemplation Ritual</h2>
              <p className="font-tiro text-xs text-mist mt-1">दैनिक अभ्यास आणि चिंतन</p>
            </div>
            <span className="font-mono text-xs text-gold-soft">0 of 3 Completed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group rounded-2xl border border-gold/15 bg-veil/40 p-5 hover:border-gold/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-mist">Step I</span>
                <Clock className="w-4 h-4 text-gold-soft" />
              </div>
              <h3 className="font-fraunces text-lg text-ivory mb-1 group-hover:text-gold transition-colors">
                Rekindle Dim Stars
              </h3>
              <p className="text-xs text-mist leading-relaxed">
                Review cards due today to restore their luminosity before they vanish from your active memory.
              </p>
            </div>

            <div className="group rounded-2xl border border-gold/15 bg-veil/40 p-5 hover:border-gold/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-mist">Step II</span>
                <BookOpen className="w-4 h-4 text-gold-soft" />
              </div>
              <h3 className="font-fraunces text-lg text-ivory mb-1 group-hover:text-gold transition-colors">
                Ingest New Material
              </h3>
              <p className="text-xs text-mist leading-relaxed">
                Feed an essay, PDF, or research note into the Library to extract virgin concepts into the firmament.
              </p>
            </div>

            <div className="group rounded-2xl border border-gold/15 bg-veil/40 p-5 hover:border-gold/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-mist">Step III</span>
                <Compass className="w-4 h-4 text-gold-soft" />
              </div>
              <h3 className="font-fraunces text-lg text-ivory mb-1 group-hover:text-gold transition-colors">
                Free Recall Journal
              </h3>
              <p className="text-xs text-mist leading-relaxed">
                Visit the Blank Page and type everything remembered from a topic without peaking at reference notes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
