"use client";

import * as React from "react";
import {
  Subject,
  Topic,
  Material,
  QuestionType,
  TrialDifficulty,
  TrialQuestion,
} from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import {
  Swords,
  Sparkles,
  Flame,
  Scale,
  Feather,
  Layers,
  Star,
  BookOpen,
  Compass,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TrialSetupProps {
  subjects: Subject[];
  topics: Topic[];
  materials: Material[];
  onStartTrial: (questions: TrialQuestion[], title: string) => void;
  initialScope?: "all" | "weakest" | "topic" | "material";
  initialTargetId?: string;
}

export function TrialSetup({
  subjects,
  topics,
  materials,
  onStartTrial,
  initialScope = "all",
  initialTargetId,
}: TrialSetupProps) {
  const [scope, setScope] = React.useState<"all" | "weakest" | "topic" | "material">(
    initialScope
  );
  const [targetId, setTargetId] = React.useState<string>(initialTargetId || "");
  const [count, setCount] = React.useState<number>(5);
  const [difficulty, setDifficulty] = React.useState<TrialDifficulty>("honest");
  const [language, setLanguage] = React.useState<"en" | "mr">("en");
  const [selectedTypes, setSelectedTypes] = React.useState<QuestionType[]>([
    "mcq",
    "true_false_why",
    "fill_blank",
    "short_answer",
  ]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Set default targetId when scope changes
  React.useEffect(() => {
    if (scope === "topic" && topics.length > 0 && !targetId) {
      setTargetId(topics[0].id);
    } else if (scope === "material" && materials.length > 0 && !targetId) {
      setTargetId(materials[0].id);
    }
  }, [scope, topics, materials, targetId]);

  const toggleType = (t: QuestionType) => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length === 1) {
        toast.error("At least one question type must be active.");
        return;
      }
      setSelectedTypes(selectedTypes.filter((type) => type !== t));
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const handleLaunch = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/trials/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          targetId: scope === "all" || scope === "weakest" ? undefined : targetId,
          count,
          difficulty,
          types: selectedTypes,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate trial questions.");

      let title = "Crucible Examination";
      if (scope === "weakest") title = "Trial of Weakest Stars";
      else if (scope === "topic") {
        const topicName = topics.find((t) => t.id === targetId)?.name;
        if (topicName) title = `Trial: ${topicName}`;
      } else if (scope === "material") {
        const matName = materials.find((m) => m.id === targetId)?.title;
        if (matName) title = `Trial: ${matName}`;
      }

      onStartTrial(data.questions, title);
    } catch (err: any) {
      toast.error(err.message || "Could not launch trial.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto rounded-[28px] border border-gold/25 bg-deep/85 p-6 sm:p-10 shadow-astral backdrop-blur-md space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b border-gold/15">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-veil text-gold shadow-astral mb-2">
          <Swords className="w-6 h-6 animate-twinkle" />
        </div>
        <h2 className="font-fraunces text-2xl sm:text-3xl text-ivory font-normal">
          Forge a Knowledge Trial
        </h2>
        <p className="font-manrope text-xs sm:text-sm text-mist max-w-md mx-auto leading-relaxed">
          Configure the generative crucible. Every question challenges understanding, reveals misconceptions, and tunes your FSRS memory constellation.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Scope Selector */}
        <div>
          <label className="text-xs font-mono uppercase text-mist block mb-2.5">
            1. Constellation Scope (परीक्षेचे कार्यक्षेत्र)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setScope("all")}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all",
                scope === "all"
                  ? "border-gold bg-gold/15 text-gold shadow-sm"
                  : "border-gold/15 bg-veil/40 text-mist hover:text-ivory hover:border-gold/30"
              )}
            >
              <Compass className="w-4 h-4 mb-1.5 text-gold" />
              <span className="font-fraunces text-xs font-normal text-ivory">Full Cosmos</span>
              <span className="text-[10px] font-mono text-mist">All stars</span>
            </button>

            <button
              type="button"
              onClick={() => setScope("weakest")}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all",
                scope === "weakest"
                  ? "border-gold bg-gold/15 text-gold shadow-sm"
                  : "border-gold/15 bg-veil/40 text-mist hover:text-ivory hover:border-gold/30"
              )}
            >
              <Star className="w-4 h-4 mb-1.5 text-ember fill-ember/40" />
              <span className="font-fraunces text-xs font-normal text-ivory">Weakest Stars</span>
              <span className="text-[10px] font-mono text-ember">Due for review</span>
            </button>

            <button
              type="button"
              onClick={() => setScope("topic")}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all",
                scope === "topic"
                  ? "border-gold bg-gold/15 text-gold shadow-sm"
                  : "border-gold/15 bg-veil/40 text-mist hover:text-ivory hover:border-gold/30"
              )}
            >
              <Layers className="w-4 h-4 mb-1.5 text-aurora" />
              <span className="font-fraunces text-xs font-normal text-ivory">By Topic</span>
              <span className="text-[10px] font-mono text-mist">Constellation</span>
            </button>

            <button
              type="button"
              onClick={() => setScope("material")}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all",
                scope === "material"
                  ? "border-gold bg-gold/15 text-gold shadow-sm"
                  : "border-gold/15 bg-veil/40 text-mist hover:text-ivory hover:border-gold/30"
              )}
            >
              <BookOpen className="w-4 h-4 mb-1.5 text-gold-soft" />
              <span className="font-fraunces text-xs font-normal text-ivory">By Material</span>
              <span className="text-[10px] font-mono text-mist">Single scroll</span>
            </button>
          </div>

          {/* Sub-select if topic or material */}
          {scope === "topic" && (
            <div className="mt-3">
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-gold/20 bg-deep px-4 py-2 text-xs font-mono text-ivory focus:outline-none focus:border-gold"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    Topic: {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === "material" && (
            <div className="mt-3">
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-gold/20 bg-deep px-4 py-2 text-xs font-mono text-ivory focus:outline-none focus:border-gold"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    Scroll: {m.title} ({m.wordCount} words)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 2. Question Count & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono uppercase text-mist block mb-2">
              2. Question Count
            </label>
            <div className="flex gap-2">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-mono font-medium border transition-all",
                    count === num
                      ? "border-gold bg-gold text-night font-bold shadow-sm"
                      : "border-gold/15 bg-veil/40 text-mist hover:text-ivory"
                  )}
                >
                  {num} Questions
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono uppercase text-mist block mb-2">
              3. Difficulty Crucible
            </label>
            <div className="flex gap-2">
              {[
                { id: "gentle", label: "Gentle", icon: Feather },
                { id: "honest", label: "Honest", icon: Scale },
                { id: "brutal", label: "Brutal", icon: Flame },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDifficulty(id as TrialDifficulty)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-mono border transition-all",
                    difficulty === id
                      ? id === "brutal"
                        ? "border-ember bg-ember/20 text-ember font-bold shadow-sm"
                        : "border-gold bg-gold text-night font-bold shadow-sm"
                      : "border-gold/15 bg-veil/40 text-mist hover:text-ivory"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Question Types */}
        <div>
          <label className="text-xs font-mono uppercase text-mist block mb-2">
            4. Modalities (Question Types)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "mcq", label: "MCQ (Deep Distractors)" },
              { id: "true_false_why", label: "True / False + Why" },
              { id: "fill_blank", label: "Fill in the Blank" },
              { id: "short_answer", label: "Explain in Your Own Words" },
            ].map(({ id, label }) => {
              const active = selectedTypes.includes(id as QuestionType);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleType(id as QuestionType)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-xs font-mono text-left transition-all",
                    active
                      ? "border-gold/50 bg-gold/10 text-ivory font-medium"
                      : "border-gold/10 bg-veil/20 text-mist/60 hover:text-mist"
                  )}
                >
                  <span>{label}</span>
                  {active && <Check className="w-3.5 h-3.5 text-gold shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Language Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gold/15 bg-veil/40">
          <div>
            <span className="font-fraunces text-sm text-ivory block">
              Evaluation Language
            </span>
            <span className="text-[11px] font-manrope text-mist">
              Questions and grading rubrics language.
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-deep border border-gold/20 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={cn(
                "px-3 py-1 text-xs font-mono rounded-lg transition-all",
                language === "en" ? "bg-gold text-night font-bold shadow-sm" : "text-mist"
              )}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("mr")}
              className={cn(
                "px-3 py-1 text-xs font-tiro rounded-lg transition-all",
                language === "mr" ? "bg-gold text-night font-bold shadow-sm" : "text-mist"
              )}
            >
              मराठी
            </button>
          </div>
        </div>
      </div>

      {/* Launch Action */}
      <Button
        onClick={handleLaunch}
        disabled={isGenerating}
        variant="celestial"
        size="lg"
        className="w-full gap-2 shadow-astral py-6 text-sm font-semibold"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-night" />
            <span>Consulting Astronomical Examiner…</span>
          </>
        ) : (
          <>
            <Swords className="w-4 h-4 text-night" />
            <span>Begin Examination ({count} Questions)</span>
          </>
        )}
      </Button>
    </div>
  );
}
