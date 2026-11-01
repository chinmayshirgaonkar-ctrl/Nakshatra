"use client";

import * as React from "react";
import {
  Subject,
  Topic,
  Material,
  TrialQuestion,
  TrialSessionResult,
} from "@/lib/types/models";
import { TrialSetup } from "./trial-setup";
import { TrialRunner } from "./trial-runner";
import { TrialResults } from "./trial-results";
import { useSearchParams } from "next/navigation";

interface TrialsClientProps {
  subjects: Subject[];
  topics: Topic[];
  materials: Material[];
}

export function TrialsClient({ subjects, topics, materials }: TrialsClientProps) {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const [view, setView] = React.useState<"setup" | "runner" | "results">("setup");
  const [activeQuestions, setActiveQuestions] = React.useState<TrialQuestion[]>([]);
  const [trialTitle, setTrialTitle] = React.useState<string>("Crucible Examination");
  const [finalResult, setFinalResult] = React.useState<TrialSessionResult | null>(null);

  // Check if re-trial was initiated from Museum of Mistakes
  React.useEffect(() => {
    if (mode === "retrial") {
      const storedQuestions = sessionStorage.getItem("active_trial_questions");
      const storedTitle = sessionStorage.getItem("active_trial_title");
      if (storedQuestions) {
        try {
          const parsed = JSON.parse(storedQuestions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveQuestions(parsed);
            setTrialTitle(storedTitle || "Crucible: Re-Trial of Mistakes");
            setView("runner");
            sessionStorage.removeItem("active_trial_questions");
            sessionStorage.removeItem("active_trial_title");
          }
        } catch {
          // Fallback to setup
        }
      }
    }
  }, [mode]);

  const handleStartTrial = (questions: TrialQuestion[], title: string) => {
    setActiveQuestions(questions);
    setTrialTitle(title);
    setView("runner");
  };

  const handleFinishTrial = (result: TrialSessionResult) => {
    setFinalResult(result);
    setView("results");
  };

  const handleReset = () => {
    setView("setup");
    setActiveQuestions([]);
    setFinalResult(null);
  };

  return (
    <div className="space-y-8">
      {view === "setup" && (
        <TrialSetup
          subjects={subjects}
          topics={topics}
          materials={materials}
          onStartTrial={handleStartTrial}
        />
      )}

      {view === "runner" && (
        <TrialRunner
          questions={activeQuestions}
          trialTitle={trialTitle}
          onFinish={handleFinishTrial}
          onExit={handleReset}
        />
      )}

      {view === "results" && finalResult && (
        <TrialResults
          result={finalResult}
          trialTitle={trialTitle}
          onRetry={handleReset}
        />
      )}
    </div>
  );
}
