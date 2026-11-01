"use client";

import * as React from "react";
import { MistakeExhibit, TrialQuestion } from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Archive,
  Sparkles,
  Swords,
  Search,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Loader2,
  Quote,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MistakesGalleryProps {
  initialMistakes: MistakeExhibit[];
}

export function MistakesGallery({ initialMistakes }: MistakesGalleryProps) {
  const router = useRouter();
  const [mistakes, setMistakes] = React.useState<MistakeExhibit[]>(initialMistakes);
  const [activeTab, setActiveTab] = React.useState<"unresolved" | "resolved">("unresolved");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isRetrying, setIsRetrying] = React.useState(false);

  const unresolved = mistakes.filter((m) => !m.resolved);
  const resolved = mistakes.filter((m) => m.resolved);

  const displayedList = (activeTab === "unresolved" ? unresolved : resolved).filter(
    (m) =>
      m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.conceptNames.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.memoryHook?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRetrial = async () => {
    if (unresolved.length === 0) {
      toast.info("No unresolved mistakes to re-trial! Your sky is clear.");
      return;
    }

    setIsRetrying(true);
    try {
      const res = await fetch("/api/mistakes/retrial");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to build re-trial.");

      // Store re-trial questions in session storage and navigate to trials
      sessionStorage.setItem("active_trial_questions", JSON.stringify(data.questions));
      sessionStorage.setItem("active_trial_title", "Crucible: Re-Trial of Mistakes");
      router.push("/trials?mode=retrial");
    } catch (err: any) {
      toast.error(err.message || "Failed to start re-trial.");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Museum Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              Repository of Flaws & Growth
            </span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span className="font-tiro text-xs text-mist">चुकांचे संग्रहालय</span>
          </div>
          <h1 className="font-fraunces text-3xl font-light text-ivory">Museum of Mistakes</h1>
        </div>

        {unresolved.length > 0 && (
          <Button
            onClick={handleRetrial}
            disabled={isRetrying}
            variant="celestial"
            className="gap-2 shadow-astral"
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin text-night" />
            ) : (
              <Swords className="w-4 h-4 text-night" />
            )}
            <span>Re-Trial My Mistakes ({unresolved.length})</span>
          </Button>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Gallery Tabs */}
        <div className="flex items-center gap-2 bg-deep/90 border border-gold/20 p-1 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("unresolved")}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all",
              activeTab === "unresolved"
                ? "bg-gold text-night font-bold shadow-astral"
                : "text-mist hover:text-ivory"
            )}
          >
            <span>Unresolved Misconceptions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-night/30">
              {unresolved.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("resolved")}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all",
              activeTab === "resolved"
                ? "bg-gold text-night font-bold shadow-astral"
                : "text-mist hover:text-ivory"
            )}
          >
            <span>Hall of Mastery</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-night/30">
              {resolved.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold" />
          <Input
            placeholder="Search exhibits or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>
      </div>

      {/* Gallery Exhibits Grid */}
      {displayedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-gold/20 bg-deep/50 p-12 md:p-16 text-center backdrop-blur-sm min-h-[360px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-veil shadow-astral mb-4">
            <Archive className="h-8 w-8 text-gold animate-twinkle" />
          </div>
          <h3 className="font-fraunces text-2xl text-ivory mb-2 font-normal">
            {activeTab === "unresolved"
              ? "All Misconceptions Resolved!"
              : "No Archived Triumphs Yet"}
          </h3>
          <p className="font-manrope text-xs sm:text-sm text-mist max-w-sm leading-relaxed mb-6">
            {activeTab === "unresolved"
              ? "Your celestial understanding is harmonious. Test more concepts in the Trials chamber to challenge your grasp."
              : "Answer mistake re-trials correctly twice to archive them here as permanent mastery exhibits."}
          </p>

          <Link href="/trials">
            <Button variant="celestial" size="sm" className="gap-2">
              <Swords className="w-3.5 h-3.5 text-night" />
              <span>Face a Trial</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedList.map((exhibit, index) => {
            const streak = exhibit.correctStreak || 0;
            return (
              <div
                key={exhibit.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-[24px] border p-6 shadow-astral backdrop-blur-md transition-all duration-300 hover:shadow-deep",
                  exhibit.resolved
                    ? "border-gold/30 bg-deep/80 hover:border-gold/50"
                    : "border-ember/30 bg-deep/90 hover:border-ember/50"
                )}
              >
                {/* Exhibit Top Bar */}
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gold/15">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-gold-soft">
                        Exhibit #{index + 1}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-gold/40" />
                      <span className="text-[10px] font-mono text-mist uppercase">
                        {exhibit.questionType}
                      </span>
                    </div>

                    {/* Streak pills */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      {exhibit.resolved ? (
                        <div className="flex items-center gap-1 text-gold font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-gold/20" />
                          <span>Mastered (2/2)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-mist">
                          <span>Re-trial streak:</span>
                          <span
                            className={cn(
                              "inline-block w-2.5 h-2.5 rounded-full border border-gold/40",
                              streak >= 1 ? "bg-gold" : "bg-transparent"
                            )}
                          />
                          <span
                            className={cn(
                              "inline-block w-2.5 h-2.5 rounded-full border border-gold/40",
                              streak >= 2 ? "bg-gold" : "bg-transparent"
                            )}
                          />
                          <span className="text-[10px] text-gold-soft">({streak}/2)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question */}
                  <h3 className="font-fraunces text-base sm:text-lg text-ivory font-normal leading-snug mb-4">
                    {exhibit.question}
                  </h3>

                  {/* User Answer vs Correct Answer */}
                  <div className="space-y-2 mb-4 text-xs font-manrope">
                    <div className="p-3 rounded-xl border border-ember/25 bg-ember/10 text-ivory">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ember block mb-0.5">
                        Erroneous Hypothesis:
                      </span>
                      <span className="line-through opacity-85 text-ember-soft">
                        {exhibit.userAnswer}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-gold/30 bg-gold/10 text-ivory">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-gold block mb-0.5">
                        The True Universal Principle:
                      </span>
                      <span className="text-gold font-medium">
                        {exhibit.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* Why it was wrong */}
                  <div className="text-xs font-manrope text-mist/90 leading-relaxed mb-4">
                    <strong className="text-ivory font-mono text-[10px] uppercase tracking-wider block mb-1">
                      Misconception Deconstructed:
                    </strong>
                    {exhibit.whyWrong}
                  </div>

                  {/* Memory Hook Card */}
                  {exhibit.memoryHook && (
                    <div className="rounded-2xl border border-gold/20 bg-veil/70 p-3.5 mb-4">
                      <div className="flex items-center gap-1.5 text-gold text-[10px] font-mono uppercase tracking-wider mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-gold" />
                        <span>Celestial Memory Hook (स्मरणसूत्र)</span>
                      </div>
                      <p className="font-fraunces text-xs sm:text-sm text-ivory italic">
                        &ldquo;{exhibit.memoryHook}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Exhibit Footer */}
                <div className="pt-3 border-t border-gold/15 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {exhibit.conceptNames?.map((name, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-gold/15 bg-veil/40 text-[10px] font-mono text-mist"
                      >
                        <Star className="w-2.5 h-2.5 text-gold" />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>

                  <span className="text-[10px] font-mono text-mist/60">
                    {new Date(exhibit.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
