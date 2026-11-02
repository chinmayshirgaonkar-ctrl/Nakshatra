"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Topic, Subject, Concept, BlankPageEvaluation, ConceptFSRSChange } from "@/lib/types/models";
import { BlankPageSetup } from "./blank-page-setup";
import { BlankPageEditor } from "./blank-page-editor";
import { BlankPageResults } from "./blank-page-results";

interface BlankPageClientProps {
  initialTopics: Topic[];
  initialSubjects: Subject[];
  initialConcepts: Concept[];
}

export function BlankPageClient({
  initialTopics,
  initialSubjects,
  initialConcepts,
}: BlankPageClientProps) {
  const searchParams = useSearchParams();
  const requestedTopicId = searchParams.get("topicId");

  const [mode, setMode] = useState<"setup" | "editor" | "results">("setup");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  // Recall manuscript data
  const [recallText, setRecallText] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Evaluation data
  const [evaluation, setEvaluation] = useState<BlankPageEvaluation | null>(null);
  const [fsrsChanges, setFsrsChanges] = useState<ConceptFSRSChange[]>([]);

  // Automatically select topic from searchParams if present
  useEffect(() => {
    if (requestedTopicId && !selectedTopic) {
      const match = initialTopics.find((t) => t.id === requestedTopicId);
      if (match) {
        setSelectedTopic(match);
      }
    }
  }, [requestedTopicId, initialTopics, selectedTopic]);

  const handleStartRecall = (topic: Topic, durationMinutes: number | null) => {
    setSelectedTopic(topic);
    setSelectedDuration(durationMinutes);
    setMode("editor");
  };

  const handleSubmitRecall = async (text: string, durationSec: number) => {
    if (!selectedTopic) return;
    setRecallText(text);
    setElapsedSeconds(durationSec);

    const res = await fetch("/api/blank-page/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: selectedTopic.id,
        recallText: text,
        durationSeconds: durationSec,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to evaluate recall session.");
    }

    setEvaluation(data.evaluation);
    setFsrsChanges(data.fsrsChanges || data.evaluation?.fsrsChanges || []);
    setMode("results");
  };

  const handleReset = () => {
    setEvaluation(null);
    setFsrsChanges([]);
    setRecallText("");
    setElapsedSeconds(0);
    setMode("setup");
  };

  const currentSubject = selectedTopic
    ? initialSubjects.find((s) => s.id === selectedTopic.subjectId)
    : undefined;

  const currentTopicConcepts = selectedTopic
    ? initialConcepts.filter((c) => c.topicId === selectedTopic.id)
    : [];

  return (
    <div className="py-6">
      {mode === "setup" && (
        <BlankPageSetup
          topics={initialTopics}
          subjects={initialSubjects}
          concepts={initialConcepts}
          initialTopicId={requestedTopicId || undefined}
          onStart={handleStartRecall}
        />
      )}

      {mode === "editor" && selectedTopic && (
        <BlankPageEditor
          topic={selectedTopic}
          subject={currentSubject}
          concepts={currentTopicConcepts}
          durationMinutes={selectedDuration}
          onSubmitRecall={handleSubmitRecall}
          onCancel={handleReset}
        />
      )}

      {mode === "results" && selectedTopic && evaluation && (
        <BlankPageResults
          topic={selectedTopic}
          subject={currentSubject}
          concepts={currentTopicConcepts}
          recallText={recallText}
          durationSeconds={elapsedSeconds}
          evaluation={evaluation}
          fsrsChanges={fsrsChanges}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
