"use client";

import * as React from "react";
import { useState } from "react";
import { Topic, Subject, Concept } from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import {
  Feather,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Globe,
  Timer,
} from "lucide-react";

interface BlankPageSetupProps {
  subjects: Subject[];
  topics: Topic[];
  concepts: Concept[];
  initialTopicId?: string;
  onStart: (topic: Topic, durationMinutes: number | null, language: "en" | "mr") => void;
}

export function BlankPageSetup({
  subjects,
  topics,
  concepts,
  initialTopicId,
  onStart,
}: BlankPageSetupProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopicId || (topics.length > 0 ? topics[0].id : "")
  );
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [language, setLanguage] = useState<"en" | "mr">("en");

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const selectedSubject = subjects.find(
    (s) => s.id === selectedTopic?.subjectId
  );

  const topicConcepts = concepts.filter(
    (c) => c.topicId === selectedTopicId
  );

  const handleStart = () => {
    if (!selectedTopic) return;
    onStart(selectedTopic, durationMinutes, language);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-gold/25 bg-deep/80 p-8 md:p-10 backdrop-blur-xl shadow-astral text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-gold/30 bg-veil shadow-astral">
          <Feather className="h-8 w-8 text-gold animate-twinkle" />
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
            Unassisted Active Recall
          </span>
          <span className="h-1 w-1 rounded-full bg-gold/50" />
          <span className="font-tiro text-xs text-mist">कोरा कागद विधी</span>
        </div>

        <h1 className="font-fraunces text-3xl md:text-4xl font-light text-ivory tracking-tight">
          The Blank Parchment
        </h1>
        <p className="font-manrope text-xs md:text-sm text-mist max-w-lg mx-auto leading-relaxed">
          The ultimate test of neural retention. Select a constellation topic and reconstruct everything you know without notes. Gemini will cross-examine your recall against canonical stars.
        </p>
      </div>

      {/* Setup Options Form */}
      <div className="rounded-[24px] border border-gold/20 bg-deep/60 p-6 md:p-8 space-y-6 backdrop-blur-xl">
        {/* 1. Topic Constellation Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-mist flex items-center justify-between">
            <span>Target Topic Constellation</span>
            <span className="text-gold-soft font-mono">
              {topicConcepts.length} Concept Star{topicConcepts.length === 1 ? "" : "s"}
            </span>
          </label>

          {topics.length > 0 ? (
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-gold/20 bg-veil px-4 text-sm text-ivory focus:outline-none focus:border-gold font-manrope"
            >
              {topics.map((t) => {
                const sub = subjects.find((s) => s.id === t.subjectId);
                return (
                  <option key={t.id} value={t.id}>
                    {sub ? `${sub.name} — ` : ""}
                    {t.name} {t.marathiName ? `(${t.marathiName})` : ""}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="rounded-2xl border border-gold/15 bg-veil/30 p-4 text-center space-y-2">
              <p className="text-xs text-mist font-manrope">
                No topics found. Please add study material in the Library first.
              </p>
            </div>
          )}
        </div>

        {/* 2. Optional Timer Duration */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-mist block">
            Recall Timer Limit (Optional)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Untimed", value: null },
              { label: "5 Min", value: 5 },
              { label: "10 Min", value: 10 },
              { label: "15 Min", value: 15 },
            ].map((t) => (
              <button
                key={String(t.value)}
                type="button"
                onClick={() => setDurationMinutes(t.value)}
                className={`py-2.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                  durationMinutes === t.value
                    ? "border-gold bg-gold text-night font-semibold shadow-astral"
                    : "border-gold/15 bg-veil/30 text-mist hover:text-ivory hover:border-gold/30"
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Evaluation Language */}
        <div className="flex items-center justify-between rounded-xl border border-gold/15 bg-veil/30 p-3.5">
          <div>
            <span className="font-fraunces text-sm text-ivory block">
              Evaluation Language
            </span>
            <span className="text-[11px] text-mist font-manrope">
              Feedback and canonical comparisons language.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                language === "en"
                  ? "bg-gold text-night font-semibold shadow-astral"
                  : "text-mist hover:text-ivory"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("mr")}
              className={`px-3 py-1 rounded-full text-xs font-tiro transition-colors ${
                language === "mr"
                  ? "bg-gold text-night font-semibold shadow-astral"
                  : "text-mist hover:text-ivory"
              }`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Start Button */}
        <Button
          type="button"
          variant="celestial"
          size="lg"
          onClick={handleStart}
          disabled={!selectedTopicId || topicConcepts.length === 0}
          className="w-full gap-2 text-sm shadow-astral"
        >
          <Feather className="w-4 h-4 text-night" />
          <span>Unfurl Parchment & Write</span>
          <ArrowRight className="w-4 h-4 text-night ml-auto" />
        </Button>
      </div>
    </div>
  );
}
