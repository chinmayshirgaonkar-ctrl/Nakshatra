"use client";

import * as React from "react";
import {
  TrialQuestion,
  ConfidenceLevel,
  ConceptFSRSChange,
  TrialSessionResult,
} from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Star,
  Quote,
  Loader2,
  Target,
  HelpCircle,
  Dices,
  Archive,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TrialRunnerProps {
  questions: TrialQuestion[];
  trialTitle: string;
  onFinish: (result: TrialSessionResult) => void;
  onExit: () => void;
}

export function TrialRunner({
  questions,
  trialTitle,
  onFinish,
  onExit,
}: TrialRunnerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const startTimeRef = React.useRef(Date.now());

  // Input states for current question
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [selectedBool, setSelectedBool] = React.useState<boolean | null>(null);
  const [textAnswer, setTextAnswer] = React.useState("");
  const [confidence, setConfidence] = React.useState<ConfidenceLevel | null>(null);

  // Status states
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [evaluation, setEvaluation] = React.useState<any>(null);
  const [fsrsFeedback, setFsrsFeedback] = React.useState<ConceptFSRSChange[]>([]);

  // Accumulated results across all questions
  const [score, setScore] = React.useState(0);
  const [strengthened, setStrengthened] = React.useState<ConceptFSRSChange[]>([]);
  const [weakened, setWeakened] = React.useState<ConceptFSRSChange[]>([]);
  const [newMistakesCount, setNewMistakesCount] = React.useState(0);
  const [resolvedMistakesCount, setResolvedMistakesCount] = React.useState(0);

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  // Check if answer is provided
  const hasAnswer =
    currentQ.type === "mcq"
      ? selectedOption !== null
      : currentQ.type === "true_false_why"
      ? selectedBool !== null
      : textAnswer.trim().length > 0;

  const canSubmit = hasAnswer && confidence !== null && !isEvaluating;

  // Submit and grade answer
  const handleSubmit = React.useCallback(async () => {
    if (!canSubmit) return;
    setIsEvaluating(true);

    try {
      let isCorrect = false;
      let userAnswerStr = "";
      let correctAnswerStr = "";
      let evalData: any = {};

      const postWithRetry = async (url: string, bodyObj: any): Promise<Response> => {
        try {
          return await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyObj),
          });
        } catch {
          // Automatic single retry on momentary server disconnect
          await new Promise((r) => setTimeout(r, 800));
          return await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyObj),
          });
        }
      };

      if (currentQ.type === "mcq") {
        userAnswerStr = currentQ.options?.[selectedOption!] || "";
        correctAnswerStr = currentQ.options?.[currentQ.correctOptionIndex!] || "";
        isCorrect = selectedOption === currentQ.correctOptionIndex;
      } else if (currentQ.type === "true_false_why") {
        userAnswerStr = selectedBool ? "True" : "False";
        correctAnswerStr = currentQ.correctBool ? "True" : "False";
        isCorrect = selectedBool === currentQ.correctBool;
      } else if (currentQ.type === "fill_blank") {
        userAnswerStr = textAnswer.trim();
        const acceptable = currentQ.acceptableAnswers || [];
        isCorrect = acceptable.some(
          (ans) => ans.toLowerCase().trim() === textAnswer.toLowerCase().trim()
        );
        correctAnswerStr = acceptable[0] || currentQ.modelAnswer || "";
      } else if (currentQ.type === "short_answer") {
        userAnswerStr = textAnswer.trim();
        correctAnswerStr = currentQ.modelAnswer || "";

        const gradeRes = await postWithRetry("/api/trials/grade-short-answer", {
          questionPrompt: currentQ.prompt,
          modelAnswer: currentQ.modelAnswer,
          rubricKeywords: currentQ.rubricKeywords,
          userAnswer: userAnswerStr,
        });

        const gradeJson = await gradeRes.json();
        if (!gradeRes.ok) throw new Error(gradeJson.error || "Grading failed.");

        evalData = gradeJson.result;
        isCorrect = evalData.isCorrect;
      }

      const submitRes = await postWithRetry("/api/trials/submit-answer", {
        questionPrompt: currentQ.prompt,
        questionType: currentQ.type,
        conceptIds: currentQ.conceptIds,
        conceptNames: currentQ.conceptNames,
        userAnswer: userAnswerStr,
        correctAnswer: correctAnswerStr,
        isCorrect,
        confidence,
        whyWrong: evalData.whyWrong || (!isCorrect ? currentQ.explanation : undefined),
        correctReasoning: evalData.correctReasoning || currentQ.explanation,
        memoryHook: evalData.memoryHook,
        originalMistakeId: currentQ.originalMistakeId,
      });

      const submitJson = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitJson.error || "Submission failed.");

      const newStrengthened: ConceptFSRSChange[] =
        submitJson.fsrsChanges?.strengthened || [];
      const newWeakened: ConceptFSRSChange[] =
        submitJson.fsrsChanges?.weakened || [];

      setEvaluation({
        isCorrect,
        userAnswer: userAnswerStr,
        correctAnswer: correctAnswerStr,
        ...evalData,
      });

      setFsrsFeedback([...newStrengthened, ...newWeakened]);

      if (isCorrect) {
        setScore((s) => s + 1);
        if (submitJson.resolvedMistake) {
          setResolvedMistakesCount((c) => c + 1);
        }
      } else {
        if (submitJson.mistakeExhibit) {
          setNewMistakesCount((c) => c + 1);
        }
      }

      setStrengthened((prev) => [...prev, ...newStrengthened]);
      setWeakened((prev) => [...prev, ...newWeakened]);
      setIsRevealed(true);
    } catch (err: any) {
      const msg = err?.message || String(err || "");
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        toast.error("Observatory connection refreshed. Please click Submit & Evaluate again.");
      } else {
        toast.error(msg || "Failed to submit answer.");
      }
    } finally {
      setIsEvaluating(false);
    }
  }, [
    canSubmit,
    currentQ,
    selectedOption,
    selectedBool,
    textAnswer,
    confidence,
  ]);

  // Next Question or Finish
  const handleNext = React.useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((idx) => idx + 1);
      setSelectedOption(null);
      setSelectedBool(null);
      setTextAnswer("");
      setConfidence(null);
      setIsRevealed(false);
      setEvaluation(null);
      setFsrsFeedback([]);
    } else {
      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      onFinish({
        score: score + (evaluation?.isCorrect ? 1 : 0),
        totalQuestions: questions.length,
        percentage: Math.round(((score + (evaluation?.isCorrect ? 1 : 0)) / questions.length) * 100),
        durationSeconds: elapsedSeconds,
        strengthened,
        weakened,
        newMistakesCount,
        resolvedMistakesCount,
      });
    }
  }, [currentIndex, questions.length, onFinish, score, evaluation, strengthened, weakened, newMistakesCount, resolvedMistakesCount]);

  // Keyboard navigation listener (1-4, Enter)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      ) {
        if (e.key === "Enter" && !e.shiftKey && currentQ.type !== "short_answer") {
          e.preventDefault();
          if (!isRevealed && canSubmit) {
            handleSubmit();
          } else if (isRevealed) {
            handleNext();
          }
        }
        return;
      }

      if (!isRevealed) {
        if (currentQ.type === "mcq" && currentQ.options) {
          if (e.key === "1") setSelectedOption(0);
          if (e.key === "2") setSelectedOption(1);
          if (e.key === "3") setSelectedOption(2);
          if (e.key === "4") setSelectedOption(3);
        } else if (currentQ.type === "true_false_why") {
          if (e.key === "1") setSelectedBool(true);
          if (e.key === "2") setSelectedBool(false);
        }

        if (e.key.toLowerCase() === "s") setConfidence("sure");
        if (e.key.toLowerCase() === "t") setConfidence("think_so");
        if (e.key.toLowerCase() === "g") setConfidence("guessing");

        if (e.key === "Enter" && canSubmit) {
          e.preventDefault();
          handleSubmit();
        }
      } else {
        if (e.key === "Enter") {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, currentQ, canSubmit, handleSubmit, handleNext]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between text-xs font-mono text-mist">
        <div className="flex items-center gap-2">
          <span className="font-fraunces text-base text-ivory">{trialTitle}</span>
          <span className="h-1 w-1 rounded-full bg-gold/50" />
          <span className="text-gold-soft uppercase tracking-wider">
            {currentQ.difficulty}
          </span>
        </div>

        <button
          onClick={onExit}
          className="hover:text-ember transition-colors border border-gold/15 px-2.5 py-1 rounded-lg"
        >
          Exit Trial
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-ivory">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-gold-soft">
            Score: {score} / {currentIndex + (isRevealed ? 1 : 0)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-deep border border-gold/15 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card (Card Flip / Transition State) */}
      <div
        className={cn(
          "rounded-[26px] border bg-deep/90 p-6 sm:p-8 shadow-astral backdrop-blur-md transition-all duration-300",
          !isRevealed
            ? "border-gold/25"
            : evaluation?.isCorrect
            ? "border-gold/60 shadow-[0_0_25px_rgba(230,175,46,0.2)]"
            : "border-ember/60 shadow-[0_0_25px_rgba(224,122,95,0.25)]"
        )}
      >
        {/* Linked Concept Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {currentQ.conceptNames?.map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-gold/20 bg-veil/60 text-[10px] font-mono text-gold-soft"
            >
              <Star className="w-2.5 h-2.5 fill-gold text-gold" />
              <span>{name}</span>
            </div>
          ))}

          {currentQ.originalMistakeId && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-ember/30 bg-ember/15 text-[10px] font-mono text-ember">
              <Archive className="w-2.5 h-2.5" />
              <span>Museum Re-Trial</span>
            </div>
          )}
        </div>

        {/* Prompt */}
        <h3 className="font-fraunces text-xl sm:text-2xl text-ivory font-normal leading-relaxed mb-6">
          {currentQ.prompt}
        </h3>

        {/* Input Area (Before Reveal) */}
        {!isRevealed ? (
          <div className="space-y-6">
            {/* 1. MCQ Option Cards */}
            {currentQ.type === "mcq" && currentQ.options && (
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(idx)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border text-left text-sm font-manrope transition-all",
                      selectedOption === idx
                        ? "border-gold bg-gold/15 text-ivory shadow-sm font-medium"
                        : "border-gold/15 bg-veil/30 text-mist hover:text-ivory hover:border-gold/30 hover:bg-veil/60"
                    )}
                  >
                    <span>{opt}</span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-deep text-xs font-mono text-gold-soft ml-3">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 2. True / False */}
            {currentQ.type === "true_false_why" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBool(true)}
                  className={cn(
                    "flex items-center justify-between p-5 rounded-2xl border text-sm font-fraunces transition-all",
                    selectedBool === true
                      ? "border-gold bg-gold/15 text-gold font-bold shadow-sm"
                      : "border-gold/15 bg-veil/30 text-mist hover:text-ivory hover:border-gold/30"
                  )}
                >
                  <span>TRUE</span>
                  <span className="text-xs font-mono text-mist border border-gold/20 px-2 py-0.5 rounded">
                    1
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBool(false)}
                  className={cn(
                    "flex items-center justify-between p-5 rounded-2xl border text-sm font-fraunces transition-all",
                    selectedBool === false
                      ? "border-gold bg-gold/15 text-gold font-bold shadow-sm"
                      : "border-gold/15 bg-veil/30 text-mist hover:text-ivory hover:border-gold/30"
                  )}
                >
                  <span>FALSE</span>
                  <span className="text-xs font-mono text-mist border border-gold/20 px-2 py-0.5 rounded">
                    2
                  </span>
                </button>
              </div>
            )}

            {/* 3. Fill in the Blank */}
            {currentQ.type === "fill_blank" && (
              <div className="space-y-2">
                <Input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type the missing concept law or keyword..."
                  className="h-12 text-sm font-manrope text-ivory border-gold/30"
                  autoFocus
                />
              </div>
            )}

            {/* 4. Short Answer (Explain in own words) */}
            {currentQ.type === "short_answer" && (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Explain the causal chain, mechanism, or principle in your own words..."
                  className="w-full rounded-2xl border border-gold/25 bg-deep/90 p-4 text-sm text-ivory placeholder:text-mist/50 focus:outline-none focus:border-gold font-manrope resize-none"
                  autoFocus
                />
                <div className="flex justify-between text-[11px] font-mono text-mist px-1">
                  <span>Graded on a 0-3 rubric by Gemini Celestial Tutor</span>
                  <span>{textAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            )}

            {/* Confidence Picker (Required Before Reveal) */}
            <div className="pt-4 border-t border-gold/15 space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-mist block text-center">
                Calibrate Conviction before Reveal
              </label>

              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setConfidence("sure")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-mono transition-all",
                    confidence === "sure"
                      ? "border-gold bg-gold text-night font-bold shadow-sm"
                      : "border-gold/15 bg-veil/40 text-mist hover:text-ivory"
                  )}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Sure</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfidence("think_so")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-mono transition-all",
                    confidence === "think_so"
                      ? "border-gold bg-gold text-night font-bold shadow-sm"
                      : "border-gold/15 bg-veil/40 text-mist hover:text-ivory"
                  )}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Think so</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfidence("guessing")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-mono transition-all",
                    confidence === "guessing"
                      ? "border-gold bg-gold text-night font-bold shadow-sm"
                      : "border-gold/15 bg-veil/40 text-mist hover:text-ivory"
                  )}
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Guessing</span>
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isEvaluating}
              variant="celestial"
              size="lg"
              className="w-full gap-2 shadow-astral py-5"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-night" />
                  <span>Evaluating Conviction…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-night" />
                  <span>
                    Submit & Evaluate {!confidence ? "(Select Confidence First)" : "↵"}
                  </span>
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Evaluation & Explanation Face (Revealed State) */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Correctness Header Banner */}
            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border",
                evaluation?.isCorrect
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : "border-ember/40 bg-ember/15 text-ember"
              )}
            >
              {evaluation?.isCorrect ? (
                <CheckCircle2 className="w-6 h-6 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 shrink-0" />
              )}
              <div>
                <h4 className="font-fraunces text-lg font-normal">
                  {evaluation?.isCorrect ? "Correct Insight" : "Misconception Detected"}
                </h4>
                <p className="text-xs font-mono opacity-85">
                  Rating: {confidence} &bull; FSRS calibrated
                  {evaluation?.score !== undefined && ` (Rubric: ${evaluation.score}/3)`}
                </p>
              </div>
            </div>

            {/* Short Answer Rubric breakdown */}
            {currentQ.type === "short_answer" && (
              <div className="space-y-2 rounded-2xl border border-gold/15 bg-veil/40 p-4 text-xs font-manrope">
                {evaluation?.whatWasGood && (
                  <div className="text-ivory">
                    <strong className="text-gold font-mono uppercase text-[10px] block mb-0.5">
                      ✓ Sound Intuition:
                    </strong>
                    {evaluation.whatWasGood}
                  </div>
                )}
                {evaluation?.whatWasMissing && (
                  <div className="text-mist pt-1">
                    <strong className="text-gold-soft font-mono uppercase text-[10px] block mb-0.5">
                      △ Missing Nuance:
                    </strong>
                    {evaluation.whatWasMissing}
                  </div>
                )}
              </div>
            )}

            {/* Definitive Explanation */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gold-soft block">
                Definitive Astronomical Reasoning
              </span>
              <p className="font-serif text-sm sm:text-base text-ivory/90 leading-relaxed whitespace-pre-line border-l-2 border-gold/30 pl-4 py-1">
                {evaluation?.correctReasoning || currentQ.explanation}
              </p>
            </div>

            {/* Memory Hook Callout (if mistake) */}
            {!evaluation?.isCorrect && evaluation?.memoryHook && (
              <div className="rounded-2xl border border-gold/25 bg-veil/70 p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gold block mb-1">
                  💡 Museum Memory Hook
                </span>
                <p className="font-fraunces text-sm text-ivory italic">
                  &ldquo;{evaluation.memoryHook}&rdquo;
                </p>
              </div>
            )}

            {/* Live FSRS Star Impacts */}
            {fsrsFeedback.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gold/15">
                <span className="text-[10px] font-mono uppercase tracking-wider text-mist block">
                  Constellation Memory Tuning (FSRS)
                </span>
                <div className="flex flex-wrap gap-2">
                  {fsrsFeedback.map((fb, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono border",
                        fb.improved
                          ? "border-gold/30 bg-gold/10 text-gold"
                          : "border-ember/30 bg-ember/10 text-ember"
                      )}
                    >
                      <Star
                        className={cn(
                          "w-3 h-3",
                          fb.improved ? "fill-gold text-gold" : "text-ember"
                        )}
                      />
                      <span>{fb.conceptName}:</span>
                      <span className="font-bold">
                        {fb.improved
                          ? `Stability +${(fb.newStability - fb.oldStability).toFixed(1)}d`
                          : "Dimmed in Sky"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advance Button */}
            <Button
              onClick={handleNext}
              variant="celestial"
              size="lg"
              className="w-full gap-2 py-5 shadow-astral text-sm font-semibold"
            >
              <span>
                {currentIndex + 1 < questions.length
                  ? "Next Question (Press Enter ↵)"
                  : "View Grand Results ↵"}
              </span>
              <ArrowRight className="w-4 h-4 text-night" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
