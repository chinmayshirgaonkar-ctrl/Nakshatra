"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Concept, Subject, Topic } from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Sparkles,
  Search,
  Star,
  BookOpen,
  ArrowRight,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { calculateConceptRetrievability, isConceptFading } from "@/lib/fsrs/retrievability";

interface ApprenticeSetupProps {
  concepts: Concept[];
  subjects: Subject[];
  topics: Topic[];
  initialConceptId?: string;
  onStartLesson: (concept: Concept, language: "en" | "mr") => void;
}

export function ApprenticeSetup({
  concepts,
  subjects,
  topics,
  initialConceptId,
  onStartLesson,
}: ApprenticeSetupProps) {
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    initialConceptId || (concepts[0]?.id ?? "")
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState<"en" | "mr">("en");

  // Filter concepts
  const filteredConcepts = useMemo(() => {
    let list = concepts;

    if (selectedSubjectId !== "all") {
      list = list.filter((c) => c.subjectId === selectedSubjectId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.definition.toLowerCase().includes(q) ||
          (c.marathiName && c.marathiName.toLowerCase().includes(q))
      );
    }

    // Sort fading stars first
    list.sort((a, b) => {
      const retA = calculateConceptRetrievability(a.fsrs);
      const retB = calculateConceptRetrievability(b.fsrs);
      return retA - retB;
    });

    return list;
  }, [concepts, selectedSubjectId, searchQuery]);

  const selectedConcept = concepts.find((c) => c.id === selectedConceptId);
  const selectedTopic = topics.find((t) => t.id === selectedConcept?.topicId);
  const selectedSubject = subjects.find((s) => s.id === selectedConcept?.subjectId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gold/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              Feynman Technique Dialogue
            </span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span className="font-tiro text-xs text-mist">शिष्य संवाद</span>
          </div>
          <h1 className="font-fraunces text-3xl font-light text-ivory">
            The Apprentice
          </h1>
          <p className="font-manrope text-xs text-mist max-w-xl">
            Choose a concept star to teach. Your student is curious and humble, but intellectually sharp.
            Explain the concept in simple words without jargon; if your explanation has holes or contradictions,
            the apprentice will innocently ask you to clarify.
          </p>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-deep/80 p-1 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-colors ${
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
            className={`px-4 py-1.5 rounded-full text-xs font-tiro transition-colors ${
              language === "mr"
                ? "bg-gold text-night font-semibold shadow-astral"
                : "text-mist hover:text-ivory"
            }`}
          >
            मराठी
          </button>
        </div>
      </div>

      {concepts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gold/20 bg-deep/60 p-12 text-center backdrop-blur-sm">
          <BookOpen className="w-12 h-12 text-gold-soft/50 mb-3" />
          <h3 className="font-fraunces text-lg text-ivory mb-2">No Concepts Found</h3>
          <p className="font-manrope text-xs text-mist max-w-sm mb-4">
            You must add study materials to The Library first so Nakshatra can extract concept stars.
          </p>
          <Link href="/library">
            <Button variant="celestial">
              Go to Library
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Concept Picker */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-mist/60" />
                <Input
                  placeholder="Search concepts to teach..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
              </div>

              {/* Subject Filter */}
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                aria-label="Filter concepts by subject"
                className="h-10 rounded-xl border border-gold/20 bg-deep px-3 text-xs text-ivory focus:outline-none focus:border-gold"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Concept List */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 rounded-xl border border-gold/15 bg-deep/40 p-2">
              {filteredConcepts.map((concept) => {
                const ret = calculateConceptRetrievability(concept.fsrs);
                const fading = isConceptFading(concept);
                const isSelected = concept.id === selectedConceptId;

                return (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => setSelectedConceptId(concept.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "border-gold bg-gold/10 shadow-astral"
                        : "border-gold/10 bg-veil/30 hover:border-gold/30 hover:bg-veil/60"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-fraunces text-sm font-medium text-ivory truncate">
                          {concept.name}
                        </span>
                        {concept.marathiName && (
                          <span className="font-tiro text-xs text-mist truncate">
                            ({concept.marathiName})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-manrope text-mist/80 line-clamp-1">
                        {concept.definition}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          fading
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {Math.round(ret * 100)}% Memory
                      </span>
                      {fading && (
                        <span className="text-[9px] font-mono text-rose-400">
                          Fading Star
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Concept Detail & Summon Button */}
          <div className="lg:col-span-5 space-y-4">
            {selectedConcept ? (
              <div className="rounded-2xl border border-gold/25 bg-deep/80 p-6 space-y-5 backdrop-blur-xl shadow-astral">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-gold fill-gold/20" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                      Target Star to Teach
                    </span>
                  </div>
                  <h3 className="font-fraunces text-2xl font-light text-ivory">
                    {selectedConcept.name}
                  </h3>
                  {selectedTopic && (
                    <p className="text-xs font-mono text-mist mt-0.5">
                      Constellation: {selectedTopic.name}
                    </p>
                  )}
                </div>

                <div className="space-y-3 rounded-xl border border-gold/15 bg-veil/40 p-4 text-xs font-manrope">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-mist block mb-1">
                      Canonical Definition
                    </span>
                    <p className="text-ivory leading-relaxed">
                      {selectedConcept.definition}
                    </p>
                  </div>
                </div>

                {/* Feynman Technique Guideline Tip */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 flex items-start gap-3 text-xs font-manrope text-blue-200/90">
                  <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Feynman rule:</strong> Assume the apprentice has never heard technical terms. Use metaphors, plain speech, and concrete real-world examples.
                  </p>
                </div>

                {/* Launch Button */}
                <Button
                  type="button"
                  variant="celestial"
                  size="lg"
                  onClick={() => onStartLesson(selectedConcept, language)}
                  className="w-full gap-2 text-night font-semibold shadow-astral"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>
                    {language === "mr"
                      ? "शिष्य बोलाविणे (Begin Lesson)"
                      : "Summon The Apprentice"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-gold/15 bg-deep/40 p-8 text-center text-mist">
                Select a concept from the list to begin teaching.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
