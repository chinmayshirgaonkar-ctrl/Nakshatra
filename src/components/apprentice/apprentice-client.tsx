"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Concept, Subject, Topic, ApprenticeGapReport, ConceptFSRSChange } from "@/lib/types/models";
import { ApprenticeSetup } from "./apprentice-setup";
import { ApprenticeChat } from "./apprentice-chat";
import { ApprenticeGapReportView } from "./apprentice-gap-report";

interface ApprenticeClientProps {
  initialConcepts: Concept[];
  initialSubjects: Subject[];
  initialTopics: Topic[];
}

export function ApprenticeClient({
  initialConcepts,
  initialSubjects,
  initialTopics,
}: ApprenticeClientProps) {
  const searchParams = useSearchParams();
  const requestedConceptId = searchParams.get("conceptId");

  const [mode, setMode] = useState<"setup" | "chat" | "report">("setup");
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "mr">("en");

  // Gap Report result
  const [gapReport, setGapReport] = useState<ApprenticeGapReport | null>(null);
  const [fsrsChange, setFsrsChange] = useState<ConceptFSRSChange | undefined>(undefined);

  // Pre-select concept if requested in URL
  useEffect(() => {
    if (requestedConceptId && !selectedConcept) {
      const match = initialConcepts.find((c) => c.id === requestedConceptId);
      if (match) {
        setSelectedConcept(match);
      }
    }
  }, [requestedConceptId, initialConcepts, selectedConcept]);

  const handleStartLesson = (concept: Concept, language: "en" | "mr") => {
    setSelectedConcept(concept);
    setSelectedLanguage(language);
    setMode("chat");
  };

  const handleEndLesson = async (
    messages: { role: "user" | "apprentice"; text: string }[]
  ) => {
    if (!selectedConcept) return;

    const res = await fetch("/api/apprentice/end-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conceptId: selectedConcept.id,
        conversationHistory: messages,
        language: selectedLanguage,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to generate gap report.");
    }

    setGapReport(data.gapReport);
    setFsrsChange(data.fsrsChange);
    setMode("report");
  };

  const handleReset = () => {
    setGapReport(null);
    setFsrsChange(undefined);
    setMode("setup");
  };

  const currentTopic = selectedConcept
    ? initialTopics.find((t) => t.id === selectedConcept.topicId)
    : undefined;

  const currentSubject = selectedConcept
    ? initialSubjects.find((s) => s.id === selectedConcept.subjectId)
    : undefined;

  return (
    <div className="py-6">
      {mode === "setup" && (
        <ApprenticeSetup
          concepts={initialConcepts}
          subjects={initialSubjects}
          topics={initialTopics}
          initialConceptId={requestedConceptId || undefined}
          onStartLesson={handleStartLesson}
        />
      )}

      {mode === "chat" && selectedConcept && (
        <ApprenticeChat
          concept={selectedConcept}
          topic={currentTopic}
          subject={currentSubject}
          language={selectedLanguage}
          onEndLesson={handleEndLesson}
          onCancel={handleReset}
        />
      )}

      {mode === "report" && selectedConcept && gapReport && (
        <ApprenticeGapReportView
          concept={selectedConcept}
          topic={currentTopic}
          subject={currentSubject}
          gapReport={gapReport}
          fsrsChange={fsrsChange}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
