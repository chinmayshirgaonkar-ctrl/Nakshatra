"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Topic, Subject, Concept } from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import {
  Feather,
  Clock,
  Sparkles,
  ArrowLeft,
  Loader2,
  Maximize2,
  Minimize2,
  AlertCircle,
} from "lucide-react";

interface BlankPageEditorProps {
  topic: Topic;
  subject?: Subject;
  concepts: Concept[];
  durationMinutes: number | null;
  onSubmitRecall: (text: string, elapsedSeconds: number) => Promise<void>;
  onCancel: () => void;
}

export function BlankPageEditor({
  topic,
  subject,
  concepts,
  durationMinutes,
  onSubmitRecall,
  onCancel,
}: BlankPageEditorProps) {
  const [text, setText] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Timer: Count up (or count down if durationMinutes set)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timer display
  const totalLimitSec = durationMinutes ? durationMinutes * 60 : null;
  const isTimeUp = totalLimitSec !== null && elapsedSeconds >= totalLimitSec;

  const displayTime = () => {
    if (totalLimitSec !== null) {
      const remaining = Math.max(0, totalLimitSec - elapsedSeconds);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Word count
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmitRecall(text.trim(), elapsedSeconds);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-night p-4 md:p-8"
          : "max-w-4xl mx-auto space-y-4"
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-gold/20 bg-deep/80 px-5 py-3 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs text-mist hover:text-ivory -ml-2 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="h-4 w-[1px] bg-gold/20" />

          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: subject?.color || "#E6AF2E" }}
              />
              <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
                {subject?.name || "General"}
              </span>
            </div>
            <h2 className="font-fraunces text-lg text-ivory leading-tight">
              {topic.name}
            </h2>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3">
          {/* Timer Clock */}
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 font-mono text-xs ${
              isTimeUp
                ? "border-ember bg-ember/15 text-ember animate-pulse font-bold"
                : "border-gold/20 bg-veil/50 text-gold-soft"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{displayTime()}</span>
          </div>

          {/* Word Counter */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-mist">
            <span className="text-ivory font-semibold">{words}</span>
            <span>words</span>
          </div>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-mist hover:text-ivory p-2 h-8 w-8"
            title={isFullscreen ? "Exit Fullscreen" : "Distraction-Free Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>

          {/* Submit Button */}
          <Button
            type="button"
            variant="celestial"
            size="sm"
            onClick={handleSubmit}
            disabled={words < 5 || isSubmitting}
            className="gap-2 shadow-astral text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-night" />
                <span>Evaluating Recall...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-night" />
                <span>Submit Recall</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Parchment Writing Sheet */}
      <div className="relative flex-1 rounded-[28px] border border-gold/25 bg-[#0e121e] p-6 md:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col min-h-[520px]">
        {/* Subtle decorative watermark */}
        <div className="pointer-events-none absolute right-8 bottom-8 text-gold/5 font-fraunces text-7xl select-none">
          Active Recall
        </div>

        {words === 0 && (
          <div className="pointer-events-none absolute inset-x-8 top-12 text-mist/40 font-manrope text-sm leading-relaxed">
            Begin typing without referencing your notes. Reconstruct every definition,
            underlying mechanism, causal relationship, boundary condition, and metaphor
            you can retrieve from your mind...
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSubmitting}
          className="relative z-10 w-full flex-1 bg-transparent font-manrope text-sm md:text-base text-ivory placeholder:text-transparent focus:outline-none resize-none leading-relaxed tracking-wide min-h-[440px]"
          placeholder="Unfurl your memory here..."
        />

        {/* Bottom Bar Info */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-gold/15 text-[11px] font-mono text-mist">
          <div className="flex items-center gap-3">
            <span>{words} words</span>
            <span>•</span>
            <span>{chars} characters</span>
            <span>•</span>
            <span>{concepts.length} target stars</span>
          </div>

          <div className="text-gold-soft font-mono">
            Pure Retrieval Mode
          </div>
        </div>
      </div>
    </div>
  );
}
