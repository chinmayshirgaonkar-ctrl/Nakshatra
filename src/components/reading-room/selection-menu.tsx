"use client";

import * as React from "react";
import { Sparkles, Star, HelpCircle, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SelectionMenuProps {
  materialId: string;
  language: "en" | "mr";
  containerRef: React.RefObject<HTMLDivElement | null>;
  onStarCreated?: () => void;
}

export function SelectionMenu({
  materialId,
  language,
  containerRef,
  onStarCreated,
}: SelectionMenuProps) {
  const [selectedText, setSelectedText] = React.useState("");
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  // Modal / popover state for results
  const [activeModal, setActiveModal] = React.useState<"explain" | "quiz" | null>(null);
  const [modalContent, setModalContent] = React.useState<any>(null);
  const [showAnswer, setShowAnswer] = React.useState(false);

  const handleSelection = React.useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      if (!activeModal) setMenuPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      if (!activeModal) setMenuPosition(null);
      return;
    }

    // Verify selection is within container
    if (containerRef.current) {
      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        if (!activeModal) setMenuPosition(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setMenuPosition({
        top: Math.max(10, rect.top - 48),
        left: rect.left + rect.width / 2,
      });
    }
  }, [containerRef, activeModal]);

  React.useEffect(() => {
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [handleSelection]);

  // Action 1: Explain this
  const handleExplain = async () => {
    setLoadingAction("explain");
    try {
      const res = await fetch("/api/ai/reading-room/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain",
          selection: selectedText,
          materialId,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to explain.");

      setModalContent(data.result);
      setActiveModal("explain");
      setMenuPosition(null);
    } catch (err: any) {
      toast.error(err.message || "Could not explain selection.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Action 2: Make a concept star
  const handleMakeStar = async () => {
    setLoadingAction("make-star");
    try {
      const res = await fetch("/api/ai/reading-room/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "make-star",
          selection: selectedText,
          materialId,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to chart star.");

      toast.success(
        `Concept Star charted: "${data.concept?.name}" added to constellation!`
      );
      setMenuPosition(null);
      window.getSelection()?.removeAllRanges();
      onStarCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create concept star.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Action 3: Quiz me on this
  const handleQuiz = async () => {
    setLoadingAction("quiz");
    setShowAnswer(false);
    try {
      const res = await fetch("/api/ai/reading-room/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quiz",
          selection: selectedText,
          materialId,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz.");

      setModalContent(data.quiz);
      setActiveModal("quiz");
      setMenuPosition(null);
    } catch (err: any) {
      toast.error(err.message || "Could not generate active recall trial.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      {/* Floating Toolbar on selection */}
      {menuPosition && !activeModal && (
        <div
          className="fixed z-50 -translate-x-1/2 flex items-center gap-1 p-1 rounded-2xl border border-gold/40 bg-deep/95 shadow-[0_8px_30px_rgba(0,0,0,0.7)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
        >
          <button
            onClick={handleExplain}
            disabled={!!loadingAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-manrope font-medium text-ivory hover:text-gold hover:bg-gold/15 transition-colors disabled:opacity-50"
          >
            {loadingAction === "explain" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-gold animate-twinkle" />
            )}
            <span>Explain</span>
          </button>

          <div className="h-3.5 w-px bg-gold/25" />

          <button
            onClick={handleMakeStar}
            disabled={!!loadingAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-manrope font-medium text-ivory hover:text-gold hover:bg-gold/15 transition-colors disabled:opacity-50"
          >
            {loadingAction === "make-star" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
            ) : (
              <Star className="w-3.5 h-3.5 text-gold fill-gold/50" />
            )}
            <span>Make Star</span>
          </button>

          <div className="h-3.5 w-px bg-gold/25" />

          <button
            onClick={handleQuiz}
            disabled={!!loadingAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-manrope font-medium text-ivory hover:text-gold hover:bg-gold/15 transition-colors disabled:opacity-50"
          >
            {loadingAction === "quiz" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
            ) : (
              <HelpCircle className="w-3.5 h-3.5 text-gold" />
            )}
            <span>Quiz me</span>
          </button>
        </div>
      )}

      {/* Popover / Modal for Explain result */}
      {activeModal === "explain" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-gold/30 bg-deep/95 p-6 shadow-astral backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-gold/15">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold animate-twinkle" />
                <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
                  Observatory Illumination
                </span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-mist hover:text-ivory rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="rounded-xl border border-gold/10 bg-veil/50 p-3 text-xs font-mono text-mist italic line-clamp-3">
                &ldquo;{selectedText}&rdquo;
              </div>
              <div className="text-sm font-manrope text-ivory leading-relaxed whitespace-pre-line">
                {modalContent}
              </div>
            </div>

            <div className="pt-3 border-t border-gold/15 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 text-xs font-mono rounded-xl border border-gold/30 hover:border-gold text-ivory hover:text-gold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popover / Modal for Quiz trial result */}
      {activeModal === "quiz" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-gold/30 bg-deep/95 p-6 shadow-astral backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-gold/15">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-gold" />
                <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
                  Active Recall Trial
                </span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-mist hover:text-ivory rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="rounded-2xl border border-gold/20 bg-veil/60 p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gold-soft block mb-1">
                  Question
                </span>
                <p className="font-fraunces text-base text-ivory leading-snug">
                  {modalContent?.question}
                </p>
                {modalContent?.hint && !showAnswer && (
                  <p className="text-xs font-manrope text-mist/80 italic mt-2">
                    Hint: {modalContent.hint}
                  </p>
                )}
              </div>

              {showAnswer ? (
                <div className="rounded-2xl border border-ember/30 bg-ember/10 p-4 animate-in fade-in">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ember block mb-1">
                    Definitive Answer
                  </span>
                  <p className="font-manrope text-sm text-ivory leading-relaxed">
                    {modalContent?.answer}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-2.5 rounded-xl border border-gold/30 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-mono font-medium transition-colors"
                >
                  Reveal Model Answer
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-gold/15 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 text-xs font-mono rounded-xl border border-gold/30 hover:border-gold text-ivory hover:text-gold transition-colors"
              >
                Complete Trial
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
